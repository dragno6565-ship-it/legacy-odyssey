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
import { colors, spacing, typography, shadows, borderRadius } from '../../theme';
import { useHeaderHeight } from '@react-navigation/elements';
import { get, put } from '../../api/client';
import { useSavedToast } from '../../components/SavedToast';

export default function AlbumRootsScreen({ navigation }) {
  const headerHeight = useHeaderHeight();
  const { showToast, ToastComponent } = useSavedToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [intro, setIntro] = useState('');
  const [momsSideTitle, setMomsSideTitle] = useState('');
  const [momsSide, setMomsSide] = useState('');
  const [dadsSideTitle, setDadsSideTitle] = useState('');
  const [dadsSide, setDadsSide] = useState('');
  const [passingDown, setPassingDown] = useState('');

  useEffect(() => {
    async function fetchAlbum() {
      try {
        const res = await get('/api/album');
        const album = res.data.album || {};
        const section = album.roots || {};
        setIntro(section.intro || '');
        setMomsSideTitle(section.moms_side_title || '');
        setMomsSide(section.moms_side || '');
        setDadsSideTitle(section.dads_side_title || '');
        setDadsSide(section.dads_side || '');
        setPassingDown(section.passing_down || '');
      } catch (err) {
        if (err.status !== 404) {
          setError(err.message || 'Failed to load album data.');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchAlbum();
  }, []);

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await put('/api/album/roots', {
        intro,
        moms_side_title: momsSideTitle,
        moms_side: momsSide,
        dads_side_title: dadsSideTitle,
        dads_side: dadsSide,
        passing_down: passingDown,
      });
      showToast('Roots section updated.');
      setTimeout(() => navigation.goBack(), 1800);
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.');
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
        <Text style={styles.pageTitle}>Roots</Text>
        <Text style={styles.pageSubtitle}>
          Where your family comes from
        </Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.label}>Intro</Text>
          <TextInput
            style={[styles.input, styles.textareaMd]}
            value={intro}
            onChangeText={setIntro}
            placeholder="An opening about your family's heritage and where you come from..."
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Mom's Side Title</Text>
          <TextInput
            style={styles.input}
            value={momsSideTitle}
            onChangeText={setMomsSideTitle}
            placeholder="e.g. The Ragno Side"
            placeholderTextColor={colors.placeholder}
          />

          <Text style={styles.label}>Mom's Side Story</Text>
          <TextInput
            style={[styles.input, styles.textareaLg]}
            value={momsSide}
            onChangeText={setMomsSide}
            placeholder="Tell the story of mom's family history..."
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Dad's Side Title</Text>
          <TextInput
            style={styles.input}
            value={dadsSideTitle}
            onChangeText={setDadsSideTitle}
            placeholder="e.g. The Johnson Side"
            placeholderTextColor={colors.placeholder}
          />

          <Text style={styles.label}>Dad's Side Story</Text>
          <TextInput
            style={[styles.input, styles.textareaLg]}
            value={dadsSide}
            onChangeText={setDadsSide}
            placeholder="Tell the story of dad's family history..."
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Passing It Down</Text>
          <Text style={styles.hint}>What are you passing to the next generation?</Text>
          <TextInput
            style={[styles.input, styles.textareaMd]}
            value={passingDown}
            onChangeText={setPassingDown}
            placeholder="The traditions, values, and stories you want to carry forward..."
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
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
  pageTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  pageSubtitle: {
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
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  hint: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  textareaLg: {
    minHeight: 110,
    paddingTop: spacing.md,
  },
  textareaMd: {
    minHeight: 88,
    paddingTop: spacing.md,
  },
  saveButton: {
    backgroundColor: colors.gold,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
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
