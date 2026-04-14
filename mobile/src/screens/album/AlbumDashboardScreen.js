import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Modal,
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
  const { user, families, activeFamilyId, switchFamily, refreshFamilies } = useAuth();
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [switching, setSwitching] = useState(false);

  async function fetchAlbum() {
    try {
      setError('');
      const res = await get('/api/album');
      setAlbum(res.data.album || {});
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
    }, [activeFamilyId])
  );

  async function onRefresh() {
    setRefreshing(true);
    await fetchAlbum();
    await refreshFamilies();
    setRefreshing(false);
  }

  async function handleSwitchFamily(familyId) {
    if (familyId === activeFamilyId) {
      setShowSwitcher(false);
      return;
    }
    setSwitching(true);
    try {
      await switchFamily(familyId);
      setShowSwitcher(false);
      setLoading(true);
      await fetchAlbum();
    } catch (err) {
      setError('Failed to switch sites.');
    } finally {
      setSwitching(false);
      setLoading(false);
    }
  }

  function renderSectionCard({ item }) {
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate(item.screen)}
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

  const familyName = album?.family_name || user?.display_name || 'Family Album';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setShowSwitcher(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.switchIcon}>📔</Text>
            <Text style={styles.switchText}>Sites</Text>
          </TouchableOpacity>

          <View style={styles.headerTitleArea}>
            <Text style={styles.headerTitle} numberOfLines={1}>
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

      {/* Family / Site Switcher Modal */}
      <Modal
        visible={showSwitcher}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSwitcher(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Your Sites</Text>
            <Text style={styles.modalSubtitle}>Tap to switch between your sites</Text>

            {switching ? (
              <ActivityIndicator size="large" color={colors.gold} style={{ marginVertical: spacing.lg }} />
            ) : (
              <>
                {families.map((fam) => {
                  const isActive = fam.id === activeFamilyId;
                  return (
                    <TouchableOpacity
                      key={fam.id}
                      style={[styles.familyCard, isActive && styles.familyCardActive]}
                      onPress={() => handleSwitchFamily(fam.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.familyCardContent}>
                        <Text style={[styles.familyCardName, isActive && styles.familyCardNameActive]}>
                          {fam.display_name || fam.subdomain}
                        </Text>
                        <Text style={styles.familyCardDomain}>
                          {fam.custom_domain || `${fam.subdomain}.legacyodyssey.com`}
                        </Text>
                      </View>
                      {isActive && <Text style={styles.activeIndicator}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={styles.newWebsiteBtn}
                  onPress={() => {
                    setShowSwitcher(false);
                    navigation.navigate('NewWebsite');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.newWebsiteIcon}>+</Text>
                  <Text style={styles.newWebsiteText}>Add Another Site</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowSwitcher(false)}
            >
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
  },
  headerTitleArea: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.gold,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.sm,
    color: colors.goldLight,
    marginTop: 2,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(200, 169, 110, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gold,
    gap: spacing.xs,
  },
  switchIcon: {
    fontSize: 14,
  },
  switchText: {
    color: colors.gold,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '70%',
  },
  modalTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  familyCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.card,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  familyCardActive: {
    borderColor: colors.gold,
    backgroundColor: '#faf7f2',
  },
  familyCardContent: {
    flex: 1,
  },
  familyCardName: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  familyCardNameActive: {
    color: colors.gold,
  },
  familyCardDomain: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  activeIndicator: {
    fontSize: 20,
    color: colors.gold,
    fontWeight: typography.weights.bold,
    marginLeft: spacing.sm,
  },
  newWebsiteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
    ...shadows.card,
  },
  newWebsiteIcon: {
    fontSize: 16,
    color: colors.dark,
    fontWeight: typography.weights.bold,
  },
  newWebsiteText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.dark,
  },
  modalCloseBtn: {
    marginTop: spacing.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  modalCloseBtnText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});
