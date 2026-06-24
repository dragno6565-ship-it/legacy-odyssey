import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  SafeAreaView,
} from 'react-native';
import { BookOpen } from 'lucide-react-native';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { useI18n } from '../i18n/I18nContext';

export default function SignupScreen({ navigation }) {
  const { t } = useI18n();
  function handleGetStarted() {
    Linking.openURL('https://legacyodyssey.com');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Branding */}
        <View style={styles.brandingContainer}>
          <BookOpen size={56} color={colors.gold} strokeWidth={1.5} style={styles.brandIcon} />
          <Text style={styles.brandTitle}>Legacy Odyssey</Text>
          <Text style={styles.brandSubtitle}>{t('app.signup.brand_subtitle')}</Text>
        </View>

        {/* Pitch */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('app.signup.card_title')}</Text>
          <Text style={styles.cardBody}>
            {t('app.signup.card_body_domain_pre')}{' '}
            <Text style={styles.cardHighlight}>{t('app.signup.card_body_domain_highlight')}</Text>
            {t('app.signup.card_body_domain_mid')}{' '}
            <Text style={styles.cardHighlight}>{t('app.signup.card_body_domain_example')}</Text>
            {t('app.signup.card_body_domain_post')}
          </Text>
          <Text style={styles.cardBody}>
            {t('app.signup.card_body_price_pre')} <Text style={styles.cardHighlight}>{t('app.signup.card_body_price_highlight')}</Text>
            {t('app.signup.card_body_price_post')}
          </Text>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleGetStarted}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>{t('app.signup.cta_button')}</Text>
        </TouchableOpacity>

        {/* Already have account */}
        <TouchableOpacity
          style={styles.linkContainer}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.linkText}>
            {t('app.signup.have_account')}{' '}
            <Text style={styles.linkBold}>{t('app.signup.sign_in')}</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  brandingContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  brandIcon: {
    fontSize: 56,
    marginBottom: spacing.sm,
  },
  brandTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  brandSubtitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.card,
  },
  cardTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  cardBody: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  cardHighlight: {
    color: colors.gold,
    fontWeight: typography.weights.semibold,
  },
  button: {
    backgroundColor: colors.gold,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    ...shadows.button,
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
    padding: spacing.sm,
  },
  linkText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  linkBold: {
    color: colors.gold,
    fontWeight: typography.weights.semibold,
  },
});
