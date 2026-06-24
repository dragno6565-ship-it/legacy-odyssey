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
import { Mail, Lock } from 'lucide-react-native';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import api from '../api/client';
import { useI18n } from '../i18n/I18nContext';
import LanguageToggle from '../components/LanguageToggle';

export default function ForgotPasswordScreen({ navigation }) {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleResetPassword() {
    setError('');
    if (!email.trim()) {
      setError(t('app.forgotpassword.error_missing_email'));
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
            <Mail size={48} color={colors.gold} strokeWidth={1.5} style={styles.brandIcon} />
            <Text style={styles.brandTitle}>{t('app.forgotpassword.success_title')}</Text>
            <Text style={styles.brandSubtitle}>
              {t('app.forgotpassword.success_subtitle', { email })}
            </Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.tipText}>
              {t('app.forgotpassword.tip_no_email')}
            </Text>

            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>{t('app.forgotpassword.back_to_login')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => { setSuccess(false); setEmail(''); }}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>{t('app.forgotpassword.try_another_email')}</Text>
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
        <LanguageToggle style={{ marginBottom: spacing.lg }} />

        <View style={styles.brandingContainer}>
          <Lock size={48} color={colors.gold} strokeWidth={1.5} style={styles.brandIcon} />
          <Text style={styles.brandTitle}>{t('app.forgotpassword.title')}</Text>
          <Text style={styles.brandSubtitle}>
            {t('app.forgotpassword.subtitle')}
          </Text>
        </View>

        <View style={styles.formCard}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>{t('app.forgotpassword.label_email')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('app.forgotpassword.placeholder_email')}
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
              <Text style={styles.buttonText}>{t('app.forgotpassword.send_reset_link')}</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.linkContainer}
          onPress={() => navigation.navigate('Login')}
          disabled={loading}
        >
          <Text style={styles.linkText}>
            {t('app.forgotpassword.remember_password')} <Text style={styles.linkHighlight}>{t('app.forgotpassword.sign_in')}</Text>
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
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
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
    ...shadows.card,
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
    color: colors.textPrimary,
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
