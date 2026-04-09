import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../theme';

/**
 * Centered floating toast that fades in and auto-dismisses.
 *
 * Usage:
 *   const { showToast, ToastComponent } = useSavedToast();
 *   // In JSX:  {ToastComponent}
 *   // To trigger: showToast('Saved!')
 */
export function useSavedToast() {
  const opacity = useRef(new Animated.Value(0)).current;
  const [message, setMessage] = React.useState('');
  const [visible, setVisible] = React.useState(false);
  const timerRef = useRef(null);

  function showToast(msg, durationMs = 1800) {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage(msg || 'Saved');
    setVisible(true);
    opacity.setValue(0);

    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    timerRef.current = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }, durationMs);
  }

  const ToastComponent = visible ? (
    <Animated.View style={[styles.toast, { opacity }]} pointerEvents="none">
      <Text style={styles.title}>Saved</Text>
      {message !== 'Saved' && <Text style={styles.message}>{message}</Text>}
    </Animated.View>
  ) : null;

  return { showToast, ToastComponent };
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    backgroundColor: colors.dark,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gold,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    zIndex: 999,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.gold,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
});
