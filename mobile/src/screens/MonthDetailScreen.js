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
import PhotoPicker from '../components/PhotoPicker';
import { useSavedToast } from '../components/SavedToast';
import { useI18n } from '../i18n/I18nContext';

export default function MonthDetailScreen({ route, navigation }) {
  const { t } = useI18n();
  const headerHeight = useHeaderHeight();
  const { showToast, ToastComponent } = useSavedToast();
  const { monthNum, monthLabel } = route.params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [highlight, setHighlight] = useState('');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [note, setNote] = useState('');
  const [photoPath, setPhotoPath] = useState('');

  useEffect(() => {
    async function fetchMonth() {
      try {
        const res = await get(`/api/books/mine/months/${monthNum}`);
        const data = res.data || {};
        setHighlight(data.highlight || '');
        setWeight(String(data.weight || ''));
        setLength(String(data.length || ''));
        setNote(data.note || '');
        setPhotoPath(data.photo_path || '');
      } catch (err) {
        // Month data may not exist yet - that's OK
        if (err.status !== 404) {
          setError(err.message || t('app.monthdetail.error_load'));
        }
      } finally {
        setLoading(false);
      }
    }
    fetchMonth();
  }, [monthNum]);

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await put(`/api/books/mine/months/${monthNum}`, {
        highlight: highlight.trim(),
        weight: weight.trim() || null,
        length: length.trim() || null,
        note: note.trim(),
        photo_path: photoPath,
      });
      showToast(t('app.monthdetail.toast_saved', { label: monthLabel }));
      setTimeout(() => navigation.goBack(), 1800);
    } catch (err) {
      setError(err.message || t('app.monthdetail.error_save'));
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
        <Text style={styles.sectionTitle}>{t('app.monthdetail.title', { label: monthLabel })}</Text>
        <Text style={styles.subtitle}>{t('app.monthdetail.subtitle', { number: monthNum })}</Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>{t('app.monthdetail.label_highlight')}</Text>
        <TextInput
          style={styles.input}
          value={highlight}
          onChangeText={setHighlight}
          placeholder={t('app.monthdetail.placeholder_highlight')}
          placeholderTextColor={colors.placeholder}
        />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>{t('app.monthdetail.label_weight')}</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              placeholder={t('app.monthdetail.placeholder_weight')}
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>{t('app.monthdetail.label_length')}</Text>
            <TextInput
              style={styles.input}
              value={length}
              onChangeText={setLength}
              placeholder={t('app.monthdetail.placeholder_length')}
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
            />
          </View>
        </View>

        <Text style={styles.label}>{t('app.monthdetail.label_notes')}</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={note}
          onChangeText={setNote}
          placeholder={t('app.monthdetail.placeholder_notes')}
          placeholderTextColor={colors.placeholder}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />

        <Text style={styles.label}>{t('app.monthdetail.label_photo')}</Text>
        <PhotoPicker
          currentPhoto={photoPath}
          onPhotoSelected={(path) => setPhotoPath(path)}
        />

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>{t('app.monthdetail.save')}</Text>
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
  sectionTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  subtitle: {
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
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  multilineInput: {
    minHeight: 140,
    paddingTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfField: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: colors.gold,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
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
