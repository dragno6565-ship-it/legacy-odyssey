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
} from 'react-native';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { get, put } from '../api/client';
import { useAuth } from '../auth/AuthContext';

const APP_VERSION = '1.0.0';

export default function SettingsScreen({ navigation }) {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [bookPassword, setBookPassword] = useState('');
  const [bookSlug, setBookSlug] = useState('');

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
      Alert.alert('Saved', 'Book password updated.');
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

      {/* App Info */}
      <View style={styles.infoSection}>
        <Text style={styles.infoText}>Legacy Odyssey Mobile</Text>
        <Text style={styles.infoText}>Version {APP_VERSION}</Text>
      </View>
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
