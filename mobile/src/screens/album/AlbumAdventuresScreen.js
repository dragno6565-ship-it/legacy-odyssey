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

export default function AlbumAdventuresScreen({ navigation }) {
  const [adventures, setAdventures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function fetchAdventures() {
    try {
      const res = await get('/api/album');
      setAdventures(res.data.album?.adventures || []);
    } catch (err) {
      if (err.status !== 404) {
        setError(err.message || 'Failed to load adventures.');
      }
    }
  }

  useEffect(() => {
    fetchAdventures().finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAdventures();
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await fetchAdventures();
    setRefreshing(false);
  }

  function handleAddAdventure() {
    const newAdventure = { emoji: '✈️', title: '', dest: '', year: '', tagline: '', story: '' };
    const updatedAdventures = [...adventures, newAdventure];
    const adventureIndex = updatedAdventures.length - 1;
    setAdventures(updatedAdventures);
    navigation.navigate('AlbumAdventureDetail', { adventureIndex });
  }

  function handlePressAdventure(index) {
    navigation.navigate('AlbumAdventureDetail', { adventureIndex: index });
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
        <Text style={styles.pageTitle}>Adventures</Text>
        <Text style={styles.pageSubtitle}>The places you went and the memories you made</Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {adventures.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No adventures yet. Add your first family adventure!
            </Text>
          </View>
        ) : null}

        {adventures.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.adventureCard}
            activeOpacity={0.7}
            onPress={() => handlePressAdventure(index)}
          >
            <View style={styles.cardLeft}>
              <Text style={styles.cardEmoji}>{item.emoji || '✈️'}</Text>
            </View>
            <View style={styles.cardMiddle}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.title || 'New Adventure'}
              </Text>
              {item.year ? <Text style={styles.cardYear}>{item.year}</Text> : null}
              {item.dest ? (
                <Text style={styles.cardDest} numberOfLines={1}>
                  {item.dest}
                </Text>
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
          onPress={handleAddAdventure}
        >
          <Text style={styles.addButtonText}>+ Add Adventure</Text>
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
  adventureCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.card,
  },
  cardLeft: {
    marginRight: spacing.md,
  },
  cardEmoji: {
    fontSize: 36,
  },
  cardMiddle: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.gold,
  },
  cardYear: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  cardDest: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
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
