import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, spacing, typography } from '../theme';
import { BASE_URL } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nContext';

export default function PreviewScreen({ route }) {
  const { slug, bookPassword, familyId } = route.params || {};
  const { user } = useAuth();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Construct the book URL - the web book is served from the API host
  // Use the family's subdomain from user context if available
  const effectiveSlug = slug || user?.subdomain;
  const bookUrl = effectiveSlug
    ? `${BASE_URL}/book/${effectiveSlug}`
    : `${BASE_URL}/book`;

  // If we know the book password and family ID, inject it as a cookie
  // so the WebView doesn't show the password prompt
  const injectedJS = bookPassword && familyId
    ? `
      // Auto-submit the password form if it appears
      (function() {
        const form = document.querySelector('form');
        const input = document.querySelector('input[type="password"]');
        if (form && input) {
          input.value = '${bookPassword.replace(/'/g, "\\'")}';
          form.submit();
        }
      })();
      true;
    `
    : 'true;';

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={styles.loadingText}>{t('app.preview.loading')}</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {t('app.preview.error')}
          </Text>
        </View>
      )}

      <WebView
        source={{ uri: bookUrl }}
        style={styles.webview}
        injectedJavaScript={injectedJS}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        onHttpError={() => {
          setLoading(false);
          setError(true);
        }}
        startInLoadingState={false}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        sharedCookiesEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    zIndex: 10,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.serif,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
