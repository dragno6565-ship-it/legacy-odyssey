# Handoff: Remove Free Signup from Mobile App

## Context
The Legacy Odyssey mobile app (React Native / Expo) currently has a full signup form in the Auth stack that creates **free accounts** — no payment, no subscription. Users who download the app and tap "Create Account" get a free `{subdomain}.legacyodyssey.com` book with zero conversion to a paid `.com` plan.

**This must be removed.** There are no free accounts. All signups happen at `https://legacyodyssey.com` (paid, includes a real `.com` domain).

The fix is two files. Do not touch anything else.

---

## Repo
- **Local path:** `F:\legacy-odyssey`
- **Branch:** `main`
- **Push to origin triggers Railway deploy** (backend — not needed for this change, but good to know)
- **Mobile app path:** `F:\legacy-odyssey\mobile`
- After making changes, a new EAS build is needed (see bottom).

---

## File 1 — REPLACE ENTIRELY
**Path:** `F:\legacy-odyssey\mobile\src\auth\SignupScreen.js`

The current file is a full signup form (displayName, subdomain, email, password, confirmPassword) that calls `signup()` from AuthContext and creates a backend account. **Replace the entire file with the following:**

```javascript
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  SafeAreaView,
} from 'react-native';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';

export default function SignupScreen({ navigation }) {
  function handleGetStarted() {
    Linking.openURL('https://legacyodyssey.com');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Branding */}
        <View style={styles.brandingContainer}>
          <Text style={styles.brandIcon}>📖</Text>
          <Text style={styles.brandTitle}>Legacy Odyssey</Text>
          <Text style={styles.brandSubtitle}>Your family's story, beautifully told</Text>
        </View>

        {/* Pitch */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Get Your Own Family Book</Text>
          <Text style={styles.cardBody}>
            Every Legacy Odyssey subscription includes your own personal{' '}
            <Text style={styles.cardHighlight}>.com domain</Text> — so your family's
            book lives at a real address like{' '}
            <Text style={styles.cardHighlight}>your-childs-name.com</Text>.
          </Text>
          <Text style={styles.cardBody}>
            Plans start at just <Text style={styles.cardHighlight}>$29 for your first year</Text>.
            Sign up takes 2 minutes on our website.
          </Text>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleGetStarted}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Get Started at legacyodyssey.com</Text>
        </TouchableOpacity>

        {/* Already have account */}
        <TouchableOpacity
          style={styles.linkContainer}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.linkText}>
            Already have an account?{' '}
            <Text style={styles.linkBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  brandingContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  brandIcon: {
    fontSize: 56,
    marginBottom: spacing.sm,
  },
  brandTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  brandSubtitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.card,
  },
  cardTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  cardBody: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  cardHighlight: {
    color: colors.gold,
    fontWeight: typography.weights.semibold,
  },
  button: {
    backgroundColor: colors.gold,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    ...shadows.button,
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
    padding: spacing.sm,
  },
  linkText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  linkBold: {
    color: colors.gold,
    fontWeight: typography.weights.semibold,
  },
});
```

---

## File 2 — ONE LINE CHANGE
**Path:** `F:\legacy-odyssey\mobile\src\auth\LoginScreen.js`

Near the bottom of the JSX (around line 132–141), there is a "Don't have an account?" link:

```javascript
// CURRENT (remove this):
<TouchableOpacity
  style={styles.linkContainer}
  onPress={() => navigation.navigate('Signup')}
  disabled={loading}
>
  <Text style={styles.linkText}>
    Don't have an account?{' '}
    <Text style={styles.linkBold}>Create Account</Text>
  </Text>
</TouchableOpacity>
```

Replace it with:

```javascript
// NEW:
<TouchableOpacity
  style={styles.linkContainer}
  onPress={() => Linking.openURL('https://legacyodyssey.com')}
  disabled={loading}
>
  <Text style={styles.linkText}>
    Don't have an account?{' '}
    <Text style={styles.linkBold}>Get Started</Text>
  </Text>
</TouchableOpacity>
```

Also add `Linking` to the existing react-native import at the top of LoginScreen.js. The current import is:
```javascript
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
```

Change to:
```javascript
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
```

---

## What NOT to touch
- `AuthContext.js` — leave the `signup()` function in place (needed by existing flow; just not called anymore)
- `App.js` — the `Signup` route in the navigator can stay registered (no harm)
- Any backend files
- Any other screens

---

## After making the changes

1. **Bump the app version** in `F:\legacy-odyssey\mobile\app.json`:
   - Change `"version": "1.0.7"` → `"1.0.8"` (or whatever is next)

2. **Build for both platforms:**
   ```bash
   cd F:\legacy-odyssey\mobile
   eas build --platform all --profile production
   ```

3. **Submit to both stores:**
   ```bash
   # iOS
   eas submit --platform ios --latest

   # Android
   eas submit --platform android --latest
   ```

   ⚠️ **DO NOT click "Submit for Review" in App Store Connect without explicit permission from the user. Ask first.**

4. **Commit the changes** to git and push to origin main.

---

## Design context
- `colors.background = '#faf7f2'` (warm cream)
- `colors.gold = '#c8a96e'` (primary accent — all CTAs)
- `colors.textPrimary = '#2c2416'`
- `colors.textSecondary = '#8a7e6b'`
- Fonts: serif = Cormorant Garamond feel; the theme file is at `F:\legacy-odyssey\mobile\src\theme\index.js`
