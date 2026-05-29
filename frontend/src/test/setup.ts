import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from '../i18n/locales/en/common.json';
import enAuth from '../i18n/locales/en/auth.json';
import enEditor from '../i18n/locales/en/editor.json';

i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: { en: { common: enCommon, auth: enAuth, editor: enEditor } },
  ns: ['common', 'auth', 'editor'],
  defaultNS: 'common',
});

// RTL's automatic cleanup only registers when globals are enabled; we run
// without globals, so unmount rendered trees between tests explicitly.
afterEach(() => cleanup());
