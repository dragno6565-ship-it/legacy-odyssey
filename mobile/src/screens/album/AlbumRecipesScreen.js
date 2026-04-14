import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography, shadows, borderRadius } from '../../theme';
import { get } from '../../api/client';

export default function AlbumRecipesScreen({ navigation }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function fetchRecipes() {
    try {
      const res = await get('/api/album');
      setRecipes(res.data.album?.recipes || []);
    } catch (err) {
      if (err.status !== 404) {
        setError(err.message || 'Failed to load recipes.');
      }
    }
  }

  useEffect(() => {
    fetchRecipes().finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRecipes();
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await fetchRecipes();
    setRefreshing(false);
  }

  function handleAddRecipe() {
    const newRecipe = { title: '', label: '', note: '', ingredients: [] };
    const updatedRecipes = [...recipes, newRecipe];
    const recipeIndex = updatedRecipes.length - 1;
    setRecipes(updatedRecipes);
    navigation.navigate('AlbumRecipeDetail', { recipeIndex });
  }

  function handlePressRecipe(index) {
    navigation.navigate('AlbumRecipeDetail', { recipeIndex: index });
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Family Recipes</Text>
        <Text style={styles.pageSubtitle}>Flavors passed down through generations</Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {recipes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No recipes yet. Add your first family recipe!
            </Text>
          </View>
        ) : null}

        {recipes.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.recipeCard}
            activeOpacity={0.7}
            onPress={() => handlePressRecipe(index)}
          >
            <View style={styles.cardMain}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.title || 'Untitled Recipe'}
              </Text>
              {item.label ? (
                <View style={styles.badgeRow}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.label}</Text>
                  </View>
                </View>
              ) : null}
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.editArrow}>→</Text>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.7}
          onPress={handleAddRecipe}
        >
          <Text style={styles.addButtonText}>+ Add Recipe</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
  emptyState: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  recipeCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.card,
  },
  cardMain: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.gold,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  badge: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  cardRight: {
    paddingLeft: spacing.sm,
  },
  editArrow: {
    fontSize: typography.sizes.xl,
    color: colors.gold,
    fontWeight: typography.weights.bold,
  },
  addButton: {
    borderWidth: 1.5,
    borderColor: colors.gold,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    minHeight: 50,
    backgroundColor: 'transparent',
  },
  addButtonText: {
    color: colors.gold,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});
