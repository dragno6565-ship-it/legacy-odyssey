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
import { useHeaderHeight } from '@react-navigation/elements';
import { get, put } from '../api/client';
import PhotoPicker from '../components/PhotoPicker';

export default function BirthStoryScreen({ navigation }) {
  const headerHeight = useHeaderHeight();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [firstHeldBy, setFirstHeldBy] = useState('');
  const [momNarrative, setMomNarrative] = useState('');
  const [dadNarrative, setDadNarrative] = useState('');
  const [momPhoto1, setMomPhoto1] = useState('');
  const [momPhoto2, setMomPhoto2] = useState('');
  const [dadPhoto1, setDadPhoto1] = useState('');
  const [dadPhoto2, setDadPhoto2] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await get('/api/books/mine/birth');
        const d = res.data || {};
        setFirstHeldBy(d.first_held_by || '');
        setMomNarrative(d.mom_narrative || '');
        setDadNarrative(d.dad_narrative || '');
        setMomPhoto1(d.mom_photo_1 || '');
        setMomPhoto2(d.mom_photo_2 || '');
        setDadPhoto1(d.dad_photo_1 || '');
        setDadPhoto2(d.dad_photo_2 || '');
      } catch (err) {
        if (err.status !== 404) {
          setError(err.message || 'Failed to load birth story.');
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
        mom_narrative: momNarrative.trim(),
        dad_narrative: dadNarrative.trim(),
        mom_photo_1: momPhoto1,
        mom_photo_2: momPhoto2,
        dad_photo_1: dadPhoto1,
        dad_photo_2: dadPhoto2,
      });
      Alert.alert('Saved', 'Birth story updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      setError(err.message || 'Failed to save.');
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
        <Text style={styles.pageTitle}>Birth Story</Text>
        <Text style={styles.pageSubtitle}>The day everything changed</Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>First Held By</Text>
        <TextInput
          style={styles.input}
          value={firstHeldBy}
          onChangeText={setFirstHeldBy}
          placeholder="e.g., Mom / Dad"
          placeholderTextColor={colors.placeholder}
        />

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Mom's Perspective</Text>
          <TextInput
            style={[styles.input, styles.narrativeInput]}
            value={momNarrative}
            onChangeText={setMomNarrative}
            placeholder="Mom's birth story..."
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={10}
            textAlignVertical="top"
          />
          <Text style={styles.photoLabel}>Mom's Photo 1</Text>
          <PhotoPicker currentPhoto={momPhoto1} onPhotoSelected={setMomPhoto1} />
          <Text style={styles.photoLabel}>Mom's Photo 2</Text>
          <PhotoPicker currentPhoto={momPhoto2} onPhotoSelected={setMomPhoto2} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Dad's Perspective</Text>
          <TextInput
            style={[styles.input, styles.narrativeInput]}
            value={dadNarrative}
            onChangeText={setDadNarrative}
            placeholder="Dad's birth story..."
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={10}
            textAlignVertical="top"
          />
          <Text style={styles.photoLabel}>Dad's Photo 1</Text>
          <PhotoPicker currentPhoto={dadPhoto1} onPhotoSelected={setDadPhoto1} />
          <Text style={styles.photoLabel}>Dad's Photo 2</Text>
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
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  saveButton: { backgroundColor: colors.gold, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xl, minHeight: 50, ...shadows.button },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: colors.white, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold },
});
