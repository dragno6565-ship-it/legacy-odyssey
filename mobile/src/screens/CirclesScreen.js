import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Users, Trash2, Send } from 'lucide-react-native';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { get, post, put, del } from '../api/client';

// Phases 1 + 2: manage contacts + circles, and send update emails (each
// opted-in person gets their private magic link — no password needed).
// Mirrors the web /account/book/circles page. Calls the JWT API at /api/contacts/*.
export default function CirclesScreen() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [circles, setCircles] = useState([]);

  // Send an Update (Phase 2)
  const [notifyCircleId, setNotifyCircleId] = useState(null); // null = Everyone
  const [notifyNote, setNotifyNote] = useState('');
  const [sending, setSending] = useState(false);

  const [newCircle, setNewCircle] = useState('');
  const [cName, setCName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [newSel, setNewSel] = useState([]);            // circle ids for the new contact
  const [editId, setEditId] = useState(null);          // contact being edited
  const [editSel, setEditSel] = useState([]);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [renameId, setRenameId] = useState(null);      // circle being renamed
  const [renameVal, setRenameVal] = useState('');

  const fetchAll = useCallback(async () => {
    try {
      const res = await get('/api/contacts/mine');
      setContacts((res.data && res.data.contacts) || []);
      setCircles((res.data && res.data.circles) || []);
    } catch (err) { if (err.status !== 404) Alert.alert('Error', 'Could not load your circles.'); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { fetchAll(); }, [fetchAll]));

  const toggle = (arr, id) => (arr.indexOf(id) === -1 ? [...arr, id] : arr.filter((x) => x !== id));

  async function addCircle() {
    if (!newCircle.trim() || busy) return;
    setBusy(true);
    try { await post('/api/contacts/mine/circles', { name: newCircle.trim() }); setNewCircle(''); await fetchAll(); }
    catch (e) { Alert.alert('Error', 'Could not add circle.'); } finally { setBusy(false); }
  }
  async function saveRename(id) {
    setBusy(true);
    try { await put('/api/contacts/mine/circles/' + id, { name: renameVal.trim() || 'Circle' }); setRenameId(null); await fetchAll(); }
    catch (e) { Alert.alert('Error', 'Could not rename.'); } finally { setBusy(false); }
  }
  function deleteCircle(c) {
    Alert.alert('Delete circle?', `Delete the “${c.name}” circle? Your contacts stay — they’re just removed from it.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { try { await del('/api/contacts/mine/circles/' + c.id); await fetchAll(); } catch (e) { Alert.alert('Error', 'Could not delete.'); } } },
    ]);
  }

  async function addContact() {
    if (!cName.trim() || busy) return;
    setBusy(true);
    try {
      const res = await post('/api/contacts/mine/contacts', { name: cName.trim(), email: cEmail.trim(), phone: cPhone.trim() });
      const id = (res.data && res.data.id) || (res.data && res.data.contact && res.data.contact.id);
      if (id && newSel.length) await put('/api/contacts/mine/contacts/' + id + '/circles', { circleIds: newSel });
      setCName(''); setCEmail(''); setCPhone(''); setNewSel([]);
      await fetchAll();
    } catch (e) { Alert.alert('Error', 'Could not add person.'); } finally { setBusy(false); }
  }
  function startEdit(p) {
    setEditId(p.id); setEditName(p.name || ''); setEditEmail(p.email || ''); setEditPhone(p.phone || ''); setEditSel(p.circle_ids || []);
  }
  async function saveContact(id) {
    setBusy(true);
    try {
      await put('/api/contacts/mine/contacts/' + id, { name: editName.trim(), email: editEmail.trim(), phone: editPhone.trim() });
      await put('/api/contacts/mine/contacts/' + id + '/circles', { circleIds: editSel });
      setEditId(null); await fetchAll();
    } catch (e) { Alert.alert('Error', 'Could not save.'); } finally { setBusy(false); }
  }
  function deleteContact(p) {
    Alert.alert('Remove person?', `Remove ${p.name}? Their view link will stop working.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { try { await del('/api/contacts/mine/contacts/' + p.id); await fetchAll(); } catch (e) { Alert.alert('Error', 'Could not remove.'); } } },
    ]);
  }

  // ── Send an Update (Phase 2) ─────────────────────────────────────────────
  const notifiable = contacts.filter((c) => c.email && c.notify_opt_in !== false && !c.unsubscribed_at);
  const notifiableInCircle = (c) => notifiable.filter((p) => (p.circle_ids || []).indexOf(c.id) !== -1).length;
  const selectedCount = notifyCircleId
    ? notifiableInCircle(circles.find((c) => c.id === notifyCircleId) || { id: notifyCircleId })
    : notifiable.length;

  function sendUpdate() {
    if (sending || !selectedCount) return;
    Alert.alert(
      'Send the update email now?',
      `${selectedCount} ${selectedCount === 1 ? 'person' : 'people'} will each get their own private link.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send', onPress: async () => {
          setSending(true);
          try {
            const res = await post('/api/contacts/mine/notify', { circleId: notifyCircleId || '', note: notifyNote.trim() });
            const sent = (res.data && res.data.sent) || 0;
            setNotifyNote('');
            Alert.alert('Sent', `Update sent to ${sent} ${sent === 1 ? 'person' : 'people'}.`);
          } catch (e) {
            const msg = (e.response && e.response.data && e.response.data.error) || 'Could not send the update.';
            Alert.alert('Not sent', msg);
          } finally { setSending(false); }
        } },
      ]
    );
  }

  const Chips = ({ selected, onToggle }) => (
    <View style={styles.chips}>
      {circles.map((c) => {
        const on = selected.indexOf(c.id) !== -1;
        return (
          <TouchableOpacity key={c.id} onPress={() => onToggle(c.id)} style={[styles.chip, on && styles.chipOn]}>
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{c.name}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={colors.gold} /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Your Contacts</Text>
      <Text style={styles.pageSubtitle}>Your Contact List and Circles — keep a private list of who can see the book, grouped into circles like “Grandparents.”</Text>

      {/* SEND AN UPDATE (Phase 2) */}
      {notifiable.length > 0 ? (
        <View style={[styles.card, styles.notifyCard]}>
          <View style={styles.row}>
            <Send size={18} color={colors.gold} />
            <Text style={styles.cardTitle}>Send an Update</Text>
          </View>
          <Text style={[styles.muted, { marginBottom: spacing.sm }]}>Let people know there’s something new in the book. Each person gets an email with their own private link — no password needed.</Text>
          <Text style={styles.label}>Who</Text>
          <View style={styles.chips}>
            <TouchableOpacity onPress={() => setNotifyCircleId(null)} style={[styles.chip, !notifyCircleId && styles.chipOn]}>
              <Text style={[styles.chipText, !notifyCircleId && styles.chipTextOn]}>Everyone ({notifiable.length})</Text>
            </TouchableOpacity>
            {circles.map((c) => (
              <TouchableOpacity key={c.id} onPress={() => setNotifyCircleId(c.id)} style={[styles.chip, notifyCircleId === c.id && styles.chipOn]}>
                <Text style={[styles.chipText, notifyCircleId === c.id && styles.chipTextOn]}>{c.name} ({notifiableInCircle(c)})</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.input}
            value={notifyNote}
            onChangeText={setNotifyNote}
            placeholder="Add a short note (optional)"
            placeholderTextColor={colors.placeholder}
            maxLength={500}
          />
          <TouchableOpacity style={[styles.btn, (sending || !selectedCount) && styles.dim]} onPress={sendUpdate} disabled={sending || !selectedCount}>
            {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send Update</Text>}
          </TouchableOpacity>
          <Text style={[styles.muted, { marginTop: spacing.xs, fontSize: typography.sizes.xs }]}>One update per 10 minutes, so inboxes stay friendly.</Text>
        </View>
      ) : null}

      {/* CIRCLES */}
      <Text style={styles.h2}>Circles</Text>
      {circles.length === 0 ? <Text style={styles.empty}>No circles yet — create one below.</Text> : null}
      {circles.map((c) => (
        <View key={c.id} style={styles.card}>
          {renameId === c.id ? (
            <View style={styles.row}>
              <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} value={renameVal} onChangeText={setRenameVal} maxLength={120} />
              <TouchableOpacity style={styles.btnSm} onPress={() => saveRename(c.id)}><Text style={styles.btnSmText}>Save</Text></TouchableOpacity>
            </View>
          ) : (
            <View style={styles.cardHead}>
              <View>
                <Text style={styles.cardTitle}>{c.name}</Text>
                <Text style={styles.muted}>{c.member_count} {c.member_count === 1 ? 'person' : 'people'}</Text>
              </View>
              <View style={styles.rowEnd}>
                <TouchableOpacity onPress={() => { setRenameId(c.id); setRenameVal(c.name); }}><Text style={styles.link}>Rename</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => deleteCircle(c)}><Trash2 size={18} color={colors.error} /></TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      ))}
      <View style={styles.card}>
        <View style={styles.row}>
          <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} value={newCircle} onChangeText={setNewCircle} placeholder="e.g. Grandparents" placeholderTextColor={colors.placeholder} maxLength={120} />
          <TouchableOpacity style={[styles.btnSm, (!newCircle.trim() || busy) && styles.dim]} onPress={addCircle} disabled={!newCircle.trim() || busy}><Text style={styles.btnSmText}>+ Add</Text></TouchableOpacity>
        </View>
      </View>

      {/* CONTACT LIST */}
      <Text style={styles.h2}>Contact List</Text>
      {contacts.length === 0 ? <Text style={styles.empty}>No contacts yet — add the first person below.</Text> : null}
      {contacts.map((p) => (
        <View key={p.id} style={styles.card}>
          {editId === p.id ? (
            <View>
              <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholder="Name" placeholderTextColor={colors.placeholder} />
              <TextInput style={styles.input} value={editEmail} onChangeText={setEditEmail} placeholder="Email" placeholderTextColor={colors.placeholder} autoCapitalize="none" keyboardType="email-address" />
              <TextInput style={styles.input} value={editPhone} onChangeText={setEditPhone} placeholder="Phone (optional)" placeholderTextColor={colors.placeholder} keyboardType="phone-pad" />
              {circles.length ? <><Text style={styles.label}>Circles</Text><Chips selected={editSel} onToggle={(id) => setEditSel((s) => toggle(s, id))} /></> : null}
              <View style={styles.rowEnd}>
                <TouchableOpacity onPress={() => setEditId(null)}><Text style={styles.link}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={styles.btnSm} onPress={() => saveContact(p.id)}><Text style={styles.btnSmText}>Save</Text></TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle}>{p.name}</Text>
                <View style={styles.rowEnd}>
                  <TouchableOpacity onPress={() => startEdit(p)}><Text style={styles.link}>Edit</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteContact(p)}><Trash2 size={18} color={colors.error} /></TouchableOpacity>
                </View>
              </View>
              <Text style={styles.muted}>{p.email || 'no email'}{p.phone ? ' · ' + p.phone : ''}</Text>
              {(p.circle_ids || []).length ? (
                <View style={styles.chips}>
                  {circles.filter((c) => (p.circle_ids || []).indexOf(c.id) !== -1).map((c) => (
                    <View key={c.id} style={[styles.chip, styles.chipStatic]}><Text style={styles.chipText}>{c.name}</Text></View>
                  ))}
                </View>
              ) : null}
            </View>
          )}
        </View>
      ))}
      <View style={styles.card}>
        <Text style={styles.label}>Add a person</Text>
        <TextInput style={styles.input} value={cName} onChangeText={setCName} placeholder="Full name" placeholderTextColor={colors.placeholder} />
        <TextInput style={styles.input} value={cEmail} onChangeText={setCEmail} placeholder="Email" placeholderTextColor={colors.placeholder} autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={styles.input} value={cPhone} onChangeText={setCPhone} placeholder="Phone (optional)" placeholderTextColor={colors.placeholder} keyboardType="phone-pad" />
        {circles.length ? <><Text style={styles.label}>Add to circles</Text><Chips selected={newSel} onToggle={(id) => setNewSel((s) => toggle(s, id))} /></> : null}
        <TouchableOpacity style={[styles.btn, (!cName.trim() || busy) && styles.dim]} onPress={addContact} disabled={!cName.trim() || busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>+ Add Person</Text>}
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
  pageSubtitle: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginBottom: spacing.md, fontStyle: 'italic' },
  notifyCard: { borderWidth: 1.5, borderColor: colors.gold, marginTop: spacing.sm },
  h2: { fontFamily: typography.fontFamily.serif, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.sm },
  empty: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginBottom: spacing.sm },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, ...shadows.card },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontFamily: typography.fontFamily.serif, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.textPrimary },
  muted: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginTop: 2 },
  link: { color: colors.gold, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold },
  label: { fontSize: typography.sizes.xs, fontWeight: typography.weights.medium, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: spacing.xs, marginTop: spacing.xs },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.sm, fontSize: typography.sizes.md, color: colors.textPrimary, marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  rowEnd: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: spacing.xs },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 12 },
  chipOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipStatic: { backgroundColor: colors.card, borderColor: colors.card },
  chipText: { fontSize: typography.sizes.xs, color: colors.textSecondary },
  chipTextOn: { color: '#fff', fontWeight: typography.weights.semibold },
  btn: { backgroundColor: colors.gold, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', minHeight: 48, justifyContent: 'center', marginTop: spacing.xs },
  btnText: { color: '#fff', fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
  btnSm: { backgroundColor: colors.gold, borderRadius: borderRadius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, justifyContent: 'center' },
  btnSmText: { color: '#fff', fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold },
  dim: { opacity: 0.5 },
});
