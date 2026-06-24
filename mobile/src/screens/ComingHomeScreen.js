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
  Alert,
} from 'react-native';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { useHeaderHeight } from '@react-navigation/elements';
import { get, put } from '../api/client';
import PhotoPicker from '../components/PhotoPicker';
import { pickAndUploadPhotos } from '../utils/multiPhoto';
import { useSavedToast } from '../components/SavedToast';
import { useI18n } from '../i18n/I18nContext';

const BLANK_CARD = () => ({ photo_path: '', title: '', subtitle: '', body: '' });

export default function ComingHomeScreen({ navigation }) {
  const { t } = useI18n();
  const headerHeight = useHeaderHeight();
  const { showToast, ToastComponent } = useSavedToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [cards, setCards] = useState([BLANK_CARD()]);
  const [addingPhotos, setAddingPhotos] = useState(false);
  const [photoProgress, setPhotoProgress] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await get('/api/books/mine/coming-home');
        const fetched = Array.isArray(res.data) ? res.data : [];
        const merged = fetched.length > 0
          ? fetched.map((c) => ({
              photo_path: c.photo_path || '',
              title: c.title || '',
              subtitle: c.subtitle || '',
              body: c.body || '',
            }))
          : [BLANK_CARD()];
        setCards(merged);
      } catch (err) {
        if (err.status !== 404) {
          setError(err.message || t('app.cominghome.error_load'));
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function updateCard(index, field, value) {
    setCards((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function addCard() {
    setCards((prev) => [...prev, BLANK_CARD()]);
  }

  function removeCard(index) {
    setCards((prev) => prev.filter((_, i) => i !== index));
  }

  // Pick several photos at once → one card per photo (label them after).
  async function addMultiplePhotos() {
    setError('');
    setAddingPhotos(true);
    setPhotoProgress('');
    try {
      const { canceled, paths } = await pickAndUploadPhotos({
        limit: 20,
        onProgress: (done, total) => setPhotoProgress(t('app.cominghome.uploading_progress', { current: Math.min(done + 1, total), total })),
      });
      if (canceled || paths.length === 0) return;
      const newCards = paths.map((p) => ({ photo_path: p, title: '', subtitle: '', body: '' }));
      setCards((prev) => {
        // Drop a single leading blank starter card so we don't leave an empty one on top.
        const base = prev.length === 1 && !prev[0].photo_path && !prev[0].title && !prev[0].subtitle && !prev[0].body ? [] : prev;
        return [...base, ...newCards];
      });
    } catch (err) {
      Alert.alert(t('app.cominghome.upload_failed_title'), err.message || t('app.cominghome.upload_failed_body'));
    } finally {
      setAddingPhotos(false);
      setPhotoProgress('');
    }
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await put('/api/books/mine/coming-home', { cards });
      showToast(t('app.cominghome.toast_saved'));
      setTimeout(() => navigation.goBack(), 1800);
    } catch (err) {
      setError(err.message || t('app.cominghome.error_save'));
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
        <Text style={styles.pageTitle}>{t('app.cominghome.page_title')}</Text>
        <Text style={styles.pageSubtitle}>{t('app.cominghome.page_subtitle')}</Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {cards.map((card, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardNumber}>{t('app.cominghome.card_number', { number: index + 1 })}</Text>
              {cards.length > 1 && (
                <TouchableOpacity onPress={() => removeCard(index)} activeOpacity={0.7}>
                  <Text style={styles.removeText}>{t('app.cominghome.remove')}</Text>
                </TouchableOpacity>
              )}
            </View>

            <PhotoPicker
              currentPhoto={card.photo_path}
              onPhotoSelected={(path) => updateCard(index, 'photo_path', path)}
            />

            <Text style={styles.label}>{t('app.cominghome.label_subtitle')}</Text>
            <TextInput
              style={styles.input}
              value={card.subtitle}
              onChangeText={(val) => updateCard(index, 'subtitle', val)}
              placeholder={t('app.cominghome.placeholder_subtitle')}
              placeholderTextColor={colors.placeholder}
            />

            <Text style={styles.label}>{t('app.cominghome.label_title')}</Text>
            <TextInput
              style={styles.input}
              value={card.title}
              onChangeText={(val) => updateCard(index, 'title', val)}
              placeholder={t('app.cominghome.placeholder_title')}
              placeholderTextColor={colors.placeholder}
            />

            <Text style={styles.label}>{t('app.cominghome.label_body')}</Text>
            <TextInput
              style={[styles.input, styles.bodyInput]}
              value={card.body}
              onChangeText={(val) => updateCard(index, 'body', val)}
              placeholder={t('app.cominghome.placeholder_body')}
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={addCard} activeOpacity={0.8}>
          <Text style={styles.addButtonText}>{t('app.cominghome.add_card')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.addButton, addingPhotos && styles.saveButtonDisabled]}
          onPress={addMultiplePhotos}
          disabled={addingPhotos}
          activeOpacity={0.8}
        >
          {addingPhotos ? (
            <View style={styles.uploadingRow}>
              <ActivityIndicator color={colors.gold} size="small" />
              <Text style={styles.addButtonText}>{photoProgress || t('app.cominghome.uploading')}</Text>
            </View>
          ) : (
            <Text style={styles.addButtonText}>{t('app.cominghome.add_multiple_photos')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>{t('app.cominghome.save')}</Text>
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
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg, ...shadows.card },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  cardNumber: { fontFamily: typography.fontFamily.serif, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.gold },
  removeText: { fontSize: typography.sizes.sm, color: colors.error },
  addButton: { borderWidth: 1.5, borderColor: colors.gold, borderStyle: 'dashed', borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', marginBottom: spacing.md },
  addButtonText: { color: colors.gold, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
  uploadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.textPrimary, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, fontSize: typography.sizes.md, color: colors.textPrimary },
  bodyInput: { minHeight: 100, paddingTop: spacing.md },
  saveButton: { backgroundColor: colors.gold, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, minHeight: 50, ...shadows.button },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: colors.white, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold },
});
