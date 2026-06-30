import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import fr from './locales/fr.json';
import en from './locales/en.json';
import { config } from '../lib/config';

const languageStorageKey = 'church-app-language';

function getStoredLanguage() {
  if (typeof window === 'undefined') {
    return null;
  }

  const language = window.localStorage.getItem(languageStorageKey);
  return language === 'fr' || language === 'en' ? language : null;
}

i18n.use(initReactI18next).init({
  resources: {
    fr: {
      translation: fr,
    },
    en: {
      translation: en,
    },
  },
  lng: getStoredLanguage() ?? config.defaultLanguage,
  fallbackLng: 'fr',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
