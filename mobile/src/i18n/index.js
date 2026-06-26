/**
 * Lightweight i18n for the mobile app — mirrors the web engine (flat key->string
 * dictionaries, English fallback, {placeholder} interpolation). The active
 * language is resolved by I18nContext (device language, or a manual override).
 */
import * as Localization from 'expo-localization';
import en from './locales/en.json';
import es from './locales/es.json';
import hi from './locales/hi.json';

export const SUPPORTED = ['en', 'es', 'hi'];
export const DEFAULT = 'en';

const dicts = { en, es, hi };

export function translate(lang, key, vars) {
  const d = dicts[lang] || dicts[DEFAULT];
  let s = d[key];
  if (s == null) s = dicts[DEFAULT][key];
  if (s == null) s = key; // surface missing keys instead of crashing
  if (vars) for (const k of Object.keys(vars)) s = s.split(`{${k}}`).join(String(vars[k]));
  return s;
}

/** The phone's language, if we support it — else English. */
export function deviceLanguage() {
  try {
    const locales = Localization.getLocales();
    const code = locales && locales[0] && locales[0].languageCode;
    return SUPPORTED.includes(code) ? code : DEFAULT;
  } catch (e) {
    return DEFAULT;
  }
}
