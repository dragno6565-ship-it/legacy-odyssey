import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { post, BASE_URL } from '../api/client';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { colors } from '../theme';

const KEEP_AWAKE_TAG = 'lo-video-upload';

/**
 * Background video upload. The user starts an upload and can keep using the app
 * while it runs; a persistent banner shows progress and a completion / failure
 * notice. Bytes upload directly to Cloudflare (never through our server) via XHR
 * so we get upload progress. (True OS-background — surviving app kill — would
 * need expo-file-system / a native module; this keeps running while the app is
 * open and navigating, which covers the common case.)
 */

const UploadContext = createContext(null);
export const useUpload = () => useContext(UploadContext);

export function UploadProvider({ children }) {
  const [state, setState] = useState({ status: 'idle', pct: 0, error: null, index: 0, total: 0 });
  const lastArgs = useRef(null);

  // Upload one OR many videos. Pass `asset` for a single video or `assets: [...]`
  // for a batch; the batch uploads sequentially (one Cloudflare upload at a time).
  const run = useCallback(async (args) => {
    lastArgs.current = args;
    const { asset, assets, onComplete, ...common } = args;
    const queue = (assets && assets.length) ? assets.slice() : (asset ? [asset] : []);
    if (!queue.length) return;
    // Keep the screen awake for the whole batch — if the phone sleeps mid-upload the
    // request fails, and retrying mints a NEW video (the duplicate-upload bug).
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});

    // Mint a direct-upload URL, push the bytes to Cloudflare, then await processing.
    const uploadOne = async (a, i) => {
      const body = { context: common.context };
      if (common.context === 'celebration') body.celebrationId = common.celebrationId;
      if (common.context === 'family_member') body.familyMemberId = common.familyMemberId;
      const mint = await post('/api/videos/mine', body);
      const { uploadURL, videoId } = mint.data || mint;
      if (!uploadURL) throw new Error(mint.data?.error || 'Could not start upload.');
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', uploadURL);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setState((s) => ({ ...s, status: 'uploading', pct: Math.round((e.loaded / e.total) * 100), index: i, total: queue.length }));
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('upload')));
        xhr.onerror = () => reject(new Error('network'));
        const fd = new FormData();
        const name = (a.fileName) || (a.uri.split('/').pop()) || 'video.mp4';
        fd.append('file', { uri: a.uri, name, type: a.mimeType || 'video/mp4' });
        xhr.send(fd);
      });
      setState((s) => ({ ...s, status: 'processing', pct: 100, index: i, total: queue.length }));
      for (let k = 0; k < 20; k++) {
        await new Promise((r) => setTimeout(r, 3000));
        const v = await post(`/api/videos/mine/${videoId}/finalize`, {});
        const data = v.data || v;
        if (data && data.status === 'ready') return;
        if (data && data.status === 'error') throw new Error('processing');
      }
      // Bytes are uploaded; Cloudflare may still be finishing — treat as submitted.
    };

    let okCount = 0;
    const failed = [];
    try {
      for (let i = 0; i < queue.length; i++) {
        setState({ status: 'uploading', pct: 0, error: null, index: i, total: queue.length });
        try { await uploadOne(queue[i], i); okCount += 1; }
        catch (e) { failed.push(queue[i]); }
      }
      if (okCount > 0 && onComplete) onComplete();
      if (failed.length === 0) {
        setState({ status: 'done', pct: 100, error: null, index: queue.length - 1, total: queue.length });
        setTimeout(() => setState((s) => (s.status === 'done' ? { status: 'idle', pct: 0, error: null, index: 0, total: 0 } : s)), 4000);
        lastArgs.current = null;
      } else if (okCount > 0) {
        setState({ status: 'partial', pct: 100, error: `Added ${okCount} of ${queue.length} — Retry the rest`, index: okCount, total: queue.length });
        lastArgs.current = { ...common, assets: failed, onComplete };
      } else {
        setState({ status: 'error', pct: 0, error: 'Upload failed', index: 0, total: queue.length });
        lastArgs.current = { ...common, assets: failed, onComplete };
      }
    } finally {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    }
  }, []);

  const startUpload = useCallback((args) => { run(args); }, [run]);
  const retry = useCallback(() => { if (lastArgs.current) run(lastArgs.current); }, [run]);
  const dismiss = useCallback(() => setState({ status: 'idle', pct: 0, error: null }), []);
  const isBusy = state.status === 'uploading' || state.status === 'processing';

  return (
    <UploadContext.Provider value={{ state, startUpload, isBusy }}>
      {children}
      <UploadBanner state={state} onRetry={retry} onDismiss={dismiss} />
    </UploadContext.Provider>
  );
}

function UploadBanner({ state, onRetry, onDismiss }) {
  if (state.status === 'idle') return null;
  const many = state.total > 1;
  const pos = many ? ` ${(state.index || 0) + 1}/${state.total}` : '';
  let text = '';
  if (state.status === 'uploading') text = `Uploading video${pos}… ${state.pct}%`;
  else if (state.status === 'processing') text = `Processing video${pos}…`;
  else if (state.status === 'done') text = many ? `✓ ${state.total} videos added` : '✓ Video added';
  else if (state.status === 'partial') text = state.error || 'Some videos didn’t upload';
  else if (state.status === 'error') text = 'Upload failed';
  const busy = state.status === 'uploading' || state.status === 'processing';
  const canRetry = state.status === 'error' || state.status === 'partial';

  return (
    <View style={[styles.banner, canRetry && styles.bannerError, state.status === 'done' && styles.bannerDone]}>
      {busy ? <ActivityIndicator color="#fff" size="small" style={{ marginRight: 10 }} /> : null}
      <Text style={styles.bannerText}>{text}</Text>
      {canRetry ? (
        <>
          <TouchableOpacity onPress={onRetry}><Text style={styles.bannerAction}>Retry</Text></TouchableOpacity>
          <TouchableOpacity onPress={onDismiss}><Text style={styles.bannerAction}>Dismiss</Text></TouchableOpacity>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 999,
    flexDirection: 'row', alignItems: 'center', paddingTop: 48, paddingBottom: 12, paddingHorizontal: 16,
    backgroundColor: colors.gold,
  },
  bannerError: { backgroundColor: colors.error },
  bannerDone: { backgroundColor: '#2e7d32' },
  bannerText: { color: '#fff', fontWeight: '600', flex: 1, fontSize: 14 },
  bannerAction: { color: '#fff', fontWeight: '700', marginLeft: 14, textDecorationLine: 'underline' },
});
