import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { useHeaderHeight } from '@react-navigation/elements';
import { get, put } from '../api/client';
import PhotoPicker from '../components/PhotoPicker';

const DEFAULT_RECIPES = Array.from({ length: 4 }, () => ({
  photo_path: '',
  origin_label: '',
  title: '',
  description: '',
  ingredients: [],
}));

export default function RecipesScreen({ navigation }) {
  const headerHeight = useHeaderHeight();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [recipes, setRecipes] = useState(DEFAULT_RECIPES);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await get('/api/books/mine/recipes');
        const fetched = Array.isArray(res.data) ? res.data : [];
        const merged = Array.from({ length: 4 }, (_, i) => ({
          photo_path: fetched[i]?.photo_path || '',
          origin_label: fetched[i]?.origin_label || '',
          title: fetched[i]?.title || '',
          description: fetched[i]?.description || '',
          ingredients: Array.isArray(fetched[i]?.ingredients) ? fetched[i].ingredients : [],
        }));
        setRecipes(merged);
      } catch (err) {
        if (err.status !== 404) {
          setError(err.message || 'Failed to load recipes.');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function updateRecipe(index, field, value) {
    setRecipes((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function updateIngredient(recipeIndex, ingIndex, value) {
    setRecipes((prev) => {
      const updated = [...prev];
      const ings = [...updated[recipeIndex].ingredients];
      ings[ingIndex] = value;
      updated[recipeIndex] = { ...updated[recipeIndex], ingredients: ings };
      return updated;
    });
  }

  function addIngredient(recipeIndex) {
    setRecipes((prev) => {
      const updated = [...prev];
      updated[recipeIndex] = {
        ...updated[recipeIndex],
        ingredients: [...updated[recipeIndex].ingredients, ''],
      };
      return updated;
    });
  }

  function removeIngredient(recipeIndex, ingIndex) {
    setRecipes((prev) => {
      const updated = [...prev];
      updated[recipeIndex] = {
        ...updated[recipeIndex],
        ingredients: updated[recipeIndex].ingredients.filter((_, i) => i !== ingIndex),
      };
      return updated;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const cleaned = recipes.map((r) => ({
        ...r,
        ingredients: r.ingredients.filter((ing) => ing.trim()),
      }));
      await put('/api/books/mine/recipes', { items: cleaned });
      Alert.alert('Saved', 'Recipes updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      setError(err.message || 'Failed to save.');
    } finally {
      setSaving(false);
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
        <Text style={styles.pageTitle}>Family Recipes</Text>
        <Text style={styles.pageSubtitle}>Flavors passed down through generations</Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {recipes.map((recipe, rIndex) => (
          <View key={rIndex} style={styles.card}>
            <Text style={styles.cardNumber}>Recipe {rIndex + 1}</Text>

            <PhotoPicker
              currentPhoto={recipe.photo_path}
              onPhotoSelected={(path) => updateRecipe(rIndex, 'photo_path', path)}
            />

            <Text style={styles.label}>Origin / Family Source</Text>
            <TextInput
              style={styles.input}
              value={recipe.origin_label}
              onChangeText={(val) => updateRecipe(rIndex, 'origin_label', val)}
              placeholder="e.g., Grandma Rose's Kitchen"
              placeholderTextColor={colors.placeholder}
            />

            <Text style={styles.label}>Recipe Title</Text>
            <TextInput
              style={styles.input}
              value={recipe.title}
              onChangeText={(val) => updateRecipe(rIndex, 'title', val)}
              placeholder="e.g., Sunday Morning Pancakes"
              placeholderTextColor={colors.placeholder}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.descInput]}
              value={recipe.description}
              onChangeText={(val) => updateRecipe(rIndex, 'description', val)}
              placeholder="The story behind this recipe..."
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={styles.label}>Ingredients</Text>
            {recipe.ingredients.map((ing, iIndex) => (
              <View key={iIndex} style={styles.ingredientRow}>
                <TextInput
                  style={styles.ingredientInput}
                  value={ing}
                  onChangeText={(val) => updateIngredient(rIndex, iIndex, val)}
                  placeholder="Ingredient..."
                  placeholderTextColor={colors.placeholder}
                />
                <TouchableOpacity onPress={() => removeIngredient(rIndex, iIndex)}>
                  <Text style={styles.removeBtn}>{'\u2715'}</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => addIngredient(rIndex)}
            >
              <Text style={styles.addBtnText}>+ Add Ingredient</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save All Recipes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg, ...shadows.card },
  cardNumber: { fontFamily: typography.fontFamily.serif, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.gold, marginBottom: spacing.sm },
  label: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.textPrimary, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, fontSize: typography.sizes.md, color: colors.textPrimary },
  descInput: { minHeight: 100, paddingTop: spacing.md },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
  ingredientInput: { flex: 1, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, fontSize: typography.sizes.md, color: colors.textPrimary },
  removeBtn: { color: colors.error, fontSize: 18, paddingHorizontal: spacing.sm },
  addBtn: { borderWidth: 2, borderColor: colors.gold, borderStyle: 'dashed', borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  addBtnText: { color: colors.gold, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
  saveButton: { backgroundColor: colors.gold, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, minHeight: 50, ...shadows.button },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: colors.white, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold },
});
