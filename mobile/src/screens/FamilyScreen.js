import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { User } from 'lucide-react-native';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { get } from '../api/client';
import { BASE_URL } from '../api/client';
import { useI18n } from '../i18n/I18nContext';

function getPhotoUri(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}/${path.replace(/^\//, '')}`;
}

export default function FamilyScreen({ navigation }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');

  async function fetchMembers() {
    try {
      setError('');
      const res = await get('/api/books/mine/family');
      setMembers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      if (err.status !== 404) {
        setError(err.message || t('app.family.error_load'));
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

  function renderMember({ item }) {
    const photoUri = getPhotoUri(item.photo_path);
    return (
      <TouchableOpacity
        style={styles.memberCard}
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate('FamilyMember', {
            memberKey: item.member_key,
            memberName: item.name || item.member_key,
          })
        }
      >
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.memberPhoto} />
        ) : (
          <View style={styles.memberPhotoPlaceholder}>
            <User size={32} color={colors.gold} strokeWidth={1.5} />
          </View>
        )}
        <Text style={styles.memberName} numberOfLines={1}>
          {item.name || item.member_key}
        </Text>
        <Text style={styles.memberRelation} numberOfLines={1}>
          {item.relation || t('app.family.default_relation')}
        </Text>
      </TouchableOpacity>
    );
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
      <View style={styles.header}>
        <Text style={styles.pageTitle}>{t('app.family.page_title')}</Text>
        <Text style={styles.pageSubtitle}>{t('app.family.page_subtitle')}</Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={members}
        renderItem={renderMember}
        keyExtractor={(item) => item.member_key || item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t('app.family.empty')}</Text>
        }
        ListFooterComponent={
          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.7}
            onPress={() => {
              const newKey = `member_${Date.now()}`;
              navigation.navigate('FamilyMember', {
                memberKey: newKey,
                memberName: t('app.family.new_member_name'),
                isNew: true,
              });
            }}
          >
            <Text style={styles.addButtonIcon}>+</Text>
            <Text style={styles.addButtonText}>{t('app.family.add_member')}</Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  pageTitle: { fontFamily: typography.fontFamily.serif, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.textPrimary },
  pageSubtitle: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginBottom: spacing.md, fontStyle: 'italic' },
  errorContainer: { backgroundColor: colors.errorLight, margin: spacing.md, borderRadius: borderRadius.sm, padding: spacing.md },
  errorText: { color: colors.error, fontSize: typography.sizes.sm, textAlign: 'center' },
  grid: { padding: spacing.md, paddingBottom: spacing.xxl },
  row: { justifyContent: 'space-between' },
  memberCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, width: '48%', alignItems: 'center', ...shadows.card },
  memberPhoto: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.card, marginBottom: spacing.sm },
  memberPhotoPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  emptyText: { fontSize: typography.sizes.sm, color: colors.textSecondary, textAlign: 'center', marginVertical: spacing.lg, paddingHorizontal: spacing.lg },
  memberName: { fontFamily: typography.fontFamily.serif, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.textPrimary, textAlign: 'center' },
  memberRelation: { fontSize: typography.sizes.xs, color: colors.textSecondary, marginTop: 2 },
  addButton: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.xl, width: '100%', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.gold, borderStyle: 'dashed', minHeight: 100, ...shadows.card },
  addButtonIcon: { fontSize: 32, color: colors.gold, marginBottom: spacing.xs },
  addButtonText: { fontFamily: typography.fontFamily.serif, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.gold },
});
