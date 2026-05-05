import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  SafeAreaView,
} from 'react-native';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';

export default function NewWebsiteScreen({ navigation }) {
  function handleGetStarted() {
    Linking.openURL('https://legacyodyssey.com');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.brandingContainer}>
          <Text style={styles.brandIcon}>📖</Text>
          <Text style={styles.brandTitle}>Add Another Book</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Start a New Site</Text>
          <Text style={styles.cardBody}>
            Each Legacy Odyssey site is its own subscription with its own{' '}
            <Text style={styles.cardHighlight}>.com domain</Text>. Pick a name,
            claim the domain, and your new book is ready in minutes.
          </Text>
          <Text style={styles.cardBody}>
            Plans start at just <Text style={styles.cardHighlight}>$29 for the first year</Text>.
            Set it up at legacyodyssey.com.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleGetStarted}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Continue at legacyodyssey.com</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkContainer}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.linkText}>
            <Text style={styles.linkBold}>← Back</Text>
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
