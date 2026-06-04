import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Images, ChevronRight } from 'lucide-react-native';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { get, post } from '../api/client';

export default function GalleriesScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [galleries, setGalleries] = useState([]);
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchGalleries = useCallback(async () => {
    try {
      const res = await get('/api/galleries/mine');
      setGalleries((res.data && res.data.galleries) || []);
    } catch (err) { if (err.status !== 404) Alert.alert('Error', 'Could not load galleries.'); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { fetchGalleries(); }, [fetchGalleries]));

  async function createGallery() {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const res = await post('/api/galleries/mine', { title: title.trim() });
      const g = res.data || res;
      setTitle('');
      navigation.navigate('GalleryDetail', { galleryId: g.id, title: g.title });
    } catch (err) { Alert.alert('Error', 'Could not create gallery.'); }
    finally { setCreating(false); }
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={colors.gold} /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Custom Galleries</Text>
      <Text style={styles.pageSubtitle}>Make your own photo galleries — name each one, up to 21 photos with captions.</Text>

      {galleries.length === 0 ? <Text style={styles.empty}>No galleries yet — create your first one below.</Text> : null}

      {galleries.map((g) => (
        <TouchableOpacity key={g.id} style={styles.galRow} activeOpacity={0.8}
          onPress={() => navigation.navigate('GalleryDetail', { galleryId: g.id, title: g.title })}>
          {g.photos && g.photos[0] ? (
            <Image source={{ uri: g.photos[0].url }} style={styles.cover} />
          ) : (
            <View style={[styles.cover, styles.coverEmpty]}><Images size={24} color={colors.gold} /></View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.galTitle}>{g.title || 'Untitled Gallery'}</Text>
            <Text style={styles.galCount}>{(g.photos || []).length} photo{(g.photos || []).length === 1 ? '' : 's'}</Text>
          </View>
          <ChevronRight size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      ))}

      <View style={styles.createBox}>
        <Text style={styles.createLabel}>New gallery name</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Our Trip to the Lake" placeholderTextColor={colors.placeholder} maxLength={80} />
        <TouchableOpacity style={[styles.btn, (creating || !title.trim()) && styles.btnDisabled]} onPress={createGallery} disabled={creating || !title.trim()}>
          {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>+ Create Gallery</Text>}
        </TouchableOpacity>
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
  createLabel: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.textSecondary, marginBottom: spacing.xs },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, fontSize: typography.sizes.md, color: colors.textPrimary, marginBottom: spacing.md },
  btn: { backgroundColor: colors.gold, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', minHeight: 48, justifyContent: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
});
