export const CONTACT_INFO = {
  telegram: {
    username: 'a_shodmanov',
    url: 'https://t.me/a_shodmanov'
  },
  telegramChannel: {
    name: '@test_quiz_maker',
    url: 'https://t.me/test_quiz_maker'
  },
  telegramBot: {
    name: '@test_quiz_maker_bot',
    url: 'https://t.me/test_quiz_maker_bot'
  },
  email: {
    address: 'shodmonov.uchqun@gmail.com',
    url: 'mailto:shodmonov.uchqun@gmail.com'
  }
}

export const ADMIN_CONTACTS = [
  {
    username: 'a_shodmanov',
    url: 'https://t.me/a_shodmanov'
  },
  {
    username: 'ramazanov_temurbek',
    url: 'https://t.me/ramazanov_temurbek'
  }
]

// Only these Telegram user IDs are treated as admins.
// Fill this list with real numeric Telegram IDs from Mini App userInfo.id.
export const ADMIN_TELEGRAM_USER_IDS: number[] = [
  1384443951,
  6150805164,
  6720865147,
  1787776889
]

export const isAdminTelegramUser = (telegramUserId?: number | null): boolean => {
  if (!telegramUserId) return false
  return ADMIN_TELEGRAM_USER_IDS.includes(telegramUserId)
}

// IMPORTANT: Frontend secret is visible to users.
// For production-grade security, generate JWT on backend.
export const JWT_SECRET_KEY = '9f3c2e7a6b8d4c1f9a2e5b7d3c8f6a1e4d9b2c7f5a8e1d3c6b9f2a4e7c5d8f1a'

export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAz9_OFJdmssAzPecOTd-M2in6L4uBXfWE',
  authDomain: 'quiz-277a6.firebaseapp.com',
  projectId: 'quiz-277a6',
  storageBucket: 'quiz-277a6.firebasestorage.app',
  messagingSenderId: '897658537809',
  appId: '1:897658537809:web:00c658d6cb5fd52976b570'
}

export const FIRESTORE_JWT_TOKENS_COLLECTION = 'jwt_tokens'
