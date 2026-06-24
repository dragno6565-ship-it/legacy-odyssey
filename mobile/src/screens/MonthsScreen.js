import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { get } from '../api/client';
import { useI18n } from '../i18n/I18nContext';

export default function MonthsScreen({ navigation }) {
  const { t } = useI18n();
  const MONTH_LABELS = [
    t('app.months.month_1'), t('app.months.month_2'), t('app.months.month_3'),
    t('app.months.month_4'), t('app.months.month_5'), t('app.months.month_6'),
    t('app.months.month_7'), t('app.months.month_8'), t('app.months.month_9'),
    t('app.months.month_10'), t('app.months.month_11'), t('app.months.month_12'),
  ];
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchMonths() {
    try {
      const res = await get('/api/books/mine');
      const book = res.data;
      const monthData = book.months || [];
      setMonths(monthData);
    } catch (err) {
      console.warn('Failed to fetch months:', err.message);
    }
  }

  useEffect(() => {
    fetchMonths().finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMonths();
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await fetchMonths();
    setRefreshing(false);
  }

  function getMonthData(num) {
    return months.find((m) => m.month === num || m.number === num) || {};
  }

  function renderMonthCard({ item: num }) {
    const data = getMonthData(num);
    const highlight = data.highlight || data.title || '';
    const hasContent = !!highlight;

    return (
      <TouchableOpacity
        style={[styles.card, hasContent && styles.cardFilled]}
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate('MonthDetail', {
            monthNum: num,
            monthLabel: MONTH_LABELS[num - 1],
          })
        }
      >
        <Text style={styles.monthNumber}>{num}</Text>
        <Text style={styles.monthLabel}>{t('app.months.month_label', { label: MONTH_LABELS[num - 1] })}</Text>
        {highlight ? (
          <Text style={styles.highlight} numberOfLines={2}>
            {highlight}
          </Text>
        ) : (
          <Text style={styles.emptyLabel}>{t('app.months.tap_to_add')}</Text>
        )}
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
      <FlatList
        data={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}
        renderItem={renderMonthCard}
        keyExtractor={(item) => String(item)}
        numColumns={3}
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
  grid: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    width: '31%',
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
    ...shadows.card,
  },
  cardFilled: {
    borderWidth: 1,
    borderColor: colors.gold,
  },
  monthNumber: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.gold,
  },
  monthLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  highlight: {
    fontSize: typography.sizes.xs,
    color: colors.textPrimary,
    marginTop: spacing.xs,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyLabel: {
    fontSize: typography.sizes.xs,
    color: colors.placeholder,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
});
