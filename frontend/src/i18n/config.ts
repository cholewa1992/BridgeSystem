import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enEditor from './locales/en/editor.json';
import daCommon from './locales/da/common.json';
import daAuth from './locales/da/auth.json';
import daEditor from './locales/da/editor.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon, auth: enAuth, editor: enEditor },
      da: { common: daCommon, auth: daAuth, editor: daEditor },
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'bridge-lang',
      caches: ['localStorage'],
    },
    fallbackLng: 'da',
    supportedLngs: ['da', 'en'],
    defaultNS: 'common',
    ns: ['common', 'auth', 'editor'],
    interpolation: { escapeValue: false },
  });

export default i18n;
