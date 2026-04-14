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

export default function AlbumOurStoryScreen({ navigation }) {
  const headerHeight = useHeaderHeight();
  const { showToast, ToastComponent } = useSavedToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [howWeMet, setHowWeMet] = useState('');
  const [earlyDays, setEarlyDays] = useState('');
  const [whenWeKnew, setWhenWeKnew] = useState('');
  const [buildingFamily, setBuildingFamily] = useState('');
  const [whatMakesUs, setWhatMakesUs] = useState('');
  const [alwaysDo, setAlwaysDo] = useState([]);

  useEffect(() => {
    async function fetchAlbum() {
      try {
        const res = await get('/api/album');
        const album = res.data.album || {};
        const section = album.our_story || {};
        setHowWeMet(section.how_we_met || '');
        setEarlyDays(section.early_days || '');
        setWhenWeKnew(section.when_we_knew || '');
        setBuildingFamily(section.building_family || '');
        setWhatMakesUs(section.what_makes_us || '');
        setAlwaysDo(Array.isArray(section.always_do) ? section.always_do : []);
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

  function updateAlwaysDoItem(index, value) {
    setAlwaysDo((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  }

  function removeAlwaysDoItem(index) {
    setAlwaysDo((prev) => prev.filter((_, i) => i !== index));
  }

  function addAlwaysDoItem() {
    setAlwaysDo((prev) => [...prev, '']);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await put('/api/album/our_story', {
        how_we_met: howWeMet,
        early_days: earlyDays,
        when_we_knew: whenWeKnew,
        building_family: buildingFamily,
        what_makes_us: whatMakesUs,
        always_do: alwaysDo,
      });
      showToast('Our Story updated.');
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
        <Text style={styles.pageTitle}>Our Story</Text>
        <Text style={styles.pageSubtitle}>
          How your family came together
        </Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.label}>How We Met</Text>
          <TextInput
            style={[styles.input, styles.textareaLg]}
            value={howWeMet}
            onChangeText={setHowWeMet}
            placeholder="Tell the story of how you two met..."
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <Text style={styles.label}>The Early Days</Text>
          <TextInput
            style={[styles.input, styles.textareaLg]}
            value={earlyDays}
            onChangeText={setEarlyDays}
            placeholder="What were those first months like?"
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <Text style={styles.label}>When We Knew</Text>
          <TextInput
            style={[styles.input, styles.textareaMd]}
            value={whenWeKnew}
            onChangeText={setWhenWeKnew}
            placeholder="The moment you knew this was forever..."
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Building Our Family</Text>
          <TextInput
            style={[styles.input, styles.textareaLg]}
            value={buildingFamily}
            onChangeText={setBuildingFamily}
            placeholder="How your family has grown and changed..."
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <Text style={styles.label}>What Makes Us Us</Text>
          <TextInput
            style={[styles.input, styles.textareaMd]}
            value={whatMakesUs}
            onChangeText={setWhatMakesUs}
            placeholder="The quirks, values, and spirit that define your family..."
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Things We Always Do</Text>
          {alwaysDo.map((item, index) => (
            <View key={index} style={styles.checklistRow}>
              <TextInput
                style={[styles.input, styles.checklistInput]}
                value={item}
                onChangeText={(val) => updateAlwaysDoItem(index, val)}
                placeholder="e.g., Sunday morning pancakes"
                placeholderTextColor={colors.placeholder}
              />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeAlwaysDoItem(index)}
                activeOpacity={0.7}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={styles.addButton}
            onPress={addAlwaysDoItem}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>+ Add item</Text>
          </TouchableOpacity>
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
  sectionHeading: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.gold,
    marginBottom: spacing.sm,
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
  textareaLg: {
    minHeight: 110,
    paddingTop: spacing.md,
  },
  textareaMd: {
    minHeight: 88,
    paddingTop: spacing.md,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  checklistInput: {
    flex: 1,
    marginRight: spacing.sm,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.round,
    backgroundColor: colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: colors.error,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  addButton: {
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.gold,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
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
