import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { get, put, del } from '../api/client';
import { useUpload } from '../upload/UploadContext';

const MAX_SEC = 120;

export default function MomentsScreen() {
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [totalSec, setTotalSec] = useState(0);
  const [capSec, setCapSec] = useState(60000);
  const { startUpload, isBusy } = useUpload();

  const fetchVideos = useCallback(async () => {
    try {
      const res = await get('/api/videos/mine?context=moments');
      setVideos((res.data && res.data.videos) || []);
      setTotalSec((res.data && res.data.totalSec) || 0);
      setCapSec((res.data && res.data.capSec) || 60000);
    } catch (err) {
      if (err.status !== 404) Alert.alert('Error', 'Could not load videos.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);
  // Refresh when returning to the screen (e.g. after a background upload finishes).
  useFocusEffect(useCallback(() => { fetchVideos(); }, [fetchVideos]));

  async function pickAndUpload() {
    if (isBusy) { Alert.alert('Please wait', 'Another video is still uploading.'); return; }
    if (totalSec >= capSec) { Alert.alert('Limit reached', 'This site has reached its 1,000-minute video limit. Delete a clip to add another.'); return; }
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], quality: 1 });
    if (picked.canceled || !picked.assets || !picked.assets.length) return;
    const asset = picked.assets[0];
    const durSec = asset.duration ? asset.duration / 1000 : 0;
    if (durSec && durSec > MAX_SEC + 1) {
      Alert.alert('Too long', `That clip is ${Math.round(durSec)} seconds. Please choose a video up to ${MAX_SEC} seconds (${MAX_SEC / 60} minutes).`);
      return;
    }
    // Kick off the background upload and let the user keep using the app.
    startUpload({ asset, context: 'moments', onComplete: fetchVideos });
    Alert.alert('Uploading', 'Your video is uploading in the background — you can keep using the app. We’ll add it to your book when it’s ready.');
  }

  async function saveCaption(v, caption) {
    try { await put(`/api/videos/mine/${v.id}/caption`, { caption }); } catch (e) {}
  }
  function confirmDelete(v) {
    Alert.alert('Delete this video?', null, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await del(`/api/videos/mine/${v.id}`); fetchVideos(); } catch (e) { Alert.alert('Could not delete', 'Please try again.'); }
      } },
    ]);
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={colors.gold} /></View>;

  const usedMin = Math.round(totalSec / 60);
  const capMin = Math.round(capSec / 60);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Video Moments</Text>
      <Text style={styles.pageSubtitle}>Short clips — first steps, first words, the laugh. Up to {MAX_SEC / 60} minutes each.</Text>
      <Text style={styles.cap}>{usedMin} of {capMin.toLocaleString()} minutes used</Text>

      {videos.map((v) => (
        <View key={v.id} style={styles.card}>
          <View style={styles.frame}>
            {v.status === 'ready' ? (
              <WebView
                source={{ uri: `https://iframe.cloudflarestream.com/${v.stream_uid}` }}
                style={styles.web}
                allowsFullscreenVideo
                javaScriptEnabled
                domStorageEnabled
              />
            ) : (
              <View style={styles.processing}><Text style={styles.processingText}>Processing…</Text></View>
            )}
          </View>
          <TextInput
            style={styles.input}
            defaultValue={v.caption || ''}
            placeholder="Caption (optional)"
            placeholderTextColor={colors.placeholder}
            onEndEditing={(e) => saveCaption(v, e.nativeEvent.text)}
          />
          <TouchableOpacity onPress={() => confirmDelete(v)}><Text style={styles.removeLink}>Remove</Text></TouchableOpacity>
        </View>
      ))}

      {videos.length === 0 ? <Text style={styles.empty}>No videos yet — add your first clip below.</Text> : null}

      <TouchableOpacity
        style={[styles.addButton, (isBusy || totalSec >= capSec) && styles.addButtonDisabled]}
        onPress={pickAndUpload}
        disabled={isBusy || totalSec >= capSec}
        activeOpacity={0.8}
      >
        <Text style={styles.addButtonText}>{totalSec >= capSec ? 'Video limit reached' : `+ Add a video (up to ${MAX_SEC / 60} min)`}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 150 },
  pageTitle: { fontFamily: typography.fontFamily.serif, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.textPrimary },
  pageSubtitle: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginBottom: spacing.sm, fontStyle: 'italic' },
  cap: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginBottom: spacing.lg },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.lg, ...shadows.card },
  frame: { width: '100%', aspectRatio: 16 / 9, borderRadius: borderRadius.md, overflow: 'hidden', backgroundColor: '#1a1510', marginBottom: spacing.sm },
  web: { flex: 1, backgroundColor: '#1a1510' },
  processing: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  processingText: { color: '#d4bb8a', fontSize: typography.sizes.sm },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, fontSize: typography.sizes.md, color: colors.textPrimary },
  removeLink: { color: colors.error, fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, marginTop: spacing.sm },
  empty: { fontSize: typography.sizes.sm, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md },
  addButton: { borderWidth: 2, borderColor: colors.gold, borderStyle: 'dashed', borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  addButtonDisabled: { opacity: 0.5 },
  addButtonText: { color: colors.gold, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
});
