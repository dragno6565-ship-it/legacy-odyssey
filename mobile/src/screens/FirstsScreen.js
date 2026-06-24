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

const DEFAULT_FIRSTS = Array.from({ length: 9 }, () => ({
  emoji: '',
  title: '',
  date_text: '',
  note: '',
}));

export default function FirstsScreen({ navigation }) {
  const { t } = useI18n();
  const headerHeight = useHeaderHeight();
  const { showToast, ToastComponent } = useSavedToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [firsts, setFirsts] = useState(DEFAULT_FIRSTS);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await get('/api/books/mine/firsts');
        const fetched = Array.isArray(res.data) ? res.data : [];
        const merged = Array.from({ length: 9 }, (_, i) => ({
          emoji: fetched[i]?.emoji || '',
          title: fetched[i]?.title || '',
          date_text: fetched[i]?.date_text || '',
          note: fetched[i]?.note || '',
        }));
        setFirsts(merged);
      } catch (err) {
        if (err.status !== 404) {
          setError(err.message || t('app.firsts.error_load'));
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function updateFirst(index, field, value) {
    setFirsts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await put('/api/books/mine/firsts', { items: firsts });
      showToast(t('app.firsts.toast_saved'));
      setTimeout(() => navigation.goBack(), 1800);
    } catch (err) {
      setError(err.message || t('app.firsts.error_save'));
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
        <Text style={styles.pageTitle}>{t('app.firsts.page_title')}</Text>
        <Text style={styles.pageSubtitle}>{t('app.firsts.page_subtitle')}</Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {firsts.map((first, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.cardHeader}>
              <TextInput
                style={styles.emojiInput}
                value={first.emoji}
                onChangeText={(val) => updateFirst(index, 'emoji', val)}
                placeholder="\u2B50"
                placeholderTextColor={colors.placeholder}
                maxLength={4}
              />
              <View style={styles.cardHeaderRight}>
                <Text style={styles.milestoneNum}>{t('app.firsts.milestone_num', { number: index + 1 })}</Text>
              </View>
            </View>

            <Text style={styles.label}>{t('app.firsts.label_title')}</Text>
            <TextInput
              style={styles.input}
              value={first.title}
              onChangeText={(val) => updateFirst(index, 'title', val)}
              placeholder={t('app.firsts.placeholder_title')}
              placeholderTextColor={colors.placeholder}
            />

            <Text style={styles.label}>{t('app.firsts.label_date')}</Text>
            <TextInput
              style={styles.input}
              value={first.date_text}
              onChangeText={(val) => updateFirst(index, 'date_text', val)}
              placeholder={t('app.firsts.placeholder_date')}
              placeholderTextColor={colors.placeholder}
            />

            <Text style={styles.label}>{t('app.firsts.label_note')}</Text>
            <TextInput
              style={[styles.input, styles.noteInput]}
              value={first.note}
              onChangeText={(val) => updateFirst(index, 'note', val)}
              placeholder={t('app.firsts.placeholder_note')}
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        ))}

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>{t('app.firsts.save_all')}</Text>
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
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, ...shadows.card },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  emojiInput: { fontSize: 28, width: 50, textAlign: 'center', backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.xs },
  cardHeaderRight: { marginLeft: spacing.sm, flex: 1 },
  milestoneNum: { fontFamily: typography.fontFamily.serif, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.gold },
  label: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.textPrimary, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, fontSize: typography.sizes.md, color: colors.textPrimary },
  noteInput: { minHeight: 70, paddingTop: spacing.md },
  saveButton: { backgroundColor: colors.gold, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, minHeight: 50, ...shadows.button },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: colors.white, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold },
});
