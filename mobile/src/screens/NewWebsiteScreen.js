import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { post } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export default function NewWebsiteScreen({ navigation }) {
  const { refreshFamilies } = useAuth();
  const [subdomain, setSubdomain] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [loading, setLoading] = useState(false);

  const cleanSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');

  async function handleCreate() {
    if (!cleanSubdomain && !customDomain.trim()) {
      Alert.alert('Required', 'Please enter a subdomain or custom domain.');
      return;
    }
    if (cleanSubdomain && cleanSubdomain.length < 3) {
      Alert.alert('Too Short', 'Subdomain must be at least 3 characters.');
      return;
    }

    setLoading(true);
    try {
      // Create Stripe checkout for additional site ($12.99/yr)
      const res = await post('/api/stripe/create-additional-site-checkout', {
        subdomain: cleanSubdomain || customDomain.trim().split('.')[0].toLowerCase().replace(/[^a-z0-9-]/g, ''),
        domain: customDomain.trim() || null,
        bookName: displayName.trim() || 'New Website',
      });

      const checkoutUrl = res.data.url;
      if (checkoutUrl) {
        // Open Stripe Checkout in browser
        await Linking.openURL(checkoutUrl);

        // Show instructions for when they return
        Alert.alert(
          'Complete Payment',
          'After completing payment in your browser, return here and pull down to refresh to see your new site.',
          [{
            text: 'OK',
            onPress: async () => {
              // Try to refresh families in case webhook already fired
              await refreshFamilies();
              navigation.navigate('Dashboard');
            },
          }]
        );
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to start checkout.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Add Another Site</Text>
        <Text style={styles.subtitle}>
          Create another baby book or family photo album. Additional sites are $12.99/year.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Site Name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="e.g. Baby Smith's Book"
            placeholderTextColor={colors.textSecondary}
          />
          <Text style={styles.hint}>A friendly name for this website</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Subdomain</Text>
          <View style={styles.subdomainRow}>
            <TextInput
              style={[styles.input, styles.subdomainInput]}
              value={subdomain}
              onChangeText={setSubdomain}
              placeholder="babyjohn"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.subdomainSuffix}>.legacyodyssey.com</Text>
          </View>
          {cleanSubdomain ? (
            <Text style={styles.hint}>
              Website: {cleanSubdomain}.legacyodyssey.com
            </Text>
          ) : null}
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Custom Domain (optional)</Text>
          <TextInput
            style={styles.input}
            value={customDomain}
            onChangeText={setCustomDomain}
            placeholder="e.g. www.babysmith.com"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <Text style={styles.hint}>
            We'll register and set up the domain for you
          </Text>
        </View>

        <View style={styles.priceBox}>
          <Text style={styles.priceText}>$12.99 / year</Text>
          <Text style={styles.priceHint}>Includes domain, hosting, and SSL</Text>
        </View>

        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={colors.dark} />
          ) : (
            <Text style={styles.createButtonText}>Continue to Payment</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  title: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  hint: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  subdomainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subdomainInput: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
  },
  subdomainSuffix: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopRightRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    paddingHorizontal: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  priceBox: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priceText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.gold,
  },
  priceHint: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  createButton: {
    backgroundColor: colors.gold,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
    ...shadows.card,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.dark,
  },
});
