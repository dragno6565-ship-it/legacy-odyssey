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
import PhotoPicker from '../../components/PhotoPicker';

export default function AlbumHomeScreen({ navigation }) {
  const headerHeight = useHeaderHeight();
  const { showToast, ToastComponent } = useSavedToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [intro, setIntro] = useState('');
  const [theHouse, setTheHouse] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [homesBefore, setHomesBefore] = useState('');
  const [photoPath, setPhotoPath] = useState('');

  useEffect(() => {
    async function fetchAlbum() {
      try {
        const res = await get('/api/album');
        const section = res.data.album?.home || {};
        setIntro(section.intro || '');
        setTheHouse(section.the_house || '');
        setNeighborhood(section.neighborhood || '');
        setHomesBefore(section.homes_before || '');
        setPhotoPath(section.photo_path || '');
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
      await put('/api/album/home', {
        intro,
        the_house: theHouse,
        neighborhood,
        homes_before: homesBefore,
        photo_path: photoPath || null,
      });
      showToast('Home updated.');
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
        <Text style={styles.pageTitle}>Home</Text>
        <Text style={styles.pageSubtitle}>The place your family calls home</Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.label}>Photo</Text>
          <PhotoPicker currentPhoto={photoPath} onPhotoSelected={setPhotoPath} />

          <Text style={styles.label}>Intro</Text>
          <TextInput
            style={[styles.input, styles.textareaSm]}
            value={intro}
            onChangeText={setIntro}
            placeholder="A few words about what home means to your family..."
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <Text style={styles.label}>The House</Text>
          <TextInput
            style={[styles.input, styles.textareaLg]}
            value={theHouse}
            onChangeText={setTheHouse}
            placeholder="Describe the place you call home"
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <Text style={styles.label}>The Neighborhood</Text>
          <TextInput
            style={[styles.input, styles.textareaMd]}
            value={neighborhood}
            onChangeText={setNeighborhood}
            placeholder="What's your corner of the world like?"
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Homes Before</Text>
          <TextInput
            style={[styles.input, styles.textareaMd]}
            value={homesBefore}
            onChangeText={setHomesBefore}
            placeholder="Places you lived before settling here"
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
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  textareaSm: {
    minHeight: 72,
    paddingTop: spacing.md,
  },
  textareaMd: {
    minHeight: 88,
    paddingTop: spacing.md,
  },
  textareaLg: {
    minHeight: 110,
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
