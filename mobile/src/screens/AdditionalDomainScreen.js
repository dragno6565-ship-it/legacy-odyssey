import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  SafeAreaView,
} from 'react-native';
import { BookOpen, ArrowLeft } from 'lucide-react-native';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { useI18n } from '../i18n/I18nContext';

export default function AdditionalDomainScreen({ navigation }) {
  const { t } = useI18n();
  function handleGetStarted() {
    Linking.openURL('https://legacyodyssey.com');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.brandingContainer}>
          <BookOpen size={56} color={colors.gold} strokeWidth={1.5} style={styles.brandIcon} />
          <Text style={styles.brandTitle}>{t('app.additionaldomain.brand_title')}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('app.additionaldomain.card_title')}</Text>
          <Text style={styles.cardBody}>
            {t('app.additionaldomain.body1_before')}{' '}
            <Text style={styles.cardHighlight}>{t('app.additionaldomain.body1_domain')}</Text>{t('app.additionaldomain.body1_after')}
          </Text>
          <Text style={styles.cardBody}>
            {t('app.additionaldomain.body2_before')} <Text style={styles.cardHighlight}>{t('app.additionaldomain.body2_price')}</Text>{t('app.additionaldomain.body2_after')}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleGetStarted}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>{t('app.additionaldomain.continue')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkContainer}
          onPress={() => navigation.goBack()}
        >
          <View style={styles.backRow}>
            <ArrowLeft size={16} color={colors.gold} strokeWidth={2} />
            <Text style={[styles.linkText, styles.linkBold, styles.backLabel]}>{t('app.additionaldomain.back')}</Text>
          </View>
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
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backLabel: {
    marginLeft: 4,
  },
});
