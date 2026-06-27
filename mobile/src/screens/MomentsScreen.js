import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import * as ImagePicker from 'expo-image-picker';
import { ChevronUp, ChevronDown } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { get, put, del } from '../api/client';
import { useUpload } from '../upload/UploadContext';
import { useI18n } from '../i18n/I18nContext';

const MAX_SEC = 120;

export default function MomentsScreen() {
  const { t } = useI18n();
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
      if (err.status !== 404) Alert.alert(t('app.moments.error_title'), t('app.moments.load_error'));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);
  // Refresh when returning to the screen (e.g. after a background upload finishes).
  useFocusEffect(useCallback(() => { fetchVideos(); }, [fetchVideos]));

  async function pickAndUpload() {
    if (isBusy) { Alert.alert(t('app.moments.please_wait_title'), t('app.moments.please_wait_body')); return; }
    if (totalSec >= capSec) { Alert.alert(t('app.moments.limit_reached_title'), t('app.moments.limit_reached_body')); return; }
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], quality: 1, allowsMultipleSelection: true });
    if (picked.canceled || !picked.assets || !picked.assets.length) return;
    // Keep clips within the per-video length limit; upload the rest as a batch.
    const valid = [];
    let tooLongSec = 0;
    for (const asset of picked.assets) {
      const durSec = asset.duration ? asset.duration / 1000 : 0;
      if (durSec && durSec > MAX_SEC + 1) { if (!tooLongSec) tooLongSec = Math.round(durSec); continue; }
      valid.push(asset);
    }
    if (tooLongSec) {
      Alert.alert(t('app.moments.too_long_title'), t('app.moments.too_long_body', { seconds: tooLongSec, maxSeconds: MAX_SEC, maxMinutes: MAX_SEC / 60 }));
    }
    if (!valid.length) return;
    // Kick off the background upload(s) and let the user keep using the app.
    startUpload({ assets: valid, context: 'moments', onComplete: fetchVideos });
    Alert.alert(t('app.moments.uploading_title'), t('app.moments.uploading_body'));
  }

  async function saveCaption(v, caption) {
    try { await put(`/api/videos/mine/${v.id}/caption`, { caption }); } catch (e) {}
  }
  // Move a video up/down and persist the new order.
  async function moveVideo(index, dir) {
    const j = index + dir;
    if (j < 0 || j >= videos.length) return;
    const next = videos.slice();
    [next[index], next[j]] = [next[j], next[index]];
    setVideos(next);
    try { await put('/api/videos/mine/reorder', { ids: next.map((v) => v.id) }); }
    catch (e) { fetchVideos(); }
  }
  function confirmDelete(v) {
    Alert.alert(t('app.moments.delete_confirm_title'), null, [
      { text: t('app.moments.cancel'), style: 'cancel' },
      { text: t('app.moments.delete'), style: 'destructive', onPress: async () => {
        try { await del(`/api/videos/mine/${v.id}`); fetchVideos(); } catch (e) { Alert.alert(t('app.moments.delete_failed_title'), t('app.moments.try_again')); }
      } },
    ]);
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={colors.gold} /></View>;

  const usedMin = Math.round(totalSec / 60);
  const capMin = Math.round(capSec / 60);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>{t('app.moments.page_title')}</Text>
      <Text style={styles.pageSubtitle}>{t('app.moments.page_subtitle', { maxMinutes: MAX_SEC / 60 })}</Text>
      <Text style={styles.cap}>{t('app.moments.minutes_used', { used: usedMin, cap: capMin.toLocaleString() })}</Text>

      {videos.map((v, idx) => (
        <View key={v.id} style={styles.card}>
          <View style={styles.frame}>
            {v.status === 'ready' ? (
              <WebView
                source={{ uri: `https://iframe.cloudflarestream.com/${v.stream_uid}?poster=https%3A%2F%2Fiframe.cloudflarestream.com%2F${v.stream_uid}%2Fthumbnails%2Fthumbnail.jpg` }}
                style={styles.web}
                allowsFullscreenVideo
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
                domStorageEnabled
                originWhitelist={['*']}
                mixedContentMode="always"
                androidLayerType="hardware"
                setSupportMultipleWindows={false}
              />
            ) : (
              <View style={styles.processing}><ActivityIndicator color="#d4bb8a" /><Text style={styles.processingText}>{t('app.moments.processing')}</Text></View>
            )}
          </View>
          <TextInput
            style={styles.input}
            defaultValue={v.caption || ''}
            placeholder={t('app.moments.caption_placeholder')}
            placeholderTextColor={colors.placeholder}
            onEndEditing={(e) => saveCaption(v, e.nativeEvent.text)}
          />
          <View style={styles.cardFooter}>
            {videos.length > 1 ? (
              <View style={styles.moveRow}>
                <TouchableOpacity onPress={() => moveVideo(idx, -1)} disabled={idx === 0} style={[styles.moveBtn, idx === 0 && styles.moveBtnDim]}>
                  <ChevronUp size={20} color={colors.gold} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => moveVideo(idx, 1)} disabled={idx === videos.length - 1} style={[styles.moveBtn, idx === videos.length - 1 && styles.moveBtnDim]}>
                  <ChevronDown size={20} color={colors.gold} />
                </TouchableOpacity>
              </View>
            ) : <View />}
            <TouchableOpacity onPress={() => confirmDelete(v)}><Text style={styles.removeLink}>{t('app.moments.remove')}</Text></TouchableOpacity>
          </View>
        </View>
      ))}

      {videos.length === 0 ? <Text style={styles.empty}>{t('app.moments.empty')}</Text> : null}

      <TouchableOpacity
        style={[styles.addButton, (isBusy || totalSec >= capSec) && styles.addButtonDisabled]}
        onPress={pickAndUpload}
        disabled={isBusy || totalSec >= capSec}
        activeOpacity={0.8}
      >
        <Text style={styles.addButtonText}>{totalSec >= capSec ? t('app.moments.add_button_limit') : t('app.moments.add_button', { maxMinutes: MAX_SEC / 60 })}</Text>
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
  removeLink: { color: colors.error, fontSize: typography.sizes.sm, fontWeight: typography.weights.medium },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  moveRow: { flexDirection: 'row', gap: spacing.sm },
  moveBtn: { width: 42, height: 36, borderWidth: 1, borderColor: colors.gold, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  moveBtnDim: { opacity: 0.35 },
  empty: { fontSize: typography.sizes.sm, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md },
  addButton: { borderWidth: 2, borderColor: colors.gold, borderStyle: 'dashed', borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  addButtonDisabled: { opacity: 0.5 },
  addButtonText: { color: colors.gold, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
});
