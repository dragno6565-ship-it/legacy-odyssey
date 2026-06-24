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
import { useSavedToast } from '../components/SavedToast';
import { useI18n } from '../i18n/I18nContext';

/**
 * Per-keepsake editor — title, category, who/when/where, story, photo gallery.
 * Uses per-item CRUD endpoints exclusively.
 */
export default function KeepsakeDetailScreen({ navigation, route }) {
  const { t } = useI18n();
  const { keepsakeId } = route.params;
  const headerHeight = useHeaderHeight();
  const { showToast, ToastComponent } = useSavedToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [attribution, setAttribution] = useState('');
  const [ageText, setAgeText] = useState('');
  const [dateMade, setDateMade] = useState('');
  const [story, setStory] = useState('');
  const [photos, setPhotos] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: route.params?.title || t('app.keepsakedetail.header_fallback') });
  }, [navigation, route.params?.title, t]);

  const fetchKeepsake = useCallback(async () => {
    try {
      const res = await get(`/api/books/mine/keepsakes/${keepsakeId}`);
      const k = res.data || {};
      setTitle(k.title && k.title !== '(untitled)' ? k.title : '');
      setCategory(k.category || '');
      setDescription(k.description || '');
      setAttribution(k.attribution || '');
      setAgeText(k.age_text || '');
      setDateMade(k.date_made ? String(k.date_made).slice(0, 10) : '');
      setStory(k.story || '');
      setPhotos(Array.isArray(k.photos) ? k.photos : []);
    } catch (err) {
      setError(err.message || t('app.keepsakedetail.load_error'));
    } finally {
      setLoading(false);
    }
  }, [keepsakeId]);

  useFocusEffect(useCallback(() => { fetchKeepsake(); }, [fetchKeepsake]));

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      // Only send the date if it parses as YYYY-MM-DD
      const trimmedDate = dateMade.trim();
      const validDate = /^\d{4}-\d{2}-\d{2}$/.test(trimmedDate) ? trimmedDate : null;

      await put(`/api/books/mine/keepsakes/${keepsakeId}`, {
        title: title.trim() || t('app.keepsakedetail.untitled'),
        category: (category || '').trim().toLowerCase() || null,
        description: description.trim() || null,
        attribution: attribution.trim() || null,
        age_text: ageText.trim() || null,
        date_made: validDate,
        story: story.trim() || null,
      });
      showToast(t('app.keepsakedetail.saved_toast'));
      if (trimmedDate && !validDate) {
        setTimeout(() => {
          Alert.alert(
            t('app.keepsakedetail.date_format_title'),
            t('app.keepsakedetail.date_format_message')
          );
        }, 100);
      }
    } catch (err) {
      setError(err.message || t('app.keepsakedetail.save_error'));
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      t('app.keepsakedetail.delete_confirm_title'),
      t('app.keepsakedetail.delete_confirm_message'),
      [
        { text: t('app.keepsakedetail.cancel'), style: 'cancel' },
        { text: t('app.keepsakedetail.delete'), style: 'destructive', onPress: handleDelete },
      ]
    );
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await del(`/api/books/mine/keepsakes/${keepsakeId}`);
      navigation.goBack();
    } catch (err) {
      setDeleting(false);
      Alert.alert(t('app.keepsakedetail.delete_error_title'), err.message || t('app.keepsakedetail.try_again'));
    }
  }

  async function handleAddPhoto() {
    // Use the system photo picker (no permission needed) — avoids the Google
    // Photos picker's "Search disabled" behavior. See PhotoPicker.js note.
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (picked.canceled || !picked.assets || picked.assets.length === 0) return;
    const asset = picked.assets[0];

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      const filename = asset.uri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      formData.append('file', { uri: asset.uri, name: filename, type });
      const upRes = await client.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const photoPath = upRes.data.url || upRes.data.path || upRes.data.storagePath;
      if (!photoPath) throw new Error(t('app.keepsakedetail.upload_no_path'));

      const created = await post(`/api/books/mine/keepsakes/${keepsakeId}/photos`, {
        photo_path: photoPath, caption: null,
      });
      setPhotos((prev) => [...prev, created.data]);
    } catch (err) {
      Alert.alert(t('app.keepsakedetail.upload_error_title'), err.message || t('app.keepsakedetail.upload_error_message'));
    } finally {
      setUploadingPhoto(false);
    }
  }

  function updatePhotoCaption(photoId, caption) {
    setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, caption } : p)));
  }

  async function savePhotoCaption(photo) {
    try {
      await put(`/api/books/mine/keepsake-photos/${photo.id}`, {
        caption: photo.caption || null,
      });
      showToast(t('app.keepsakedetail.caption_saved_toast'));
    } catch (err) {
      Alert.alert(t('app.keepsakedetail.caption_error_title'), err.message || t('app.keepsakedetail.try_again'));
    }
  }

  function confirmRemovePhoto(photo) {
    Alert.alert(
      t('app.keepsakedetail.remove_photo_title'),
      null,
      [
        { text: t('app.keepsakedetail.cancel'), style: 'cancel' },
        {
          text: t('app.keepsakedetail.remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              await del(`/api/books/mine/keepsake-photos/${photo.id}`);
              setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
            } catch (err) {
              Alert.alert(t('app.keepsakedetail.remove_error_title'), err.message || t('app.keepsakedetail.try_again'));
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

  const categories = [
    { value: 'artwork',     label: t('app.keepsakedetail.category_artwork') },
    { value: 'schoolwork',  label: t('app.keepsakedetail.category_schoolwork') },
    { value: 'award',       label: t('app.keepsakedetail.category_award') },
    { value: 'memorabilia', label: t('app.keepsakedetail.category_memorabilia') },
  ];

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

        {/* The basics */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('app.keepsakedetail.basics_title')}</Text>

          <Text style={styles.label}>{t('app.keepsakedetail.title_label')}</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={t('app.keepsakedetail.title_placeholder')}
            placeholderTextColor={colors.placeholder}
          />

          <Text style={styles.label}>{t('app.keepsakedetail.category_label')}</Text>
          <View style={styles.categoryRow}>
            {categories.map((c) => (
              <TouchableOpacity
                key={c.value}
                onPress={() => setCategory(category === c.value ? '' : c.value)}
                style={[
                  styles.categoryChip,
                  category === c.value && styles.categoryChipActive,
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    category === c.value && styles.categoryChipTextActive,
                  ]}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>{t('app.keepsakedetail.description_label')}</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder={t('app.keepsakedetail.description_placeholder')}
            placeholderTextColor={colors.placeholder}
          />
        </View>

        {/* Who, when, where */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('app.keepsakedetail.whowhenwhere_title')}</Text>
          <Text style={styles.hint}>{t('app.keepsakedetail.whowhenwhere_hint')}</Text>

          <Text style={styles.label}>{t('app.keepsakedetail.made_by_label')}</Text>
          <TextInput
            style={styles.input}
            value={attribution}
            onChangeText={setAttribution}
            placeholder={t('app.keepsakedetail.made_by_placeholder')}
            placeholderTextColor={colors.placeholder}
          />

          <Text style={styles.label}>{t('app.keepsakedetail.age_label')}</Text>
          <TextInput
            style={styles.input}
            value={ageText}
            onChangeText={setAgeText}
            placeholder={t('app.keepsakedetail.age_placeholder')}
            placeholderTextColor={colors.placeholder}
          />

          <Text style={styles.label}>{t('app.keepsakedetail.date_label')}</Text>
          <TextInput
            style={styles.input}
            value={dateMade}
            onChangeText={setDateMade}
            placeholder={t('app.keepsakedetail.date_placeholder')}
            placeholderTextColor={colors.placeholder}
            autoCapitalize="none"
          />
        </View>

        {/* Story */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('app.keepsakedetail.story_title')}</Text>
          <TextInput
            style={[styles.input, styles.storyInput]}
            value={story}
            onChangeText={setStory}
            placeholder={t('app.keepsakedetail.story_placeholder')}
            placeholderTextColor={colors.placeholder}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.hint}>{t('app.keepsakedetail.story_hint')}</Text>
        </View>

        {/* Photos */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('app.keepsakedetail.photos_title')}</Text>
          <Text style={styles.hint}>{t('app.keepsakedetail.photos_hint')}</Text>

          {photos.length === 0 && (
            <Text style={styles.emptyText}>{t('app.keepsakedetail.photos_empty')}</Text>
          )}

          {photos.map((p) => {
            const uri = photoUri(p.photo_path);
            return (
              <View key={p.id} style={styles.photoCard}>
                {uri ? (
                  <Image source={{ uri }} style={styles.photoImg} resizeMode="cover" />
                ) : (
                  <View style={[styles.photoImg, styles.photoPlaceholder]}>
                    <Text style={{ color: colors.gold }}>{t('app.keepsakedetail.no_image')}</Text>
                  </View>
                )}
                <TextInput
                  style={styles.captionInput}
                  value={p.caption || ''}
                  onChangeText={(v) => updatePhotoCaption(p.id, v)}
                  placeholder={t('app.keepsakedetail.caption_placeholder')}
                  placeholderTextColor={colors.placeholder}
                />
                <View style={styles.photoActions}>
                  <TouchableOpacity
                    style={styles.smallButton}
                    onPress={() => savePhotoCaption(p)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.smallButtonText}>{t('app.keepsakedetail.save_caption')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.smallButton, styles.smallButtonDanger]}
                    onPress={() => confirmRemovePhoto(p)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.smallButtonText, { color: colors.error }]}>{t('app.keepsakedetail.remove')}</Text>
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
              <ActivityIndicator color={colors.gold} />
            ) : (
              <Text style={styles.addPhotoText}>{t('app.keepsakedetail.add_photo')}</Text>
            )}
          </TouchableOpacity>
        </View>

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
            <Text style={styles.saveButtonText}>{t('app.keepsakedetail.save_button')}</Text>
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
            <Text style={styles.deleteButtonText}>{t('app.keepsakedetail.delete_button')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  hint: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  storyInput: { minHeight: 140, paddingTop: spacing.md, marginTop: spacing.xs },
  // Category chips
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  categoryChipActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  categoryChipText: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  categoryChipTextActive: {
    color: colors.white,
    fontWeight: typography.weights.semibold,
  },
  // Photos
  emptyText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: spacing.md,
  },
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
