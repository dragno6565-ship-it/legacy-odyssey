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
  Alert,
  Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { get } from '../api/client';
import { useAuth } from '../auth/AuthContext';

const FREE_SECTIONS = new Set(['childInfo', 'before', 'birth', 'manageSections', 'settings']);

const SECTIONS = [
  { key: 'childInfo', title: 'Welcome / Child Info', icon: '\u{1F476}', screen: 'ChildInfo' },
  { key: 'before', title: 'Before You Arrived', icon: '\u{1F31F}', screen: 'BeforeArrived' },
  { key: 'birth', title: 'Birth Story', icon: '\u{1F382}', screen: 'BirthStory' },
  { key: 'comingHome', title: 'Coming Home', icon: '\u{1F3E0}', screen: 'ComingHome' },
  { key: 'months', title: 'Month by Month', icon: '\u{1F4C5}', screen: 'Months' },
  { key: 'family', title: 'Our Family', icon: '\u{1F46A}', screen: 'OurFamily' },
  { key: 'firsts', title: 'Your Firsts', icon: '\u{2B50}', screen: 'YourFirsts' },
  { key: 'celebrations', title: 'Celebrations', icon: '\u{1F389}', screen: 'Celebrations' },
  { key: 'letters', title: 'Letters to You', icon: '\u{1F48C}', screen: 'Letters' },
  { key: 'recipes', title: 'Family Recipes', icon: '\u{1F373}', screen: 'FamilyRecipes' },
  { key: 'vault', title: 'The Vault', icon: '\u{1F512}', screen: 'TheVault' },
  { key: 'manageSections', title: 'Website Sections', icon: '\u{1F310}', screen: 'ManageSections' },
  { key: 'settings', title: 'Settings', icon: '\u{2699}\u{FE0F}', screen: 'Settings' },
];

export default function DashboardScreen({ navigation }) {
  const { user, families, activeFamilyId, switchFamily, refreshFamilies } = useAuth();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [switching, setSwitching] = useState(false);

  // Determine if current active family is on free plan
  const activeFamily = families.find(f => f.id === activeFamilyId);
  const isFree = activeFamily ? (activeFamily.plan !== 'paid' && activeFamily.subscription_status !== 'active') : false;

  async function fetchBook() {
    try {
      setError('');
      const res = await get('/api/books/mine');
      setBook(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load book data.');
    }
  }

  // Fetch on mount
  useEffect(() => {
    fetchBook().finally(() => setLoading(false));
  }, []);

  // Refetch on focus (returning from an editor) or when active family changes
  useFocusEffect(
    useCallback(() => {
      fetchBook();
    }, [activeFamilyId])
  );

  async function onRefresh() {
    setRefreshing(true);
    await fetchBook();
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
      // Refetch book for the new family
      setLoading(true);
      await fetchBook();
    } catch (err) {
      setError('Failed to switch books.');
    } finally {
      setSwitching(false);
      setLoading(false);
    }
  }

  function showUpgradePrompt(sectionTitle) {
    Alert.alert(
      '✨ Upgrade to Unlock',
      `${sectionTitle} is available on the paid plan.\n\nUpgrade starting at $4.99/month to unlock all sections, add unlimited photos, and get your own custom domain.`,
      [
        { text: 'Not Now', style: 'cancel' },
        {
          text: 'Upgrade Now',
          onPress: () => Linking.openURL('https://legacyodyssey.com/#pricing'),
        },
      ]
    );
  }

  function getChildName() {
    if (!book) return '';
    const child = book.child || book.childInfo || {};
    const first = child.first_name || child.firstName || '';
    const last = child.last_name || child.lastName || '';
    if (first || last) return `${first} ${last}`.trim();
    return '';
  }

  function getBookDomain() {
    if (user?.custom_domain) return user.custom_domain;
    if (user?.subdomain) return `${user.subdomain}.legacyodyssey.com`;
    return '';
  }

  function renderSectionCard({ item }) {
    const isLocked = isFree && !FREE_SECTIONS.has(item.key);
    return (
      <TouchableOpacity
        style={[styles.card, isLocked && styles.cardLocked]}
        activeOpacity={0.7}
        onPress={() => {
          if (isLocked) {
            showUpgradePrompt(item.title);
          } else {
            navigation.navigate(item.screen, { book });
          }
        }}
      >
        <Text style={styles.cardIcon}>{isLocked ? '🔒' : item.icon}</Text>
        <Text style={[styles.cardTitle, isLocked && styles.cardTitleLocked]}>{item.title}</Text>
        <Text style={[styles.cardAction, isLocked && styles.cardActionLocked]}>
          {isLocked ? 'Upgrade' : 'Edit'}
        </Text>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.loadingText}>Loading your book...</Text>
      </View>
    );
  }

  const childName = getChildName();
  const domain = getBookDomain();
  const hasMultipleBooks = families.length > 1;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleArea}>
            <Text style={styles.headerTitle}>Legacy Odyssey</Text>
            {childName ? (
              <Text style={styles.headerSubtitle}>{childName}'s Book</Text>
            ) : (
              <Text style={styles.headerSubtitle}>Your Family's Story</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setShowSwitcher(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.switchIcon}>{'\u{1F4DA}'}</Text>
            <Text style={styles.switchText}>{hasMultipleBooks ? 'Switch' : 'Sites'}</Text>
          </TouchableOpacity>
        </View>
        {domain ? (
          <Text style={styles.headerDomain}>{domain}</Text>
        ) : null}
        {isFree ? (
          <TouchableOpacity
            style={styles.upgradeBar}
            onPress={() => Linking.openURL('https://legacyodyssey.com/#pricing')}
            activeOpacity={0.8}
          >
            <Text style={styles.upgradeBarText}>✨ Free Plan — Tap to upgrade for full access</Text>
          </TouchableOpacity>
        ) : null}
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

      {/* Book Switcher Modal */}
      <Modal
        visible={showSwitcher}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSwitcher(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Your Books</Text>
            <Text style={styles.modalSubtitle}>
              Select a book to edit
            </Text>

            {families.map((fam) => {
              const isActive = fam.id === activeFamilyId;
              const label = fam.childName || fam.display_name || fam.subdomain || 'Untitled';
              const domainLabel = fam.custom_domain
                ? fam.custom_domain
                : fam.subdomain
                  ? `${fam.subdomain}.legacyodyssey.com`
                  : '';

              return (
                <TouchableOpacity
                  key={fam.id}
                  style={[styles.familyCard, isActive && styles.familyCardActive]}
                  onPress={() => handleSwitchFamily(fam.id)}
                  disabled={switching}
                  activeOpacity={0.7}
                >
                  <View style={styles.familyCardContent}>
                    <Text style={[styles.familyCardName, isActive && styles.familyCardNameActive]}>
                      {label}
                    </Text>
                    <Text style={styles.familyCardDomain}>{domainLabel}</Text>
                  </View>
                  {isActive && (
                    <Text style={styles.activeIndicator}>{'\u2713'}</Text>
                  )}
                  {switching && !isActive && (
                    <ActivityIndicator size="small" color={colors.gold} />
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.newWebsiteBtn}
              onPress={() => {
                setShowSwitcher(false);
                navigation.navigate('NewWebsite');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.newWebsiteIcon}>{'\u2795'}</Text>
              <Text style={styles.newWebsiteText}>New Website</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowSwitcher(false)}
              activeOpacity={0.8}
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
  headerDomain: {
    fontSize: typography.sizes.xs,
    color: colors.goldLight,
    marginTop: spacing.sm,
    opacity: 0.7,
  },
  upgradeBar: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(200, 169, 110, 0.15)',
    borderColor: colors.gold,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  upgradeBarText: {
    color: colors.gold,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
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
    fontSize: 16,
  },
  switchText: {
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
  cardLocked: {
    backgroundColor: '#f5f0e8',
    opacity: 0.75,
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
  cardTitleLocked: {
    color: colors.textSecondary,
  },
  cardAction: {
    fontSize: typography.sizes.xs,
    color: colors.gold,
    fontWeight: typography.weights.medium,
  },
  cardActionLocked: {
    color: '#b08e4a',
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
