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
import { get, post } from '../api/client';
import PhotoPicker from '../components/PhotoPicker';

const ITEM_TYPES = ['letter', 'photo', 'memory', 'message'];

export default function VaultScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);

  // New item form
  const [itemType, setItemType] = useState('letter');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [photoPath, setPhotoPath] = useState('');
  const [sealedBy, setSealedBy] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await get('/api/books/mine/vault');
        setItems(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (err.status !== 404) {
          setError(err.message || 'Failed to load vault.');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function handleAddItem() {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a title for this vault item.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await post('/api/books/mine/vault', {
        item_type: itemType,
        title: title.trim(),
        body: body.trim(),
        photo_path: photoPath,
        sealed_by: sealedBy.trim(),
      });
      setItems((prev) => [...prev, res.data]);
      // Reset form
      setTitle('');
      setBody('');
      setPhotoPath('');
      setSealedBy('');
      Alert.alert('Sealed', 'Item added to the vault.');
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
        <Text style={styles.pageTitle}>{'\u{1F512}'} The Legacy Vault</Text>
        <Text style={styles.pageSubtitle}>
          Sealed until their 18th birthday. Add letters, photos, and memories
          that will wait for the day they're ready.
        </Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Existing items */}
        {items.length > 0 && (
          <View style={styles.existingSection}>
            <Text style={styles.sectionHeader}>
              Sealed Items ({items.length})
            </Text>
            {items.map((item, index) => (
              <View key={item.id || index} style={styles.sealedItem}>
                <Text style={styles.sealedIcon}>{'\u{1F512}'}</Text>
                <View style={styles.sealedInfo}>
                  <Text style={styles.sealedTitle}>{item.title}</Text>
                  <Text style={styles.sealedMeta}>
                    {item.item_type} {item.sealed_by ? `\u2022 by ${item.sealed_by}` : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Add new item form */}
        <View style={styles.formSection}>
          <Text style={styles.sectionHeader}>Add New Vault Item</Text>

          <Text style={styles.label}>Type</Text>
          <View style={styles.typeRow}>
            {ITEM_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.typeBtn, itemType === type && styles.typeBtnActive]}
                onPress={() => setItemType(type)}
              >
                <Text
                  style={[
                    styles.typeBtnText,
                    itemType === type && styles.typeBtnTextActive,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., A Letter for Your 18th Birthday"
            placeholderTextColor={colors.placeholder}
          />

          <Text style={styles.label}>Content</Text>
          <TextInput
            style={[styles.input, styles.bodyInput]}
            value={body}
            onChangeText={setBody}
            placeholder="Write your message..."
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />

          {(itemType === 'photo' || itemType === 'memory') && (
            <>
              <Text style={styles.label}>Photo</Text>
              <PhotoPicker currentPhoto={photoPath} onPhotoSelected={setPhotoPath} />
            </>
          )}

          <Text style={styles.label}>Sealed By</Text>
          <TextInput
            style={styles.input}
            value={sealedBy}
            onChangeText={setSealedBy}
            placeholder="e.g., Mom & Dad"
            placeholderTextColor={colors.placeholder}
          />

          <TouchableOpacity
            style={[styles.sealButton, saving && styles.sealButtonDisabled]}
            onPress={handleAddItem}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.sealButtonText}>{'\u{1F512}'} Seal in Vault</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, paddingBottom: 150 },
  pageTitle: { fontFamily: typography.fontFamily.serif, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.textPrimary },
  pageSubtitle: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 20 },
  errorContainer: { backgroundColor: colors.errorLight, borderRadius: borderRadius.sm, padding: spacing.md, marginBottom: spacing.md },
  errorText: { color: colors.error, fontSize: typography.sizes.sm, textAlign: 'center' },
  existingSection: { marginBottom: spacing.lg },
  sectionHeader: { fontFamily: typography.fontFamily.serif, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.gold, marginBottom: spacing.md },
  sealedItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadows.card },
  sealedIcon: { fontSize: 20, marginRight: spacing.sm },
  sealedInfo: { flex: 1 },
  sealedTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.textPrimary },
  sealedMeta: { fontSize: typography.sizes.xs, color: colors.textSecondary, marginTop: 2 },
  formSection: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, ...shadows.card },
  label: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.textPrimary, marginBottom: spacing.xs, marginTop: spacing.md },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, fontSize: typography.sizes.md, color: colors.textPrimary },
  bodyInput: { minHeight: 160, paddingTop: spacing.md },
  typeRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  typeBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.round, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  typeBtnActive: { borderColor: colors.gold, backgroundColor: colors.gold },
  typeBtnText: { fontSize: typography.sizes.sm, color: colors.textSecondary },
  typeBtnTextActive: { color: colors.white, fontWeight: typography.weights.semibold },
  sealButton: { backgroundColor: colors.dark, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xl, minHeight: 50, ...shadows.button },
  sealButtonDisabled: { opacity: 0.7 },
  sealButtonText: { color: colors.gold, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold },
});
