import { createI18n } from 'vue-i18n';
import tr from './locales/tr';
import en from './locales/en';

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('locale') || 'tr',
  fallbackLocale: 'en',
  messages: {
    tr,
    en
  }
});

export default i18n;
