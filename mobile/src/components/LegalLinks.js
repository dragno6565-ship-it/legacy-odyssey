import React from 'react';
import { Text, StyleSheet, Linking } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { useI18n } from '../i18n/I18nContext';

/**
 * "By using Legacy Odyssey, you agree to our Terms of Service and Privacy
 * Policy." with tappable links (C-008, Oct 2026). Shown on the Login and Signup
 * screens. Accounts are created on the website, where the checkout requires
 * ticking an "I agree" box; this keeps the same agreement visible in the app.
 * Ships with the next app build (no OTA-only dependency: plain Text + Linking).
 */
export default function LegalLinks({ style }) {
  const { t } = useI18n();
  return (
    <Text style={[styles.text, style]}>
      {t('app.legal.agree_prefix')}{' '}
      <Text style={styles.link} onPress={() => Linking.openURL('https://legacyodyssey.com/terms')} accessibilityRole="link">
        {t('app.legal.terms')}
      </Text>
      {' '}{t('app.legal.and')}{' '}
      <Text style={styles.link} onPress={() => Linking.openURL('https://legacyodyssey.com/privacy')} accessibilityRole="link">
        {t('app.legal.privacy')}
      </Text>
      {t('app.legal.agree_suffix')}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  link: {
    color: colors.gold,
    textDecorationLine: 'underline',
  },
});
