import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { get, put } from '../api/client';
import PhotoPicker from '../components/PhotoPicker';

export default function ChildInfoScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [weightLbs, setWeightLbs] = useState('');
  const [weightOz, setWeightOz] = useState('');
  const [lengthInches, setLengthInches] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [hospital, setHospital] = useState('');
  const [nameMeaning, setNameMeaning] = useState('');
  const [heroImage, setHeroImage] = useState('');

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
        setBirthTime(child.birth_time || child.birthTime || '');
        setWeightLbs(String(child.weight_lbs || child.weightLbs || ''));
        setWeightOz(String(child.weight_oz || child.weightOz || ''));
        setLengthInches(String(child.length_inches || child.lengthInches || ''));
        setCity(child.city || '');
        setState(child.state || '');
        setHospital(child.hospital || '');
        setNameMeaning(child.name_meaning || child.nameMeaning || '');
        setHeroImage(book.hero_image_path || '');
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
      await put('/api/books/mine', {
        hero_image_path: heroImage || null,
        child: {
          first_name: firstName.trim(),
          middle_name: middleName.trim(),
          last_name: lastName.trim(),
          birth_date: birthDate.trim(),
          birth_time: birthTime.trim(),
          weight_lbs: weightLbs ? Number(weightLbs) : null,
          weight_oz: weightOz ? Number(weightOz) : null,
          length_inches: lengthInches ? Number(lengthInches) : null,
          city: city.trim(),
          state: state.trim(),
          hospital: hospital.trim(),
          name_meaning: nameMeaning.trim(),
        },
      });
      Alert.alert('Saved', 'Child information updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
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
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
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

        <Text style={styles.label}>Birth Date (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={birthDate}
          onChangeText={setBirthDate}
          placeholder="2024-01-15"
          placeholderTextColor={colors.placeholder}
        />

        <Text style={styles.label}>Birth Time</Text>
        <TextInput
          style={styles.input}
          value={birthTime}
          onChangeText={setBirthTime}
          placeholder="3:42 PM"
          placeholderTextColor={colors.placeholder}
        />

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
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
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
