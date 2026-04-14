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
import { get, put } from '../../api/client';

export default function AlbumYearsScreen({ navigation }) {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function fetchYears() {
    try {
      const res = await get('/api/album');
      setYears(res.data.album?.years || []);
    } catch (err) {
      if (err.status !== 404) {
        setError(err.message || 'Failed to load years.');
      }
    }
  }

  useEffect(() => {
    fetchYears().finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchYears();
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await fetchYears();
    setRefreshing(false);
  }

  function buildOnSave(currentYears) {
    return async function onSave(yearIndex, updatedYear) {
      const updated = [...currentYears];
      updated[yearIndex] = updatedYear;
      await put('/api/album/years', { years: updated });
      await fetchYears();
    };
  }

  function buildOnDelete(currentYears) {
    return async function onDelete(yearIndex) {
      const updated = currentYears.filter((_, i) => i !== yearIndex);
      await put('/api/album/years', { years: updated });
      await fetchYears();
    };
  }

  function handleAddYear() {
    const newYear = { year: '', label: '', highlight: '', note: '' };
    const updatedYears = [...years, newYear];
    const yearIndex = updatedYears.length - 1;
    // Optimistically append so the detail screen sees a full array
    setYears(updatedYears);
    navigation.navigate('AlbumYearDetail', {
      yearIndex,
      onSave: buildOnSave(updatedYears),
      onDelete: buildOnDelete(updatedYears),
    });
  }

  function handlePressYear(index) {
    navigation.navigate('AlbumYearDetail', {
      yearIndex: index,
      onSave: buildOnSave(years),
      onDelete: buildOnDelete(years),
    });
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
        <Text style={styles.pageTitle}>Our Years</Text>
        <Text style={styles.pageSubtitle}>A chapter for each year that shaped your family</Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {years.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No years yet. Add your first year below.</Text>
          </View>
        ) : null}

        {years.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.yearCard}
            activeOpacity={0.7}
            onPress={() => handlePressYear(index)}
          >
            <View style={styles.yearCardLeft}>
              <Text style={styles.yearNumber}>{item.year || 'New Year'}</Text>
              {item.label ? (
                <Text style={styles.yearLabel} numberOfLines={2}>
                  {item.label}
                </Text>
              ) : (
                <Text style={styles.yearLabelEmpty}>No tagline yet</Text>
              )}
            </View>
            <View style={styles.yearCardRight}>
              <Text style={styles.editArrow}>→</Text>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.7}
          onPress={handleAddYear}
        >
          <Text style={styles.addButtonText}>+ Add Year</Text>
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
  },
  yearCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.card,
  },
  yearCardLeft: {
    flex: 1,
  },
  yearCardRight: {
    paddingLeft: spacing.sm,
  },
  yearNumber: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.gold,
  },
  yearLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  yearLabelEmpty: {
    fontSize: typography.sizes.sm,
    color: colors.placeholder,
    marginTop: spacing.xs,
    fontStyle: 'italic',
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
