import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useHeaderHeight } from '@react-navigation/elements';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import client, { get, post, put, del, BASE_URL } from '../api/client';
import { useSavedToast } from '../components/SavedToast';
import RepositionModal from '../components/RepositionModal';
import { useI18n } from '../i18n/I18nContext';

// "Your Birth Day" — a captioned photo gallery (parity with the web editor).
// Multi-select up to 20 at once; caption / remove each. Backed by
// /api/books/mine/birthday* (needs migration 024's birthday_photos table).
export default function BirthDayScreen({ navigation }) {
  const { t } = useI18n();
  const headerHeight = useHeaderHeight();
  const { showToast, ToastComponent } = useSavedToast();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState('');
  const [repoUri, setRepoUri] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await get('/api/books/mine/birthday');
        setPhotos((res.data && res.data.photos) || []);
      } catch (err) {
        if (err.status !== 404) setError(err.message || t('app.birthday.error_load'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function photoUri(path) {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${BASE_URL}/${path.replace(/^\//, '')}`;
  }

  async function handleAddPhotos() {
    // System photo picker, multi-select up to 20 (no permission prompt — see PhotoPicker note).
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 20,
      quality: 0.85,
    });
    if (picked.canceled || !picked.assets || picked.assets.length === 0) return;

    setUploading(true);
    const added = [];
    try {
      for (const asset of picked.assets) {
        const formData = new FormData();
        const filename = asset.uri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('file', { uri: asset.uri, name: filename, type });
        const upRes = await client.post('/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const photoPath = upRes.data.url || upRes.data.path || upRes.data.storagePath;
        if (!photoPath) continue;
        const created = await post('/api/books/mine/birthday/photos', { photo_path: photoPath, caption: null });
        added.push(created.data);
      }
      if (added.length) setPhotos((prev) => [...prev, ...added]);
    } catch (err) {
      Alert.alert(t('app.birthday.upload_failed_title'), err.message || t('app.birthday.upload_failed_body'));
    } finally {
      setUploading(false);
    }
  }

  function updateCaption(photoId, caption) {
    setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, caption } : p)));
  }

  async function saveCaption(photo) {
    try {
      await put(`/api/books/mine/birthday-photos/${photo.id}`, { caption: photo.caption || null });
      showToast(t('app.birthday.caption_saved'));
    } catch (err) {
      Alert.alert(t('app.birthday.caption_save_failed_title'), err.message || t('app.birthday.try_again'));
    }
  }

  function confirmRemove(photo) {
    Alert.alert(t('app.birthday.remove_confirm_title'), null, [
      { text: t('app.birthday.cancel'), style: 'cancel' },
      {
        text: t('app.birthday.remove'),
        style: 'destructive',
        onPress: async () => {
          try {
            await del(`/api/books/mine/birthday-photos/${photo.id}`);
            setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
          } catch (err) {
            Alert.alert(t('app.birthday.remove_failed_title'), err.message || t('app.birthday.try_again'));
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>{t('app.birthday.page_title')}</Text>
        <Text style={styles.pageSubtitle}>
          {t('app.birthday.page_subtitle')}
        </Text>

        {error ? (
          <View style={styles.errorContainer}><Text style={styles.errorText}>{error}</Text></View>
        ) : null}

        {photos.map((photo) => (
          <View key={photo.id} style={styles.card}>
            {photoUri(photo.photo_path) ? (
              <Image source={{ uri: photoUri(photo.photo_path) }} style={styles.photo} resizeMode="cover" />
            ) : null}
            <Text style={styles.label}>{t('app.birthday.caption_label')}</Text>
            <TextInput
              style={styles.input}
              value={photo.caption || ''}
              onChangeText={(val) => updateCaption(photo.id, val)}
              onBlur={() => saveCaption(photo)}
              placeholder={t('app.birthday.caption_placeholder')}
              placeholderTextColor={colors.placeholder}
            />
            <View style={styles.cardActions}>
              <TouchableOpacity onPress={() => saveCaption(photo)}>
                <Text style={styles.saveLink}>{t('app.birthday.save_caption')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setRepoUri({ uri: photoUri(photo.photo_path), path: photo.photo_path })}>
                <Text style={styles.saveLink}>{t('app.birthday.reposition')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmRemove(photo)}>
                <Text style={styles.removeLink}>{t('app.birthday.remove')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {photos.length === 0 ? (
          <Text style={styles.emptyText}>{t('app.birthday.empty')}</Text>
        ) : null}

        <TouchableOpacity
          style={[styles.addButton, uploading && styles.addButtonDisabled]}
          onPress={handleAddPhotos}
          disabled={uploading}
          activeOpacity={0.8}
        >
          {uploading ? (
            <View style={styles.uploadingRow}>
              <ActivityIndicator color={colors.gold} size="small" />
              <Text style={styles.addButtonText}>{t('app.birthday.uploading')}</Text>
            </View>
          ) : (
            <Text style={styles.addButtonText}>{t('app.birthday.add_photos')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      <RepositionModal visible={!!repoUri} photoUri={repoUri && repoUri.uri} photoPath={repoUri && repoUri.path} onClose={() => setRepoUri(null)} />
      {ToastComponent}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, paddingBottom: 150 },
  pageTitle: { fontFamily: typography.fontFamily.serif, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.textPrimary },
  pageSubtitle: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginBottom: spacing.lg, fontStyle: 'italic' },
  errorContainer: { backgroundColor: colors.errorLight, borderRadius: borderRadius.sm, padding: spacing.md, marginBottom: spacing.md },
  errorText: { color: colors.error, fontSize: typography.sizes.sm, textAlign: 'center' },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.lg, ...shadows.card },
  photo: { width: '100%', height: 220, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  label: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.textPrimary, marginBottom: spacing.xs },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, fontSize: typography.sizes.md, color: colors.textPrimary },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  saveLink: { color: colors.gold, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold },
  removeLink: { color: colors.error, fontSize: typography.sizes.sm, fontWeight: typography.weights.medium },
  emptyText: { fontSize: typography.sizes.sm, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md },
  addButton: { borderWidth: 2, borderColor: colors.gold, borderStyle: 'dashed', borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  addButtonDisabled: { opacity: 0.6 },
  addButtonText: { color: colors.gold, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
  uploadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
