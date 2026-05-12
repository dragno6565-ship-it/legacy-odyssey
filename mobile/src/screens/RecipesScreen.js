import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { get, post, BASE_URL } from '../api/client';

/**
 * List every recipe. Tap one to open the per-recipe editor; use the
 * "Add" row to create a new recipe.
 *
 * Uses per-item CRUD endpoints exclusively.
 */
export default function RecipesScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get('/api/books/mine/recipes');
      setRecipes(Array.isArray(res.data) ? res.data : []);
    } catch (_) {
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRecipes();
    }, [fetchRecipes])
  );

  async function handleAddRecipe() {
    const title = newTitle.trim();
    if (!title) return;
    setAdding(true);
    try {
      const res = await post('/api/books/mine/recipes', { title });
      setNewTitle('');
      navigation.navigate('RecipeDetail', {
        recipeId: res.data.id,
        title,
      });
    } catch (err) {
      Alert.alert('Could not add recipe', err.message || 'Please try again.');
    } finally {
      setAdding(false);
    }
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>Family Recipes</Text>
      <Text style={styles.pageSubtitle}>
        The dishes that mean home. Each recipe gets its own page with photos, a story, ingredients, and directions.
      </Text>

      {recipes.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No recipes yet. Add your first one below.</Text>
        </View>
      )}

      {recipes.map((r) => {
        const uri = photoUri(r.photo_path);
        const displayTitle = r.title && r.title !== '(untitled)' ? r.title : 'Untitled';
        const ingredientCount = Array.isArray(r.ingredients) ? r.ingredients.length : 0;
        const stepCount = Array.isArray(r.directions) ? r.directions.length : 0;
        return (
          <TouchableOpacity
            key={r.id}
            style={styles.row}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate('RecipeDetail', { recipeId: r.id, title: displayTitle })
            }
          >
            <View style={styles.thumb}>
              {uri ? (
                <Image source={{ uri }} style={styles.thumbImg} />
              ) : (
                <Text style={styles.thumbEmpty}>🍴</Text>
              )}
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle} numberOfLines={1}>{displayTitle}</Text>
              {r.origin_label ? (
                <Text style={styles.rowMeta} numberOfLines={1}>From {r.origin_label}</Text>
              ) : null}
              {(ingredientCount > 0 || stepCount > 0) ? (
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {ingredientCount > 0 ? `${ingredientCount} ingredient${ingredientCount === 1 ? '' : 's'}` : ''}
                  {ingredientCount > 0 && stepCount > 0 ? ' · ' : ''}
                  {stepCount > 0 ? `${stepCount} step${stepCount === 1 ? '' : 's'}` : ''}
                </Text>
              ) : null}
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        );
      })}

      <View style={styles.addCard}>
        <Text style={styles.addCardTitle}>Add a recipe</Text>
        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            value={newTitle}
            onChangeText={setNewTitle}
            placeholder="e.g. Grandma's Pancakes"
            placeholderTextColor={colors.placeholder}
            returnKeyType="done"
            onSubmitEditing={handleAddRecipe}
          />
          <TouchableOpacity
            style={[styles.addButton, (!newTitle.trim() || adding) && styles.addButtonDisabled]}
            onPress={handleAddRecipe}
            disabled={!newTitle.trim() || adding}
            activeOpacity={0.8}
          >
            {adding ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.addButtonText}>+ Add</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, paddingBottom: 150 },
  pageTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  pageSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    fontStyle: 'italic',
  },
  emptyState: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  emptyStateText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  row: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.card,
  },
  thumb: {
    width: 56, height: 56, borderRadius: borderRadius.sm,
    backgroundColor: colors.card, marginRight: spacing.md,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  thumbEmpty: { fontSize: 24, color: colors.gold },
  rowInfo: { flex: 1, minWidth: 0 },
  rowTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  rowMeta: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chevron: { fontSize: 24, color: colors.gold, marginLeft: spacing.sm },
  addCard: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: colors.gold,
    borderRadius: borderRadius.lg, padding: spacing.lg,
    marginTop: spacing.md, backgroundColor: colors.white,
  },
  addCardTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.gold,
    marginBottom: spacing.sm,
  },
  addRow: { flexDirection: 'row', gap: spacing.sm },
  addInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    fontSize: typography.sizes.md, color: colors.textPrimary,
  },
  addButton: {
    backgroundColor: colors.gold, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    alignItems: 'center', justifyContent: 'center', minWidth: 80,
  },
  addButtonDisabled: { opacity: 0.5 },
  addButtonText: {
    color: colors.white, fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});
