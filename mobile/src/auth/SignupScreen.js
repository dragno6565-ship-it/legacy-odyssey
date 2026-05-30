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

export default function SignupScreen({ navigation }) {
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
          <Text style={styles.brandSubtitle}>Your family's story, beautifully told</Text>
        </View>

        {/* Pitch */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Get Your Own Family Book</Text>
          <Text style={styles.cardBody}>
            Every Legacy Odyssey subscription includes your own personal{' '}
            <Text style={styles.cardHighlight}>.com domain</Text> — so your family's
            book lives at a real address like{' '}
            <Text style={styles.cardHighlight}>your-childs-name.com</Text>.
          </Text>
          <Text style={styles.cardBody}>
            Plans start at just <Text style={styles.cardHighlight}>$29 for your first year</Text>.
            Sign up takes 2 minutes on our website.
          </Text>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleGetStarted}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Get Started at legacyodyssey.com</Text>
        </TouchableOpacity>

        {/* Already have account */}
        <TouchableOpacity
          style={styles.linkContainer}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.linkText}>
            Already have an account?{' '}
            <Text style={styles.linkBold}>Sign In</Text>
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
