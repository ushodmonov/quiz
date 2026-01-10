export interface Answer {
  text: string
  isCorrect: boolean
}

export interface Question {
  text: string
  answers: Answer[]
  isMultiSelect?: boolean
  originalIndex?: number
}

export interface QuizProgress {
  fileId: string
  fileName: string
  allQuestions: Question[]
  selectedQuestions: Question[]
  startIndex: number
  currentQuestionIndex: number
  selectionMethod: 'sequential' | 'random'
  answers: Record<number, {
    selected: number[]
    correct: boolean
  }>
  score: {
    correct: number
    incorrect: number
  }
  results?: QuizResults
  nextStartIndex?: number | null
  timestamp?: number
}

export interface QuizResults {
  correct: number
  incorrect: number
  total: number
  percentage: number
  nextStartIndex: number | null
}

export interface QuizData {
  fileId: string
  fileName: string
  allQuestions: Question[]
  selectedQuestions: Question[]
  startIndex: number
  currentQuestionIndex: number
  selectionMethod: 'sequential' | 'random'
  answers: Record<number, {
    selected: number[]
    correct: boolean
  }>
  score: {
    correct: number
    incorrect: number
  }
  results?: QuizResults
  nextStartIndex?: number | null
}

export type ThemeMode = 'light' | 'dark'
export type Language = 'uz' | 'ru'
