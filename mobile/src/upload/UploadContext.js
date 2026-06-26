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
  const [state, setState] = useState({ status: 'idle', pct: 0, error: null });
  const lastArgs = useRef(null);

  const run = useCallback(async (args) => {
    lastArgs.current = args;
    const { asset, context, celebrationId, familyMemberId, onComplete } = args;
    setState({ status: 'uploading', pct: 0, error: null });
    // Keep the screen awake for the whole upload — if the phone sleeps mid-upload
    // the request fails, and retrying mints a NEW video (the duplicate-upload bug).
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    try {
      // 1) Mint a direct-upload URL
      const body = { context };
      if (context === 'celebration') body.celebrationId = celebrationId;
      if (context === 'family_member') body.familyMemberId = familyMemberId;
      const mint = await post('/api/videos/mine', body);
      const { uploadURL, videoId } = mint.data || mint;
      if (!uploadURL) throw new Error(mint.data?.error || 'Could not start upload.');

      // 2) Upload straight to Cloudflare with progress (XHR)
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', uploadURL);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setState((s) => ({ ...s, status: 'uploading', pct: Math.round((e.loaded / e.total) * 100) }));
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('upload')));
        xhr.onerror = () => reject(new Error('network'));
        const fd = new FormData();
        const name = (asset.fileName) || (asset.uri.split('/').pop()) || 'video.mp4';
        fd.append('file', { uri: asset.uri, name, type: asset.mimeType || 'video/mp4' });
        xhr.send(fd);
      });

      // 3) Wait for Cloudflare to finish processing
      setState({ status: 'processing', pct: 100, error: null });
      let ready = false;
      for (let i = 0; i < 20 && !ready; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        const v = await post(`/api/videos/mine/${videoId}/finalize`, {});
        const data = v.data || v;
        if (data && data.status === 'ready') ready = true;
        if (data && data.status === 'error') throw new Error('processing');
      }
      setState({ status: 'done', pct: 100, error: null });
      if (onComplete) onComplete();
      setTimeout(() => setState((s) => (s.status === 'done' ? { status: 'idle', pct: 0, error: null } : s)), 4000);
    } catch (err) {
      setState({ status: 'error', pct: 0, error: err.message || 'Upload failed' });
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
  let text = '';
  if (state.status === 'uploading') text = `Uploading video… ${state.pct}%`;
  else if (state.status === 'processing') text = 'Processing your video…';
  else if (state.status === 'done') text = '✓ Video added';
  else if (state.status === 'error') text = 'Upload failed';
  const busy = state.status === 'uploading' || state.status === 'processing';

  return (
    <View style={[styles.banner, state.status === 'error' && styles.bannerError, state.status === 'done' && styles.bannerDone]}>
      {busy ? <ActivityIndicator color="#fff" size="small" style={{ marginRight: 10 }} /> : null}
      <Text style={styles.bannerText}>{text}</Text>
      {state.status === 'error' ? (
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
