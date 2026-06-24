import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { post } from '../api/client';
import { useI18n } from '../i18n/I18nContext';

export default function HelpScreen({ navigation }) {
  const { t } = useI18n();
  const TOPICS = [
    { value: 'general', label: t('app.help.topic_general') },
    { value: 'account', label: t('app.help.topic_account') },
    { value: 'billing', label: t('app.help.topic_billing') },
    { value: 'bug', label: t('app.help.topic_bug') },
    { value: 'feature', label: t('app.help.topic_feature') },
  ];
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('general');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSubmit() {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert(t('app.help.alert_missing_title'), t('app.help.alert_missing_message'));
      return;
    }

    setSending(true);
    try {
      await post('/api/contact', { name: name.trim(), email: email.trim(), topic, message: message.trim() });
      Alert.alert(t('app.help.alert_sent_title'), t('app.help.alert_sent_message'), [
        { text: t('app.help.alert_ok'), onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert(t('app.help.alert_error_title'), t('app.help.alert_error_message'));
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>{t('app.help.heading')}</Text>
        <Text style={styles.subtext}>
          {t('app.help.subtext')}
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>{t('app.help.label_name')}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t('app.help.placeholder_name')}
            placeholderTextColor={colors.placeholder}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('app.help.label_email')}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder={t('app.help.placeholder_email')}
            placeholderTextColor={colors.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('app.help.label_topic')}</Text>
          <View style={styles.topicRow}>
            {TOPICS.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[styles.topicChip, topic === t.value && styles.topicChipActive]}
                onPress={() => setTopic(t.value)}
              >
                <Text style={[styles.topicChipText, topic === t.value && styles.topicChipTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('app.help.label_message')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={message}
            onChangeText={setMessage}
            placeholder={t('app.help.placeholder_message')}
            placeholderTextColor={colors.placeholder}
            multiline
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, sending && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={sending}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>{sending ? t('app.help.sending') : t('app.help.send_message')}</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <Text style={styles.orText}>{t('app.help.or_email')}</Text>
        <TouchableOpacity onPress={() => Linking.openURL('mailto:help@legacyodyssey.com')}>
          <Text style={styles.emailLink}>help@legacyodyssey.com</Text>
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
  content: {
    padding: spacing.lg,
    paddingBottom: 60,
  },
  heading: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtext: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  topicRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  topicChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBg,
  },
  topicChipActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  topicChipText: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  topicChipTextActive: {
    color: colors.white,
    fontWeight: typography.weights.semibold,
  },
  submitButton: {
    backgroundColor: colors.gold,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
    ...shadows.button,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xl,
  },
  orText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emailLink: {
    color: colors.gold,
    textAlign: 'center',
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.lg,
  },
});
