import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Images, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react-native';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { get, post, put } from '../api/client';
import { useI18n } from '../i18n/I18nContext';

export default function GalleriesScreen({ navigation }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [galleries, setGalleries] = useState([]);
  const [creating, setCreating] = useState(false);

  const fetchGalleries = useCallback(async () => {
    try {
      const res = await get('/api/galleries/mine');
      setGalleries((res.data && res.data.galleries) || []);
    } catch (err) { if (err.status !== 404) Alert.alert(t('app.galleries.error_title'), t('app.galleries.load_error')); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { fetchGalleries(); }, [fetchGalleries]));

  // Move a gallery up/down — this order is what visitors see (matches the
  // web editor's drag-to-reorder; PUT /api/galleries/mine/reorder).
  async function moveGallery(index, delta) {
    const to = index + delta;
    if (to < 0 || to >= galleries.length) return;
    const next = [...galleries];
    const [g] = next.splice(index, 1);
    next.splice(to, 0, g);
    setGalleries(next);
    try { await put('/api/galleries/mine/reorder', { order: next.map((x) => x.id) }); }
    catch (e) { Alert.alert(t('app.galleries.error_title'), t('app.galleries.reorder_error')); fetchGalleries(); }
  }

  // Create-then-name flow (matches web): the gallery is created untitled and
  // the user names it on the photo page.
  async function createGallery() {
    setCreating(true);
    try {
      const res = await post('/api/galleries/mine', {});
      const g = res.data || res;
      navigation.navigate('GalleryDetail', { galleryId: g.id, title: g.title });
    } catch (err) { Alert.alert(t('app.galleries.error_title'), t('app.galleries.create_error')); }
    finally { setCreating(false); }
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={colors.gold} /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>{t('app.galleries.page_title')}</Text>
      <Text style={styles.pageSubtitle}>{t('app.galleries.page_subtitle')}</Text>

      {galleries.length === 0 ? <Text style={styles.empty}>{t('app.galleries.empty')}</Text> : null}

      {galleries.map((g, i) => (
        <TouchableOpacity key={g.id} style={styles.galRow} activeOpacity={0.8}
          onPress={() => navigation.navigate('GalleryDetail', { galleryId: g.id, title: g.title })}>
          {g.photos && g.photos[0] ? (
            <Image source={{ uri: g.photos[0].url }} style={styles.cover} />
          ) : (
            <View style={[styles.cover, styles.coverEmpty]}><Images size={24} color={colors.gold} /></View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.galTitle}>{g.title || t('app.galleries.untitled')}</Text>
            <Text style={styles.galCount}>{(g.photos || []).length === 1 ? t('app.galleries.photo_count_one', { count: 1 }) : t('app.galleries.photo_count_other', { count: (g.photos || []).length })}</Text>
          </View>
          {galleries.length > 1 ? (
            <View style={styles.orderBtns}>
              <TouchableOpacity onPress={() => moveGallery(i, -1)} disabled={i === 0} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <ChevronUp size={20} color={i === 0 ? colors.border : colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => moveGallery(i, 1)} disabled={i === galleries.length - 1} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <ChevronDown size={20} color={i === galleries.length - 1 ? colors.border : colors.textSecondary} />
              </TouchableOpacity>
            </View>
          ) : null}
          <ChevronRight size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      ))}
      {galleries.length > 1 ? <Text style={styles.orderHint}>{t('app.galleries.order_hint')}</Text> : null}

      <View style={styles.createBox}>
        <TouchableOpacity style={[styles.btn, creating && styles.btnDisabled]} onPress={createGallery} disabled={creating}>
          {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t('app.galleries.create_button')}</Text>}
        </TouchableOpacity>
        <Text style={styles.createHint}>{t('app.galleries.create_hint')}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 150 },
  pageTitle: { fontFamily: typography.fontFamily.serif, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.textPrimary },
  pageSubtitle: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginBottom: spacing.lg, fontStyle: 'italic' },
  empty: { fontSize: typography.sizes.sm, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md },
  galRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, ...shadows.card },
  cover: { width: 60, height: 60, borderRadius: borderRadius.md, backgroundColor: colors.card },
  coverEmpty: { alignItems: 'center', justifyContent: 'center' },
  galTitle: { fontFamily: typography.fontFamily.serif, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.textPrimary },
  galCount: { fontSize: typography.sizes.sm, color: colors.textSecondary },
  createBox: { backgroundColor: colors.white, borderWidth: 2, borderColor: colors.gold, borderStyle: 'dashed', borderRadius: borderRadius.lg, padding: spacing.lg, marginTop: spacing.md },
  createHint: { fontSize: typography.sizes.xs, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  orderBtns: { alignItems: 'center', gap: 2, marginRight: spacing.xs },
  orderHint: { fontSize: typography.sizes.xs, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.sm },
  btn: { backgroundColor: colors.gold, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', minHeight: 48, justifyContent: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
});
