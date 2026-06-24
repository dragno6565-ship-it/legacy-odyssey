import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { get, post, put, del } from '../api/client';
import { pickAndUploadPhotos } from '../utils/multiPhoto';
import { useI18n } from '../i18n/I18nContext';

export default function GalleryDetailScreen({ route, navigation }) {
  const { t } = useI18n();
  const { galleryId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [photos, setPhotos] = useState([]);
  const [busy, setBusy] = useState(false);
  const [maxPhotos, setMaxPhotos] = useState(50); // server is the source of truth (galleryService.MAX_PHOTOS)
  const [progress, setProgress] = useState('');

  const fetchGallery = useCallback(async () => {
    try {
      const res = await get(`/api/galleries/mine/${galleryId}`);
      const g = (res.data && res.data.gallery) || {};
      setTitle(g.title || '');
      if (res.data && res.data.maxPhotos) setMaxPhotos(res.data.maxPhotos);
      setPhotos(g.photos || []);
    } catch (err) { Alert.alert(t('app.gallerydetail.error_title'), t('app.gallerydetail.load_error')); }
    finally { setLoading(false); }
  }, [galleryId]);

  useEffect(() => { fetchGallery(); }, [fetchGallery]);

  async function saveTitle() {
    try { await put(`/api/galleries/mine/${galleryId}`, { title: title.trim() || t('app.gallerydetail.untitled') }); } catch (e) {}
  }

  async function addPhotos() {
    const room = maxPhotos - photos.length;
    if (room <= 0) { Alert.alert(t('app.gallerydetail.full_title'), t('app.gallerydetail.full_body', { max: maxPhotos })); return; }
    setBusy(true); setProgress('');
    try {
      const { canceled, paths } = await pickAndUploadPhotos({ limit: room, onProgress: (d, total) => setProgress(t('app.gallerydetail.uploading_progress', { current: Math.min(d + 1, total), total })) });
      if (canceled || !paths.length) return;
      const res = await post(`/api/galleries/mine/${galleryId}/photos`, { paths });
      const added = (res.data && res.data.added) || [];
      setPhotos((prev) => [...prev, ...added]);
    } catch (err) { Alert.alert(t('app.gallerydetail.upload_failed_title'), t('app.gallerydetail.try_again')); }
    finally { setBusy(false); setProgress(''); }
  }

  async function saveCaption(p, caption) {
    try { await put(`/api/galleries/mine/photo/${p.id}`, { caption }); } catch (e) {}
  }
  function removePhoto(p) {
    Alert.alert(t('app.gallerydetail.remove_photo_confirm'), null, [
      { text: t('app.gallerydetail.cancel'), style: 'cancel' },
      { text: t('app.gallerydetail.remove'), style: 'destructive', onPress: async () => {
        try { await del(`/api/galleries/mine/photo/${p.id}`); setPhotos((prev) => prev.filter((x) => x.id !== p.id)); } catch (e) { Alert.alert(t('app.gallerydetail.remove_failed')); }
      } },
    ]);
  }
  function deleteGallery() {
    Alert.alert(t('app.gallerydetail.delete_confirm_title'), t('app.gallerydetail.delete_confirm_body'), [
      { text: t('app.gallerydetail.cancel'), style: 'cancel' },
      { text: t('app.gallerydetail.delete'), style: 'destructive', onPress: async () => {
        try { await del(`/api/galleries/mine/${galleryId}`); navigation.goBack(); } catch (e) { Alert.alert(t('app.gallerydetail.delete_failed')); }
      } },
    ]);
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={colors.gold} /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TextInput style={styles.titleInput} value={title} onChangeText={setTitle} onEndEditing={saveTitle} placeholder={t('app.gallerydetail.name_placeholder')} placeholderTextColor={colors.placeholder} maxLength={80} />
      <Text style={styles.count}>{t('app.gallerydetail.photo_count', { count: photos.length, max: maxPhotos })}</Text>

      {photos.map((p) => (
        <View key={p.id} style={styles.card}>
          <Image source={{ uri: p.url }} style={styles.photo} />
          <TextInput style={styles.input} defaultValue={p.caption || ''} placeholder={t('app.gallerydetail.caption_placeholder')} placeholderTextColor={colors.placeholder} onEndEditing={(e) => saveCaption(p, e.nativeEvent.text)} />
          <TouchableOpacity onPress={() => removePhoto(p)}><Text style={styles.removeLink}>{t('app.gallerydetail.remove')}</Text></TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={[styles.addButton, (busy || photos.length >= maxPhotos) && styles.addDisabled]} onPress={addPhotos} disabled={busy || photos.length >= maxPhotos} activeOpacity={0.8}>
        {busy ? (
          <View style={styles.row}><ActivityIndicator color={colors.gold} size="small" /><Text style={styles.addText}>  {progress || t('app.gallerydetail.uploading')}</Text></View>
        ) : (
          <Text style={styles.addText}>{photos.length >= maxPhotos ? t('app.gallerydetail.add_button_full', { max: maxPhotos }) : t('app.gallerydetail.add_button')}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={deleteGallery} style={styles.deleteBtn}><Text style={styles.deleteText}>{t('app.gallerydetail.delete_gallery_link')}</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 150 },
  titleInput: { fontFamily: typography.fontFamily.serif, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.textPrimary, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.xs },
  count: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md, ...shadows.card },
  photo: { width: '100%', aspectRatio: 1, borderRadius: borderRadius.md, marginBottom: spacing.sm, backgroundColor: colors.card },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, fontSize: typography.sizes.md, color: colors.textPrimary },
  removeLink: { color: colors.error, fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, marginTop: spacing.sm },
  addButton: { borderWidth: 2, borderColor: colors.gold, borderStyle: 'dashed', borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  addDisabled: { opacity: 0.5 },
  addText: { color: colors.gold, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
  row: { flexDirection: 'row', alignItems: 'center' },
  deleteBtn: { marginTop: spacing.xl, alignItems: 'center' },
  deleteText: { color: colors.error, fontSize: typography.sizes.sm, fontWeight: typography.weights.medium },
});
