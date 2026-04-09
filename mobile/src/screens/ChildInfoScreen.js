import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { useHeaderHeight } from '@react-navigation/elements';
import { get, put } from '../api/client';
import PhotoPicker from '../components/PhotoPicker';
import { useSavedToast } from '../components/SavedToast';

// ── Time helpers ────────────────────────────────────────────────────────────
function parseTime(timeStr) {
  if (!timeStr) return { hour: '', minute: '', ampm: 'AM' };
  // "3:42 PM" or "03:42 PM"
  const match12 = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    return {
      hour: String(parseInt(match12[1])),
      minute: match12[2],
      ampm: match12[3].toUpperCase(),
    };
  }
  // "14:30" 24-hour legacy format
  const match24 = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    let h = parseInt(match24[1]);
    const m = match24[2];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return { hour: String(h), minute: m, ampm };
  }
  return { hour: '', minute: '', ampm: 'AM' };
}

function formatTime(hour, minute, ampm) {
  if (!hour) return '';
  const m = (minute || '00').padStart(2, '0');
  return `${hour}:${m} ${ampm}`;
}

export default function ChildInfoScreen({ navigation }) {
  const headerHeight = useHeaderHeight();
  const { showToast, ToastComponent } = useSavedToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Child info fields
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthHour, setBirthHour] = useState('');
  const [birthMinute, setBirthMinute] = useState('');
  const [birthAmpm, setBirthAmpm] = useState('AM');
  const [weightLbs, setWeightLbs] = useState('');
  const [weightOz, setWeightOz] = useState('');
  const [lengthInches, setLengthInches] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [hospital, setHospital] = useState('');
  const [nameMeaning, setNameMeaning] = useState('');
  const [heroImage, setHeroImage] = useState('');

  // Welcome page customization
  const [nameQuote, setNameQuote] = useState('');
  const [parentQuote, setParentQuote] = useState('');
  const [parentQuoteAttribution, setParentQuoteAttribution] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await get('/api/books/mine');
        const book = res.data;
        const child = book.child || book.childInfo || {};
        setFirstName(child.first_name || child.firstName || '');
        setMiddleName(child.middle_name || child.middleName || '');
        setLastName(child.last_name || child.lastName || '');
        setBirthDate(child.birth_date || child.birthDate || '');

        const parsed = parseTime(child.birth_time || child.birthTime || '');
        setBirthHour(parsed.hour);
        setBirthMinute(parsed.minute);
        setBirthAmpm(parsed.ampm);

        setWeightLbs(String(child.weight_lbs || child.weightLbs || ''));
        setWeightOz(String(child.weight_oz || child.weightOz || ''));
        setLengthInches(String(child.length_inches || child.lengthInches || ''));
        setCity(child.city || '');
        setState(child.state || '');
        setHospital(child.hospital || '');
        setNameMeaning(child.name_meaning || child.nameMeaning || '');
        setHeroImage(book.hero_image_path || '');

        // Welcome page fields (top-level book fields, not child sub-object)
        setNameQuote(book.name_quote || '');
        setParentQuote(book.parent_quote || '');
        setParentQuoteAttribution(book.parent_quote_attribution || '');
      } catch (err) {
        setError(err.message || 'Failed to load child info.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const birthTime = formatTime(birthHour, birthMinute, birthAmpm);
      await put('/api/books/mine', {
        hero_image_path: heroImage || null,
        name_quote: nameQuote.trim() || null,
        parent_quote: parentQuote.trim() || null,
        parent_quote_attribution: parentQuoteAttribution.trim() || null,
        child: {
          first_name: firstName.trim(),
          middle_name: middleName.trim(),
          last_name: lastName.trim(),
          birth_date: birthDate.trim(),
          birth_time: birthTime,
          weight_lbs: weightLbs ? Number(weightLbs) : null,
          weight_oz: weightOz ? Number(weightOz) : null,
          length_inches: lengthInches ? Number(lengthInches) : null,
          city: city.trim(),
          state: state.trim(),
          hospital: hospital.trim(),
          name_meaning: nameMeaning.trim(),
        },
      });
      showToast('Child information updated successfully.');
      setTimeout(() => navigation.goBack(), 1800);
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Child Information</Text>

        <Text style={styles.label}>Hero Photo</Text>
        <Text style={styles.helperText}>
          This photo appears on the Welcome page of your book website
        </Text>
        <PhotoPicker
          currentPhoto={heroImage}
          onPhotoSelected={(photoPath) => setHeroImage(photoPath)}
        />

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* ── Name ── */}
        <View style={styles.row}>
          <View style={styles.thirdField}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First"
              placeholderTextColor={colors.placeholder}
            />
          </View>
          <View style={styles.thirdField}>
            <Text style={styles.label}>Middle Name</Text>
            <TextInput
              style={styles.input}
              value={middleName}
              onChangeText={setMiddleName}
              placeholder="Middle"
              placeholderTextColor={colors.placeholder}
            />
          </View>
          <View style={styles.thirdField}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last"
              placeholderTextColor={colors.placeholder}
            />
          </View>
        </View>

        {/* ── Birth Date ── */}
        <Text style={styles.label}>Birth Date</Text>
        <View style={styles.row}>
          <View style={styles.thirdField}>
            <Text style={styles.helperText}>Month</Text>
            <TextInput
              style={styles.input}
              value={birthDate ? String(parseInt(birthDate.split('-')[1]) || '') : ''}
              onChangeText={(val) => {
                const parts = (birthDate || '--').split('-');
                parts[1] = val.replace(/[^0-9]/g, '').slice(0, 2).padStart(2, '0');
                setBirthDate(parts.join('-'));
              }}
              placeholder="3"
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
              maxLength={2}
            />
          </View>
          <View style={styles.thirdField}>
            <Text style={styles.helperText}>Day</Text>
            <TextInput
              style={styles.input}
              value={birthDate ? String(parseInt(birthDate.split('-')[2]) || '') : ''}
              onChangeText={(val) => {
                const parts = (birthDate || '--').split('-');
                parts[2] = val.replace(/[^0-9]/g, '').slice(0, 2).padStart(2, '0');
                setBirthDate(parts.join('-'));
              }}
              placeholder="15"
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
              maxLength={2}
            />
          </View>
          <View style={styles.thirdField}>
            <Text style={styles.helperText}>Year</Text>
            <TextInput
              style={styles.input}
              value={birthDate ? birthDate.split('-')[0] : ''}
              onChangeText={(val) => {
                const parts = (birthDate || '--').split('-');
                parts[0] = val.replace(/[^0-9]/g, '').slice(0, 4);
                setBirthDate(parts.join('-'));
              }}
              placeholder="2024"
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
              maxLength={4}
            />
          </View>
        </View>

        {/* ── Birth Time (12-hour) ── */}
        <Text style={styles.label}>Birth Time</Text>
        <View style={styles.timeRow}>
          <View style={styles.timeHourWrap}>
            <Text style={styles.helperText}>Hour</Text>
            <TextInput
              style={styles.input}
              value={birthHour}
              onChangeText={(val) => {
                const n = val.replace(/[^0-9]/g, '');
                if (n === '' || (parseInt(n) >= 1 && parseInt(n) <= 12)) setBirthHour(n);
              }}
              placeholder="3"
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
              maxLength={2}
            />
          </View>
          <Text style={styles.timeColon}>:</Text>
          <View style={styles.timeMinuteWrap}>
            <Text style={styles.helperText}>Minute</Text>
            <TextInput
              style={styles.input}
              value={birthMinute}
              onChangeText={(val) => {
                const n = val.replace(/[^0-9]/g, '').slice(0, 2);
                setBirthMinute(n);
              }}
              placeholder="42"
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
              maxLength={2}
            />
          </View>
          <View style={styles.ampmWrap}>
            <Text style={styles.helperText}>AM/PM</Text>
            <View style={styles.ampmToggle}>
              <TouchableOpacity
                style={[styles.ampmBtn, birthAmpm === 'AM' && styles.ampmBtnActive]}
                onPress={() => setBirthAmpm('AM')}
              >
                <Text style={[styles.ampmBtnText, birthAmpm === 'AM' && styles.ampmBtnTextActive]}>AM</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.ampmBtn, birthAmpm === 'PM' && styles.ampmBtnActive]}
                onPress={() => setBirthAmpm('PM')}
              >
                <Text style={[styles.ampmBtnText, birthAmpm === 'PM' && styles.ampmBtnTextActive]}>PM</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Stats ── */}
        <View style={styles.row}>
          <View style={styles.thirdField}>
            <Text style={styles.label}>Weight (lbs)</Text>
            <TextInput
              style={styles.input}
              value={weightLbs}
              onChangeText={setWeightLbs}
              placeholder="7"
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.thirdField}>
            <Text style={styles.label}>Weight (oz)</Text>
            <TextInput
              style={styles.input}
              value={weightOz}
              onChangeText={setWeightOz}
              placeholder="8"
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.thirdField}>
            <Text style={styles.label}>Length (in)</Text>
            <TextInput
              style={styles.input}
              value={lengthInches}
              onChangeText={setLengthInches}
              placeholder="20"
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="City"
              placeholderTextColor={colors.placeholder}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>State</Text>
            <TextInput
              style={styles.input}
              value={state}
              onChangeText={setState}
              placeholder="State"
              placeholderTextColor={colors.placeholder}
            />
          </View>
        </View>

        <Text style={styles.label}>Hospital</Text>
        <TextInput
          style={styles.input}
          value={hospital}
          onChangeText={setHospital}
          placeholder="Hospital name"
          placeholderTextColor={colors.placeholder}
        />

        <Text style={styles.label}>Name Meaning</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={nameMeaning}
          onChangeText={setNameMeaning}
          placeholder="What does the name mean to your family?"
          placeholderTextColor={colors.placeholder}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* ── Welcome Page Customization ── */}
        <View style={styles.sectionDivider} />
        <Text style={styles.sectionTitle}>Welcome Page</Text>
        <Text style={styles.sectionSubtitle}>
          Customize the text that appears on your book's cover page
        </Text>

        <Text style={styles.label}>Name Subtitle</Text>
        <Text style={styles.helperText}>
          Shown under your child's name. Leave blank for the default.
        </Text>
        <TextInput
          style={styles.input}
          value={nameQuote}
          onChangeText={setNameQuote}
          placeholder="A name chosen with love, meaning, and intention"
          placeholderTextColor={colors.placeholder}
        />

        <Text style={styles.label}>Family Message</Text>
        <Text style={styles.helperText}>
          The quote shown at the bottom of the welcome page.
        </Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={parentQuote}
          onChangeText={setParentQuote}
          placeholder="From the moment we first saw your face, our world was never the same..."
          placeholderTextColor={colors.placeholder}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Message By</Text>
        <TextInput
          style={styles.input}
          value={parentQuoteAttribution}
          onChangeText={setParentQuoteAttribution}
          placeholder="Mom & Dad"
          placeholderTextColor={colors.placeholder}
        />

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      {ToastComponent}
    </KeyboardAvoidingView>
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
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 150,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xl,
  },
  errorContainer: {
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  helperText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  multilineInput: {
    minHeight: 100,
    paddingTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfField: {
    flex: 1,
  },
  thirdField: {
    flex: 1,
  },
  // ── Time picker ──
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  timeHourWrap: {
    width: 64,
  },
  timeColon: {
    fontSize: 24,
    color: colors.textPrimary,
    fontWeight: typography.weights.bold,
    paddingBottom: spacing.md,
    paddingHorizontal: 2,
  },
  timeMinuteWrap: {
    width: 64,
  },
  ampmWrap: {
    flex: 1,
  },
  ampmToggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    height: 46,
  },
  ampmBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  ampmBtnActive: {
    backgroundColor: colors.gold,
  },
  ampmBtnText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  ampmBtnTextActive: {
    color: colors.white,
    fontWeight: typography.weights.semibold,
  },
  saveButton: {
    backgroundColor: colors.gold,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    minHeight: 50,
    ...shadows.button,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
});
