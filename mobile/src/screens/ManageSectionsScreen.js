import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../theme';
import { useI18n } from '../i18n/I18nContext';
import { get, put } from '../api/client';
// Lucide line-art icons (v1.0.7 brand-consistency pass — replaces emoji).
import {
  Heart,
  BookOpen,
  Camera,
  Video,
  Images,
  Compass,
  Home,
  Calendar,
  Users,
  Star,
  Gift,
  Mail,
  UtensilsCrossed,
  Archive,
  Lock,
} from 'lucide-react-native';

// `labelKey` is resolved at render time via t(); icon stays hardcoded.
const SECTION_TOGGLES = [
  { key: 'before',    labelKey: 'app.managesections.section_before',    icon: Heart },
  { key: 'birth',     labelKey: 'app.managesections.section_birth',     icon: BookOpen },
  { key: 'birthday',  labelKey: 'app.managesections.section_birthday',  icon: Camera },
  { key: 'moments',   labelKey: 'app.managesections.section_moments',   icon: Video },
  { key: 'galleries', labelKey: 'app.managesections.section_galleries', icon: Images },
  { key: 'journey',   labelKey: 'app.managesections.section_journey',   icon: Compass },
  { key: 'home',      labelKey: 'app.managesections.section_coming_home', icon: Home },
  { key: 'months',    labelKey: 'app.managesections.section_months',    icon: Calendar },
  { key: 'family',    labelKey: 'app.managesections.section_family',    icon: Users },
  { key: 'firsts',    labelKey: 'app.managesections.section_firsts',    icon: Star },
  { key: 'holidays',  labelKey: 'app.managesections.section_celebrations', icon: Gift },
  { key: 'letters',   labelKey: 'app.managesections.section_letters',   icon: Mail },
  { key: 'recipes',   labelKey: 'app.managesections.section_recipes',   icon: UtensilsCrossed },
  { key: 'keepsakes', labelKey: 'app.managesections.section_keepsakes', icon: Archive },
  { key: 'vault',     labelKey: 'app.managesections.section_vault',     icon: Lock },
];

export default function ManageSectionsScreen() {
  const { t } = useI18n();
  const [sections, setSections] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // key of section currently saving
  const [refreshing, setRefreshing] = useState(false);

  const fetchSections = useCallback(async () => {
    try {
      const res = await get('/api/books/mine/sections');
      setSections(res.data || {});
    } catch (err) {
      Alert.alert(t('app.common.error'), t('app.managesections.error_load'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  async function toggleSection(key, value) {
    // Optimistic update
    setSections((prev) => ({ ...prev, [key]: value }));
    setSaving(key);

    try {
      const res = await put('/api/books/mine/sections', { [key]: value });
      // Update with server response (source of truth)
      setSections(res.data || {});
    } catch (err) {
      // Revert on failure
      setSections((prev) => ({ ...prev, [key]: !value }));
      Alert.alert(t('app.common.error'), t('app.managesections.error_update'));
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.loadingText}>{t('app.managesections.loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchSections();
          }}
          tintColor={colors.gold}
        />
      }
    >
      <Text style={styles.headerTitle}>{t('app.managesections.title')}</Text>
      <Text style={styles.headerSubtitle}>
        {t('app.managesections.subtitle')}
      </Text>

      <View style={styles.sectionsList}>
        {SECTION_TOGGLES.map((item) => (
          <View key={item.key} style={styles.sectionRow}>
            <View style={styles.sectionInfo}>
              <View style={styles.sectionIcon}>
                <item.icon size={22} color="#c8a96e" strokeWidth={1.5} />
              </View>
              <Text style={styles.sectionLabel}>{t(item.labelKey)}</Text>
            </View>
            <View style={styles.sectionControl}>
              {saving === item.key && (
                <ActivityIndicator
                  size="small"
                  color={colors.gold}
                  style={styles.savingIndicator}
                />
              )}
              <Switch
                value={sections[item.key] === true}
                onValueChange={(val) => toggleSection(item.key, val)}
                trackColor={{ false: colors.border, true: colors.goldLight }}
                thumbColor={
                  sections[item.key] ? colors.gold : colors.placeholder
                }
                disabled={saving !== null}
              />
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.footerNote}>
        {t('app.managesections.footer_note')}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
  },
  headerTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.serif,
    marginBottom: spacing.sm,
  },
  headerSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  sectionsList: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    // v1.0.7 — Lucide SVG container (was a 22pt emoji <Text>).
    width: 30,
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
  sectionControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savingIndicator: {
    marginRight: spacing.sm,
  },
  footerNote: {
    marginTop: spacing.lg,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
