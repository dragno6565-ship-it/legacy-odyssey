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

export default function BirthStoryScreen({ navigation }) {
  const { t } = useI18n();
  const headerHeight = useHeaderHeight();
  const { showToast, ToastComponent } = useSavedToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [firstHeldBy, setFirstHeldBy] = useState('');
  const [momTitle, setMomTitle] = useState('');
  const [momNarrative, setMomNarrative] = useState('');
  const [dadTitle, setDadTitle] = useState('');
  const [dadNarrative, setDadNarrative] = useState('');
  const [momPhoto1, setMomPhoto1] = useState('');
  const [momPhoto2, setMomPhoto2] = useState('');
  const [dadPhoto1, setDadPhoto1] = useState('');
  const [dadPhoto2, setDadPhoto2] = useState('');
  // Selectable perspective labels (migration 021). Blank = "Mom" / "Dad".
  const [person1Label, setPerson1Label] = useState('');
  const [person2Label, setPerson2Label] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await get('/api/books/mine/birth');
        const d = res.data || {};
        setFirstHeldBy(d.first_held_by || '');
        setMomTitle(d.mom_title || '');
        setMomNarrative(d.mom_narrative || '');
        setDadTitle(d.dad_title || '');
        setDadNarrative(d.dad_narrative || '');
        setMomPhoto1(d.mom_photo_1 || '');
        setMomPhoto2(d.mom_photo_2 || '');
        setDadPhoto1(d.dad_photo_1 || '');
        setDadPhoto2(d.dad_photo_2 || '');
        setPerson1Label(d.person1_label || '');
        setPerson2Label(d.person2_label || '');
      } catch (err) {
        if (err.status !== 404) {
          setError(err.message || t('app.birthstory.error_load'));
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await put('/api/books/mine/birth', {
        first_held_by: firstHeldBy.trim(),
        mom_title: momTitle.trim(),
        mom_narrative: momNarrative.trim(),
        dad_title: dadTitle.trim(),
        dad_narrative: dadNarrative.trim(),
        mom_photo_1: momPhoto1,
        mom_photo_2: momPhoto2,
        dad_photo_1: dadPhoto1,
        dad_photo_2: dadPhoto2,
        person1_label: person1Label.trim(),
        person2_label: person2Label.trim(),
      });
      showToast(t('app.birthstory.saved_toast'));
      setTimeout(() => navigation.goBack(), 1800);
    } catch (err) {
      setError(err.message || t('app.birthstory.error_save'));
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
        <Text style={styles.pageTitle}>{t('app.birthstory.page_title')}</Text>
        <Text style={styles.pageSubtitle}>{t('app.birthstory.page_subtitle')}</Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>{t('app.birthstory.first_held_by_label')}</Text>
        <TextInput
          style={styles.input}
          value={firstHeldBy}
          onChangeText={setFirstHeldBy}
          placeholder={t('app.birthstory.first_held_by_placeholder')}
          placeholderTextColor={colors.placeholder}
        />

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('app.birthstory.first_perspective')}</Text>
          <Text style={styles.fieldLabel}>{t('app.birthstory.perspective_label')}</Text>
          <TextInput
            style={styles.input}
            value={person1Label}
            onChangeText={setPerson1Label}
            placeholder={t('app.birthstory.person1_placeholder')}
            placeholderTextColor={colors.placeholder}
            maxLength={40}
          />
          <Text style={styles.helperText}>{t('app.birthstory.perspective_helper')}</Text>
          <Text style={styles.fieldLabel}>{t('app.birthstory.headline_label')}</Text>
          <TextInput
            style={styles.input}
            value={momTitle}
            onChangeText={setMomTitle}
            placeholder={t('app.birthstory.headline1_placeholder')}
            placeholderTextColor={colors.placeholder}
            maxLength={120}
          />
          <Text style={styles.fieldLabel}>{t('app.birthstory.narrative_label')}</Text>
          <TextInput
            style={[styles.input, styles.narrativeInput]}
            value={momNarrative}
            onChangeText={setMomNarrative}
            placeholder={t('app.birthstory.narrative_placeholder')}
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={10}
            textAlignVertical="top"
          />
          <Text style={styles.photoLabel}>{t('app.birthstory.photo_1')}</Text>
          <PhotoPicker currentPhoto={momPhoto1} onPhotoSelected={setMomPhoto1} />
          <Text style={styles.photoLabel}>{t('app.birthstory.photo_2')}</Text>
          <PhotoPicker currentPhoto={momPhoto2} onPhotoSelected={setMomPhoto2} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('app.birthstory.second_perspective')}</Text>
          <Text style={styles.fieldLabel}>{t('app.birthstory.perspective_label')}</Text>
          <TextInput
            style={styles.input}
            value={person2Label}
            onChangeText={setPerson2Label}
            placeholder={t('app.birthstory.person2_placeholder')}
            placeholderTextColor={colors.placeholder}
            maxLength={40}
          />
          <Text style={styles.helperText}>{t('app.birthstory.second_perspective_helper')}</Text>
          <Text style={styles.fieldLabel}>{t('app.birthstory.headline_label')}</Text>
          <TextInput
            style={styles.input}
            value={dadTitle}
            onChangeText={setDadTitle}
            placeholder={t('app.birthstory.headline2_placeholder')}
            placeholderTextColor={colors.placeholder}
            maxLength={120}
          />
          <Text style={styles.fieldLabel}>{t('app.birthstory.narrative_label')}</Text>
          <TextInput
            style={[styles.input, styles.narrativeInput]}
            value={dadNarrative}
            onChangeText={setDadNarrative}
            placeholder={t('app.birthstory.narrative_placeholder')}
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={10}
            textAlignVertical="top"
          />
          <Text style={styles.photoLabel}>{t('app.birthstory.photo_1')}</Text>
          <PhotoPicker currentPhoto={dadPhoto1} onPhotoSelected={setDadPhoto1} />
          <Text style={styles.photoLabel}>{t('app.birthstory.photo_2')}</Text>
          <PhotoPicker currentPhoto={dadPhoto2} onPhotoSelected={setDadPhoto2} />
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
            <Text style={styles.saveButtonText}>{t('app.birthstory.save')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      {ToastComponent}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, paddingBottom: 150 },
  pageTitle: { fontFamily: typography.fontFamily.serif, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.textPrimary },
  pageSubtitle: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginBottom: spacing.lg, fontStyle: 'italic' },
  errorContainer: { backgroundColor: colors.errorLight, borderRadius: borderRadius.sm, padding: spacing.md, marginBottom: spacing.md },
  errorText: { color: colors.error, fontSize: typography.sizes.sm, textAlign: 'center' },
  label: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.textPrimary, marginBottom: spacing.xs, marginTop: spacing.md },
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, fontSize: typography.sizes.md, color: colors.textPrimary },
  narrativeInput: { minHeight: 200, paddingTop: spacing.md },
  section: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginTop: spacing.lg, ...shadows.card },
  sectionHeader: { fontFamily: typography.fontFamily.serif, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.gold, marginBottom: spacing.sm },
  photoLabel: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.textPrimary, marginTop: spacing.md, marginBottom: spacing.xs },
  fieldLabel: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.textPrimary, marginBottom: spacing.xs, marginTop: spacing.sm },
  helperText: { fontSize: typography.sizes.xs, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.xs, lineHeight: 16 },
  saveButton: { backgroundColor: colors.gold, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xl, minHeight: 50, ...shadows.button },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: colors.white, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold },
});
