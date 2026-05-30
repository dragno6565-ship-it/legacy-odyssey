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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PartyPopper } from 'lucide-react-native';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { get, post, del } from '../api/client';

/**
 * Top-level Celebrations screen — list of celebration years.
 *
 * Tapping a year opens CelebrationYearScreen (list of every celebration
 * in that year). Years can be added with custom labels ("2026", "Toddler
 * years", etc.) and long-pressed for delete (except the very first year,
 * which always exists).
 */
export default function CelebrationsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [years, setYears] = useState(['Your First Year']);
  const [newYearLabel, setNewYearLabel] = useState('');
  const [counts, setCounts] = useState({}); // year_label -> celebration count
  const [adding, setAdding] = useState(false);

  const fetchYears = useCallback(async () => {
    setLoading(true);
    try {
      const yearsRes = await get('/api/books/mine/celebration-years');
      const fetchedYears = Array.isArray(yearsRes.data) ? yearsRes.data : ['Your First Year'];
      setYears(fetchedYears.length > 0 ? fetchedYears : ['Your First Year']);

      // Count celebrations per year — done one request per year because
      // /api/books/mine/celebrations is year-scoped. Fast enough for a
      // typical 1-5 years.
      const nextCounts = {};
      await Promise.all(
        (fetchedYears.length > 0 ? fetchedYears : ['Your First Year']).map(async (label) => {
          try {
            const res = await get(
              `/api/books/mine/celebrations?year_label=${encodeURIComponent(label)}`
            );
            const items = Array.isArray(res.data) ? res.data : [];
            // Only count celebrations with meaningful content
            const meaningful = items.filter((c) =>
              (c.title && c.title.trim() && c.title !== '(untitled)' && c.title !== 'New Celebration') ||
              (c.body && c.body.trim()) ||
              c.photo_path || c.eyebrow || c.location || c.attendees || c.gifts
            );
            nextCounts[label] = meaningful.length;
          } catch (_) {
            nextCounts[label] = 0;
          }
        })
      );
      setCounts(nextCounts);
    } catch (_) {
      setYears(['Your First Year']);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchYears();
    }, [fetchYears])
  );

  async function handleAddYear() {
    const label = newYearLabel.trim();
    if (!label) return;
    if (years.includes(label)) {
      Alert.alert('Already exists', `"${label}" is already in your year list.`);
      return;
    }
    setAdding(true);
    try {
      const res = await post('/api/books/mine/celebration-years', { label });
      setYears(Array.isArray(res.data) ? res.data : [...years, label]);
      setNewYearLabel('');
    } catch (err) {
      Alert.alert('Could not add year', err.message || 'Please try again.');
    } finally {
      setAdding(false);
    }
  }

  function handleDeleteYear(label) {
    Alert.alert(
      `Delete "${label}"?`,
      'This will remove every celebration in this year, including all photos. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await del('/api/books/mine/celebration-years', { data: { label } });
              setYears(Array.isArray(res.data) ? res.data : years.filter((y) => y !== label));
            } catch (err) {
              Alert.alert('Could not delete', err.message || 'Please try again.');
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
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>Celebrations</Text>
      <Text style={styles.pageSubtitle}>
        Holidays, birthdays, traditions. Organized by year, with as many celebrations per year as you'd like.
      </Text>

      {years.map((label) => {
        const count = counts[label] || 0;
        // "Your First Year" is the protected default — the backend rejects
        // deletion of it (it always exists). Long-press delete is only
        // enabled for custom years.
        const canDelete = label !== 'Your First Year' && years.length > 1;
        return (
          <TouchableOpacity
            key={label}
            style={styles.yearRow}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('CelebrationYear', { yearLabel: label })}
            onLongPress={canDelete ? () => handleDeleteYear(label) : undefined}
          >
            <View style={styles.yearRowInner}>
              <PartyPopper size={28} color={colors.gold} strokeWidth={1.5} style={styles.yearIcon} />
              <View style={styles.yearTextWrap}>
                <Text style={styles.yearLabel}>{label}</Text>
                <Text style={styles.yearHint}>
                  {count === 0 ? 'No celebrations yet' :
                   count === 1 ? '1 celebration' :
                   `${count} celebrations`}
                </Text>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        );
      })}

      <View style={styles.addYearCard}>
        <Text style={styles.addYearTitle}>Add another year</Text>
        <Text style={styles.addYearHint}>
          Use the actual year ("2026") or a label like "Toddler years."
        </Text>
        <View style={styles.addYearRow}>
          <TextInput
            style={styles.addYearInput}
            value={newYearLabel}
            onChangeText={setNewYearLabel}
            placeholder="e.g. 2026"
            placeholderTextColor={colors.placeholder}
            returnKeyType="done"
            onSubmitEditing={handleAddYear}
          />
          <TouchableOpacity
            style={[styles.addYearButton, (!newYearLabel.trim() || adding) && styles.addYearButtonDisabled]}
            onPress={handleAddYear}
            disabled={!newYearLabel.trim() || adding}
            activeOpacity={0.8}
          >
            {adding ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.addYearButtonText}>+ Add</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.hint}>Long-press a year to delete it.</Text>
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
    marginTop: spacing.xs,
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
  addYearCard: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.gold,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.white,
  },
  addYearTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.gold,
    marginBottom: spacing.xs,
  },
  addYearHint: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  addYearRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  addYearInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  addYearButton: {
    backgroundColor: colors.gold,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  addYearButtonDisabled: { opacity: 0.5 },
  addYearButtonText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  hint: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
    fontStyle: 'italic',
  },
});
