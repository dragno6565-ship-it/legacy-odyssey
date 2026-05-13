import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { get, post, BASE_URL } from '../api/client';

/**
 * List every keepsake. Tap one to edit; use the "Add" row to create.
 * Uses per-item CRUD endpoints exclusively.
 */
export default function KeepsakesScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [keepsakes, setKeepsakes] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchKeepsakes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get('/api/books/mine/keepsakes');
      setKeepsakes(Array.isArray(res.data) ? res.data : []);
    } catch (_) {
      setKeepsakes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchKeepsakes();
    }, [fetchKeepsakes])
  );

  async function handleAdd() {
    const title = newTitle.trim();
    if (!title) return;
    setAdding(true);
    try {
      const res = await post('/api/books/mine/keepsakes', { title });
      setNewTitle('');
      navigation.navigate('KeepsakeDetail', { keepsakeId: res.data.id, title });
    } catch (err) {
      Alert.alert('Could not add keepsake', err.message || 'Please try again.');
    } finally {
      setAdding(false);
    }
  }

  function photoUri(path) {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${BASE_URL}/${path.replace(/^\//, '')}`;
  }

  function categoryLabel(c) {
    const map = { artwork: 'Artwork', schoolwork: 'Schoolwork', award: 'Award', memorabilia: 'Memorabilia' };
    if (!c) return null;
    return map[c] || (c.charAt(0).toUpperCase() + c.slice(1));
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>Their Keepsakes</Text>
      <Text style={styles.pageSubtitle}>
        Photos of drawings, awards, certificates, handprints — the small treasures you can't keep forever.
      </Text>

      {keepsakes.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No keepsakes yet. Add your first one below.</Text>
        </View>
      )}

      {keepsakes.map((k) => {
        const uri = photoUri(k.cover_photo);
        const title = k.title && k.title !== '(untitled)' ? k.title : 'Untitled';
        const cat = categoryLabel(k.category);
        return (
          <TouchableOpacity
            key={k.id}
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('KeepsakeDetail', { keepsakeId: k.id, title })}
          >
            <View style={styles.thumb}>
              {uri ? (
                <Image source={{ uri }} style={styles.thumbImg} />
              ) : (
                <Text style={styles.thumbEmpty}>📂</Text>
              )}
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle} numberOfLines={1}>{title}</Text>
              {(cat || k.age_text) ? (
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {cat ? cat : ''}
                  {cat && k.age_text ? ' · ' : ''}
                  {k.age_text || ''}
                </Text>
              ) : null}
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        );
      })}

      <View style={styles.addCard}>
        <Text style={styles.addCardTitle}>Add a keepsake</Text>
        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            value={newTitle}
            onChangeText={setNewTitle}
            placeholder="e.g. First finger painting"
            placeholderTextColor={colors.placeholder}
            returnKeyType="done"
            onSubmitEditing={handleAdd}
          />
          <TouchableOpacity
            style={[styles.addButton, (!newTitle.trim() || adding) && styles.addButtonDisabled]}
            onPress={handleAdd}
            disabled={!newTitle.trim() || adding}
            activeOpacity={0.8}
          >
            {adding ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.addButtonText}>+ Add</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, paddingBottom: 150 },
  pageTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  pageSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    fontStyle: 'italic',
  },
  emptyState: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  emptyStateText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  row: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.card,
  },
  thumb: {
    width: 56, height: 56, borderRadius: borderRadius.sm,
    backgroundColor: colors.card, marginRight: spacing.md,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  thumbEmpty: { fontSize: 24, color: colors.gold },
  rowInfo: { flex: 1, minWidth: 0 },
  rowTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  rowMeta: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chevron: { fontSize: 24, color: colors.gold, marginLeft: spacing.sm },
  addCard: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: colors.gold,
    borderRadius: borderRadius.lg, padding: spacing.lg,
    marginTop: spacing.md, backgroundColor: colors.white,
  },
  addCardTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.gold,
    marginBottom: spacing.sm,
  },
  addRow: { flexDirection: 'row', gap: spacing.sm },
  addInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    fontSize: typography.sizes.md, color: colors.textPrimary,
  },
  addButton: {
    backgroundColor: colors.gold, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    alignItems: 'center', justifyContent: 'center', minWidth: 80,
  },
  addButtonDisabled: { opacity: 0.5 },
  addButtonText: {
    color: colors.white, fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});
