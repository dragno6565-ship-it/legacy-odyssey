import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, FlatList, Modal, ActivityIndicator, Alert, Linking, Platform, KeyboardAvoidingView } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Contacts from 'expo-contacts';
import * as SMS from 'expo-sms';
import { Trash2, Send, UserPlus, MessageSquare, Mail, Search, ChevronDown, Check } from 'lucide-react-native';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { get, post, put, del } from '../api/client';
import { useI18n } from '../i18n/I18nContext';

// Manage contacts + circles, and SHARE an update — the whole website, one
// section, or a single photo gallery — by TEXT (native Messages) or EMAIL
// (private magic links). Mirrors the web /account/book/circles + dashboard.
export default function CirclesScreen() {
  const { t } = useI18n();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [circles, setCircles] = useState([]);

  // ── Share an update ───────────────────────────────────────────────────────
  const [targets, setTargets] = useState({ sections: [], galleries: [] });
  const [scope, setScope] = useState({ type: 'all' }); // {type:'all'|'section'|'gallery', value/id, label/title}
  const [shareSel, setShareSel] = useState([]);         // selected contact ids
  const [shareNote, setShareNote] = useState('');
  const [sending, setSending] = useState(false);
  const [showScope, setShowScope] = useState(false);
  const [showRecip, setShowRecip] = useState(false);
  const [recipSearch, setRecipSearch] = useState('');

  const [newCircle, setNewCircle] = useState('');
  const [cName, setCName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [newSel, setNewSel] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editSel, setEditSel] = useState([]);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [renameId, setRenameId] = useState(null);
  const [renameVal, setRenameVal] = useState('');

  // Import from phone
  const [showImport, setShowImport] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [deviceContacts, setDeviceContacts] = useState([]);
  const [importSel, setImportSel] = useState({});
  const [importSearch, setImportSearch] = useState('');

  const fetchAll = useCallback(async () => {
    try {
      const res = await get('/api/contacts/mine');
      setContacts((res.data && res.data.contacts) || []);
      setCircles((res.data && res.data.circles) || []);
    } catch (err) { if (err.status !== 404) Alert.alert(t('app.circles.error_title'), t('app.circles.error_load')); }
    finally { setLoading(false); }
    try {
      const tg = await get('/api/contacts/mine/share-targets');
      setTargets({ sections: (tg.data && tg.data.sections) || [], galleries: (tg.data && tg.data.galleries) || [] });
    } catch (e) { /* non-fatal — scope just falls back to whole website */ }
  }, []);
  useFocusEffect(useCallback(() => { fetchAll(); }, [fetchAll]));

  // Save-prompt readiness: a screen can navigate('Circles', { section }) or
  // { gallery: {id,title} } to pre-select the scope.
  useEffect(() => {
    const p = route.params || {};
    if (p.gallery && p.gallery.id) setScope({ type: 'gallery', id: p.gallery.id, title: p.gallery.title || t('app.share.a_gallery') });
    else if (p.section) {
      const found = (targets.sections || []).find((s) => s.value === p.section);
      setScope({ type: 'section', value: p.section, label: (found && found.label) || p.section });
    }
  }, [route.params, targets.sections]);

  const toggle = (arr, id) => (arr.indexOf(id) === -1 ? [...arr, id] : arr.filter((x) => x !== id));

  async function addCircle() {
    if (!newCircle.trim() || busy) return;
    setBusy(true);
    try { await post('/api/contacts/mine/circles', { name: newCircle.trim() }); setNewCircle(''); await fetchAll(); }
    catch (e) { Alert.alert(t('app.circles.error_title'), t('app.circles.error_add_circle')); } finally { setBusy(false); }
  }
  async function saveRename(id) {
    setBusy(true);
    try { await put('/api/contacts/mine/circles/' + id, { name: renameVal.trim() || t('app.circles.default_circle_name') }); setRenameId(null); await fetchAll(); }
    catch (e) { Alert.alert(t('app.circles.error_title'), t('app.circles.error_rename')); } finally { setBusy(false); }
  }
  function deleteCircle(c) {
    Alert.alert(t('app.circles.delete_circle_title'), t('app.circles.delete_circle_msg', { name: c.name }), [
      { text: t('app.circles.cancel'), style: 'cancel' },
      { text: t('app.circles.delete'), style: 'destructive', onPress: async () => { try { await del('/api/contacts/mine/circles/' + c.id); await fetchAll(); } catch (e) { Alert.alert(t('app.circles.error_title'), t('app.circles.error_delete')); } } },
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
    } catch (e) { Alert.alert(t('app.circles.error_title'), t('app.circles.error_add_person')); } finally { setBusy(false); }
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
    } catch (e) { Alert.alert(t('app.circles.error_title'), t('app.circles.error_save')); } finally { setBusy(false); }
  }
  function deleteContact(p) {
    Alert.alert(t('app.circles.remove_person_title'), t('app.circles.remove_person_msg', { name: p.name }), [
      { text: t('app.circles.cancel'), style: 'cancel' },
      { text: t('app.circles.remove'), style: 'destructive', onPress: async () => { try { await del('/api/contacts/mine/contacts/' + p.id); await fetchAll(); } catch (e) { Alert.alert(t('app.circles.error_title'), t('app.circles.error_remove')); } } },
    ]);
  }

  // ── Share helpers ─────────────────────────────────────────────────────────
  // The `section` query/body value for the current scope (null = whole website).
  function scopeParam() {
    if (!scope || scope.type === 'all') return null;
    if (scope.type === 'section') return scope.value;
    if (scope.type === 'gallery') return 'gallery-' + scope.id;
    return null;
  }
  function scopeLabel() {
    if (!scope || scope.type === 'all') return t('app.share.whole_website');
    return scope.type === 'gallery' ? scope.title : scope.label;
  }

  const selectedContacts = contacts.filter((c) => shareSel.indexOf(c.id) !== -1);
  const emailables = selectedContacts.filter((c) => c.email && c.notify_opt_in !== false && !c.unsubscribed_at);
  const textables = selectedContacts.filter((c) => c.phone);

  function selectCircle(c) {
    const ids = contacts.filter((p) => (p.circle_ids || []).indexOf(c.id) !== -1).map((p) => p.id);
    setShareSel((prev) => Array.from(new Set([...prev, ...ids])));
  }

  async function doEmail() {
    const ids = emailables.map((c) => c.id);
    if (!ids.length || sending) return;
    Alert.alert(
      t('app.share.email_confirm_title'),
      ids.length === 1 ? t('app.share.email_confirm_one', { scope: scopeLabel() }) : t('app.share.email_confirm_many', { count: ids.length, scope: scopeLabel() }),
      [
        { text: t('app.circles.cancel'), style: 'cancel' },
        { text: t('app.share.send_email'), onPress: async () => {
          setSending(true);
          try {
            const body = { contactIds: ids, note: shareNote.trim() };
            const sec = scopeParam(); if (sec) body.section = sec;
            const res = await post('/api/contacts/mine/notify', body);
            const sent = (res.data && res.data.sent) || 0;
            setShareSel([]); setShareNote('');
            Alert.alert(t('app.share.sent_title'), sent === 1 ? t('app.circles.sent_msg_one', { count: sent }) : t('app.circles.sent_msg_many', { count: sent }));
          } catch (e) {
            const msg = (e.response && e.response.data && e.response.data.error) || t('app.circles.error_send');
            Alert.alert(t('app.circles.not_sent_title'), msg);
          } finally { setSending(false); }
        } },
      ]
    );
  }

  async function doText() {
    const people = textables;
    if (!people.length || sending) return;
    const available = await SMS.isAvailableAsync();
    if (!available) { Alert.alert(t('app.circles.texting_unavailable_title'), t('app.circles.texting_unavailable_msg')); return; }
    // Everyone gets their OWN private link (no password). A group SMS can't carry
    // different links, so we open a separate message per person, one at a time.
    if (people.length > 1) {
      Alert.alert(
        t('app.share.text_multi_title', { count: people.length }),
        t('app.share.text_multi_msg', { count: people.length }),
        [{ text: t('app.circles.cancel'), style: 'cancel' }, { text: t('app.share.text_multi_go'), onPress: () => runTexts(people) }]
      );
    } else { runTexts(people); }
  }
  async function runTexts(people) {
    setSending(true);
    const sec = scopeParam();
    const note = shareNote.trim();
    try {
      for (const p of people) {
        const params = [];
        if (sec) params.push('section=' + encodeURIComponent(sec));
        if (note) params.push('note=' + encodeURIComponent(note));
        const q = params.length ? ('?' + params.join('&')) : '';
        const res = await get('/api/contacts/mine/contacts/' + p.id + '/sms' + q);
        const phone = (res.data && res.data.phone) || p.phone;
        const message = (res.data && res.data.message) || '';
        await SMS.sendSMSAsync([phone], message);
      }
      setShareSel([]); setShareNote('');
    } catch (e) {
      Alert.alert(t('app.circles.cant_open_messages_title'), t('app.circles.please_try_again'));
    } finally { setSending(false); }
  }

  // Per-contact quick text from the contact list (single private link).
  async function textContact(p) {
    if (!p.phone) { Alert.alert(t('app.circles.no_phone_title'), t('app.circles.no_phone_msg', { name: p.name })); return; }
    try {
      const available = await SMS.isAvailableAsync();
      if (!available) { Alert.alert(t('app.circles.texting_unavailable_title'), t('app.circles.texting_unavailable_msg')); return; }
      const res = await get('/api/contacts/mine/contacts/' + p.id + '/sms');
      const phone = (res.data && res.data.phone) || p.phone;
      const message = (res.data && res.data.message) || '';
      await SMS.sendSMSAsync([phone], message);
    } catch (e) {
      Alert.alert(t('app.circles.cant_open_messages_title'), t('app.circles.please_try_again'));
    }
  }

  // ── Import from phone ─────────────────────────────────────────────────────
  const _name = (s) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const _email = (s) => (s || '').trim().toLowerCase();
  const _phone = (s) => (s || '').replace(/[^0-9]/g, '');
  function isAlreadyAdded(c) {
    const e = _email(c.email), ph = _phone(c.phone), n = _name(c.name);
    return contacts.some((x) => {
      const xe = _email(x.email), xph = _phone(x.phone), xn = _name(x.name);
      return (e && xe && e === xe) || (ph && xph && ph === xph) || (!e && !ph && n && xn && n === xn);
    });
  }
  async function openImporter() {
    if (importBusy) return;
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('app.circles.permission_title'), t('app.circles.permission_msg'),
          [{ text: t('app.circles.not_now'), style: 'cancel' }, { text: t('app.circles.open_settings'), onPress: () => Linking.openSettings() }]);
        return;
      }
      setImportSel({}); setImportSearch(''); setShowImport(true); setImportLoading(true);
      const { data } = await Contacts.getContactsAsync({ fields: [Contacts.Fields.Name, Contacts.Fields.Emails, Contacts.Fields.PhoneNumbers] });
      const mapped = (data || [])
        .map((c) => ({ id: c.id, name: (c.name || [c.firstName, c.lastName].filter(Boolean).join(' ') || '').trim(), email: (c.emails && c.emails[0] && c.emails[0].email) || '', phone: (c.phoneNumbers && c.phoneNumbers[0] && c.phoneNumbers[0].number) || '' }))
        .filter((c) => c.name)
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
      setDeviceContacts(mapped);
    } catch (e) { Alert.alert(t('app.circles.error_title'), t('app.circles.error_open_contacts')); setShowImport(false); }
    finally { setImportLoading(false); }
  }
  const toggleImport = (id) => setImportSel((s) => ({ ...s, [id]: !s[id] }));
  async function doImport() {
    const chosen = deviceContacts.filter((c) => importSel[c.id] && !isAlreadyAdded(c));
    if (!chosen.length || importBusy) return;
    setImportBusy(true);
    try {
      const people = chosen.map((c) => ({ name: c.name, email: c.email, phone: c.phone }));
      const res = await post('/api/contacts/mine/contacts/import', { people });
      const imported = (res.data && res.data.imported) || 0;
      const skipped = (res.data && res.data.skipped) || 0;
      setShowImport(false); await fetchAll();
      const addedText = imported === 1 ? t('app.circles.import_added_one', { count: imported }) : t('app.circles.import_added_many', { count: imported });
      const skippedText = skipped ? t('app.circles.import_skipped', { count: skipped }) : '';
      Alert.alert(t('app.circles.import_complete_title'), t('app.circles.import_complete_msg', { added: addedText, skipped: skippedText }));
    } catch (e) { Alert.alert(t('app.circles.error_title'), t('app.circles.error_import')); }
    finally { setImportBusy(false); }
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

  const _q = importSearch.trim().toLowerCase();
  const filteredDevice = _q ? deviceContacts.filter((c) => (c.name + ' ' + c.email + ' ' + c.phone).toLowerCase().includes(_q)) : deviceContacts;
  const selectedImportCount = deviceContacts.filter((c) => importSel[c.id] && !isAlreadyAdded(c)).length;

  const _rq = recipSearch.trim().toLowerCase();
  const recipList = _rq ? contacts.filter((c) => (c.name + ' ' + (c.email || '') + ' ' + (c.phone || '')).toLowerCase().includes(_rq)) : contacts;

  return (
    <>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>{t('app.circles.page_title')}</Text>
      <Text style={styles.pageSubtitle}>{t('app.circles.page_subtitle')}</Text>

      {/* ===== SHARE AN UPDATE ===== */}
      {contacts.length > 0 ? (
        <View style={[styles.card, styles.notifyCard]}>
          <View style={styles.row}>
            <Send size={18} color={colors.gold} />
            <Text style={styles.cardTitle}>{t('app.share.title')}</Text>
          </View>
          <Text style={[styles.muted, { marginBottom: spacing.sm }]}>{t('app.share.desc')}</Text>

          <Text style={styles.label}>{t('app.share.what_label')}</Text>
          <TouchableOpacity style={styles.scopeBtn} onPress={() => setShowScope(true)}>
            <Text style={styles.scopeBtnText} numberOfLines={1}>{scopeLabel()}</Text>
            <ChevronDown size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <Text style={[styles.label, { marginTop: spacing.sm }]}>{t('app.share.who_label')}</Text>
          {circles.length ? (
            <View style={styles.chips}>
              {circles.map((c) => (
                <TouchableOpacity key={c.id} onPress={() => selectCircle(c)} style={[styles.chip]}>
                  <Text style={styles.chipText}>{t('app.circles.circle_with_count', { name: c.name, count: contacts.filter((p) => (p.circle_ids || []).indexOf(c.id) !== -1).length })}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
          <TouchableOpacity style={styles.chooseBtn} onPress={() => { setRecipSearch(''); setShowRecip(true); }}>
            <UserPlus size={16} color={colors.gold} />
            <Text style={styles.chooseBtnText}>{shareSel.length ? t('app.share.people_selected', { count: shareSel.length }) : t('app.share.choose_people')}</Text>
          </TouchableOpacity>
          {shareSel.length ? (
            <View style={styles.chips}>
              {selectedContacts.map((p) => (
                <TouchableOpacity key={p.id} onPress={() => setShareSel((s) => s.filter((x) => x !== p.id))} style={[styles.chip, styles.chipOn]}>
                  <Text style={[styles.chipText, styles.chipTextOn]}>{p.name}  ×</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <TextInput style={[styles.input, { marginTop: spacing.sm }]} value={shareNote} onChangeText={setShareNote} placeholder={t('app.circles.note_placeholder')} placeholderTextColor={colors.placeholder} maxLength={500} />

          <View style={styles.shareActions}>
            <TouchableOpacity style={[styles.shareBtn, (!textables.length || sending) && styles.dim]} onPress={doText} disabled={!textables.length || sending}>
              <MessageSquare size={17} color="#fff" />
              <Text style={styles.shareBtnText}>{t('app.share.text_btn', { count: textables.length })}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shareBtn, styles.shareBtnAlt, (!emailables.length || sending) && styles.dim]} onPress={doEmail} disabled={!emailables.length || sending}>
              {sending ? <ActivityIndicator color={colors.gold} /> : <><Mail size={17} color={colors.gold} /><Text style={[styles.shareBtnText, styles.shareBtnTextAlt]}>{t('app.share.email_btn', { count: emailables.length })}</Text></>}
            </TouchableOpacity>
          </View>
          <Text style={[styles.muted, { marginTop: spacing.xs, fontSize: typography.sizes.xs }]}>{t('app.share.foot_note')}</Text>
        </View>
      ) : null}

      {/* ===== CIRCLES ===== */}
      <Text style={styles.h2}>{t('app.circles.circles_heading')}</Text>
      {circles.length === 0 ? <Text style={styles.empty}>{t('app.circles.no_circles')}</Text> : null}
      {circles.map((c) => (
        <View key={c.id} style={styles.card}>
          {renameId === c.id ? (
            <View style={styles.row}>
              <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} value={renameVal} onChangeText={setRenameVal} maxLength={120} />
              <TouchableOpacity style={styles.btnSm} onPress={() => saveRename(c.id)}><Text style={styles.btnSmText}>{t('app.circles.save')}</Text></TouchableOpacity>
            </View>
          ) : (
            <View style={styles.cardHead}>
              <View>
                <Text style={styles.cardTitle}>{c.name}</Text>
                <Text style={styles.muted}>{c.member_count === 1 ? t('app.circles.member_count_one', { count: c.member_count }) : t('app.circles.member_count_many', { count: c.member_count })}</Text>
              </View>
              <View style={styles.rowEnd}>
                <TouchableOpacity onPress={() => { setRenameId(c.id); setRenameVal(c.name); }}><Text style={styles.link}>{t('app.circles.rename')}</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => deleteCircle(c)}><Trash2 size={18} color={colors.error} /></TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      ))}
      <View style={styles.card}>
        <View style={styles.row}>
          <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} value={newCircle} onChangeText={setNewCircle} placeholder={t('app.circles.new_circle_placeholder')} placeholderTextColor={colors.placeholder} maxLength={120} />
          <TouchableOpacity style={[styles.btnSm, (!newCircle.trim() || busy) && styles.dim]} onPress={addCircle} disabled={!newCircle.trim() || busy}><Text style={styles.btnSmText}>{t('app.circles.add')}</Text></TouchableOpacity>
        </View>
      </View>

      {/* ===== CONTACT LIST ===== */}
      <Text style={styles.h2}>{t('app.circles.contact_list_heading')}</Text>
      {contacts.length === 0 ? <Text style={styles.empty}>{t('app.circles.no_contacts')}</Text> : null}
      {contacts.map((p) => (
        <View key={p.id} style={styles.card}>
          {editId === p.id ? (
            <View>
              <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholder={t('app.circles.name_placeholder')} placeholderTextColor={colors.placeholder} />
              <TextInput style={styles.input} value={editEmail} onChangeText={setEditEmail} placeholder={t('app.circles.email_placeholder')} placeholderTextColor={colors.placeholder} autoCapitalize="none" keyboardType="email-address" />
              <TextInput style={styles.input} value={editPhone} onChangeText={setEditPhone} placeholder={t('app.circles.phone_placeholder')} placeholderTextColor={colors.placeholder} keyboardType="phone-pad" />
              {circles.length ? <><Text style={styles.label}>{t('app.circles.circles_label')}</Text><Chips selected={editSel} onToggle={(id) => setEditSel((s) => toggle(s, id))} /></> : null}
              <View style={styles.rowEnd}>
                <TouchableOpacity onPress={() => setEditId(null)}><Text style={styles.link}>{t('app.circles.cancel')}</Text></TouchableOpacity>
                <TouchableOpacity style={styles.btnSm} onPress={() => saveContact(p.id)}><Text style={styles.btnSmText}>{t('app.circles.save')}</Text></TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle}>{p.name}</Text>
                <View style={styles.rowEnd}>
                  {p.phone ? (
                    <TouchableOpacity onPress={() => textContact(p)} style={styles.textBtn}>
                      <MessageSquare size={15} color={colors.gold} />
                      <Text style={styles.link}>{t('app.circles.text')}</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity onPress={() => startEdit(p)}><Text style={styles.link}>{t('app.circles.edit')}</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteContact(p)}><Trash2 size={18} color={colors.error} /></TouchableOpacity>
                </View>
              </View>
              <Text style={styles.muted}>{p.email || t('app.circles.no_email')}{p.phone ? ' · ' + p.phone : ''}</Text>
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
      <TouchableOpacity style={[styles.card, styles.importRow]} onPress={openImporter} activeOpacity={0.7} disabled={importBusy}>
        <UserPlus size={22} color={colors.gold} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{t('app.circles.import_from_phone_title')}</Text>
          <Text style={styles.muted}>{t('app.circles.import_from_phone_desc')}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.label}>{t('app.circles.add_person_label')}</Text>
        <TextInput style={styles.input} value={cName} onChangeText={setCName} placeholder={t('app.circles.full_name_placeholder')} placeholderTextColor={colors.placeholder} />
        <TextInput style={styles.input} value={cEmail} onChangeText={setCEmail} placeholder={t('app.circles.email_placeholder')} placeholderTextColor={colors.placeholder} autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={styles.input} value={cPhone} onChangeText={setCPhone} placeholder={t('app.circles.phone_placeholder')} placeholderTextColor={colors.placeholder} keyboardType="phone-pad" />
        {circles.length ? <><Text style={styles.label}>{t('app.circles.add_to_circles_label')}</Text><Chips selected={newSel} onToggle={(id) => setNewSel((s) => toggle(s, id))} /></> : null}
        <TouchableOpacity style={[styles.btn, (!cName.trim() || busy) && styles.dim]} onPress={addContact} disabled={!cName.trim() || busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t('app.circles.add_person_button')}</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>

    {/* Scope picker */}
    <Modal visible={showScope} animationType="slide" transparent onRequestClose={() => setShowScope(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.modalHead}>
            <Text style={styles.modalTitle}>{t('app.share.what_label')}</Text>
            <TouchableOpacity onPress={() => setShowScope(false)}><Text style={styles.link}>{t('app.circles.close')}</Text></TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 420 }} keyboardShouldPersistTaps="handled">
            <ScopeRow label={t('app.share.whole_website')} on={!scope || scope.type === 'all'} onPress={() => { setScope({ type: 'all' }); setShowScope(false); }} />
            {(targets.sections || []).map((s) => (
              <ScopeRow key={s.value} label={s.label} on={scope.type === 'section' && scope.value === s.value} onPress={() => { setScope({ type: 'section', value: s.value, label: s.label }); setShowScope(false); }} />
            ))}
            {(targets.galleries || []).length ? <Text style={[styles.label, { marginTop: spacing.sm }]}>{t('app.share.galleries_label')}</Text> : null}
            {(targets.galleries || []).map((g) => (
              <ScopeRow key={g.id} label={g.title} on={scope.type === 'gallery' && scope.id === g.id} onPress={() => { setScope({ type: 'gallery', id: g.id, title: g.title }); setShowScope(false); }} />
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>

    {/* Recipient picker */}
    <Modal visible={showRecip} animationType="slide" transparent onRequestClose={() => setShowRecip(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.modalHead}>
            <Text style={styles.modalTitle}>{t('app.share.choose_people')}</Text>
            <TouchableOpacity onPress={() => setShowRecip(false)}><Text style={styles.link}>{t('app.circles.done')}</Text></TouchableOpacity>
          </View>
          <View style={styles.searchRow}>
            <Search size={16} color={colors.textSecondary} />
            <TextInput style={styles.searchInput} value={recipSearch} onChangeText={setRecipSearch} placeholder={t('app.circles.search_placeholder')} placeholderTextColor={colors.placeholder} autoCapitalize="none" />
          </View>
          <FlatList
            data={recipList}
            keyExtractor={(item) => String(item.id)}
            keyboardShouldPersistTaps="handled"
            style={styles.pickList}
            ListEmptyComponent={<Text style={[styles.muted, { textAlign: 'center', padding: spacing.lg }]}>{t('app.circles.no_contacts')}</Text>}
            renderItem={({ item }) => {
              const on = shareSel.indexOf(item.id) !== -1;
              const reach = [item.email ? t('app.share.via_email') : null, item.phone ? t('app.share.via_text') : null].filter(Boolean).join(' · ') || t('app.circles.no_email_or_phone');
              return (
                <TouchableOpacity style={styles.pickRow} activeOpacity={0.6} onPress={() => setShareSel((s) => toggle(s, item.id))}>
                  <View style={[styles.checkbox, on && styles.checkboxOn]}>{on ? <Check size={14} color="#fff" /> : null}</View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickName}>{item.name}</Text>
                    <Text style={styles.muted} numberOfLines={1}>{reach}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
          <TouchableOpacity style={styles.btn} onPress={() => setShowRecip(false)}>
            <Text style={styles.btnText}>{shareSel.length ? t('app.share.done_count', { count: shareSel.length }) : t('app.circles.done')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

    {/* Import-from-phone picker */}
    <Modal visible={showImport} animationType="slide" transparent onRequestClose={() => setShowImport(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.modalHead}>
            <Text style={styles.modalTitle}>{t('app.circles.import_modal_title')}</Text>
            <TouchableOpacity onPress={() => setShowImport(false)}><Text style={styles.link}>{t('app.circles.close')}</Text></TouchableOpacity>
          </View>
          <Text style={[styles.muted, { marginBottom: spacing.sm }]}>{t('app.circles.import_modal_desc')}</Text>
          <TextInput style={styles.input} value={importSearch} onChangeText={setImportSearch} placeholder={t('app.circles.search_placeholder')} placeholderTextColor={colors.placeholder} autoCapitalize="none" />
          {importLoading ? (
            <View style={styles.modalLoading}><ActivityIndicator size="large" color={colors.gold} /></View>
          ) : (
            <FlatList
              data={filteredDevice}
              keyExtractor={(item) => String(item.id)}
              keyboardShouldPersistTaps="handled"
              style={styles.pickList}
              ListEmptyComponent={<Text style={[styles.muted, { textAlign: 'center', padding: spacing.lg }]}>{t('app.circles.no_device_contacts')}</Text>}
              renderItem={({ item }) => {
                const added = isAlreadyAdded(item);
                const on = !!importSel[item.id];
                return (
                  <TouchableOpacity style={styles.pickRow} activeOpacity={added ? 1 : 0.6} disabled={added} onPress={() => toggleImport(item.id)}>
                    <View style={[styles.checkbox, on && styles.checkboxOn, added && styles.checkboxDim]}>{on ? <Check size={14} color="#fff" /> : null}</View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickName}>{item.name}</Text>
                      <Text style={styles.muted} numberOfLines={1}>{item.email || item.phone || t('app.circles.no_email_or_phone')}</Text>
                    </View>
                    {added ? <Text style={styles.addedTag}>{t('app.circles.added_tag')}</Text> : null}
                  </TouchableOpacity>
                );
              }}
            />
          )}
          <TouchableOpacity style={[styles.btn, (!selectedImportCount || importBusy) && styles.dim]} onPress={doImport} disabled={!selectedImportCount || importBusy}>
            {importBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{selectedImportCount ? t('app.circles.import_with_count', { count: selectedImportCount }) : t('app.circles.import_button')}</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    </>
  );
}

function ScopeRow({ label, on, onPress }) {
  return (
    <TouchableOpacity style={styles.scopeRow} activeOpacity={0.6} onPress={onPress}>
      <Text style={[styles.scopeRowText, on && styles.scopeRowTextOn]}>{label}</Text>
      {on ? <Check size={16} color={colors.gold} /> : null}
    </TouchableOpacity>
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
  // scope selector
  scopeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: colors.gold, borderRadius: borderRadius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, backgroundColor: colors.white },
  scopeBtnText: { flex: 1, fontSize: typography.sizes.md, color: colors.textPrimary, fontWeight: typography.weights.medium },
  scopeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  scopeRowText: { fontSize: typography.sizes.md, color: colors.textPrimary },
  scopeRowTextOn: { color: colors.gold, fontWeight: typography.weights.semibold },
  // choose people
  chooseBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.gold, borderStyle: 'dashed', borderRadius: borderRadius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, justifyContent: 'center', marginVertical: spacing.xs },
  chooseBtnText: { color: colors.gold, fontWeight: typography.weights.semibold, fontSize: typography.sizes.sm },
  // share actions
  shareActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  shareBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.gold, borderRadius: borderRadius.md, paddingVertical: spacing.md, minHeight: 48 },
  shareBtnAlt: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.gold },
  shareBtnText: { color: '#fff', fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
  shareBtnTextAlt: { color: colors.gold },
  // buttons
  btn: { backgroundColor: colors.gold, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', minHeight: 48, justifyContent: 'center', marginTop: spacing.xs },
  btnText: { color: '#fff', fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
  btnSm: { backgroundColor: colors.gold, borderRadius: borderRadius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, justifyContent: 'center' },
  btnSmText: { color: '#fff', fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold },
  dim: { opacity: 0.4 },
  textBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  importRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg, maxHeight: '88%' },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  modalTitle: { fontFamily: typography.fontFamily.serif, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.textPrimary },
  modalLoading: { padding: spacing.xxl, alignItems: 'center' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  searchInput: { flex: 1, paddingVertical: spacing.sm, fontSize: typography.sizes.md, color: colors.textPrimary },
  pickList: { flexGrow: 0, marginBottom: spacing.sm, maxHeight: 380 },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  pickName: { fontSize: typography.sizes.md, color: colors.textPrimary, fontWeight: typography.weights.medium },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  checkboxDim: { opacity: 0.4 },
  addedTag: { fontSize: typography.sizes.xs, color: colors.textSecondary, fontStyle: 'italic' },
});
