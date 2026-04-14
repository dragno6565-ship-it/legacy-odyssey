import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, spacing, typography, shadows, borderRadius } from '../../theme';
import { useHeaderHeight } from '@react-navigation/elements';
import { get, put } from '../../api/client';
import { useSavedToast } from '../../components/SavedToast';

export default function AlbumVaultScreen({ navigation }) {
  const headerHeight = useHeaderHeight();
  const { showToast, ToastComponent } = useSavedToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [familyStartYear, setFamilyStartYear] = useState('');
  const [anniversaryYears, setAnniversaryYears] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await get('/api/album');
        const vault = res.data.album?.vault || {};
        setFamilyStartYear(vault.family_start_year || '');
        setAnniversaryYears(vault.anniversary_years || '');
        setMessage(vault.message || '');
      } catch (err) {
        if (err.status !== 404) {
          setError(err.message || 'Failed to load vault data.');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const startNum = parseInt(familyStartYear, 10);
  const annivNum = parseInt(anniversaryYears, 10);
  const openYear =
    !isNaN(startNum) && !isNaN(annivNum) && familyStartYear && anniversaryYears
      ? startNum + annivNum
      : null;

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await put('/api/album/vault', {
        family_start_year: familyStartYear.trim(),
        anniversary_years: anniversaryYears.trim(),
        message: message.trim(),
      });
      showToast('Vault saved.');
      setTimeout(() => navigation.goBack(), 1800);
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>The Vault</Text>
        <Text style={styles.pageSubtitle}>A time capsule to be opened in the future</Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.label}>Family Start Year</Text>
          <TextInput
            style={styles.input}
            value={familyStartYear}
            onChangeText={setFamilyStartYear}
            placeholder="e.g. 1987"
            placeholderTextColor={colors.placeholder}
            keyboardType="numeric"
            maxLength={4}
          />

          <Text style={styles.label}>Anniversary Years</Text>
          <TextInput
            style={styles.input}
            value={anniversaryYears}
            onChangeText={setAnniversaryYears}
            placeholder="e.g. 25"
            placeholderTextColor={colors.placeholder}
            keyboardType="numeric"
            maxLength={4}
          />

          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.messageInput]}
            value={message}
            onChangeText={setMessage}
            placeholder="What do you want to say to the future?"
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={10}
            textAlignVertical="top"
          />
        </View>

        {openYear !== null ? (
          <View style={styles.openYearBanner}>
            <Text style={styles.openYearText}>
              {'\uD83D\uDCC5'} This vault opens in {openYear}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      {ToastComponent}
    </KeyboardAvoidingView>
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
    paddingBottom: 150,
  },
  pageTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  pageSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    fontStyle: 'italic',
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
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  messageInput: {
    minHeight: 200,
    paddingTop: spacing.md,
  },
  openYearBanner: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  openYearText: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.gold,
  },
  saveButton: {
    backgroundColor: colors.gold,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    minHeight: 50,
    ...shadows.button,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
});
