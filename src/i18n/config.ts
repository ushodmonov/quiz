import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import uzTranslations from './locales/uz.json'
import ruTranslations from './locales/ru.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      uz: {
        translation: uzTranslations
      },
      ru: {
        translation: ruTranslations
      }
    },
    fallbackLng: 'uz',
    interpolation: {
      escapeValue: false
    }
  })

export default i18n
