import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import { colors, typography } from '../theme';

/**
 * Compact EN | ES switch for the pre-login screens (Login/Signup/Forgot),
 * where a user can't yet reach Settings. Tapping sets an explicit language
 * override that persists; the device-language default still applies until then.
 */
export default function LanguageToggle({ style }) {
  const { lang, setPref } = useI18n();
  return (
    <View style={[styles.wrap, style]}>
      {[['en', 'EN'], ['es', 'ES'], ['hi', 'हिं']].map(([code, label]) => {
        const active = lang === code;
        return (
          <TouchableOpacity
            key={code}
            onPress={() => setPref(code)}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            style={[styles.pill, active && styles.pillActive]}
          >
            <Text style={[styles.txt, active && styles.txtActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    padding: 2,
  },
  pill: { paddingVertical: 4, paddingHorizontal: 14, borderRadius: 999 },
  pillActive: { backgroundColor: colors.gold },
  txt: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.5,
  },
  txtActive: { color: colors.white },
});
