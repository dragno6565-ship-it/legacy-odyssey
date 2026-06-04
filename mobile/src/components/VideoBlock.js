import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { get, put, del } from '../api/client';
import { useUpload } from '../upload/UploadContext';

const MAX_SEC = 120;

/**
 * Embeddable video list + uploader for the app's Celebration & Family contexts.
 * Reuses the global background-upload banner (UploadProvider). Props:
 *   context: 'celebration' | 'family_member'
 *   celebrationId / familyMemberId
 *   single: cap at one video (family member)
 */
export default function VideoBlock({ context, celebrationId, familyMemberId, single }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { startUpload, isBusy } = useUpload();

  const qs = context === 'celebration'
    ? `context=celebration&celebrationId=${celebrationId}`
    : `context=family_member&familyMemberId=${familyMemberId}`;

  const fetchVideos = useCallback(async () => {
    try {
      const res = await get(`/api/videos/mine?${qs}`);
      setVideos((res.data && res.data.videos) || []);
    } catch (e) { /* non-fatal */ } finally { setLoading(false); }
  }, [qs]);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);
  useFocusEffect(useCallback(() => { fetchVideos(); }, [fetchVideos]));

  async function pickAndUpload() {
    if (isBusy) { Alert.alert('Please wait', 'Another video is still uploading.'); return; }
    if (single && videos.length >= 1) { Alert.alert('One video', 'Remove the current video to add a new one.'); return; }
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], quality: 1 });
    if (picked.canceled || !picked.assets || !picked.assets.length) return;
    const asset = picked.assets[0];
    const durSec = asset.duration ? asset.duration / 1000 : 0;
    if (durSec && durSec > MAX_SEC + 1) { Alert.alert('Too long', `Please choose a video up to ${MAX_SEC} seconds.`); return; }
    startUpload({ asset, context, celebrationId, familyMemberId, onComplete: fetchVideos });
    Alert.alert('Uploading', 'Your video is uploading in the background — you can keep using the app.');
  }

  async function saveCaption(v, caption) { try { await put(`/api/videos/mine/${v.id}/caption`, { caption }); } catch (e) {} }
  function removeVideo(v) {
    Alert.alert('Remove this video?', null, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try { await del(`/api/videos/mine/${v.id}`); setVideos((p) => p.filter((x) => x.id !== v.id)); } catch (e) { Alert.alert('Could not remove'); }
      } },
    ]);
  }

  if (loading) return <ActivityIndicator color={colors.gold} style={{ marginTop: spacing.md }} />;

  const atLimit = single && videos.length >= 1;

  return (
    <View style={styles.block}>
      <Text style={styles.title}>Videos</Text>
      {videos.map((v) => (
        <View key={v.id} style={styles.card}>
          <View style={styles.frame}>
            {v.status === 'ready' ? (
              <WebView source={{ uri: `https://iframe.cloudflarestream.com/${v.stream_uid}` }} style={styles.web} allowsFullscreenVideo javaScriptEnabled domStorageEnabled />
            ) : (
              <View style={styles.proc}><Text style={styles.procText}>Processing…</Text></View>
            )}
          </View>
          <TextInput style={styles.input} defaultValue={v.caption || ''} placeholder="Caption (optional)" placeholderTextColor={colors.placeholder} onEndEditing={(e) => saveCaption(v, e.nativeEvent.text)} />
          <TouchableOpacity onPress={() => removeVideo(v)}><Text style={styles.removeLink}>Remove</Text></TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={[styles.addBtn, (isBusy || atLimit) && styles.addDisabled]} onPress={pickAndUpload} disabled={isBusy || atLimit} activeOpacity={0.8}>
        <Text style={styles.addText}>{atLimit ? 'One video added' : `+ Add a video (up to ${MAX_SEC / 60} min)`}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { marginTop: spacing.lg },
  title: { fontFamily: typography.fontFamily.serif, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.textPrimary, marginBottom: spacing.sm },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md, ...shadows.card },
  frame: { width: '100%', aspectRatio: 16 / 9, borderRadius: borderRadius.md, overflow: 'hidden', backgroundColor: '#1a1510', marginBottom: spacing.sm },
  web: { flex: 1, backgroundColor: '#1a1510' },
  proc: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  procText: { color: '#d4bb8a', fontSize: typography.sizes.sm },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, fontSize: typography.sizes.md, color: colors.textPrimary },
  removeLink: { color: colors.error, fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, marginTop: spacing.sm },
  addBtn: { borderWidth: 2, borderColor: colors.gold, borderStyle: 'dashed', borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.xs },
  addDisabled: { opacity: 0.5 },
  addText: { color: colors.gold, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
});
