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
 * Per-recipe editor — all fields, ingredients, directions, multi-photo
 * gallery, delete.
 *
 * Each ingredient is {amount, item}. Each direction is {text}. Saves go
 * to the per-item CRUD endpoints; bulk PUTs are not called.
 */
export default function RecipeDetailScreen({ navigation, route }) {
  const { recipeId } = route.params;
  const headerHeight = useHeaderHeight();
  const { showToast, ToastComponent } = useSavedToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  // Fields
  const [title, setTitle] = useState('');
  const [originLabel, setOriginLabel] = useState('');
  const [description, setDescription] = useState('');
  const [story, setStory] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [notes, setNotes] = useState('');
  const [ingredients, setIngredients] = useState([{ amount: '', item: '' }]);
  const [directions, setDirections] = useState([{ text: '' }]);
  const [photos, setPhotos] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: route.params?.title || 'Recipe' });
  }, [navigation, route.params?.title]);

  const fetchRecipe = useCallback(async () => {
    try {
      const res = await get(`/api/books/mine/recipes/${recipeId}`);
      const r = res.data || {};
      setTitle(r.title && r.title !== '(untitled)' ? r.title : '');
      setOriginLabel(r.origin_label || '');
      setDescription(r.description || '');
      setStory(r.story || '');
      setPrepTime(r.prep_time || '');
      setCookTime(r.cook_time || '');
      setServings(r.servings || '');
      setDifficulty(r.difficulty || '');
      setNotes(r.notes || '');

      // Normalize ingredients (server may have strings from old data)
      const ings = Array.isArray(r.ingredients) ? r.ingredients : [];
      const normalizedIngs = ings.map((ing) =>
        typeof ing === 'string'
          ? { amount: '', item: ing }
          : { amount: ing.amount || '', item: ing.item || ing.name || ing.text || '' }
      );
      setIngredients(normalizedIngs.length > 0 ? normalizedIngs : [{ amount: '', item: '' }]);

      // Normalize directions
      const dirs = Array.isArray(r.directions) ? r.directions : [];
      const normalizedDirs = dirs.map((d) =>
        typeof d === 'string' ? { text: d } : { text: d.text || d.body || '' }
      );
      setDirections(normalizedDirs.length > 0 ? normalizedDirs : [{ text: '' }]);

      setPhotos(Array.isArray(r.photos) ? r.photos : []);
    } catch (err) {
      setError(err.message || 'Failed to load recipe.');
    } finally {
      setLoading(false);
    }
  }, [recipeId]);

  useFocusEffect(
    useCallback(() => {
      fetchRecipe();
    }, [fetchRecipe])
  );

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      // Clean up: drop empty rows entirely
      const cleanIngredients = ingredients
        .map((i) => ({ amount: (i.amount || '').trim(), item: (i.item || '').trim() }))
        .filter((i) => i.amount || i.item);
      const cleanDirections = directions
        .map((d) => ({ text: (d.text || '').trim() }))
        .filter((d) => d.text);

      await put(`/api/books/mine/recipes/${recipeId}`, {
        title: title.trim() || 'Untitled',
        origin_label: originLabel.trim(),
        description: description.trim(),
        story: story.trim(),
        prep_time: prepTime.trim(),
        cook_time: cookTime.trim(),
        servings: servings.trim(),
        difficulty: difficulty.trim(),
        notes: notes.trim(),
        ingredients: cleanIngredients,
        directions: cleanDirections,
      });
      showToast('Recipe saved.');
    } catch (err) {
      setError(err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Delete this recipe?',
      'This removes the recipe and all its photos. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: handleDelete },
      ]
    );
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await del(`/api/books/mine/recipes/${recipeId}`);
      navigation.goBack();
    } catch (err) {
      setDeleting(false);
      Alert.alert('Could not delete', err.message || 'Please try again.');
    }
  }

  // ──── Ingredients ────
  function updateIngredient(idx, key, value) {
    setIngredients((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: value };
      return next;
    });
  }
  function addIngredient() {
    setIngredients((prev) => [...prev, { amount: '', item: '' }]);
  }
  function removeIngredient(idx) {
    setIngredients((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length > 0 ? next : [{ amount: '', item: '' }];
    });
  }

  // ──── Directions ────
  function updateDirection(idx, value) {
    setDirections((prev) => {
      const next = [...prev];
      next[idx] = { text: value };
      return next;
    });
  }
  function addDirection() {
    setDirections((prev) => [...prev, { text: '' }]);
  }
  function removeDirection(idx) {
    setDirections((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length > 0 ? next : [{ text: '' }];
    });
  }

  // ──── Photos ────
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

      const created = await post(`/api/books/mine/recipes/${recipeId}/photos`, {
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
      await put(`/api/books/mine/recipe-photos/${photo.id}`, {
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
              await del(`/api/books/mine/recipe-photos/${photo.id}`);
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

  const difficulties = ['', 'Easy', 'Medium', 'Hard'];

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

          <Text style={styles.label}>Recipe name</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Grandma's Pancakes"
            placeholderTextColor={colors.placeholder}
          />

          <Text style={styles.label}>From whom</Text>
          <TextInput
            style={styles.input}
            value={originLabel}
            onChangeText={setOriginLabel}
            placeholder="e.g. Grandma Sarah"
            placeholderTextColor={colors.placeholder}
          />

          <Text style={styles.label}>Short description</Text>
          <TextInput
            style={[styles.input, styles.descInput]}
            value={description}
            onChangeText={setDescription}
            placeholder="A short tagline that appears under the title."
            placeholderTextColor={colors.placeholder}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* The story */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>The story</Text>
          <TextInput
            style={[styles.input, styles.storyInput]}
            value={story}
            onChangeText={setStory}
            placeholder="Where the recipe came from, why it matters, what you'll remember."
            placeholderTextColor={colors.placeholder}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.hint}>Optional. Press Enter twice between paragraphs.</Text>
        </View>

        {/* Cooking details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cooking details</Text>
          <Text style={styles.hint}>All optional.</Text>

          <View style={styles.row2}>
            <View style={styles.row2col}>
              <Text style={styles.label}>Prep time</Text>
              <TextInput
                style={styles.input}
                value={prepTime}
                onChangeText={setPrepTime}
                placeholder="e.g. 15 min"
                placeholderTextColor={colors.placeholder}
              />
            </View>
            <View style={styles.row2col}>
              <Text style={styles.label}>Cook time</Text>
              <TextInput
                style={styles.input}
                value={cookTime}
                onChangeText={setCookTime}
                placeholder="e.g. 45 min"
                placeholderTextColor={colors.placeholder}
              />
            </View>
          </View>

          <View style={styles.row2}>
            <View style={styles.row2col}>
              <Text style={styles.label}>Serves</Text>
              <TextInput
                style={styles.input}
                value={servings}
                onChangeText={setServings}
                placeholder="e.g. 4–6"
                placeholderTextColor={colors.placeholder}
              />
            </View>
            <View style={styles.row2col}>
              <Text style={styles.label}>Difficulty</Text>
              <View style={styles.difficultyRow}>
                {difficulties.slice(1).map((d) => (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setDifficulty(difficulty === d ? '' : d)}
                    style={[
                      styles.difficultyChip,
                      difficulty === d && styles.difficultyChipActive,
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.difficultyChipText,
                        difficulty === d && styles.difficultyChipTextActive,
                      ]}
                    >
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Ingredients */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ingredients</Text>
          <Text style={styles.hint}>Amount on the left, ingredient on the right.</Text>

          {ingredients.map((ing, i) => (
            <View key={i} style={styles.ingRow}>
              <TextInput
                style={[styles.input, styles.ingAmount]}
                value={ing.amount}
                onChangeText={(v) => updateIngredient(i, 'amount', v)}
                placeholder="2 cups"
                placeholderTextColor={colors.placeholder}
              />
              <TextInput
                style={[styles.input, styles.ingItem]}
                value={ing.item}
                onChangeText={(v) => updateIngredient(i, 'item', v)}
                placeholder="all-purpose flour"
                placeholderTextColor={colors.placeholder}
              />
              <TouchableOpacity
                style={styles.rowRemoveBtn}
                onPress={() => removeIngredient(i)}
                activeOpacity={0.7}
              >
                <Text style={styles.rowRemoveText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.addRowBtn} onPress={addIngredient} activeOpacity={0.8}>
            <Text style={styles.addRowBtnText}>+ Add ingredient</Text>
          </TouchableOpacity>
        </View>

        {/* Directions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Directions</Text>
          <Text style={styles.hint}>Steps will be numbered automatically.</Text>

          {directions.map((step, i) => (
            <View key={i} style={styles.directionRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <TextInput
                style={[styles.input, styles.directionInput]}
                value={step.text}
                onChangeText={(v) => updateDirection(i, v)}
                placeholder={`Step ${i + 1}`}
                placeholderTextColor={colors.placeholder}
                multiline
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={styles.rowRemoveBtn}
                onPress={() => removeDirection(i)}
                activeOpacity={0.7}
              >
                <Text style={styles.rowRemoveText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.addRowBtn} onPress={addDirection} activeOpacity={0.8}>
            <Text style={styles.addRowBtnText}>+ Add step</Text>
          </TouchableOpacity>
        </View>

        {/* Notes */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notes & memories</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Tips, variations, little memories."
            placeholderTextColor={colors.placeholder}
            multiline
            textAlignVertical="top"
          />
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
            <Text style={styles.deleteButtonText}>Delete recipe</Text>
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
  descInput: { minHeight: 80, paddingTop: spacing.md, marginTop: spacing.xs },
  storyInput: { minHeight: 140, paddingTop: spacing.md, marginTop: spacing.xs },
  notesInput: { minHeight: 100, paddingTop: spacing.md, marginTop: spacing.xs },
  // Cooking details two-column row
  row2: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  row2col: { flex: 1 },
  // Difficulty chips
  difficultyRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  difficultyChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  difficultyChipActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  difficultyChipText: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  difficultyChipTextActive: {
    color: colors.white,
    fontWeight: typography.weights.semibold,
  },
  // Ingredient rows
  ingRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  ingAmount: { flex: 0.8 },
  ingItem: { flex: 1.4 },
  rowRemoveBtn: {
    width: 32, height: 32,
    borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.error,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.white,
  },
  rowRemoveText: { color: colors.error, fontSize: 18, lineHeight: 20 },
  addRowBtn: {
    marginTop: spacing.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.gold,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  addRowBtnText: {
    color: colors.gold,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  // Direction rows
  directionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    alignItems: 'flex-start',
  },
  stepNum: {
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: colors.gold,
    justifyContent: 'center', alignItems: 'center',
    marginTop: spacing.sm,
  },
  stepNumText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  directionInput: {
    flex: 1,
    minHeight: 70,
  },
  // Photo gallery
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
