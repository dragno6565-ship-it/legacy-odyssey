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

export default function FamilyMemberScreen({ route, navigation }) {
  const headerHeight = useHeaderHeight();
  const { memberKey } = route.params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [emoji, setEmoji] = useState('');
  const [photoPath, setPhotoPath] = useState('');
  const [meta, setMeta] = useState([
    { label: '', value: '' },
    { label: '', value: '' },
    { label: '', value: '' },
    { label: '', value: '' },
  ]);
  const [story, setStory] = useState('');
  const [story2, setStory2] = useState('');
  const [quoteText, setQuoteText] = useState('');
  const [quoteCite, setQuoteCite] = useState('');
  const [albumPhotos, setAlbumPhotos] = useState([
    { path: '', caption: '' },
    { path: '', caption: '' },
    { path: '', caption: '' },
  ]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await get('/api/books/mine/family');
        const members = Array.isArray(res.data) ? res.data : [];
        const member = members.find((m) => m.member_key === memberKey);
        if (member) {
          setName(member.name || '');
          setRelation(member.relation || '');
          setEmoji(member.emoji || '');
          setPhotoPath(member.photo_path || '');
          setMeta([
            { label: member.meta_1_label || '', value: member.meta_1_value || '' },
            { label: member.meta_2_label || '', value: member.meta_2_value || '' },
            { label: member.meta_3_label || '', value: member.meta_3_value || '' },
            { label: member.meta_4_label || '', value: member.meta_4_value || '' },
          ]);
          setStory(member.story || '');
          setStory2(member.story2 || '');
          setQuoteText(member.quote_text || '');
          setQuoteCite(member.quote_cite || '');
          setAlbumPhotos([
            { path: member.album_1_path || '', caption: member.album_1_caption || '' },
            { path: member.album_2_path || '', caption: member.album_2_caption || '' },
            { path: member.album_3_path || '', caption: member.album_3_caption || '' },
          ]);
        }
      } catch (err) {
        if (err.status !== 404) {
          setError(err.message || 'Failed to load member.');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [memberKey]);

  function updateMeta(index, field, value) {
    setMeta((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function updateAlbumPhoto(index, field, value) {
    setAlbumPhotos((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await put(`/api/books/mine/family/${memberKey}`, {
        name: name.trim(),
        relation: relation.trim(),
        emoji: emoji.trim(),
        photo_path: photoPath,
        meta_1_label: meta[0].label.trim(),
        meta_1_value: meta[0].value.trim(),
        meta_2_label: meta[1].label.trim(),
        meta_2_value: meta[1].value.trim(),
        meta_3_label: meta[2].label.trim(),
        meta_3_value: meta[2].value.trim(),
        meta_4_label: meta[3].label.trim(),
        meta_4_value: meta[3].value.trim(),
        story: story.trim(),
        story2: story2.trim(),
        quote_text: quoteText.trim(),
        quote_cite: quoteCite.trim(),
        album_1_path: albumPhotos[0].path,
        album_1_caption: albumPhotos[0].caption.trim(),
        album_2_path: albumPhotos[1].path,
        album_2_caption: albumPhotos[1].caption.trim(),
        album_3_path: albumPhotos[2].path,
        album_3_caption: albumPhotos[2].caption.trim(),
      });
      Alert.alert('Saved', 'Family member updated.', [
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
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Basic Info</Text>
          <PhotoPicker currentPhoto={photoPath} onPhotoSelected={setPhotoPath} />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Name</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name" placeholderTextColor={colors.placeholder} />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Relation</Text>
              <TextInput style={styles.input} value={relation} onChangeText={setRelation} placeholder="e.g., Mom" placeholderTextColor={colors.placeholder} />
            </View>
          </View>

          <Text style={styles.label}>Emoji</Text>
          <TextInput style={styles.input} value={emoji} onChangeText={setEmoji} placeholder="e.g., \u{1F469}" placeholderTextColor={colors.placeholder} />
        </View>

        {/* Meta Facts */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Quick Facts</Text>
          {meta.map((m, i) => (
            <View key={i} style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.label}>Label {i + 1}</Text>
                <TextInput style={styles.input} value={m.label} onChangeText={(val) => updateMeta(i, 'label', val)} placeholder="e.g., Birthday" placeholderTextColor={colors.placeholder} />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.label}>Value</Text>
                <TextInput style={styles.input} value={m.value} onChangeText={(val) => updateMeta(i, 'value', val)} placeholder="e.g., March 15" placeholderTextColor={colors.placeholder} />
              </View>
            </View>
          ))}
        </View>

        {/* Stories */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Stories</Text>
          <Text style={styles.label}>Story 1</Text>
          <TextInput style={[styles.input, styles.storyInput]} value={story} onChangeText={setStory} placeholder="Their story..." placeholderTextColor={colors.placeholder} multiline numberOfLines={6} textAlignVertical="top" />
          <Text style={styles.label}>Story 2</Text>
          <TextInput style={[styles.input, styles.storyInput]} value={story2} onChangeText={setStory2} placeholder="Another story..." placeholderTextColor={colors.placeholder} multiline numberOfLines={6} textAlignVertical="top" />
        </View>

        {/* Quote */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Quote</Text>
          <Text style={styles.label}>Quote Text</Text>
          <TextInput style={[styles.input, styles.quoteInput]} value={quoteText} onChangeText={setQuoteText} placeholder="A meaningful quote..." placeholderTextColor={colors.placeholder} multiline numberOfLines={3} textAlignVertical="top" />
          <Text style={styles.label}>Attribution</Text>
          <TextInput style={styles.input} value={quoteCite} onChangeText={setQuoteCite} placeholder="— Who said it" placeholderTextColor={colors.placeholder} />
        </View>

        {/* Album Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Photo Album</Text>
          {albumPhotos.map((photo, i) => (
            <View key={i} style={styles.albumItem}>
              <Text style={styles.label}>Photo {i + 1}</Text>
              <PhotoPicker currentPhoto={photo.path} onPhotoSelected={(path) => updateAlbumPhoto(i, 'path', path)} />
              <Text style={styles.label}>Caption</Text>
              <TextInput style={styles.input} value={photo.caption} onChangeText={(val) => updateAlbumPhoto(i, 'caption', val)} placeholder="Photo caption..." placeholderTextColor={colors.placeholder} />
            </View>
          ))}
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
  errorContainer: { backgroundColor: colors.errorLight, borderRadius: borderRadius.sm, padding: spacing.md, marginBottom: spacing.md },
  errorText: { color: colors.error, fontSize: typography.sizes.sm, textAlign: 'center' },
  section: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg, ...shadows.card },
  sectionHeader: { fontFamily: typography.fontFamily.serif, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.gold, marginBottom: spacing.sm },
  label: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.textPrimary, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, fontSize: typography.sizes.md, color: colors.textPrimary },
  storyInput: { minHeight: 120, paddingTop: spacing.md },
  quoteInput: { minHeight: 80, paddingTop: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  halfField: { flex: 1 },
  albumItem: { marginBottom: spacing.md },
  saveButton: { backgroundColor: colors.gold, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, minHeight: 50, ...shadows.button },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: colors.white, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold },
});
