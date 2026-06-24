import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import client, { get, put, post, del, BASE_URL } from '../api/client';
import { pickAndUploadPhotos } from '../utils/multiPhoto';
import { useSavedToast } from '../components/SavedToast';
import { useI18n } from '../i18n/I18nContext';
import VideoBlock from '../components/VideoBlock';
import RepositionModal from '../components/RepositionModal';

/**
 * Per-celebration editor — fields, multi-photo gallery, delete.
 *
 * Uses the new per-item CRUD endpoints exclusively. No bulk PUTs.
 */
export default function CelebrationDetailScreen({ navigation, route }) {
  const { celebrationId, yearLabel } = route.params;
  const { t } = useI18n();
  const headerHeight = useHeaderHeight();
  const { showToast, ToastComponent } = useSavedToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [eyebrow, setEyebrow] = useState('');
  const [body, setBody] = useState('');
  const [location, setLocation] = useState('');
  const [attendees, setAttendees] = useState('');
  const [gifts, setGifts] = useState('');
  const [celebrationDate, setCelebrationDate] = useState('');
  const [photos, setPhotos] = useState([]); // [{ id, photo_path, caption }]
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoProgress, setPhotoProgress] = useState('');
  const [repo, setRepo] = useState(null);

  useEffect(() => {
    navigation.setOptions({ title: route.params?.title || t('app.celebrationdetail.nav_title') });
  }, [navigation, route.params?.title]);

  const fetchCelebration = useCallback(async () => {
    try {
      const res = await get(`/api/books/mine/celebrations/${celebrationId}`);
      const c = res.data || {};
      setTitle(c.title && c.title !== '(untitled)' ? c.title : '');
      setEyebrow(c.eyebrow || '');
      setBody(c.body || '');
      setLocation(c.location || '');
      setAttendees(c.attendees || '');
      setGifts(c.gifts || '');
      setCelebrationDate(
        c.celebration_date ? String(c.celebration_date).slice(0, 10) : ''
      );
      setPhotos(Array.isArray(c.photos) ? c.photos : []);
    } catch (err) {
      setError(err.message || t('app.celebrationdetail.error_load'));
    } finally {
      setLoading(false);
    }
  }, [celebrationId]);

  useFocusEffect(
    useCallback(() => {
      fetchCelebration();
    }, [fetchCelebration])
  );

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      // Only send the date if it parses as YYYY-MM-DD; otherwise null.
      // Saves the user from a server 500 if they typed "12/25/2025" or similar.
      const trimmedDate = celebrationDate.trim();
      const validDate = /^\d{4}-\d{2}-\d{2}$/.test(trimmedDate) ? trimmedDate : null;

      await put(`/api/books/mine/celebrations/${celebrationId}`, {
        title: title.trim() || 'Untitled',
        eyebrow: eyebrow.trim(),
        body: body.trim(),
        location: location.trim(),
        attendees: attendees.trim(),
        gifts: gifts.trim(),
        celebration_date: validDate,
        year_label: yearLabel,
      });
      showToast(t('app.celebrationdetail.toast_saved'));
      if (trimmedDate && !validDate) {
        // Heads-up so they know why the date didn't stick
        setTimeout(() => {
          Alert.alert(
            t('app.celebrationdetail.date_format_title'),
            t('app.celebrationdetail.date_format_msg')
          );
        }, 100);
      }
      // Stay on the page so the user can continue editing / managing photos
    } catch (err) {
      setError(err.message || t('app.celebrationdetail.error_save'));
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      t('app.celebrationdetail.delete_title'),
      t('app.celebrationdetail.delete_msg'),
      [
        { text: t('app.celebrationdetail.cancel'), style: 'cancel' },
        { text: t('app.celebrationdetail.delete'), style: 'destructive', onPress: handleDelete },
      ]
    );
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await del(`/api/books/mine/celebrations/${celebrationId}`);
      navigation.goBack();
    } catch (err) {
      setDeleting(false);
      Alert.alert(t('app.celebrationdetail.delete_fail_title'), err.message || t('app.celebrationdetail.please_try_again'));
    }
  }

  async function handleAddPhoto() {
    setUploadingPhoto(true);
    setPhotoProgress('');
    try {
      // Pick several at once → upload each, then attach to this celebration.
      const { canceled, paths } = await pickAndUploadPhotos({
        limit: 20,
        onProgress: (done, total) => setPhotoProgress(t('app.celebrationdetail.uploading_progress', { current: Math.min(done + 1, total), total })),
      });
      if (canceled || paths.length === 0) return;
      const created = [];
      for (const photoPath of paths) {
        const res = await post(
          `/api/books/mine/celebrations/${celebrationId}/photos`,
          { photo_path: photoPath, caption: null }
        );
        created.push(res.data);
      }
      if (created.length) setPhotos((prev) => [...prev, ...created]);
    } catch (err) {
      Alert.alert(t('app.celebrationdetail.upload_fail_title'), err.message || t('app.celebrationdetail.upload_fail_msg'));
    } finally {
      setUploadingPhoto(false);
      setPhotoProgress('');
    }
  }

  function updatePhotoCaption(photoId, caption) {
    setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, caption } : p)));
  }

  async function savePhotoCaption(photo) {
    try {
      await put(`/api/books/mine/celebration-photos/${photo.id}`, {
        caption: photo.caption || null,
      });
      showToast(t('app.celebrationdetail.caption_saved'));
    } catch (err) {
      Alert.alert(t('app.celebrationdetail.caption_fail_title'), err.message || t('app.celebrationdetail.please_try_again'));
    }
  }

  function confirmRemovePhoto(photo) {
    Alert.alert(
      t('app.celebrationdetail.remove_photo_title'),
      null,
      [
        { text: t('app.celebrationdetail.cancel'), style: 'cancel' },
        {
          text: t('app.celebrationdetail.remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              await del(`/api/books/mine/celebration-photos/${photo.id}`);
              setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
            } catch (err) {
              Alert.alert(t('app.celebrationdetail.remove_fail_title'), err.message || t('app.celebrationdetail.please_try_again'));
            }
          },
        },
      ]
    );
  }

  function photoUri(path) {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${BASE_URL}/${path.replace(/^\//, '')}`;
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
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Basics */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('app.celebrationdetail.details_title')}</Text>

          <Text style={styles.label}>{t('app.celebrationdetail.label_title')}</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={t('app.celebrationdetail.placeholder_title')}
            placeholderTextColor={colors.placeholder}
          />

          <Text style={styles.label}>{t('app.celebrationdetail.label_eyebrow')}</Text>
          <TextInput
            style={styles.input}
            value={eyebrow}
            onChangeText={setEyebrow}
            placeholder={t('app.celebrationdetail.placeholder_eyebrow')}
            placeholderTextColor={colors.placeholder}
          />
          <Text style={styles.hint}>{t('app.celebrationdetail.hint_eyebrow')}</Text>

          <Text style={styles.label}>{t('app.celebrationdetail.label_date')}</Text>
          <TextInput
            style={styles.input}
            value={celebrationDate}
            onChangeText={setCelebrationDate}
            placeholder={t('app.celebrationdetail.placeholder_date')}
            placeholderTextColor={colors.placeholder}
            autoCapitalize="none"
          />

          <Text style={styles.label}>{t('app.celebrationdetail.label_location')}</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder={t('app.celebrationdetail.placeholder_location')}
            placeholderTextColor={colors.placeholder}
          />

          <Text style={styles.label}>{t('app.celebrationdetail.label_attendees')}</Text>
          <TextInput
            style={styles.input}
            value={attendees}
            onChangeText={setAttendees}
            placeholder={t('app.celebrationdetail.placeholder_attendees')}
            placeholderTextColor={colors.placeholder}
          />
          <Text style={styles.hint}>
            {t('app.celebrationdetail.hint_attendees')}
          </Text>
        </View>

        {/* Story */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('app.celebrationdetail.story_title')}</Text>
          <TextInput
            style={[styles.input, styles.bodyInput]}
            value={body}
            onChangeText={setBody}
            placeholder={t('app.celebrationdetail.placeholder_body')}
            placeholderTextColor={colors.placeholder}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.hint}>{t('app.celebrationdetail.hint_body')}</Text>
        </View>

        {/* Presents */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('app.celebrationdetail.presents_title')}</Text>
          <TextInput
            style={[styles.input, styles.giftsInput]}
            value={gifts}
            onChangeText={setGifts}
            placeholder={t('app.celebrationdetail.placeholder_gifts')}
            placeholderTextColor={colors.placeholder}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.hint}>{t('app.celebrationdetail.hint_gifts')}</Text>
        </View>

        {/* Photo gallery */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('app.celebrationdetail.photos_title')}</Text>
          <Text style={styles.hint}>{t('app.celebrationdetail.photos_hint')}</Text>

          {photos.length === 0 && (
            <Text style={styles.emptyText}>{t('app.celebrationdetail.photos_empty')}</Text>
          )}

          {photos.map((p, idx) => {
            const uri = photoUri(p.photo_path);
            return (
              <View key={p.id || idx} style={styles.photoCard}>
                {uri ? (
                  <Image source={{ uri }} style={styles.photoImg} resizeMode="cover" />
                ) : (
                  <View style={[styles.photoImg, styles.photoPlaceholder]}>
                    <Text style={{ color: colors.gold }}>{t('app.celebrationdetail.no_image')}</Text>
                  </View>
                )}
                <TextInput
                  style={styles.captionInput}
                  value={p.caption || ''}
                  onChangeText={(v) => updatePhotoCaption(p.id, v)}
                  placeholder={t('app.celebrationdetail.caption_placeholder')}
                  placeholderTextColor={colors.placeholder}
                />
                <View style={styles.photoActions}>
                  <TouchableOpacity
                    style={styles.smallButton}
                    onPress={() => savePhotoCaption(p)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.smallButtonText}>{t('app.celebrationdetail.save_caption')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.smallButton}
                    onPress={() => setRepo({ uri, path: p.photo_path })}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.smallButtonText}>{t('app.celebrationdetail.reposition')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.smallButton, styles.smallButtonDanger]}
                    onPress={() => confirmRemovePhoto(p)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.smallButtonText, { color: colors.error }]}>{t('app.celebrationdetail.remove')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          <TouchableOpacity
            style={[styles.addPhotoButton, uploadingPhoto && styles.addPhotoButtonDisabled]}
            onPress={handleAddPhoto}
            disabled={uploadingPhoto}
            activeOpacity={0.8}
          >
            {uploadingPhoto ? (
              <View style={styles.uploadingRow}>
                <ActivityIndicator color={colors.gold} size="small" />
                <Text style={styles.addPhotoText}>{photoProgress || t('app.celebrationdetail.uploading')}</Text>
              </View>
            ) : (
              <Text style={styles.addPhotoText}>{t('app.celebrationdetail.add_photos')}</Text>
            )}
          </TouchableOpacity>
        </View>

        <VideoBlock context="celebration" celebrationId={celebrationId} />

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>{t('app.celebrationdetail.save_changes')}</Text>
          )}
        </TouchableOpacity>

        {/* Delete */}
        <TouchableOpacity
          style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
          onPress={confirmDelete}
          disabled={deleting}
          activeOpacity={0.8}
        >
          {deleting ? (
            <ActivityIndicator color={colors.error} />
          ) : (
            <Text style={styles.deleteButtonText}>{t('app.celebrationdetail.delete_celebration')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      <RepositionModal visible={!!repo} photoUri={repo && repo.uri} photoPath={repo && repo.path} onClose={() => setRepo(null)} />
      {ToastComponent}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, paddingBottom: 150 },
  errorContainer: { backgroundColor: colors.errorLight, borderRadius: borderRadius.sm, padding: spacing.md, marginBottom: spacing.md },
  errorText: { color: colors.error, fontSize: typography.sizes.sm, textAlign: 'center' },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  cardTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.gold,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  bodyInput: { minHeight: 140, paddingTop: spacing.md, marginTop: spacing.xs },
  giftsInput: { minHeight: 90, paddingTop: spacing.md, marginTop: spacing.xs },
  hint: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  // Photo gallery
  photoCard: {
    marginTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  photoImg: {
    width: '100%', height: 200,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
  },
  photoPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  captionInput: {
    backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  photoActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  smallButton: {
    flex: 1,
    backgroundColor: colors.gold,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  smallButtonDanger: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.error },
  smallButtonText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  addPhotoButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.gold,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  addPhotoButtonDisabled: { opacity: 0.7 },
  addPhotoText: {
    color: colors.gold,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  uploadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  // Save / Delete
  saveButton: {
    backgroundColor: colors.gold,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    ...shadows.button,
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  deleteButton: {
    marginTop: spacing.lg,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: colors.white,
  },
  deleteButtonDisabled: { opacity: 0.6 },
  deleteButtonText: {
    color: colors.error,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});
