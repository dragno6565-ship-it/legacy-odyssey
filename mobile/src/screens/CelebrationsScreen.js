import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { get, post, del } from '../api/client';

export default function CelebrationsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [years, setYears] = useState(['Your First Year']);

  const fetchYears = useCallback(async () => {
    try {
      const res = await get('/api/books/mine/celebration-years');
      setYears(Array.isArray(res.data) ? res.data : ['Your First Year']);
    } catch {
      setYears(['Your First Year']);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(fetchYears);

  async function handleAddYear() {
    const nextLabel = `Year ${years.length + 1}`;
    try {
      const res = await post('/api/books/mine/celebration-years', { label: nextLabel });
      setYears(res.data);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not add year.');
    }
  }

  function handleDeleteYear(label) {
    Alert.alert(
      `Delete "${label}"?`,
      'This will remove all celebrations in this year. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await del('/api/books/mine/celebration-years', { data: { label } });
              setYears(res.data);
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not delete year.');
            }
          },
        },
      ]
    );
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
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>Celebrations</Text>
      <Text style={styles.pageSubtitle}>Holidays and special occasions</Text>

      {years.map((label) => (
        <TouchableOpacity
          key={label}
          style={styles.yearRow}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('CelebrationYear', { yearLabel: label })}
          onLongPress={label !== 'Your First Year' ? () => handleDeleteYear(label) : undefined}
        >
          <View style={styles.yearRowInner}>
            <Text style={styles.yearIcon}>🎉</Text>
            <View style={styles.yearTextWrap}>
              <Text style={styles.yearLabel}>{label}</Text>
              <Text style={styles.yearHint}>Holidays & special moments</Text>
            </View>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.addButton} activeOpacity={0.8} onPress={handleAddYear}>
        <Text style={styles.addButtonText}>+ Add Year</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>Long-press any year (except the first) to delete it.</Text>
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
    marginBottom: spacing.xl,
    fontStyle: 'italic',
  },
  yearRow: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.card,
  },
  yearRowInner: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  yearIcon: { fontSize: 28, marginRight: spacing.md },
  yearTextWrap: { flex: 1 },
  yearLabel: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  yearHint: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chevron: { fontSize: 24, color: colors.gold, marginLeft: spacing.sm },
  addButton: {
    borderWidth: 1.5,
    borderColor: colors.gold,
    borderRadius: borderRadius.md,
    borderStyle: 'dashed',
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  addButtonText: {
    color: colors.gold,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  hint: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
});
