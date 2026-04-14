import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography, shadows, borderRadius } from '../../theme';
import { get } from '../../api/client';

export default function AlbumFamilyScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');

  async function fetchMembers() {
    try {
      setError('');
      const res = await get('/api/album');
      setMembers(res.data.album?.family_members || []);
    } catch (err) {
      if (err.status !== 404) {
        setError(err.message || 'Failed to load family members.');
      }
    }
  }

  useEffect(() => {
    fetchMembers().finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMembers();
    }, [])
  );

  function handleAddMember() {
    const newMember = { emoji: '👤', name: '', role: '', meta: [], story1: '', quote: '', story2: '' };
    const newIndex = members.length;
    setMembers((prev) => [...prev, newMember]);
    navigation.navigate('AlbumFamilyMember', { memberIndex: newIndex });
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Family Members</Text>
        <Text style={styles.pageSubtitle}>The people who make your family</Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {members.length === 0 && !error ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No family members yet. Add one below!</Text>
          </View>
        ) : null}

        {members.map((member, index) => (
          <TouchableOpacity
            key={index}
            style={styles.memberCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('AlbumFamilyMember', { memberIndex: index })}
          >
            <Text style={styles.memberEmoji}>{member.emoji || '👤'}</Text>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName} numberOfLines={1}>
                {member.name || 'Unnamed Member'}
              </Text>
              <Text style={styles.memberRole} numberOfLines={1}>
                {member.role || '—'}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.7}
          onPress={handleAddMember}
        >
          <Text style={styles.addButtonIcon}>+</Text>
          <Text style={styles.addButtonText}>Add Family Member</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
  emptyContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    alignItems: 'center',
    ...shadows.card,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  memberCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.card,
  },
  memberEmoji: {
    fontSize: 40,
    marginRight: spacing.md,
    width: 52,
    textAlign: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.gold,
  },
  memberRole: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  addButton: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.gold,
    borderStyle: 'dashed',
    minHeight: 80,
    ...shadows.card,
  },
  addButtonIcon: {
    fontSize: 28,
    color: colors.gold,
    marginBottom: spacing.xs,
  },
  addButtonText: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.gold,
  },
});
