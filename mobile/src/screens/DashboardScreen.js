import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
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
// Lucide line-art icons replace emoji (v1.0.7 brand-consistency pass).
// Each section's `icon` field is now a React component reference rendered
// at size=22, color=#c8a96e, strokeWidth=1.5 — see card render below.
import {
  Sparkles,
  Heart,
  BookOpen,
  Camera,
  Video,
  Images,
  Compass,
  Home,
  Calendar,
  Users,
  Star,
  Gift,
  Mail,
  UtensilsCrossed,
  Archive,
  Lock,
  Globe,
  Image as ImageIcon,
  LifeBuoy,
  Share2,
  Settings as SettingsIcon,
} from 'lucide-react-native';

const FREE_SECTIONS = new Set(['childInfo', 'before', 'birth', 'birthday', 'moments', 'galleries', 'journey', 'manageSections', 'help', 'settings']);

const SECTIONS = [
  { key: 'childInfo',      title: 'Welcome / Child Info', icon: Sparkles,        screen: 'ChildInfo' },
  { key: 'before',         title: 'Before You Arrived',   icon: Heart,           screen: 'BeforeArrived' },
  { key: 'birth',          title: 'Birth Story',          icon: BookOpen,        screen: 'BirthStory' },
  { key: 'birthday',       title: 'Your Birth Day',       icon: Camera,          screen: 'BirthDay' },
  { key: 'moments',        title: 'Video Moments',        icon: Video,           screen: 'Moments' },
  { key: 'galleries',      title: 'Custom Galleries',     icon: Images,          screen: 'Galleries' },
  { key: 'journey',        title: 'Your Journey to Us',   icon: Compass,         screen: 'Journey' },
  { key: 'comingHome',     title: 'Coming Home',          icon: Home,            screen: 'ComingHome' },
  { key: 'months',         title: 'Month by Month',       icon: Calendar,        screen: 'Months' },
  { key: 'family',         title: 'Our Family',           icon: Users,           screen: 'OurFamily' },
  { key: 'firsts',         title: 'Your Firsts',          icon: Star,            screen: 'YourFirsts' },
  { key: 'celebrations',   title: 'Celebrations',         icon: Gift,            screen: 'Celebrations' },
  { key: 'letters',        title: 'Letters to You',       icon: Mail,            screen: 'Letters' },
  { key: 'recipes',        title: 'Family Recipes',       icon: UtensilsCrossed, screen: 'FamilyRecipes' },
  { key: 'keepsakes',      title: 'Their Keepsakes',      icon: Archive,         screen: 'Keepsakes' },
  { key: 'vault',          title: 'The Vault',            icon: Lock,            screen: 'TheVault' },
  { key: 'manageSections', title: 'Website Sections',     icon: Globe,           screen: 'ManageSections' },
  { key: 'help',           title: 'Help & Support',       icon: LifeBuoy,        screen: 'Help' },
  { key: 'settings',       title: 'Settings',             icon: SettingsIcon,    screen: 'Settings' },
];

// Contact is its OWN top-level section (Contact List + Circles) — pulled out of
// the book grid and rendered above it (D-012). key 'circles' keeps the existing
// paid-feature lock + the CirclesScreen route; only the presentation changes.
const CONTACT = { key: 'circles', title: 'Your Contacts', icon: Users, screen: 'Circles' };

// D-012 step 2: the flat section grid is regrouped into the SAME 4 groups as the
// web My Book hub (account-book.ejs) — lockstep names + order. Family Intro is a
// disabled "Coming soon" placeholder; utility rows go in a "Manage" footer group.
const SECTION_BY_KEY = SECTIONS.reduce((m, s) => { m[s.key] = s; return m; }, {});
const GROUPS = [
  { title: 'Main page',         keys: ['childInfo', 'journey'], placeholder: { key: 'familyIntro', title: 'Family Intro', icon: ImageIcon } },
  { title: 'Your Odyssey',      keys: ['before', 'birth', 'birthday', 'comingHome', 'months'] },
  { title: 'Family & Memories', keys: ['family', 'firsts', 'celebrations', 'letters', 'recipes', 'keepsakes', 'vault', 'galleries', 'moments'] },
];
const UTILITY_KEYS = ['manageSections', 'help', 'settings'];

const DEMO_BOOK = { child: { first_name: 'Sophia', last_name: 'Smith' }, subdomain: 'sophiasmith', custom_domain: null };

export default function DashboardScreen({ navigation }) {
  const { user, families, activeFamilyId, switchFamily, refreshFamilies } = useAuth();
  const isDemo = user?.isDemo;
  const [book, setBook] = useState(isDemo ? DEMO_BOOK : null);
  const [loading, setLoading] = useState(!isDemo);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [switching, setSwitching] = useState(false);

  // Determine if current active family is on free plan
  const activeFamily = families.find(f => f.id === activeFamilyId);
  const isFree = activeFamily ? (activeFamily.plan !== 'paid' && activeFamily.subscription_status !== 'active') : false;

  async function fetchBook() {
    if (isDemo) return; // Demo mode — no real API calls
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
    if (isDemo) return;
    fetchBook().finally(() => setLoading(false));
  }, []);

  // Refetch on focus (returning from an editor) or when active family changes
  useFocusEffect(
    useCallback(() => {
      if (!isDemo) fetchBook();
    }, [activeFamilyId])
  );

  async function onRefresh() {
    if (isDemo) return;
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
      'Upgrade to Unlock',
      `${sectionTitle} is available on the paid plan.\n\nUpgrade for $29 your first year to unlock all sections, add unlimited photos, and get your own custom domain.`,
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
    if (book?.custom_domain) return book.custom_domain;
    if (user?.custom_domain) return user.custom_domain;
    const sub = book?.subdomain || user?.subdomain;
    if (sub) return `${sub}.legacyodyssey.com`;
    return '';
  }

  function renderCard(item) {
    const isLocked = isFree && !FREE_SECTIONS.has(item.key);
    return (
      <TouchableOpacity
        key={item.key}
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
        <View style={styles.cardIcon}>
          {isLocked
            ? <Lock size={22} color="#c8a96e" strokeWidth={1.5} />
            : <item.icon size={22} color="#c8a96e" strokeWidth={1.5} />}
        </View>
        <Text style={[styles.cardTitle, isLocked && styles.cardTitleLocked]}>{item.title}</Text>
        <Text style={[styles.cardAction, isLocked && styles.cardActionLocked]}>
          {isLocked ? 'Upgrade' : 'Edit'}
        </Text>
      </TouchableOpacity>
    );
  }

  // Disabled "Coming soon" placeholder (Family Intro) — mirrors the web card.
  function renderPlaceholder(ph) {
    return (
      <View key={ph.key} style={[styles.card, styles.cardPlaceholder]}>
        <View style={styles.cardIcon}>
          <ph.icon size={22} color="#c8a96e" strokeWidth={1.5} />
        </View>
        <Text style={styles.cardTitle}>{ph.title}</Text>
        <Text style={styles.cardAction}>Coming soon</Text>
      </View>
    );
  }

  function renderGroup(group) {
    return (
      <View key={group.title} style={styles.group}>
        <Text style={styles.groupTitle}>{group.title}</Text>
        <View style={styles.groupWrap}>
          {group.keys.map((k) => renderCard(SECTION_BY_KEY[k]))}
          {group.placeholder ? renderPlaceholder(group.placeholder) : null}
        </View>
      </View>
    );
  }

  // Contact = its own section above the book grid (Contact List + Circles).
  function renderContactSection() {
    const isLocked = isFree && !FREE_SECTIONS.has(CONTACT.key);
    return (
      <View style={styles.contactSection}>
        <TouchableOpacity
          style={[styles.card, styles.contactCard, isLocked && styles.cardLocked]}
          activeOpacity={0.7}
          onPress={() => {
            if (isLocked) showUpgradePrompt('Contact');
            else navigation.navigate(CONTACT.screen, { book });
          }}
        >
          <View style={styles.cardIcon}>
            {isLocked
              ? <Lock size={22} color="#c8a96e" strokeWidth={1.5} />
              : <CONTACT.icon size={22} color="#c8a96e" strokeWidth={1.5} />}
          </View>
          <Text style={[styles.cardTitle, isLocked && styles.cardTitleLocked]}>{CONTACT.title}</Text>
          <Text style={[styles.cardAction, isLocked && styles.cardActionLocked]}>
            {isLocked ? 'Upgrade' : 'Contact List + Circles'}
          </Text>
        </TouchableOpacity>
      </View>
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
              <Text style={styles.headerSubtitle}>Your Child's Story</Text>
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
            <View style={styles.upgradeBarRow}>
              <Sparkles size={13} color={colors.gold} strokeWidth={1.5} />
              <Text style={[styles.upgradeBarText, styles.upgradeBarLabel]}>Free Plan — Tap to upgrade for full access</Text>
            </View>
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

      {/* Grouped section list (D-012 step 2 — lockstep with the web My Book hub) */}
      <ScrollView
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
      >
        {GROUPS.map(renderGroup)}

        <View style={styles.group}>
          <Text style={styles.groupTitle}>Your Contacts</Text>
          {renderContactSection()}
        </View>

        <View style={styles.group}>
          <Text style={styles.groupTitle}>Manage</Text>
          <View style={styles.groupWrap}>
            {UTILITY_KEYS.map((k) => renderCard(SECTION_BY_KEY[k]))}
          </View>
        </View>
      </ScrollView>

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
  upgradeBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upgradeBarText: {
    color: colors.gold,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  upgradeBarLabel: {
    marginLeft: 5,
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
  group: {
    marginBottom: spacing.lg,
  },
  groupTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.gold,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  groupWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardPlaceholder: {
    opacity: 0.55,
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
    // Lucide line-art icon container (v1.0.7 — was a 36pt emoji <Text>).
    // SVG is 22x22 brand-gold; container provides bottom margin to mirror
    // the original visual cadence inside the dashboard cards.
    height: 22,
    marginBottom: spacing.sm,
    alignItems: 'flex-start',
    justifyContent: 'center',
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
  contactSection: {
    marginBottom: spacing.lg,
  },
  contactHeading: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.gold,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  contactCard: {
    width: '100%',
    marginBottom: 0,
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
