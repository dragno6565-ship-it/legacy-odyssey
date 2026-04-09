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
  Linking,
} from 'react-native';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { get, post } from '../api/client';

export default function AdditionalDomainScreen({ navigation }) {
  const [bookName, setBookName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [alternatives, setAlternatives] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(null); // null = skip domain
  const [skipDomain, setSkipDomain] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [searchError, setSearchError] = useState('');

  function sanitize(name) {
    return name.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '').slice(0, 63);
  }

  function deriveSubdomain() {
    if (selectedDomain) return selectedDomain.split('.')[0];
    return sanitize(bookName) || 'mybook';
  }

  async function handleSearch() {
    const query = searchQuery.trim() || bookName.trim();
    if (!query) {
      Alert.alert('Enter a name', 'Type a name to search for available domains.');
      return;
    }
    setSearching(true);
    setSearchError('');
    setResults([]);
    setAlternatives([]);
    setSelectedDomain(null);
    setSkipDomain(false);
    try {
      const clean = sanitize(query);
      if (!clean || clean.length < 2) {
        setSearchError('Name must be at least 2 characters (letters and numbers only).');
        return;
      }
      const res = await get(`/api/domains/search?name=${encodeURIComponent(clean)}`);
      setResults(res.data.results || []);
      setAlternatives(res.data.alternatives || []);
      setHasSearched(true);
    } catch (err) {
      setSearchError(err.message || 'Domain search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  }

  function handleSelectDomain(domain) {
    setSelectedDomain(domain);
    setSkipDomain(false);
  }

  function handleSkipDomain() {
    setSkipDomain(true);
    setSelectedDomain(null);
  }

  async function handlePurchase() {
    if (!bookName.trim()) {
      Alert.alert('Book Name Required', 'Please enter a name for this book.');
      return;
    }
    if (!selectedDomain && !skipDomain) {
      Alert.alert('Choose a Domain', 'Select a domain or tap "Skip — use subdomain" to continue.');
      return;
    }

    setPurchasing(true);
    try {
      const subdomain = deriveSubdomain();
      const res = await post('/api/stripe/create-additional-site-checkout', {
        subdomain,
        domain: selectedDomain || null,
        bookName: bookName.trim(),
      });
      await Linking.openURL(res.data.url);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || err.message || 'Could not start checkout. Please try again.');
    } finally {
      setPurchasing(false);
    }
  }

  const allResults = [...results, ...alternatives];
  const canPurchase = bookName.trim().length > 0 && (selectedDomain !== null || skipDomain);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Add Another Book</Text>
        <Text style={styles.heroSubtitle}>
          Create a second baby book with its own website and domain — perfect for a new sibling or a gift.
        </Text>
        <View style={styles.priceBadge}>
          <Text style={styles.priceAmount}>$12.99</Text>
          <Text style={styles.pricePeriod}>/year</Text>
        </View>
      </View>

      {/* Step 1: Book Name */}
      <View style={styles.section}>
        <View style={styles.stepRow}>
          <View style={styles.stepBadge}><Text style={styles.stepNumber}>1</Text></View>
          <Text style={styles.sectionTitle}>Name This Book</Text>
        </View>
        <Text style={styles.sectionDescription}>
          What's this book for? This becomes the title of the new book.
        </Text>
        <TextInput
          style={styles.input}
          value={bookName}
          onChangeText={(t) => {
            setBookName(t);
            if (!searchQuery) setSearchQuery(t);
          }}
          placeholder="e.g., Baby Emma, Our Second Child"
          placeholderTextColor={colors.textSecondary}
          returnKeyType="next"
        />
      </View>

      {/* Step 2: Domain Search */}
      <View style={styles.section}>
        <View style={styles.stepRow}>
          <View style={styles.stepBadge}><Text style={styles.stepNumber}>2</Text></View>
          <Text style={styles.sectionTitle}>Choose a Domain</Text>
        </View>
        <Text style={styles.sectionDescription}>
          Each book gets its own website. Search for a domain or use a free subdomain.
        </Text>

        <View style={styles.searchRow}>
          <TextInput
            style={[styles.input, styles.searchInput]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name…"
            placeholderTextColor={colors.textSecondary}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.searchButton, searching && styles.buttonDisabled]}
            onPress={handleSearch}
            disabled={searching}
            activeOpacity={0.8}
          >
            {searching ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.searchButtonText}>Search</Text>
            )}
          </TouchableOpacity>
        </View>

        {searchError ? (
          <Text style={styles.errorText}>{searchError}</Text>
        ) : null}

        {hasSearched && !searching && (
          <>
            {allResults.length === 0 ? (
              <View style={styles.noResultsBox}>
                <Text style={styles.noResultsText}>No affordable domains found for that name. Try a different search.</Text>
              </View>
            ) : (
              <>
                <Text style={styles.resultsLabel}>Available Domains</Text>
                {allResults.map((item) => {
                  const isSelected = selectedDomain === item.domain;
                  const isAvailable = item.available && item.underBudget;
                  return (
                    <TouchableOpacity
                      key={item.domain}
                      style={[
                        styles.domainCard,
                        isSelected && styles.domainCardSelected,
                        !isAvailable && styles.domainCardUnavailable,
                      ]}
                      onPress={() => isAvailable && handleSelectDomain(item.domain)}
                      activeOpacity={isAvailable ? 0.7 : 1}
                      disabled={!isAvailable}
                    >
                      <View style={styles.domainCardLeft}>
                        <Text style={[styles.domainName, !isAvailable && styles.domainNameUnavailable]}>
                          {item.domain}
                        </Text>
                        {isAvailable ? (
                          <Text style={styles.domainAvailableTag}>Available</Text>
                        ) : (
                          <Text style={styles.domainTakenTag}>Taken</Text>
                        )}
                      </View>
                      <View style={styles.domainCardRight}>
                        {isAvailable && item.price != null ? (
                          <Text style={styles.domainPrice}>${item.price.toFixed(2)}/yr</Text>
                        ) : null}
                        {isSelected ? (
                          <View style={styles.checkCircle}>
                            <Text style={styles.checkMark}>✓</Text>
                          </View>
                        ) : isAvailable ? (
                          <View style={styles.emptyCircle} />
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {/* Skip option */}
            <TouchableOpacity
              style={[styles.skipCard, skipDomain && styles.skipCardSelected]}
              onPress={handleSkipDomain}
              activeOpacity={0.7}
            >
              <View style={styles.domainCardLeft}>
                <Text style={[styles.domainName, skipDomain && styles.skipDomainSelected]}>
                  Use a subdomain instead
                </Text>
                <Text style={styles.domainAvailableTag}>Free · included with subscription</Text>
              </View>
              <View style={styles.domainCardRight}>
                {skipDomain ? (
                  <View style={styles.checkCircle}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                ) : (
                  <View style={styles.emptyCircle} />
                )}
              </View>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Step 3: Summary + Purchase */}
      <View style={styles.section}>
        <View style={styles.stepRow}>
          <View style={styles.stepBadge}><Text style={styles.stepNumber}>3</Text></View>
          <Text style={styles.sectionTitle}>Review & Purchase</Text>
        </View>

        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Book name</Text>
            <Text style={styles.summaryValue} numberOfLines={1}>
              {bookName.trim() || '—'}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Domain</Text>
            <Text style={styles.summaryValue} numberOfLines={1}>
              {selectedDomain
                ? selectedDomain
                : skipDomain
                ? `${deriveSubdomain()}.legacyodyssey.app`
                : '—'}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Price</Text>
            <Text style={[styles.summaryValue, styles.summaryPrice]}>$12.99 / year</Text>
          </View>
        </View>

        <Text style={styles.checkoutNote}>
          You'll be taken to a secure Stripe checkout page to complete payment. Your new book will be ready within minutes.
        </Text>

        <TouchableOpacity
          style={[styles.purchaseButton, (!canPurchase || purchasing) && styles.buttonDisabled]}
          onPress={handlePurchase}
          disabled={!canPurchase || purchasing}
          activeOpacity={0.85}
        >
          {purchasing ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.purchaseButtonText}>Purchase — $12.99/yr</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  // Hero
  hero: {
    backgroundColor: colors.dark,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    alignItems: 'center',
    ...shadows.card,
  },
  heroTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.gold,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.goldLight,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.85,
    marginBottom: spacing.md,
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.gold,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  priceAmount: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.dark,
  },
  pricePeriod: {
    fontSize: typography.sizes.sm,
    color: colors.dark,
    fontWeight: typography.weights.semibold,
    marginBottom: 2,
    marginLeft: 2,
  },

  // Sections
  section: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  sectionDescription: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 19,
  },

  // Inputs
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
  },
  searchButton: {
    backgroundColor: colors.gold,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    minHeight: 46,
    minWidth: 76,
    alignItems: 'center',
    ...shadows.button,
  },
  searchButtonText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },

  // Domain results
  resultsLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  domainCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  domainCardSelected: {
    borderColor: colors.gold,
    backgroundColor: '#fffbf2',
  },
  domainCardUnavailable: {
    opacity: 0.45,
  },
  skipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderStyle: 'dashed',
    padding: spacing.md,
    marginTop: spacing.xs,
    backgroundColor: colors.background,
  },
  skipCardSelected: {
    borderColor: colors.gold,
    backgroundColor: '#fffbf2',
  },
  domainCardLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  domainCardRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  domainName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  domainNameUnavailable: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  skipDomainSelected: {
    color: colors.gold,
  },
  domainAvailableTag: {
    fontSize: typography.sizes.xs,
    color: '#2e7d32',
    fontWeight: typography.weights.semibold,
  },
  domainTakenTag: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  domainPrice: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: colors.white,
    fontSize: 13,
    fontWeight: typography.weights.bold,
  },
  emptyCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  noResultsBox: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  noResultsText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },

  // Summary
  summaryBox: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  summaryLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  summaryValue: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    fontWeight: typography.weights.semibold,
    flex: 2,
    textAlign: 'right',
  },
  summaryPrice: {
    color: colors.gold,
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.md,
  },
  checkoutNote: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: spacing.md,
  },

  // Purchase button
  purchaseButton: {
    backgroundColor: colors.gold,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    ...shadows.button,
  },
  purchaseButtonText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.3,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
