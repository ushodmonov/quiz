import type { QuizProgress, Question } from '../types'

const STORAGE_KEY = 'quiz_progress'
const THEME_KEY = 'quiz_theme'
const LANGUAGE_KEY = 'quiz_language'
const ALL_QUESTIONS_KEY = 'quiz_all_questions'

export function saveProgress(progress: QuizProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch (error) {
    console.error('Failed to save progress:', error)
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
  return loadProgress() !== null
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
  try {
    localStorage.setItem(ALL_QUESTIONS_KEY, JSON.stringify(questions))
  } catch (error) {
    console.error('Failed to save all questions:', error)
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
