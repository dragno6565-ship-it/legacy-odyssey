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
  Image,
  Alert,
} from 'react-native';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { useHeaderHeight } from '@react-navigation/elements';
import { get, put, post, del } from '../api/client';
import PhotoPicker from '../components/PhotoPicker';
import { useSavedToast } from '../components/SavedToast';

// "Your Journey to Us" — single story page for non-traditional families
// (adoption, surrogacy, fostering, etc.). Mirrors the web editor at
// /account/book/journey. Text + milestones save together; photos are
// added/removed immediately via their own API calls.
export default function JourneyScreen({ navigation }) {
  const headerHeight = useHeaderHeight();
  const { showToast, ToastComponent } = useSavedToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [intro, setIntro] = useState('');
  const [storyTitle, setStoryTitle] = useState('');
  const [story, setStory] = useState('');
  const [letterText, setLetterText] = useState('');
  const [letterSign, setLetterSign] = useState('');
  const [milestones, setMilestones] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [photoKey, setPhotoKey] = useState(0);

  async function load() {
    try {
      const res = await get('/api/books/mine/journey');
      const d = res.data || {};
      setTitle(d.title || '');
      setIntro(d.intro || '');
      setStoryTitle(d.story_title || '');
      setStory(d.story || '');
      setLetterText(d.letter_text || '');
      setLetterSign(d.letter_sign || '');
      setMilestones(
        Array.isArray(d.milestones)
          ? d.milestones.map((m) => ({ label: (m && m.label) || '', date: (m && m.date) || '' }))
          : []
      );
      setPhotos(Array.isArray(d.photos) ? d.photos : []);
    } catch (err) {
      if (err.status !== 404) setError(err.message || 'Failed to load.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function updateMilestone(i, field, value) {
    setMilestones((prev) => prev.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)));
  }
  function addMilestone() {
    setMilestones((prev) => [...prev, { label: '', date: '' }]);
  }
  function removeMilestone(i) {
    setMilestones((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await put('/api/books/mine/journey', {
        title: title.trim(),
        intro: intro.trim(),
        story_title: storyTitle.trim(),
        story: story.trim(),
        letter_text: letterText.trim(),
        letter_sign: letterSign.trim(),
        milestones: milestones.filter(
          (m) => (m.label || '').trim() || (m.date || '').trim()
        ),
      });
      showToast('Your Journey to Us updated.');
      setTimeout(() => navigation.goBack(), 1800);
    } catch (err) {
      setError(err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddPhoto(path) {
    if (!path) return;
    setPhotoBusy(true);
    try {
      await post('/api/books/mine/journey/photos', { photo_path: path });
      const res = await get('/api/books/mine/journey');
      setPhotos(Array.isArray(res.data && res.data.photos) ? res.data.photos : []);
      setPhotoKey((k) => k + 1);
    } catch (err) {
      Alert.alert('Error', 'Could not add the photo. Please try again.');
    } finally {
      setPhotoBusy(false);
    }
  }

  function confirmDeletePhoto(id) {
    Alert.alert('Remove photo', 'Remove this photo from the page?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deletePhoto(id) },
    ]);
  }
  async function deletePhoto(id) {
    setPhotoBusy(true);
    try {
      await del('/api/books/mine/journey-photos/' + id);
      setPhotos((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      Alert.alert('Error', 'Could not remove the photo.');
    } finally {
      setPhotoBusy(false);
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
        <Text style={styles.pageTitle}>Your Journey to Us</Text>
        <Text style={styles.pageSubtitle}>
          An optional story page — for adoption, surrogacy, fostering, and every path home
        </Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Page Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Your Journey to Us"
          placeholderTextColor={colors.placeholder}
        />
        <Text style={styles.helperText}>
          Name it whatever fits — "The Adoption Story", "Our Surrogacy Story", etc. Leave blank for the default.
        </Text>

        <Text style={styles.label}>Intro Line</Text>
        <TextInput
          style={[styles.input, styles.shortMultiline]}
          value={intro}
          onChangeText={setIntro}
          placeholder="A sentence or two to open the page."
          placeholderTextColor={colors.placeholder}
          multiline
          textAlignVertical="top"
        />

        {/* Milestones */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Milestone Dates</Text>
          <Text style={styles.helperText}>
            Optional dated moments — the day you were matched, homecoming day, the day it was finalized.
          </Text>
          {milestones.map((m, i) => (
            <View key={i} style={styles.msRow}>
              <TextInput
                style={[styles.input, styles.msLabel]}
                value={m.label}
                onChangeText={(t) => updateMilestone(i, 'label', t)}
                placeholder="Label"
                placeholderTextColor={colors.placeholder}
              />
              <TextInput
                style={[styles.input, styles.msDate]}
                value={m.date}
                onChangeText={(t) => updateMilestone(i, 'date', t)}
                placeholder="Date"
                placeholderTextColor={colors.placeholder}
              />
              <TouchableOpacity style={styles.msRemove} onPress={() => removeMilestone(i)}>
                <Text style={styles.msRemoveText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addBtn} onPress={addMilestone} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>+ Add a milestone</Text>
          </TouchableOpacity>
        </View>

        {/* The Story */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>The Story</Text>
          <Text style={styles.fieldLabel}>Story Heading</Text>
          <TextInput
            style={styles.input}
            value={storyTitle}
            onChangeText={setStoryTitle}
            placeholder="How you came home"
            placeholderTextColor={colors.placeholder}
          />
          <Text style={styles.fieldLabel}>Your Story</Text>
          <TextInput
            style={[styles.input, styles.narrativeInput]}
            value={story}
            onChangeText={setStory}
            placeholder="Tell the story in your own words. Leave a blank line between paragraphs."
            placeholderTextColor={colors.placeholder}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Photos</Text>
          {photos.length ? (
            <View style={styles.photoGrid}>
              {photos.map((p) => (
                <View key={p.id} style={styles.photoTile}>
                  <Image source={{ uri: p.photo_path }} style={styles.photoImg} />
                  <TouchableOpacity
                    style={styles.photoDel}
                    onPress={() => confirmDeletePhoto(p.id)}
                    disabled={photoBusy}
                  >
                    <Text style={styles.photoDelText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.helperText}>No photos yet.</Text>
          )}
          <Text style={styles.fieldLabel}>Add a Photo</Text>
          <PhotoPicker key={photoKey} currentPhoto={''} onPhotoSelected={handleAddPhoto} />
          {photoBusy ? (
            <ActivityIndicator color={colors.gold} style={{ marginTop: spacing.sm }} />
          ) : null}
        </View>

        {/* A Letter to You */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>A Letter to You (optional)</Text>
          <Text style={styles.fieldLabel}>Letter</Text>
          <TextInput
            style={[styles.input, styles.shortMultiline]}
            value={letterText}
            onChangeText={setLetterText}
            placeholder="A few lines straight to your child."
            placeholderTextColor={colors.placeholder}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.fieldLabel}>Signed</Text>
          <TextInput
            style={styles.input}
            value={letterSign}
            onChangeText={setLetterSign}
            placeholder="e.g. With all our love"
            placeholderTextColor={colors.placeholder}
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
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, paddingBottom: 150 },
  pageTitle: { fontFamily: typography.fontFamily.serif, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.textPrimary },
  pageSubtitle: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginBottom: spacing.lg, fontStyle: 'italic', lineHeight: 18 },
  errorContainer: { backgroundColor: colors.errorLight, borderRadius: borderRadius.sm, padding: spacing.md, marginBottom: spacing.md },
  errorText: { color: colors.error, fontSize: typography.sizes.sm, textAlign: 'center' },
  label: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.textPrimary, marginBottom: spacing.xs, marginTop: spacing.md },
  fieldLabel: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.textPrimary, marginBottom: spacing.xs, marginTop: spacing.md },
  helperText: { fontSize: typography.sizes.xs, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.xs, lineHeight: 16 },
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, fontSize: typography.sizes.md, color: colors.textPrimary },
  shortMultiline: { minHeight: 80, paddingTop: spacing.md },
  narrativeInput: { minHeight: 200, paddingTop: spacing.md },
  section: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginTop: spacing.lg, ...shadows.card },
  sectionHeader: { fontFamily: typography.fontFamily.serif, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.gold, marginBottom: spacing.sm },
  msRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  msLabel: { flex: 1 },
  msDate: { width: 110 },
  msRemove: { width: 36, height: 36, borderRadius: borderRadius.sm, backgroundColor: colors.errorLight, alignItems: 'center', justifyContent: 'center' },
  msRemoveText: { color: colors.error, fontSize: 20, lineHeight: 22 },
  addBtn: { marginTop: spacing.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.gold, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center' },
  addBtnText: { color: colors.goldDark, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  photoTile: { width: 96, height: 96, borderRadius: borderRadius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  photoImg: { width: '100%', height: '100%' },
  photoDel: { position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  photoDelText: { color: colors.white, fontSize: 15, lineHeight: 17 },
  saveButton: { backgroundColor: colors.gold, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xl, minHeight: 50, ...shadows.button },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: colors.white, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold },
});
