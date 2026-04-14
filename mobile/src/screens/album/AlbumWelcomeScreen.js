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

export default function AlbumWelcomeScreen({ navigation }) {
  const headerHeight = useHeaderHeight();
  const { showToast, ToastComponent } = useSavedToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [familyName, setFamilyName] = useState('');
  const [establishedYear, setEstablishedYear] = useState('');
  const [hometown, setHometown] = useState('');
  const [welcomeQuote, setWelcomeQuote] = useState('');
  const [welcomeQuoteAttribution, setWelcomeQuoteAttribution] = useState('');
  const [welcomeTexts, setWelcomeTexts] = useState('');

  useEffect(() => {
    async function fetchAlbum() {
      try {
        const res = await get('/api/album');
        const album = res.data.album || {};
        setFamilyName(album.family_name || '');
        setEstablishedYear(album.established_year != null ? String(album.established_year) : '');
        setHometown(album.hometown || '');
        setWelcomeQuote(album.welcome_quote || '');
        setWelcomeQuoteAttribution(album.welcome_quote_attribution || '');
        // welcome_texts may arrive as an array of paragraph strings or a single string
        if (Array.isArray(album.welcome_texts)) {
          setWelcomeTexts(album.welcome_texts.join('\n\n'));
        } else {
          setWelcomeTexts(album.welcome_texts || '');
        }
      } catch (err) {
        if (err.status !== 404) {
          setError(err.message || 'Failed to load album data.');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchAlbum();
  }, []);

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await put('/api/album/welcome', {
        family_name: familyName,
        established_year: establishedYear,
        hometown,
        welcome_quote: welcomeQuote,
        welcome_quote_attribution: welcomeQuoteAttribution,
        welcome_texts: welcomeTexts,
      });
      showToast('Welcome section updated.');
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
        <Text style={styles.pageTitle}>Welcome & Intro</Text>
        <Text style={styles.pageSubtitle}>
          Introduce your family to the album
        </Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.label}>Family Name</Text>
          <TextInput
            style={styles.input}
            value={familyName}
            onChangeText={setFamilyName}
            placeholder="e.g., The Johnson Family"
            placeholderTextColor={colors.placeholder}
          />

          <Text style={styles.label}>Year Established</Text>
          <TextInput
            style={styles.input}
            value={establishedYear}
            onChangeText={setEstablishedYear}
            placeholder="e.g., 1998"
            placeholderTextColor={colors.placeholder}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Hometown</Text>
          <TextInput
            style={styles.input}
            value={hometown}
            onChangeText={setHometown}
            placeholder="e.g., Portland, Oregon"
            placeholderTextColor={colors.placeholder}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Welcome Quote</Text>
          <TextInput
            style={[styles.input, styles.quoteInput]}
            value={welcomeQuote}
            onChangeText={setWelcomeQuote}
            placeholder="A favourite family quote or saying..."
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Quote Attribution</Text>
          <TextInput
            style={styles.input}
            value={welcomeQuoteAttribution}
            onChangeText={setWelcomeQuoteAttribution}
            placeholder="e.g., — Dad"
            placeholderTextColor={colors.placeholder}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Our Story</Text>
          <Text style={styles.hint}>Separate paragraphs with a blank line</Text>
          <TextInput
            style={[styles.input, styles.storyInput]}
            value={welcomeTexts}
            onChangeText={setWelcomeTexts}
            placeholder="Tell your family's story here..."
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />
        </View>

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
  hint: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: spacing.xs,
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
  quoteInput: {
    minHeight: 72,
    paddingTop: spacing.md,
  },
  storyInput: {
    minHeight: 160,
    paddingTop: spacing.md,
  },
  saveButton: {
    backgroundColor: colors.gold,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
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
