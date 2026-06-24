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
import { PartyPopper, Pencil } from 'lucide-react-native';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { get, post, put, del } from '../api/client';
import { useI18n } from '../i18n/I18nContext';

/**
 * Top-level Celebrations screen — list of celebration years.
 *
 * Tapping a year opens CelebrationYearScreen (list of every celebration
 * in that year). Years can be added with custom labels ("2026", "Toddler
 * years", etc.) and long-pressed for delete (except the very first year,
 * which always exists).
 */
export default function CelebrationsScreen({ navigation }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [years, setYears] = useState(['Your First Year']);
  const [newYearLabel, setNewYearLabel] = useState('');
  const [counts, setCounts] = useState({}); // year_label -> celebration count
  const [adding, setAdding] = useState(false);
  const [renamingYear, setRenamingYear] = useState(null);
  const [renameVal, setRenameVal] = useState('');

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
      Alert.alert(t('app.celebrations.already_exists_title'), t('app.celebrations.already_exists_msg', { label }));
      return;
    }
    setAdding(true);
    try {
      const res = await post('/api/books/mine/celebration-years', { label });
      setYears(Array.isArray(res.data) ? res.data : [...years, label]);
      setNewYearLabel('');
    } catch (err) {
      Alert.alert(t('app.celebrations.add_year_fail_title'), err.message || t('app.celebrations.please_try_again'));
    } finally {
      setAdding(false);
    }
  }

  // Rename a year — relabels the year AND every celebration filed under it
  // (PUT /api/books/mine/celebration-years, twin of the web editor's Rename).
  async function saveRenameYear(oldLabel) {
    const newLabel = renameVal.trim();
    if (!newLabel || newLabel === oldLabel) { setRenamingYear(null); return; }
    try {
      const res = await put('/api/books/mine/celebration-years', { oldLabel, newLabel });
      setYears(Array.isArray(res.data) ? res.data : years.map((y) => (y === oldLabel ? newLabel : y)));
      setCounts((c) => { const n = { ...c, [newLabel]: c[oldLabel] || 0 }; delete n[oldLabel]; return n; });
      setRenamingYear(null);
    } catch (err) {
      const msg = (err.response && err.response.data && err.response.data.error) || t('app.celebrations.please_try_again');
      Alert.alert(t('app.celebrations.rename_fail_title'), msg);
    }
  }

  function handleDeleteYear(label) {
    Alert.alert(
      t('app.celebrations.delete_year_title', { label }),
      t('app.celebrations.delete_year_msg'),
      [
        { text: t('app.celebrations.cancel'), style: 'cancel' },
        {
          text: t('app.celebrations.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await del('/api/books/mine/celebration-years', { data: { label } });
              setYears(Array.isArray(res.data) ? res.data : years.filter((y) => y !== label));
            } catch (err) {
              Alert.alert(t('app.celebrations.delete_fail_title'), err.message || t('app.celebrations.please_try_again'));
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
      <Text style={styles.pageTitle}>{t('app.celebrations.page_title')}</Text>
      <Text style={styles.pageSubtitle}>
        {t('app.celebrations.page_subtitle')}
      </Text>

      {years.map((label) => {
        const count = counts[label] || 0;
        // "Your First Year" is the protected default — the backend rejects
        // deletion of it (it always exists). Long-press delete is only
        // enabled for custom years.
        const canDelete = label !== 'Your First Year' && years.length > 1;
        if (renamingYear === label) {
          return (
            <View key={label} style={styles.yearRow}>
              <View style={[styles.yearRowInner, { flex: 1 }]}>
                <TextInput
                  style={styles.renameInput}
                  value={renameVal}
                  onChangeText={setRenameVal}
                  autoFocus
                  maxLength={40}
                  returnKeyType="done"
                  onSubmitEditing={() => saveRenameYear(label)}
                />
                <TouchableOpacity style={styles.renameSave} onPress={() => saveRenameYear(label)}>
                  <Text style={styles.renameSaveText}>{t('app.celebrations.save')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setRenamingYear(null)}>
                  <Text style={styles.renameCancel}>{t('app.celebrations.cancel')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }
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
                  {count === 0 ? t('app.celebrations.count_none') :
                   count === 1 ? t('app.celebrations.count_one') :
                   t('app.celebrations.count_many', { count })}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => { setRenamingYear(label); setRenameVal(label); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ marginRight: spacing.sm }}>
              <Pencil size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        );
      })}

      <View style={styles.addYearCard}>
        <Text style={styles.addYearTitle}>{t('app.celebrations.add_year_title')}</Text>
        <Text style={styles.addYearHint}>
          {t('app.celebrations.add_year_hint')}
        </Text>
        <View style={styles.addYearRow}>
          <TextInput
            style={styles.addYearInput}
            value={newYearLabel}
            onChangeText={setNewYearLabel}
            placeholder={t('app.celebrations.add_year_placeholder')}
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
              <Text style={styles.addYearButtonText}>{t('app.celebrations.add_button')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.hint}>{t('app.celebrations.long_press_hint')}</Text>
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
  renameInput: { flex: 1, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.gold, borderRadius: borderRadius.md, padding: spacing.sm, fontSize: typography.sizes.md, color: colors.textPrimary },
  renameSave: { backgroundColor: colors.gold, borderRadius: borderRadius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, marginLeft: spacing.sm },
  renameSaveText: { color: '#fff', fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold },
  renameCancel: { color: colors.textSecondary, fontSize: typography.sizes.sm, marginLeft: spacing.sm },
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
