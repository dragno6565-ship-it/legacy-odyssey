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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { get, put } from '../api/client';

const DEFAULT_LETTERS = [
  { from_label: '', salutation: '', body: '', signature: '' },
  { from_label: '', salutation: '', body: '', signature: '' },
  { from_label: '', salutation: '', body: '', signature: '' },
];

export default function LettersScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [letters, setLetters] = useState(DEFAULT_LETTERS);

  useEffect(() => {
    async function fetchLetters() {
      try {
        const res = await get('/api/books/mine/letters');
        const data = res.data;
        // Ensure we always have 3 letters
        const fetched = Array.isArray(data) ? data : data.letters || [];
        const merged = [0, 1, 2].map((i) => ({
          from_label: fetched[i]?.from_label || '',
          salutation: fetched[i]?.salutation || '',
          body: fetched[i]?.body || '',
          signature: fetched[i]?.signature || '',
        }));
        setLetters(merged);
      } catch (err) {
        if (err.status !== 404) {
          setError(err.message || 'Failed to load letters.');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchLetters();
  }, []);

  function updateLetter(index, field, value) {
    setLetters((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  async function handleSaveAll() {
    setSaving(true);
    setError('');
    try {
      await put('/api/books/mine/letters', { items: letters });
      Alert.alert('Saved', 'Letters updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Letters to You</Text>
        <Text style={styles.pageSubtitle}>
          Words from the people who love you most
        </Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {letters.map((letter, index) => (
          <View key={index} style={styles.letterCard}>
            <Text style={styles.letterNumber}>Letter {index + 1}</Text>

            <Text style={styles.label}>From</Text>
            <TextInput
              style={styles.input}
              value={letter.from_label}
              onChangeText={(val) => updateLetter(index, 'from_label', val)}
              placeholder="e.g., Mom, Dad, Grandma"
              placeholderTextColor={colors.placeholder}
            />

            <Text style={styles.label}>Salutation</Text>
            <TextInput
              style={styles.input}
              value={letter.salutation}
              onChangeText={(val) => updateLetter(index, 'salutation', val)}
              placeholder="e.g., Dear little one,"
              placeholderTextColor={colors.placeholder}
            />

            <Text style={styles.label}>Body</Text>
            <TextInput
              style={[styles.input, styles.bodyInput]}
              value={letter.body}
              onChangeText={(val) => updateLetter(index, 'body', val)}
              placeholder="Write your letter here..."
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />

            <Text style={styles.label}>Signature</Text>
            <TextInput
              style={styles.input}
              value={letter.signature}
              onChangeText={(val) => updateLetter(index, 'signature', val)}
              placeholder="e.g., With all my love, Mom"
              placeholderTextColor={colors.placeholder}
            />
          </View>
        ))}

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSaveAll}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save All Letters</Text>
          )}
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
  letterCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  letterNumber: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.gold,
    marginBottom: spacing.sm,
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
  bodyInput: {
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
