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
  Linking,
} from 'react-native';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { get, put, post } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useSavedToast } from '../components/SavedToast';
import { useI18n } from '../i18n/I18nContext';

const APP_VERSION = '1.0.22';

export default function SettingsScreen({ navigation }) {
  const { logout, families, activeFamilyId } = useAuth();
  const { t, pref, setPref } = useI18n();
  const LANG_OPTIONS = [
    { key: 'auto', label: t('settings.language_auto'), sub: t('settings.language_auto_sub') },
    { key: 'en', label: t('settings.language_en') },
    { key: 'es', label: t('settings.language_es') },
    { key: 'hi', label: t('settings.language_hi') },
  ];
  const activeFamily = families?.find(f => f.id === activeFamilyId) || families?.[0];
  const isFree = activeFamily ? (activeFamily.plan !== 'paid' && activeFamily.subscription_status !== 'active') : true;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [bookPassword, setBookPassword] = useState('');
  const [bookSlug, setBookSlug] = useState('');
  const { showToast, ToastComponent } = useSavedToast();

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await get('/api/books/mine');
        const book = res.data;
        setBookPassword(book.password || book.book_password || '');
        setBookSlug(book.slug || book.family_slug || '');
      } catch (err) {
        setError(err.message || t('app.settings.error_load'));
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  async function handleSavePassword() {
    setSaving(true);
    setError('');
    try {
      await put('/api/books/mine', { password: bookPassword.trim() });
      showToast(t('app.settings.toast_password_saved'));
    } catch (err) {
      setError(err.message || t('app.settings.error_save_password'));
    } finally {
      setSaving(false);
    }
  }

  function handlePreview() {
    if (bookSlug) {
      navigation.navigate('Preview', { slug: bookSlug });
    } else {
      Alert.alert(t('app.settings.no_book_url_title'), t('app.settings.no_book_url_msg'));
    }
  }

  function handleLogout() {
    Alert.alert(t('app.settings.logout_title'), t('app.settings.logout_msg'), [
      { text: t('app.settings.cancel'), style: 'cancel' },
      {
        text: t('app.settings.logout_confirm'),
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  }

  async function handleManageSubscription() {
    try {
      const res = await post('/api/stripe/portal', {
        return_url: 'https://legacyodyssey.com',
      });
      await Linking.openURL(res.data.url);
    } catch (err) {
      Alert.alert(t('app.settings.error_title'), t('app.settings.error_portal'));
    }
  }

  function handleUpgrade() {
    Linking.openURL('https://legacyodyssey.com/#pricing');
  }

  // ─── Cancel Subscription ─────────────────────────────────────────────────
  // Soft cancel the customer's account(s). Preserves photos + content for 1 year
  // so they can resubscribe and pick up where they left off.
  // Multi-site rule (Scenario A): cancelling the Primary while other sites exist
  // requires either promoting a secondary OR cancelling all.

  async function doCancel(body, onApiError) {
    try {
      await post('/api/auth/cancel', body);
      Alert.alert(
        t('app.settings.cancelled_title'),
        t('app.settings.cancelled_msg'),
        [{ text: t('app.settings.ok'), onPress: async () => { await logout(); } }]
      );
    } catch (err) {
      // Server returns 400 + JSON {error: 'PROMOTE_OR_CANCEL_ALL_REQUIRED', otherFamilies: [...]}
      // when trying to cancel the primary while other sites exist.
      const data = err?.response?.data;
      if (data && onApiError) onApiError(data);
      else Alert.alert(t('app.settings.could_not_cancel'), err?.message || t('app.settings.contact_support'));
    }
  }

  function confirmCancelSingle(family) {
    Alert.alert(
      t('app.settings.cancel_sub_title'),
      t('app.settings.cancel_single_msg'),
      [
        { text: t('app.settings.keep_it'), style: 'cancel' },
        { text: t('app.settings.cancel_sub_title'), style: 'destructive', onPress: () => doCancel({ familyId: family.id }, handlePrimaryBlock) },
      ]
    );
  }

  function confirmCancelAll() {
    Alert.alert(
      t('app.settings.cancel_all_title'),
      t('app.settings.cancel_all_msg'),
      [
        { text: t('app.settings.keep_them'), style: 'cancel' },
        { text: t('app.settings.cancel_all_sites'), style: 'destructive', onPress: () => doCancel({ all: true }) },
      ]
    );
  }

  // Server tells us "this is your primary, you must promote or cancel-all".
  // Show the promotion picker with each non-archived secondary as a button.
  function handlePrimaryBlock(apiError) {
    if (apiError?.error !== 'PROMOTE_OR_CANCEL_ALL_REQUIRED') {
      Alert.alert(t('app.settings.could_not_cancel'), apiError?.message || t('app.settings.please_try_again'));
      return;
    }
    const others = apiError.otherFamilies || [];
    const cancelTargetId = (families || []).find(f => f.subscription_status !== 'canceled' && !f.archived_at)?.id;
    const buttons = [
      { text: t('app.settings.cancel'), style: 'cancel' },
      ...others.map(other => ({
        text: t('app.settings.promote_site', { site: other.display_name || other.subdomain || t('app.settings.this_site_lower') }),
        onPress: () => {
          // Confirm promotion before doing it
          Alert.alert(
            t('app.settings.confirm_promotion_title'),
            t('app.settings.confirm_promotion_msg', { site: other.display_name || other.subdomain || t('app.settings.this_site_cap') }),
            [
              { text: t('app.settings.back'), style: 'cancel' },
              { text: t('app.settings.promote_and_cancel'), style: 'destructive', onPress: () => doCancel({ familyId: cancelTargetId, promoteFamilyId: other.id }) },
            ]
          );
        },
      })),
      { text: t('app.settings.cancel_all_sites_instead'), style: 'destructive', onPress: confirmCancelAll },
    ];
    Alert.alert(t('app.settings.primary_site_title'), t('app.settings.primary_site_msg', { message: apiError.message }), buttons);
  }

  function handleCancelSubscription() {
    const liveFamilies = (families || []).filter(f => !f.archived_at && f.subscription_status !== 'canceled');
    if (liveFamilies.length === 0) {
      Alert.alert(t('app.settings.no_active_sub_title'), t('app.settings.no_active_sub_msg'));
      return;
    }
    if (liveFamilies.length === 1) { confirmCancelSingle(liveFamilies[0]); return; }

    // Multi-site: present an action sheet to pick which site or cancel all
    const buttons = [
      { text: t('app.settings.cancel'), style: 'cancel' },
      ...liveFamilies.map(f => ({
        text: t('app.settings.cancel_named_site', { site: f.display_name || f.subdomain || f.email || t('app.settings.this_site_lower') }),
        onPress: () => confirmCancelSingle(f),
      })),
      { text: t('app.settings.cancel_all_sites'), style: 'destructive', onPress: confirmCancelAll },
    ];
    Alert.alert(
      t('app.settings.cancel_sub_title'),
      t('app.settings.multi_site_msg', { count: liveFamilies.length }),
      buttons
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
      <Text style={styles.pageTitle}>{t('app.settings.page_title')}</Text>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Language */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.language_title')}</Text>
        <Text style={styles.sectionDescription}>{t('settings.language_desc')}</Text>
        {LANG_OPTIONS.map((opt) => {
          const active = pref === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.langOption, active && styles.langOptionActive]}
              onPress={() => setPref(opt.key)}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.langOptionText, active && styles.langOptionTextActive]}>{opt.label}</Text>
                {opt.sub ? <Text style={styles.langOptionSub}>{opt.sub}</Text> : null}
              </View>
              {active ? <Text style={styles.langCheck}>✓</Text> : null}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Book Password */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('app.settings.book_password_title')}</Text>
        <Text style={styles.sectionDescription}>
          {t('app.settings.book_password_desc')}
        </Text>
        <TextInput
          style={styles.input}
          value={bookPassword}
          onChangeText={setBookPassword}
          placeholder={t('app.settings.book_password_placeholder')}
          placeholderTextColor={colors.placeholder}
        />
        <TouchableOpacity
          style={[styles.goldButton, saving && styles.buttonDisabled]}
          onPress={handleSavePassword}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.goldButtonText}>{t('app.settings.save_password')}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Preview Book */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('app.settings.preview_title')}</Text>
        <Text style={styles.sectionDescription}>
          {t('app.settings.preview_desc')}
        </Text>
        <TouchableOpacity
          style={styles.outlineButton}
          onPress={handlePreview}
          activeOpacity={0.8}
        >
          <Text style={styles.outlineButtonText}>{t('app.settings.preview_button')}</Text>
        </TouchableOpacity>
      </View>

      {/* Help & Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('app.settings.help_title')}</Text>
        <TouchableOpacity
          style={styles.outlineButton}
          onPress={() => navigation.navigate('Help')}
          activeOpacity={0.8}
        >
          <Text style={styles.outlineButtonText}>{t('app.settings.help_button')}</Text>
        </TouchableOpacity>
      </View>

      {/* Plan / Subscription */}
      {isFree ? (
        <View style={styles.upgradeSection}>
          <View style={styles.upgradeBadge}>
            <Text style={styles.upgradeBadgeText}>{t('app.settings.free_plan_badge')}</Text>
          </View>
          <Text style={styles.upgradeTitle}>{t('app.settings.upgrade_title')}</Text>
          <Text style={styles.upgradeDescription}>
            {t('app.settings.upgrade_desc')}
          </Text>
          <TouchableOpacity
            style={styles.goldButton}
            onPress={handleUpgrade}
            activeOpacity={0.8}
          >
            <Text style={styles.goldButtonText}>{t('app.settings.upgrade_button')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('app.settings.billing_title')}</Text>
          <Text style={styles.sectionDescription}>
            {t('app.settings.billing_desc')}
          </Text>
          <TouchableOpacity
            style={styles.outlineButton}
            onPress={handleManageSubscription}
            activeOpacity={0.8}
          >
            <Text style={styles.outlineButtonText}>{t('app.settings.manage_subscription')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Logout */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutButtonText}>{t('app.settings.logout_button')}</Text>
        </TouchableOpacity>
      </View>

      {/* Cancel Subscription */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('app.settings.cancel_sub_title')}</Text>
        <Text style={styles.sectionDescription}>
          {t('app.settings.cancel_sub_desc')}
        </Text>
        <TouchableOpacity
          style={styles.deleteAccountButton}
          onPress={handleCancelSubscription}
          activeOpacity={0.8}
        >
          <Text style={styles.deleteAccountButtonText}>{t('app.settings.cancel_sub_title')}</Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.infoSection}>
        <Text style={styles.infoText}>{t('app.settings.app_name')}</Text>
        <Text style={styles.infoText}>{t('app.settings.version', { version: APP_VERSION })}</Text>
      </View>
      {ToastComponent}
    </ScrollView>
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
    paddingBottom: spacing.xxl,
  },
  pageTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
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
  section: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  goldButton: {
    backgroundColor: colors.gold,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    ...shadows.button,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  goldButtonText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  outlineButton: {
    borderWidth: 2,
    borderColor: colors.gold,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  outlineButtonText: {
    color: colors.gold,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  logoutButton: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  logoutButtonText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  deleteAccountButton: {
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  deleteAccountButtonText: {
    color: colors.error,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  upgradeSection: {
    backgroundColor: colors.dark,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
    ...shadows.card,
  },
  upgradeBadge: {
    backgroundColor: colors.gold,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginBottom: spacing.sm,
  },
  upgradeBadgeText: {
    color: colors.dark,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
  },
  upgradeTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.gold,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  upgradeDescription: {
    fontSize: typography.sizes.sm,
    color: colors.goldLight,
    marginBottom: spacing.md,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.85,
  },
  infoSection: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  infoText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  langOptionActive: {
    borderColor: colors.gold,
    borderWidth: 2,
    backgroundColor: colors.white,
  },
  langOptionText: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
  langOptionTextActive: {
    color: colors.gold,
    fontWeight: typography.weights.semibold,
  },
  langOptionSub: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  langCheck: {
    color: colors.gold,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginLeft: spacing.sm,
  },
});
