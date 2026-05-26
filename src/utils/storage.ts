import type { QuizProgress, Question } from '../types'

const STORAGE_KEY = 'quiz_progress'
const THEME_KEY = 'quiz_theme'
const LANGUAGE_KEY = 'quiz_language'
const ALL_QUESTIONS_KEY = 'quiz_all_questions'
const ACCESS_JWT_KEY_PREFIX = 'quiz_access_jwt_'

// Base64 rasmlar localStorage quotasini tez tugatadi — saqlashdan oldin olib tashlaymiz.
// Resume qilganda rasm ko'rinmaydi, lekin matn javoblari va progress saqlanadi.
function stripHeavyFields(questions: Question[] | undefined): Question[] | undefined {
  if (!questions) return questions
  return questions.map((q) => ({
    ...q,
    answers: q.answers.map(({ imageData: _imageData, ...rest }) => rest),
  }))
}

let quotaWarned = false

export function saveProgress(progress: QuizProgress): void {
  const trimmed: QuizProgress = {
    ...progress,
    selectedQuestions: stripHeavyFields(progress.selectedQuestions) ?? progress.selectedQuestions,
    allQuestions: stripHeavyFields(progress.allQuestions) ?? progress.allQuestions,
  }
  // Tobora kichraytirib urinamiz: 1) rasmsiz, 2) allQuestions yo'q, 3) faqat metadata
  const candidates: QuizProgress[] = [
    trimmed,
    { ...trimmed, allQuestions: [] },
    { ...trimmed, allQuestions: [], selectedQuestions: [] },
  ]
  for (const candidate of candidates) {
    try {
      // Avval eski qiymatni olib tashlaymiz — quotada joy ochiladi
      localStorage.removeItem(STORAGE_KEY)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(candidate))
      return
    } catch {
      // keyingisini sinab ko'ramiz
    }
  }
  if (!quotaWarned) {
    quotaWarned = true
    console.warn('Progress saqlanmadi — localStorage to\'la. Resume ishlamasligi mumkin.')
  }
}

export function loadProgress(): QuizProgress | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) as QuizProgress : null
  } catch (error) {
    console.error('Failed to load progress:', error)
    return null
  }
}

export function clearProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear progress:', error)
  }
}

export function hasProgress(): boolean {
  const p = loadProgress()
  return !!(p && p.selectedQuestions && p.selectedQuestions.length > 0)
}

export function saveTheme(theme: 'light' | 'dark'): void {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch (error) {
    console.error('Failed to save theme:', error)
  }
}

export function loadTheme(): 'light' | 'dark' {
  try {
    const theme = localStorage.getItem(THEME_KEY)
    return (theme === 'dark' || theme === 'light') ? theme : 'light'
  } catch (error) {
    return 'light'
  }
}

export function saveLanguage(lang: 'uz' | 'ru'): void {
  try {
    localStorage.setItem(LANGUAGE_KEY, lang)
  } catch (error) {
    console.error('Failed to save language:', error)
  }
}

export function loadLanguage(): 'uz' | 'ru' {
  try {
    const lang = localStorage.getItem(LANGUAGE_KEY)
    return (lang === 'uz' || lang === 'ru') ? lang : 'uz'
  } catch (error) {
    return 'uz'
  }
}

export function saveAllQuestions(questions: Question[]): void {
  // Strip base64 imageData up-front — same rationale as saveProgress
  const stripped = stripHeavyFields(questions) ?? questions
  try {
    localStorage.removeItem(ALL_QUESTIONS_KEY)
    localStorage.setItem(ALL_QUESTIONS_KEY, JSON.stringify(stripped))
  } catch (error) {
    console.warn('All questions saqlanmadi — localStorage to\'la:', error)
  }
}

export function loadAllQuestions(): Question[] | null {
  try {
    const data = localStorage.getItem(ALL_QUESTIONS_KEY)
    return data ? JSON.parse(data) as Question[] : null
  } catch (error) {
    console.error('Failed to load all questions:', error)
    return null
  }
}

export function clearAllQuestions(): void {
  try {
    localStorage.removeItem(ALL_QUESTIONS_KEY)
  } catch (error) {
    console.error('Failed to clear all questions:', error)
  }
}

export function saveAccessJwt(telegramUserId: number, token: string): void {
  try {
    localStorage.setItem(`${ACCESS_JWT_KEY_PREFIX}${telegramUserId}`, token)
  } catch (error) {
    console.error('Failed to save access JWT:', error)
  }
}

export function loadAccessJwt(telegramUserId: number): string | null {
  try {
    return localStorage.getItem(`${ACCESS_JWT_KEY_PREFIX}${telegramUserId}`)
  } catch (error) {
    console.error('Failed to load access JWT:', error)
    return null
  }
}

export function clearAccessJwt(telegramUserId: number): void {
  try {
    localStorage.removeItem(`${ACCESS_JWT_KEY_PREFIX}${telegramUserId}`)
  } catch (error) {
    console.error('Failed to clear access JWT:', error)
  }
}

/** Brauzerda Telegramsiz sinash rejimi (kalit: `BROWSER_DEV_MODE_STORAGE_KEY`). */
export const BROWSER_DEV_MODE_STORAGE_KEY = 'dev'

export function isBrowserDevModeEnabled(): boolean {
  try {
    const v = localStorage.getItem(BROWSER_DEV_MODE_STORAGE_KEY)
    if (v == null || v === '') return false
    const s = v.trim().toLowerCase()
    return s === '1' || s === 'true' || s === 'yes' || s === 'on'
  } catch {
    return false
  }
}
