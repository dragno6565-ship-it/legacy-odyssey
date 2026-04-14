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
  '👨', '👩', '👦', '👧', '👴', '👵', '👶', '🧑', '🧔', '👱', '🧕', '🧒', '🐶', '🐱', '🐻',
];

export default function AlbumFamilyMemberScreen({ route, navigation }) {
  const headerHeight = useHeaderHeight();
  const { showToast, ToastComponent } = useSavedToast();
  const { memberIndex } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [emoji, setEmoji] = useState('👤');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [meta, setMeta] = useState([]);
  const [story1, setStory1] = useState('');
  const [quote, setQuote] = useState('');
  const [story2, setStory2] = useState('');

  // Full array kept so we can write the whole thing back on save/delete
  const [allMembers, setAllMembers] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await get('/api/album');
        const fetched = res.data.album?.family_members || [];
        setAllMembers(fetched);
        const member = fetched[memberIndex];
        if (member) {
          setEmoji(member.emoji || '👤');
          setName(member.name || '');
          setRole(member.role || '');
          setMeta(Array.isArray(member.meta) ? member.meta.map((m) => ({ key: m.key || '', value: m.value || '' })) : []);
          setStory1(member.story1 || '');
          setQuote(member.quote || '');
          setStory2(member.story2 || '');
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
  }, [memberIndex]);

  function buildMember() {
    return {
      emoji: emoji.trim(),
      name: name.trim(),
      role: role.trim(),
      meta: meta
        .filter((m) => m.key.trim() || m.value.trim())
        .map((m) => ({ key: m.key.trim(), value: m.value.trim() })),
      story1: story1.trim(),
      quote: quote.trim(),
      story2: story2.trim(),
    };
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const updated = [...allMembers];
      updated[memberIndex] = buildMember();
      await put('/api/album/family_members', { family_members: updated });
      showToast('Family member saved.');
      setTimeout(() => navigation.goBack(), 1800);
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    Alert.alert(
      'Remove Member',
      `Remove ${name.trim() || 'this member'} from your family album?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            setError('');
            try {
              const updated = allMembers.filter((_, i) => i !== memberIndex);
              await put('/api/album/family_members', { family_members: updated });
              navigation.goBack();
            } catch (err) {
              setError(err.message || 'Failed to delete. Please try again.');
              setSaving(false);
            }
          },
        },
      ]
    );
  }

  // --- Meta helpers ---
  function addMetaRow() {
    setMeta((prev) => [...prev, { key: '', value: '' }]);
  }

  function updateMeta(index, field, value) {
    setMeta((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function removeMetaRow(index) {
    setMeta((prev) => prev.filter((_, i) => i !== index));
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

        {/* Emoji Picker */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Choose an Emoji</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.emojiRow}
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
        </View>

        {/* Basic Info */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Basic Info</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Full name"
            placeholderTextColor={colors.placeholder}
          />

          <Text style={styles.label}>Role</Text>
          <TextInput
            style={styles.input}
            value={role}
            onChangeText={setRole}
            placeholder="e.g., Dad, Grandma, Uncle"
            placeholderTextColor={colors.placeholder}
          />
        </View>

        {/* Key Details */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Key Details</Text>

          {meta.map((m, i) => (
            <View key={i} style={styles.metaRow}>
              <TextInput
                style={[styles.input, styles.metaKeyInput]}
                value={m.key}
                onChangeText={(val) => updateMeta(i, 'key', val)}
                placeholder="Label"
                placeholderTextColor={colors.placeholder}
              />
              <TextInput
                style={[styles.input, styles.metaValueInput]}
                value={m.value}
                onChangeText={(val) => updateMeta(i, 'value', val)}
                placeholder="Value"
                placeholderTextColor={colors.placeholder}
              />
              <TouchableOpacity
                style={styles.metaRemoveButton}
                onPress={() => removeMetaRow(i)}
                activeOpacity={0.7}
              >
                <Text style={styles.metaRemoveText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={styles.addDetailButton}
            onPress={addMetaRow}
            activeOpacity={0.7}
          >
            <Text style={styles.addDetailText}>+ Add Detail</Text>
          </TouchableOpacity>
        </View>

        {/* Stories & Quote */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>About Them</Text>
          <TextInput
            style={[styles.input, styles.textareaLg]}
            value={story1}
            onChangeText={setStory1}
            placeholder="Tell their story..."
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Their Words</Text>
          <TextInput
            style={styles.input}
            value={quote}
            onChangeText={setQuote}
            placeholder="A favourite quote or saying"
            placeholderTextColor={colors.placeholder}
          />

          <Text style={styles.label}>More Notes</Text>
          <TextInput
            style={[styles.input, styles.textareaMd]}
            value={story2}
            onChangeText={setStory2}
            placeholder="Anything else worth remembering..."
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

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={saving}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteButtonText}>Remove Member</Text>
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
  sectionHeader: {
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
  textareaMd: {
    minHeight: 88,
    paddingTop: spacing.md,
  },
  textareaLg: {
    minHeight: 110,
    paddingTop: spacing.md,
  },
  // Emoji picker
  emojiRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  emojiButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.background,
  },
  emojiButtonSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.card,
  },
  emojiOption: {
    fontSize: 28,
  },
  // Meta / key-value rows
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  metaKeyInput: {
    flex: 2,
  },
  metaValueInput: {
    flex: 3,
  },
  metaRemoveButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.round,
    backgroundColor: colors.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaRemoveText: {
    color: colors.error,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  addDetailButton: {
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gold,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
  },
  addDetailText: {
    color: colors.gold,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  // Buttons
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
  deleteButton: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: colors.error,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
});
