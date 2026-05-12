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
 * Per-celebration editor — fields, multi-photo gallery, delete.
 *
 * Uses the new per-item CRUD endpoints exclusively. No bulk PUTs.
 */
export default function CelebrationDetailScreen({ navigation, route }) {
  const { celebrationId, yearLabel } = route.params;
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

  useEffect(() => {
    navigation.setOptions({ title: route.params?.title || 'Celebration' });
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
      setError(err.message || 'Failed to load celebration.');
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
      showToast('Celebration saved.');
      if (trimmedDate && !validDate) {
        // Heads-up so they know why the date didn't stick
        setTimeout(() => {
          Alert.alert(
            'Date format',
            'The date was saved as blank because the format wasn\'t YYYY-MM-DD. Try "2026-12-25" for December 25, 2026.'
          );
        }, 100);
      }
      // Stay on the page so the user can continue editing / managing photos
    } catch (err) {
      setError(err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Delete this celebration?',
      'This removes the celebration and all its photos. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: handleDelete },
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
      Alert.alert('Could not delete', err.message || 'Please try again.');
    }
  }

  async function handleAddPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant photo library access to add photos.');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (picked.canceled || !picked.assets || picked.assets.length === 0) return;
    const asset = picked.assets[0];

    setUploadingPhoto(true);
    try {
      // 1) Upload the raw file
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

      // 2) Attach to the celebration
      const created = await post(
        `/api/books/mine/celebrations/${celebrationId}/photos`,
        { photo_path: photoPath, caption: null }
      );
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
      await put(`/api/books/mine/celebration-photos/${photo.id}`, {
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
              await del(`/api/books/mine/celebration-photos/${photo.id}`);
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
          <Text style={styles.cardTitle}>Details</Text>

          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. First Christmas"
            placeholderTextColor={colors.placeholder}
          />

          <Text style={styles.label}>Eyebrow / sub-label</Text>
          <TextInput
            style={styles.input}
            value={eyebrow}
            onChangeText={setEyebrow}
            placeholder="e.g. Christmas Day · December 25, 2025"
            placeholderTextColor={colors.placeholder}
          />
          <Text style={styles.hint}>Small text above the title on the published page.</Text>

          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            value={celebrationDate}
            onChangeText={setCelebrationDate}
            placeholder="YYYY-MM-DD (optional)"
            placeholderTextColor={colors.placeholder}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Where it was</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. Grandma & Grandpa's house"
            placeholderTextColor={colors.placeholder}
          />

          <Text style={styles.label}>Who was there</Text>
          <TextInput
            style={styles.input}
            value={attendees}
            onChangeText={setAttendees}
            placeholder="e.g. Mom, Dad, Grandma Pat"
            placeholderTextColor={colors.placeholder}
          />
          <Text style={styles.hint}>
            Comma-separated names. Each shows as a little tag on the published page.
          </Text>
        </View>

        {/* Story */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>The story</Text>
          <TextInput
            style={[styles.input, styles.bodyInput]}
            value={body}
            onChangeText={setBody}
            placeholder="Tell the story of the day — what happened, what was special."
            placeholderTextColor={colors.placeholder}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.hint}>Press Enter twice between paragraphs.</Text>
        </View>

        {/* Presents */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Presents</Text>
          <TextInput
            style={[styles.input, styles.giftsInput]}
            value={gifts}
            onChangeText={setGifts}
            placeholder={'One gift per line.\ne.g. Handmade quilt from Grandma\nWooden blocks'}
            placeholderTextColor={colors.placeholder}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.hint}>One per line. Shown as a bulleted list.</Text>
        </View>

        {/* Photo gallery */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Photos</Text>
          <Text style={styles.hint}>The first photo becomes the cover on the published page.</Text>

          {photos.length === 0 && (
            <Text style={styles.emptyText}>No photos yet. Add some below.</Text>
          )}

          {photos.map((p, idx) => {
            const uri = photoUri(p.photo_path);
            return (
              <View key={p.id || idx} style={styles.photoCard}>
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
            <Text style={styles.deleteButtonText}>Delete celebration</Text>
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
