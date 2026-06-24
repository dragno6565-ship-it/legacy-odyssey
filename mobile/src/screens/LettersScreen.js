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
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { useHeaderHeight } from '@react-navigation/elements';
import { get, put } from '../api/client';
import { useSavedToast } from '../components/SavedToast';
import { useI18n } from '../i18n/I18nContext';

const BLANK_LETTER = () => ({ from_label: '', salutation: '', body: '', signature: '' });

export default function LettersScreen({ navigation }) {
  const { t } = useI18n();
  const headerHeight = useHeaderHeight();
  const { showToast, ToastComponent } = useSavedToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [letters, setLetters] = useState([BLANK_LETTER()]);

  useEffect(() => {
    async function fetchLetters() {
      try {
        const res = await get('/api/books/mine/letters');
        const data = res.data;
        const fetched = Array.isArray(data) ? data : data.letters || [];
        // Use however many letters exist in the DB; start with one blank if none
        const merged = fetched.length > 0
          ? fetched.map((l) => ({
              from_label: l.from_label || '',
              salutation: l.salutation || '',
              body: l.body || '',
              signature: l.signature || '',
            }))
          : [BLANK_LETTER()];
        setLetters(merged);
      } catch (err) {
        if (err.status !== 404) {
          setError(err.message || t('app.letters.load_error'));
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

  function addLetter() {
    setLetters((prev) => [...prev, BLANK_LETTER()]);
  }

  function removeLetter(index) {
    setLetters((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSaveAll() {
    setSaving(true);
    setError('');
    try {
      await put('/api/books/mine/letters', { items: letters });
      showToast(t('app.letters.save_success'));
      setTimeout(() => navigation.goBack(), 1800);
    } catch (err) {
      setError(err.message || t('app.letters.save_error'));
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
        <Text style={styles.pageTitle}>{t('app.letters.page_title')}</Text>
        <Text style={styles.pageSubtitle}>
          {t('app.letters.page_subtitle')}
        </Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {letters.map((letter, index) => (
          <View key={index} style={styles.letterCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.letterNumber}>{t('app.letters.letter_number', { number: index + 1 })}</Text>
              {letters.length > 1 && (
                <TouchableOpacity onPress={() => removeLetter(index)} activeOpacity={0.7}>
                  <Text style={styles.removeText}>{t('app.letters.remove')}</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.label}>{t('app.letters.from_label')}</Text>
            <TextInput
              style={styles.input}
              value={letter.from_label}
              onChangeText={(val) => updateLetter(index, 'from_label', val)}
              placeholder={t('app.letters.from_placeholder')}
              placeholderTextColor={colors.placeholder}
            />

            <Text style={styles.label}>{t('app.letters.salutation_label')}</Text>
            <TextInput
              style={styles.input}
              value={letter.salutation}
              onChangeText={(val) => updateLetter(index, 'salutation', val)}
              placeholder={t('app.letters.salutation_placeholder')}
              placeholderTextColor={colors.placeholder}
            />

            <Text style={styles.label}>{t('app.letters.body_label')}</Text>
            <TextInput
              style={[styles.input, styles.bodyInput]}
              value={letter.body}
              onChangeText={(val) => updateLetter(index, 'body', val)}
              placeholder={t('app.letters.body_placeholder')}
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />

            <Text style={styles.label}>{t('app.letters.signature_label')}</Text>
            <TextInput
              style={styles.input}
              value={letter.signature}
              onChangeText={(val) => updateLetter(index, 'signature', val)}
              placeholder={t('app.letters.signature_placeholder')}
              placeholderTextColor={colors.placeholder}
            />
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={addLetter} activeOpacity={0.8}>
          <Text style={styles.addButtonText}>{t('app.letters.add_letter')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSaveAll}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>{t('app.letters.save_all')}</Text>
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
  letterCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  letterNumber: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.gold,
  },
  removeText: {
    fontSize: typography.sizes.sm,
    color: colors.error,
  },
  addButton: {
    borderWidth: 1.5,
    borderColor: colors.gold,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addButtonText: {
    color: colors.gold,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
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
