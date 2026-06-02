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

const BLANK_CARD = () => ({ photo_path: '', title: '', subtitle: '', body: '' });
// New books start with a few prompt cards; existing books load whatever they saved.
const DEFAULT_CARDS = [BLANK_CARD(), BLANK_CARD(), BLANK_CARD(), BLANK_CARD()];

export default function BeforeScreen({ navigation }) {
  const headerHeight = useHeaderHeight();
  const { showToast, ToastComponent } = useSavedToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [cards, setCards] = useState(DEFAULT_CARDS);
  const [checklist, setChecklist] = useState([]);
  const [addingPhotos, setAddingPhotos] = useState(false);
  const [photoProgress, setPhotoProgress] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await get('/api/books/mine/before');
        const data = res.data;
        const fetched = Array.isArray(data.cards) ? data.cards : [];
        // Load however many cards the book has; only fall back to the 4 starter
        // prompts when the section is brand new (keeps add/remove fully dynamic).
        const merged = fetched.length > 0
          ? fetched.map((c) => ({
              photo_path: c.photo_path || '',
              title: c.title || '',
              subtitle: c.subtitle || '',
              body: c.body || '',
            }))
          : DEFAULT_CARDS.map((c) => ({ ...c }));
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
        onProgress: (done, total) => setPhotoProgress(`Uploading ${Math.min(done + 1, total)} of ${total}…`),
      });
      if (canceled || paths.length === 0) return;
      const newCards = paths.map((p) => ({ photo_path: p, title: '', subtitle: '', body: '' }));
      setCards((prev) => {
        // Drop any all-blank starter cards so we don't leave empty ones on top.
        const base = prev.filter((c) => c.photo_path || c.title || c.subtitle || c.body);
        return [...base, ...newCards];
      });
    } catch (err) {
      Alert.alert('Upload failed', err.message || 'Could not add photos.');
    } finally {
      setAddingPhotos(false);
      setPhotoProgress('');
    }
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
      showToast('Before You Arrived updated.');
      setTimeout(() => navigation.goBack(), 1800);
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
        <Text style={styles.pageTitle}>Before You Arrived</Text>
        <Text style={styles.pageSubtitle}>The story of how we prepared for you</Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {cards.map((card, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardNumber}>Card {index + 1}</Text>
              {cards.length > 1 && (
                <TouchableOpacity onPress={() => removeCard(index)} activeOpacity={0.7}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>

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

        <TouchableOpacity style={styles.addBtn} onPress={addCard} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>+ Add Card</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.addBtn, addingPhotos && styles.saveButtonDisabled]}
          onPress={addMultiplePhotos}
          disabled={addingPhotos}
          activeOpacity={0.8}
        >
          {addingPhotos ? (
            <View style={styles.uploadingRow}>
              <ActivityIndicator color={colors.gold} size="small" />
              <Text style={styles.addBtnText}>{photoProgress || 'Uploading…'}</Text>
            </View>
          ) : (
            <Text style={styles.addBtnText}>+ Add multiple photos</Text>
          )}
        </TouchableOpacity>

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
  uploadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
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
