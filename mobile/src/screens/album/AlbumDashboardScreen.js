import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography, shadows, borderRadius } from '../../theme';
import { get } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';

const SECTIONS = [
  { key: 'welcome', title: 'Welcome & Intro', icon: '\u{1F3E0}', screen: 'AlbumWelcome' },
  { key: 'ourStory', title: 'Our Story', icon: '\u{1F4D6}', screen: 'AlbumOurStory' },
  { key: 'roots', title: 'Roots', icon: '\u{1F333}', screen: 'AlbumRoots' },
  { key: 'home', title: 'Home', icon: '\u{1F3E1}', screen: 'AlbumHome' },
  { key: 'years', title: 'Our Years', icon: '\u{1F4C5}', screen: 'AlbumYears' },
  { key: 'family', title: 'Family Members', icon: '\u{1F46A}', screen: 'AlbumFamily' },
  { key: 'adventures', title: 'Adventures', icon: '\u{1F9ED}', screen: 'AlbumAdventures' },
  { key: 'traditions', title: 'Traditions', icon: '\u{1F384}', screen: 'AlbumTraditions' },
  { key: 'letters', title: 'Letters', icon: '\u{1F48C}', screen: 'AlbumLetters' },
  { key: 'recipes', title: 'Recipes', icon: '\u{1F372}', screen: 'AlbumRecipes' },
  { key: 'vault', title: 'The Vault', icon: '\u{1F512}', screen: 'AlbumVault' },
  { key: 'settings', title: 'Settings', icon: '\u2699\uFE0F', screen: 'Settings' },
];

export default function AlbumDashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function fetchAlbum() {
    try {
      setError('');
      const res = await get('/api/album');
      setAlbum(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load album data.');
    }
  }

  useEffect(() => {
    fetchAlbum().finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAlbum();
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await fetchAlbum();
    setRefreshing(false);
  }

  function getFamilyName() {
    if (!album) return '';
    return album.family_name || '';
  }

  function renderSectionCard({ item }) {
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate(item.screen, { album })}
      >
        <Text style={styles.cardIcon}>{item.icon}</Text>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardAction}>Edit</Text>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.loadingText}>Loading your album...</Text>
      </View>
    );
  }

  const familyName = getFamilyName();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleArea}>
            <Text style={styles.headerTitle}>
              {familyName ? `${familyName} Family` : 'Family Album'}
            </Text>
            <Text style={styles.headerSubtitle}>Family Album</Text>
          </View>
          <TouchableOpacity
            style={styles.previewButton}
            onPress={() => navigation.navigate('Preview')}
            activeOpacity={0.7}
          >
            <Text style={styles.previewButtonText}>👁 Preview</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Section Grid */}
      <FlatList
        data={SECTIONS}
        renderItem={renderSectionCard}
        keyExtractor={(item) => item.key}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
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
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.serif,
  },
  header: {
    backgroundColor: colors.dark,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitleArea: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.gold,
  },
  headerSubtitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.md,
    color: colors.goldLight,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(200, 169, 110, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  previewButtonText: {
    color: colors.gold,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  errorContainer: {
    backgroundColor: colors.errorLight,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.sm,
  },
  retryText: {
    color: colors.gold,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.xs,
  },
  grid: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  row: {
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    width: '48%',
    alignItems: 'center',
    ...shadows.card,
  },
  cardIcon: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  cardAction: {
    fontSize: typography.sizes.xs,
    color: colors.gold,
    fontWeight: typography.weights.medium,
  },
});
