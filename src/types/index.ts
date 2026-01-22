export interface Answer {
  text: string
  isCorrect: boolean
  orderNumber?: number // For sequence questions - the correct order position
  matchIndex?: number // For matching questions - the index of the matching answer (0-based)
  matchVariants?: Record<number, number>[] // For matching questions - multiple correct matching variants
  isLeftColumn?: boolean // For matching questions - true if this is in left column (column 2-3), false if right column (column 4-5)
}

export interface Question {
  text: string
  answers: Answer[]
  isMultiSelect?: boolean
  isSequence?: boolean // For sequence/ordering questions
  isMatching?: boolean // For matching questions
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
  originalNextStartIndex?: number | null // For retake: original position to continue from
  isRetake?: boolean // Flag to indicate this is a retake of incorrect questions
}

export type ThemeMode = 'light' | 'dark'
export type Language = 'uz' | 'ru'
