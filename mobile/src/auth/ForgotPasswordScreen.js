import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import api from '../api/client';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleResetPassword() {
    setError('');
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { email: email.trim() });
      setSuccess(true);
    } catch (err) {
      // Always show success to prevent email enumeration
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.brandingContainer}>
            <Text style={styles.brandIcon}>&#9993;</Text>
            <Text style={styles.brandTitle}>Check Your Email</Text>
            <Text style={styles.brandSubtitle}>
              If an account exists for {email}, we've sent a password reset link. Check your inbox and follow the instructions.
            </Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.tipText}>
              Didn't receive an email? Check your spam folder, or try again with a different email address.
            </Text>

            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Back to Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => { setSuccess(false); setEmail(''); }}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Try Another Email</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandingContainer}>
          <Text style={styles.brandIcon}>&#128274;</Text>
          <Text style={styles.brandTitle}>Reset Password</Text>
          <Text style={styles.brandSubtitle}>
            Enter the email address associated with your account and we'll send you a link to reset your password.
          </Text>
        </View>

        <View style={styles.formCard}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            placeholderTextColor={colors.placeholder}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            autoFocus
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleResetPassword}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.linkContainer}
          onPress={() => navigation.navigate('Login')}
          disabled={loading}
        >
          <Text style={styles.linkText}>
            Remember your password? <Text style={styles.linkHighlight}>Sign In</Text>
          </Text>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  brandingContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  brandIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  brandTitle: {
    fontFamily: typography.families?.serif || undefined,
    fontSize: typography.sizes.xxl || 28,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  formCard: {
    backgroundColor: colors.card || colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    ...shadows.md,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: colors.inputBg || '#F5F5F5',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border || '#E5E5E5',
  },
  button: {
    backgroundColor: colors.gold,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  secondaryButtonText: {
    color: colors.gold,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  errorContainer: {
    backgroundColor: '#FFF2F2',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: '#E53E3E',
  },
  errorText: {
    color: '#E53E3E',
    fontSize: typography.sizes.sm,
  },
  tipText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
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
  linkHighlight: {
    color: colors.gold,
    fontWeight: typography.weights.semibold,
  },
});
