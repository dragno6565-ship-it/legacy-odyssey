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
import PhotoPicker from '../components/PhotoPicker';

const DEFAULT_CARDS = [
  { photo_path: '', title: '', subtitle: '', body: '' },
  { photo_path: '', title: '', subtitle: '', body: '' },
  { photo_path: '', title: '', subtitle: '', body: '' },
  { photo_path: '', title: '', subtitle: '', body: '' },
];

export default function BeforeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [cards, setCards] = useState(DEFAULT_CARDS);
  const [checklist, setChecklist] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await get('/api/books/mine/before');
        const data = res.data;
        const fetched = Array.isArray(data.cards) ? data.cards : [];
        const merged = [0, 1, 2, 3].map((i) => ({
          photo_path: fetched[i]?.photo_path || '',
          title: fetched[i]?.title || '',
          subtitle: fetched[i]?.subtitle || '',
          body: fetched[i]?.body || '',
        }));
        setCards(merged);
        setChecklist(
          (data.checklist || []).map((item) => ({
            label: item.label || '',
            is_checked: item.is_checked || false,
          }))
        );
      } catch (err) {
        if (err.status !== 404) {
          setError(err.message || 'Failed to load data.');
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

  function updateChecklistItem(index, field, value) {
    setChecklist((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function addChecklistItem() {
    setChecklist((prev) => [...prev, { label: '', is_checked: false }]);
  }

  function removeChecklistItem(index) {
    setChecklist((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await put('/api/books/mine/before', {
        cards,
        checklist: checklist.filter((item) => item.label.trim()),
      });
      Alert.alert('Saved', 'Before You Arrived updated.', [
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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Before You Arrived</Text>
        <Text style={styles.pageSubtitle}>The story of how we prepared for you</Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {cards.map((card, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.cardNumber}>Card {index + 1}</Text>

            <PhotoPicker
              currentPhoto={card.photo_path}
              onPhotoSelected={(path) => updateCard(index, 'photo_path', path)}
            />

            <Text style={styles.label}>Subtitle / Label</Text>
            <TextInput
              style={styles.input}
              value={card.subtitle}
              onChangeText={(val) => updateCard(index, 'subtitle', val)}
              placeholder="e.g., The Nursery"
              placeholderTextColor={colors.placeholder}
            />

            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={card.title}
              onChangeText={(val) => updateCard(index, 'title', val)}
              placeholder="e.g., Painting Clouds on the Ceiling"
              placeholderTextColor={colors.placeholder}
            />

            <Text style={styles.label}>Body</Text>
            <TextInput
              style={[styles.input, styles.bodyInput]}
              value={card.body}
              onChangeText={(val) => updateCard(index, 'body', val)}
              placeholder="Tell the story..."
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        ))}

        {/* Checklist Section */}
        <Text style={styles.sectionHeader}>Getting-Ready Checklist</Text>
        {checklist.map((item, index) => (
          <View key={index} style={styles.checklistRow}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => updateChecklistItem(index, 'is_checked', !item.is_checked)}
            >
              <Text style={styles.checkboxText}>{item.is_checked ? '\u2611' : '\u2610'}</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.checklistInput}
              value={item.label}
              onChangeText={(val) => updateChecklistItem(index, 'label', val)}
              placeholder="Checklist item..."
              placeholderTextColor={colors.placeholder}
            />
            <TouchableOpacity onPress={() => removeChecklistItem(index)}>
              <Text style={styles.removeBtn}>{'\u2715'}</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addBtn} onPress={addChecklistItem}>
          <Text style={styles.addBtnText}>+ Add Checklist Item</Text>
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
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg, ...shadows.card },
  cardNumber: { fontFamily: typography.fontFamily.serif, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.gold, marginBottom: spacing.sm },
  label: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.textPrimary, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, fontSize: typography.sizes.md, color: colors.textPrimary },
  bodyInput: { minHeight: 100, paddingTop: spacing.md },
  sectionHeader: { fontFamily: typography.fontFamily.serif, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.md },
  checklistRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
  checkbox: { padding: spacing.xs },
  checkboxText: { fontSize: 22, color: colors.gold },
  checklistInput: { flex: 1, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, fontSize: typography.sizes.md, color: colors.textPrimary },
  removeBtn: { color: colors.error, fontSize: 18, paddingHorizontal: spacing.sm },
  addBtn: { borderWidth: 2, borderColor: colors.gold, borderStyle: 'dashed', borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  addBtnText: { color: colors.gold, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
  saveButton: { backgroundColor: colors.gold, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xl, minHeight: 50, ...shadows.button },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: colors.white, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold },
});
