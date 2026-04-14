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
import { colors, spacing, typography, shadows, borderRadius } from '../../theme';
import { useHeaderHeight } from '@react-navigation/elements';
import { get, put } from '../../api/client';
import { useSavedToast } from '../../components/SavedToast';

const EMOJI_OPTIONS = [
  '✈️', '🏖️', '🏔️', '🌊', '🗺️', '🏕️', '🎡', '🚗', '🚢', '🏛️', '🌴', '🌍', '🎿', '⛷️', '🤿',
];

export default function AlbumAdventureDetailScreen({ navigation, route }) {
  const headerHeight = useHeaderHeight();
  const { showToast, ToastComponent } = useSavedToast();
  const { adventureIndex } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  // Full adventures array fetched from server — used for PUT
  const [allAdventures, setAllAdventures] = useState([]);

  // Individual field state
  const [emoji, setEmoji] = useState('✈️');
  const [title, setTitle] = useState('');
  const [dest, setDest] = useState('');
  const [year, setYear] = useState('');
  const [tagline, setTagline] = useState('');
  const [story, setStory] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await get('/api/album');
        const fetchedAdventures = res.data.album?.adventures || [];
        setAllAdventures(fetchedAdventures);
        const entry = fetchedAdventures[adventureIndex] || {};
        setEmoji(entry.emoji || '✈️');
        setTitle(entry.title || '');
        setDest(entry.dest || '');
        setYear(entry.year || '');
        setTagline(entry.tagline || '');
        setStory(entry.story || '');
      } catch (err) {
        if (err.status !== 404) {
          setError(err.message || 'Failed to load adventure data.');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [adventureIndex]);

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const updatedEntry = {
        emoji,
        title: title.trim(),
        dest: dest.trim(),
        year: year.trim(),
        tagline: tagline.trim(),
        story: story.trim(),
      };
      const updatedAdventures = [...allAdventures];
      updatedAdventures[adventureIndex] = updatedEntry;
      await put('/api/album/adventures', { adventures: updatedAdventures });
      showToast('Adventure saved.');
      setTimeout(() => navigation.goBack(), 1800);
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Delete This Adventure?',
      title
        ? `Are you sure you want to delete "${title}"? This cannot be undone.`
        : 'Are you sure you want to delete this adventure? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: handleDelete,
        },
      ]
    );
  }

  async function handleDelete() {
    setDeleting(true);
    setError('');
    try {
      const updatedAdventures = allAdventures.filter((_, i) => i !== adventureIndex);
      await put('/api/album/adventures', { adventures: updatedAdventures });
      navigation.goBack();
    } catch (err) {
      setError(err.message || 'Failed to delete. Please try again.');
      setDeleting(false);
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
        <Text style={styles.pageTitle}>{title || 'Adventure Details'}</Text>
        <Text style={styles.pageSubtitle}>Edit the details for this adventure</Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          {/* Emoji Picker */}
          <Text style={styles.label}>Emoji</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.emojiRow}
            keyboardShouldPersistTaps="handled"
          >
            {EMOJI_OPTIONS.map((e) => (
              <TouchableOpacity
                key={e}
                style={[styles.emojiButton, emoji === e && styles.emojiButtonSelected]}
                onPress={() => setEmoji(e)}
                activeOpacity={0.7}
              >
                <Text style={styles.emojiOption}>{e}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Title */}
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Costa Rica 2022"
            placeholderTextColor={colors.placeholder}
          />

          {/* Destination */}
          <Text style={styles.label}>Destination</Text>
          <TextInput
            style={styles.input}
            value={dest}
            onChangeText={setDest}
            placeholder="e.g. Costa Rica"
            placeholderTextColor={colors.placeholder}
          />

          {/* Year */}
          <Text style={styles.label}>Year</Text>
          <TextInput
            style={styles.input}
            value={year}
            onChangeText={setYear}
            placeholder="e.g. 2022"
            placeholderTextColor={colors.placeholder}
            keyboardType="numeric"
            maxLength={4}
          />

          {/* Tagline */}
          <Text style={styles.label}>Tagline</Text>
          <TextInput
            style={styles.input}
            value={tagline}
            onChangeText={setTagline}
            placeholder="A short phrase that captures it"
            placeholderTextColor={colors.placeholder}
          />

          {/* Story */}
          <Text style={styles.label}>The Story</Text>
          <TextInput
            style={[styles.input, styles.storyInput]}
            value={story}
            onChangeText={setStory}
            placeholder="Write about this adventure — what you did, how it felt, what you'll never forget..."
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving || deleting}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
          onPress={confirmDelete}
          disabled={saving || deleting}
          activeOpacity={0.8}
        >
          {deleting ? (
            <ActivityIndicator color={colors.error} />
          ) : (
            <Text style={styles.deleteButtonText}>Delete This Adventure</Text>
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
  emojiRow: {
    flexDirection: 'row',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  emojiButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  emojiButtonSelected: {
    borderColor: colors.gold,
  },
  emojiOption: {
    fontSize: 24,
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
  storyInput: {
    minHeight: 160,
    paddingTop: spacing.md,
  },
  saveButton: {
    backgroundColor: colors.gold,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
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
  deleteButton: {
    borderWidth: 1.5,
    borderColor: colors.error,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    backgroundColor: 'transparent',
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    color: colors.error,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});
