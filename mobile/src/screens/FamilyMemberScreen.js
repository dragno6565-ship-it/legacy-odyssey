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
import { Alert } from 'react-native';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { useHeaderHeight } from '@react-navigation/elements';
import { get, put, del } from '../api/client';
import PhotoPicker from '../components/PhotoPicker';
import VideoBlock from '../components/VideoBlock';
import { useSavedToast } from '../components/SavedToast';
import { useI18n } from '../i18n/I18nContext';

export default function FamilyMemberScreen({ route, navigation }) {
  const { t } = useI18n();
  const headerHeight = useHeaderHeight();
  const { showToast, ToastComponent } = useSavedToast();
  const { memberKey } = route.params;
  const [memberId, setMemberId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
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
          setMemberId(member.id || null);
          setName(member.name || '');
          setRelation(member.relation || '');
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
          setError(err.message || t('app.familymember.error_load'));
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
      showToast(t('app.familymember.toast_saved'));
      setTimeout(() => navigation.goBack(), 1800);
    } catch (err) {
      setError(err.message || t('app.familymember.error_save'));
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
          <Text style={styles.sectionHeader}>{t('app.familymember.section_basic')}</Text>
          <PhotoPicker currentPhoto={photoPath} onPhotoSelected={setPhotoPath} />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>{t('app.familymember.label_name')}</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder={t('app.familymember.placeholder_name')} placeholderTextColor={colors.placeholder} />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>{t('app.familymember.label_relation')}</Text>
              <TextInput style={styles.input} value={relation} onChangeText={setRelation} placeholder={t('app.familymember.placeholder_relation')} placeholderTextColor={colors.placeholder} />
            </View>
          </View>
        </View>

        {/* Meta Facts */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('app.familymember.section_facts')}</Text>
          {meta.map((m, i) => (
            <View key={i} style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.label}>{t('app.familymember.label_fact', { number: i + 1 })}</Text>
                <TextInput style={styles.input} value={m.label} onChangeText={(val) => updateMeta(i, 'label', val)} placeholder={t('app.familymember.placeholder_fact_label')} placeholderTextColor={colors.placeholder} />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.label}>{t('app.familymember.label_value')}</Text>
                <TextInput style={styles.input} value={m.value} onChangeText={(val) => updateMeta(i, 'value', val)} placeholder={t('app.familymember.placeholder_fact_value')} placeholderTextColor={colors.placeholder} />
              </View>
            </View>
          ))}
        </View>

        {/* Stories */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('app.familymember.section_stories')}</Text>
          <Text style={styles.label}>{t('app.familymember.label_story1')}</Text>
          <TextInput style={[styles.input, styles.storyInput]} value={story} onChangeText={setStory} placeholder={t('app.familymember.placeholder_story1')} placeholderTextColor={colors.placeholder} multiline numberOfLines={6} textAlignVertical="top" />
          <Text style={styles.label}>{t('app.familymember.label_story2')}</Text>
          <TextInput style={[styles.input, styles.storyInput]} value={story2} onChangeText={setStory2} placeholder={t('app.familymember.placeholder_story2')} placeholderTextColor={colors.placeholder} multiline numberOfLines={6} textAlignVertical="top" />
        </View>

        {/* Quote */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('app.familymember.section_quote')}</Text>
          <Text style={styles.label}>{t('app.familymember.label_quote_text')}</Text>
          <TextInput style={[styles.input, styles.quoteInput]} value={quoteText} onChangeText={setQuoteText} placeholder={t('app.familymember.placeholder_quote_text')} placeholderTextColor={colors.placeholder} multiline numberOfLines={3} textAlignVertical="top" />
          <Text style={styles.label}>{t('app.familymember.label_attribution')}</Text>
          <TextInput style={styles.input} value={quoteCite} onChangeText={setQuoteCite} placeholder={t('app.familymember.placeholder_attribution')} placeholderTextColor={colors.placeholder} />
        </View>

        {/* Album Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('app.familymember.section_album')}</Text>
          {albumPhotos.map((photo, i) => (
            <View key={i} style={styles.albumItem}>
              <Text style={styles.label}>{t('app.familymember.label_photo', { number: i + 1 })}</Text>
              <PhotoPicker currentPhoto={photo.path} onPhotoSelected={(path) => updateAlbumPhoto(i, 'path', path)} />
              <Text style={styles.label}>{t('app.familymember.label_caption')}</Text>
              <TextInput style={styles.input} value={photo.caption} onChangeText={(val) => updateAlbumPhoto(i, 'caption', val)} placeholder={t('app.familymember.placeholder_caption')} placeholderTextColor={colors.placeholder} />
            </View>
          ))}
        </View>

        {memberId ? (
          <VideoBlock context="family_member" familyMemberId={memberId} single />
        ) : null}

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>{t('app.familymember.save')}</Text>
          )}
        </TouchableOpacity>

        {memberId ? (
          <TouchableOpacity
            style={styles.removeButton}
            activeOpacity={0.7}
            onPress={() => {
              Alert.alert(t('app.familymember.remove_confirm_title'), t('app.familymember.remove_confirm_body', { name: name || t('app.familymember.this_person') }), [
                { text: t('app.familymember.cancel'), style: 'cancel' },
                { text: t('app.familymember.remove'), style: 'destructive', onPress: async () => {
                  try { await del(`/api/books/mine/family/${memberKey}`); navigation.goBack(); }
                  catch (e) { Alert.alert(t('app.familymember.error_title'), t('app.familymember.remove_error')); }
                } },
              ]);
            }}
          >
            <Text style={styles.removeButtonText}>{t('app.familymember.remove_from_family')}</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
      {ToastComponent}
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
  removeButton: { marginTop: spacing.lg, alignItems: 'center' },
  removeButtonText: { color: colors.error, fontSize: typography.sizes.sm, fontWeight: typography.weights.medium },
});
