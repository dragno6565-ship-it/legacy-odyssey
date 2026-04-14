import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { colors, spacing, typography, shadows, borderRadius } from '../../theme';
import { useHeaderHeight } from '@react-navigation/elements';
import { get, put } from '../../api/client';
import { useSavedToast } from '../../components/SavedToast';

export default function AlbumRecipeDetailScreen({ navigation, route }) {
  const headerHeight = useHeaderHeight();
  const { showToast, ToastComponent } = useSavedToast();
  const { recipeIndex } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  // Full recipes array fetched from server — used for PUT
  const [allRecipes, setAllRecipes] = useState([]);

  // Individual field state
  const [title, setTitle] = useState('');
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');
  const [ingredients, setIngredients] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await get('/api/album');
        const fetchedRecipes = res.data.album?.recipes || [];
        setAllRecipes(fetchedRecipes);
        const entry = fetchedRecipes[recipeIndex] || {};
        setTitle(entry.title || '');
        setLabel(entry.label || '');
        setNote(entry.note || '');
        setIngredients(Array.isArray(entry.ingredients) ? entry.ingredients : []);
      } catch (err) {
        if (err.status !== 404) {
          setError(err.message || 'Failed to load recipe data.');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [recipeIndex]);

  function updateIngredient(index, value) {
    setIngredients((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  }

  function addIngredient() {
    setIngredients((prev) => [...prev, '']);
  }

  function removeIngredient(index) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const updatedEntry = {
        title: title.trim(),
        label: label.trim(),
        note: note.trim(),
        ingredients: ingredients.filter((ing) => ing.trim()),
      };
      const updatedRecipes = [...allRecipes];
      updatedRecipes[recipeIndex] = updatedEntry;
      await put('/api/album/recipes', { recipes: updatedRecipes });
      showToast('Recipe saved.');
      setTimeout(() => navigation.goBack(), 1800);
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Delete This Recipe?',
      title
        ? `Are you sure you want to delete "${title}"? This cannot be undone.`
        : 'Are you sure you want to delete this recipe? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: handleDelete,
        },
      ]
    );
  }

  async function handleDelete() {
    setDeleting(true);
    setError('');
    try {
      const updatedRecipes = allRecipes.filter((_, i) => i !== recipeIndex);
      await put('/api/album/recipes', { recipes: updatedRecipes });
      navigation.goBack();
    } catch (err) {
      setError(err.message || 'Failed to delete. Please try again.');
      setDeleting(false);
    }
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
        <Text style={styles.pageTitle}>{title || 'Recipe'}</Text>
        <Text style={styles.pageSubtitle}>Edit the details for this recipe</Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Grandma's Apple Pie"
            placeholderTextColor={colors.placeholder}
          />

          <Text style={styles.label}>Category / Label</Text>
          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            placeholder="e.g. Dessert, Breakfast"
            placeholderTextColor={colors.placeholder}
          />

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.noteInput]}
            value={note}
            onChangeText={setNote}
            placeholder="Tips, origins, or the story behind it"
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Ingredients</Text>
          {ingredients.map((ing, index) => (
            <View key={index} style={styles.ingredientRow}>
              <TextInput
                style={styles.ingredientInput}
                value={ing}
                onChangeText={(val) => updateIngredient(index, val)}
                placeholder="Ingredient..."
                placeholderTextColor={colors.placeholder}
              />
              <TouchableOpacity onPress={() => removeIngredient(index)}>
                <Text style={styles.removeBtn}>{'\u2715'}</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addIngredientBtn} onPress={addIngredient}>
            <Text style={styles.addIngredientBtnText}>+ Add Ingredient</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving || deleting}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
          onPress={confirmDelete}
          disabled={saving || deleting}
          activeOpacity={0.8}
        >
          {deleting ? (
            <ActivityIndicator color={colors.error} />
          ) : (
            <Text style={styles.deleteButtonText}>Delete This Recipe</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      {ToastComponent}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 150,
  },
  pageTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  pageSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    fontStyle: 'italic',
  },
  errorContainer: {
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
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
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  noteInput: {
    minHeight: 100,
    paddingTop: spacing.md,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  ingredientInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  removeBtn: {
    color: colors.error,
    fontSize: 18,
    paddingHorizontal: spacing.sm,
  },
  addIngredientBtn: {
    borderWidth: 2,
    borderColor: colors.gold,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  addIngredientBtnText: {
    color: colors.gold,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  saveButton: {
    backgroundColor: colors.gold,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    minHeight: 50,
    ...shadows.button,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  deleteButton: {
    borderWidth: 1.5,
    borderColor: colors.error,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    backgroundColor: 'transparent',
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    color: colors.error,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});
