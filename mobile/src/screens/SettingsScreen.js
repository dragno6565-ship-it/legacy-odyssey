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

const APP_VERSION = '1.0.6';

export default function SettingsScreen({ navigation }) {
  const { logout, families, activeFamilyId } = useAuth();
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
        setError(err.message || 'Failed to load settings.');
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
      showToast('Book password updated.');
    } catch (err) {
      setError(err.message || 'Failed to save password.');
    } finally {
      setSaving(false);
    }
  }

  function handlePreview() {
    if (bookSlug) {
      navigation.navigate('Preview', { slug: bookSlug });
    } else {
      Alert.alert('No Book URL', 'Your book URL is not set up yet.');
    }
  }

  function handleLogout() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
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
      Alert.alert('Error', 'Could not open subscription management. Please try again.');
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
        'Subscription Cancelled',
        "Check your email for confirmation. You'll be signed out now.",
        [{ text: 'OK', onPress: async () => { await logout(); } }]
      );
    } catch (err) {
      // Server returns 400 + JSON {error: 'PROMOTE_OR_CANCEL_ALL_REQUIRED', otherFamilies: [...]}
      // when trying to cancel the primary while other sites exist.
      const data = err?.response?.data;
      if (data && onApiError) onApiError(data);
      else Alert.alert('Could not cancel', err?.message || 'Please contact support@legacyodyssey.com.');
    }
  }

  function confirmCancelSingle(family) {
    Alert.alert(
      'Cancel Subscription',
      "Cancel your Legacy Odyssey subscription?\n\n• You keep access until your next renewal date\n• Photos & stories preserved for 1 year — resubscribe anytime to restore\n• Custom domain auto-renewal stops\n• You will not be charged anything today",
      [
        { text: 'Keep It', style: 'cancel' },
        { text: 'Cancel Subscription', style: 'destructive', onPress: () => doCancel({ familyId: family.id }, handlePrimaryBlock) },
      ]
    );
  }

  function confirmCancelAll() {
    Alert.alert(
      'Cancel ALL Sites?',
      'This cancels every Legacy Odyssey site on your account.\n\n• Each site keeps access until its own renewal date\n• Photos & stories preserved for 1 year on every site\n• Custom domain auto-renewals stop\n• You will not be charged anything today',
      [
        { text: 'Keep Them', style: 'cancel' },
        { text: 'Cancel All Sites', style: 'destructive', onPress: () => doCancel({ all: true }) },
      ]
    );
  }

  // Server tells us "this is your primary, you must promote or cancel-all".
  // Show the promotion picker with each non-archived secondary as a button.
  function handlePrimaryBlock(apiError) {
    if (apiError?.error !== 'PROMOTE_OR_CANCEL_ALL_REQUIRED') {
      Alert.alert('Could not cancel', apiError?.message || 'Please try again.');
      return;
    }
    const others = apiError.otherFamilies || [];
    const cancelTargetId = (families || []).find(f => f.subscription_status !== 'canceled' && !f.archived_at)?.id;
    const buttons = [
      { text: 'Cancel', style: 'cancel' },
      ...others.map(other => ({
        text: `Promote "${other.display_name || other.subdomain || 'this site'}"`,
        onPress: () => {
          // Confirm promotion before doing it
          Alert.alert(
            'Confirm Promotion',
            `${other.display_name || other.subdomain || 'This site'} will become your new Primary site.\n\n• Its billing rate stays the same until your current Primary's renewal date, then switches to the Primary rate\n• You will not be charged anything today\n• Your current Primary site will cancel at its next renewal`,
            [
              { text: 'Back', style: 'cancel' },
              { text: 'Promote & Cancel', style: 'destructive', onPress: () => doCancel({ familyId: cancelTargetId, promoteFamilyId: other.id }) },
            ]
          );
        },
      })),
      { text: 'Cancel ALL Sites Instead', style: 'destructive', onPress: confirmCancelAll },
    ];
    Alert.alert('This is your Primary site', `${apiError.message}\n\nWhich site should become your new Primary?`, buttons);
  }

  function handleCancelSubscription() {
    const liveFamilies = (families || []).filter(f => !f.archived_at && f.subscription_status !== 'canceled');
    if (liveFamilies.length === 0) {
      Alert.alert('No active subscription', "Your account doesn't have an active subscription to cancel.");
      return;
    }
    if (liveFamilies.length === 1) { confirmCancelSingle(liveFamilies[0]); return; }

    // Multi-site: present an action sheet to pick which site or cancel all
    const buttons = [
      { text: 'Cancel', style: 'cancel' },
      ...liveFamilies.map(f => ({
        text: `Cancel "${f.display_name || f.subdomain || f.email || 'this site'}"`,
        onPress: () => confirmCancelSingle(f),
      })),
      { text: 'Cancel ALL Sites', style: 'destructive', onPress: confirmCancelAll },
    ];
    Alert.alert(
      'Cancel Subscription',
      `You have ${liveFamilies.length} active sites. Which would you like to cancel?`,
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
      <Text style={styles.pageTitle}>Settings</Text>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Book Password */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Book Password</Text>
        <Text style={styles.sectionDescription}>
          Set a password that visitors need to view your book online.
        </Text>
        <TextInput
          style={styles.input}
          value={bookPassword}
          onChangeText={setBookPassword}
          placeholder="Enter book password"
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
            <Text style={styles.goldButtonText}>Save Password</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Preview Book */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preview Book</Text>
        <Text style={styles.sectionDescription}>
          See how your book looks to visitors.
        </Text>
        <TouchableOpacity
          style={styles.outlineButton}
          onPress={handlePreview}
          activeOpacity={0.8}
        >
          <Text style={styles.outlineButtonText}>Open Book Preview</Text>
        </TouchableOpacity>
      </View>

      {/* Help & Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Help & Support</Text>
        <TouchableOpacity
          style={styles.outlineButton}
          onPress={() => navigation.navigate('Help')}
          activeOpacity={0.8}
        >
          <Text style={styles.outlineButtonText}>Get Help</Text>
        </TouchableOpacity>
      </View>

      {/* Plan / Subscription */}
      {isFree ? (
        <View style={styles.upgradeSection}>
          <View style={styles.upgradeBadge}>
            <Text style={styles.upgradeBadgeText}>FREE PLAN</Text>
          </View>
          <Text style={styles.upgradeTitle}>Unlock Your Full Story</Text>
          <Text style={styles.upgradeDescription}>
            Upgrade to access Coming Home, Month by Month, Our Family, Firsts, Celebrations, Letters, Recipes, and The Vault.
          </Text>
          <TouchableOpacity
            style={styles.goldButton}
            onPress={handleUpgrade}
            activeOpacity={0.8}
          >
            <Text style={styles.goldButtonText}>Upgrade — From $4.99/mo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription & Billing</Text>
          <Text style={styles.sectionDescription}>
            View your plan, update billing details, or cancel your subscription.
          </Text>
          <TouchableOpacity
            style={styles.outlineButton}
            onPress={handleManageSubscription}
            activeOpacity={0.8}
          >
            <Text style={styles.outlineButtonText}>Manage Subscription</Text>
          </TouchableOpacity>
          <View style={{ height: spacing.sm }} />
          <TouchableOpacity
            style={styles.goldButton}
            onPress={() => navigation.navigate('AdditionalDomain')}
            activeOpacity={0.8}
          >
            <Text style={styles.goldButtonText}>Add Another Book & Domain</Text>
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
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Cancel Subscription */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cancel Subscription</Text>
        <Text style={styles.sectionDescription}>
          Cancel your Legacy Odyssey subscription. Your photos and stories will be safely preserved for one year — you can reactivate anytime to restore everything. You will not be charged anything to cancel.
        </Text>
        <TouchableOpacity
          style={styles.deleteAccountButton}
          onPress={handleCancelSubscription}
          activeOpacity={0.8}
        >
          <Text style={styles.deleteAccountButtonText}>Cancel Subscription</Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.infoSection}>
        <Text style={styles.infoText}>Legacy Odyssey Mobile</Text>
        <Text style={styles.infoText}>Version {APP_VERSION}</Text>
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
});
