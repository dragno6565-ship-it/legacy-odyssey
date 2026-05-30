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

/**
 * Per-keepsake editor — title, category, who/when/where, story, photo gallery.
 * Uses per-item CRUD endpoints exclusively.
 */
export default function KeepsakeDetailScreen({ navigation, route }) {
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
    navigation.setOptions({ title: route.params?.title || 'Keepsake' });
  }, [navigation, route.params?.title]);

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
      setError(err.message || 'Failed to load keepsake.');
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
        title: title.trim() || 'Untitled',
        category: (category || '').trim().toLowerCase() || null,
        description: description.trim() || null,
        attribution: attribution.trim() || null,
        age_text: ageText.trim() || null,
        date_made: validDate,
        story: story.trim() || null,
      });
      showToast('Keepsake saved.');
      if (trimmedDate && !validDate) {
        setTimeout(() => {
          Alert.alert(
            'Date format',
            'The date was saved as blank because the format wasn\'t YYYY-MM-DD. Try "2028-03-15" for March 15, 2028.'
          );
        }, 100);
      }
    } catch (err) {
      setError(err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Delete this keepsake?',
      'This removes the keepsake and all its photos. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: handleDelete },
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
      Alert.alert('Could not delete', err.message || 'Please try again.');
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
      if (!photoPath) throw new Error('Upload did not return a photo path.');

      const created = await post(`/api/books/mine/keepsakes/${keepsakeId}/photos`, {
        photo_path: photoPath, caption: null,
      });
      setPhotos((prev) => [...prev, created.data]);
    } catch (err) {
      Alert.alert('Upload failed', err.message || 'Could not add photo.');
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
      showToast('Caption saved.');
    } catch (err) {
      Alert.alert('Could not save caption', err.message || 'Please try again.');
    }
  }

  function confirmRemovePhoto(photo) {
    Alert.alert(
      'Remove this photo?',
      null,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await del(`/api/books/mine/keepsake-photos/${photo.id}`);
              setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
            } catch (err) {
              Alert.alert('Could not remove', err.message || 'Please try again.');
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
    { value: 'artwork',     label: 'Artwork' },
    { value: 'schoolwork',  label: 'Schoolwork' },
    { value: 'award',       label: 'Award' },
    { value: 'memorabilia', label: 'Memorabilia' },
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
          <Text style={styles.cardTitle}>The basics</Text>

          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. First finger painting"
            placeholderTextColor={colors.placeholder}
          />

          <Text style={styles.label}>Category</Text>
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

          <Text style={styles.label}>Short description</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="A short tagline shown under the title."
            placeholderTextColor={colors.placeholder}
          />
        </View>

        {/* Who, when, where */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Who, when, where</Text>
          <Text style={styles.hint}>All optional. Anything you fill in shows up in the meta strip.</Text>

          <Text style={styles.label}>Made by</Text>
          <TextInput
            style={styles.input}
            value={attribution}
            onChangeText={setAttribution}
            placeholder="e.g. Sophia"
            placeholderTextColor={colors.placeholder}
          />

          <Text style={styles.label}>Age or grade</Text>
          <TextInput
            style={styles.input}
            value={ageText}
            onChangeText={setAgeText}
            placeholder="e.g. Age 4 or Kindergarten"
            placeholderTextColor={colors.placeholder}
          />

          <Text style={styles.label}>Date created</Text>
          <TextInput
            style={styles.input}
            value={dateMade}
            onChangeText={setDateMade}
            placeholder="YYYY-MM-DD (optional)"
            placeholderTextColor={colors.placeholder}
            autoCapitalize="none"
          />
        </View>

        {/* Story */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>The story</Text>
          <TextInput
            style={[styles.input, styles.storyInput]}
            value={story}
            onChangeText={setStory}
            placeholder="What was happening, why it matters, what you'll want to remember."
            placeholderTextColor={colors.placeholder}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.hint}>Optional. Press Enter twice between paragraphs.</Text>
        </View>

        {/* Photos */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Photos</Text>
          <Text style={styles.hint}>The first photo becomes the cover on the published page.</Text>

          {photos.length === 0 && (
            <Text style={styles.emptyText}>No photos yet. Add some below.</Text>
          )}

          {photos.map((p) => {
            const uri = photoUri(p.photo_path);
            return (
              <View key={p.id} style={styles.photoCard}>
                {uri ? (
                  <Image source={{ uri }} style={styles.photoImg} resizeMode="cover" />
                ) : (
                  <View style={[styles.photoImg, styles.photoPlaceholder]}>
                    <Text style={{ color: colors.gold }}>No image</Text>
                  </View>
                )}
                <TextInput
                  style={styles.captionInput}
                  value={p.caption || ''}
                  onChangeText={(v) => updatePhotoCaption(p.id, v)}
                  placeholder="Caption (optional)"
                  placeholderTextColor={colors.placeholder}
                />
                <View style={styles.photoActions}>
                  <TouchableOpacity
                    style={styles.smallButton}
                    onPress={() => savePhotoCaption(p)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.smallButtonText}>Save caption</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.smallButton, styles.smallButtonDanger]}
                    onPress={() => confirmRemovePhoto(p)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.smallButtonText, { color: colors.error }]}>Remove</Text>
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
              <Text style={styles.addPhotoText}>+ Add Photo</Text>
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
            <Text style={styles.saveButtonText}>Save Changes</Text>
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
            <Text style={styles.deleteButtonText}>Delete keepsake</Text>
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
