/**
 * App-wide language state. Spanish is AUTOMATIC: with the 'auto' preference
 * (the default) the app follows the phone's language. A manual override
 * (Settings → Language) pins English or Spanish and persists across launches.
 *
 * Usage:  const { t, lang, pref, setPref } = useI18n();
 *         <Text>{t('settings.language_title')}</Text>
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as SecureStore from 'expo-secure-store';
import { translate, deviceLanguage, SUPPORTED, DEFAULT } from './index';

const PREF_KEY = 'legacy_odyssey_lang_pref'; // 'auto' | 'en' | 'es'
const PREFS = ['auto', ...SUPPORTED];

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [pref, setPrefState] = useState('auto');
  const [device, setDevice] = useState(DEFAULT);

  useEffect(() => {
    setDevice(deviceLanguage());
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(PREF_KEY);
        if (stored && PREFS.includes(stored)) setPrefState(stored);
      } catch (e) {
        /* ignore — fall back to auto */
      }
    })();
  }, []);

  const lang = pref === 'auto' ? device : pref;

  const setPref = useCallback(async (p) => {
    if (!PREFS.includes(p)) return;
    setPrefState(p);
    try { await SecureStore.setItemAsync(PREF_KEY, p); } catch (e) { /* ignore */ }
  }, []);

  const t = useCallback((key, vars) => translate(lang, key, vars), [lang]);

  const value = useMemo(() => ({ lang, pref, setPref, t, device }), [lang, pref, setPref, t, device]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export default I18nContext;
