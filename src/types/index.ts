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

/** `single` — har bir savol alohida ekranda; `all` — barcha savollar bir ekranda. */
export type QuestionDisplayMode = 'single' | 'all'

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
  /** Test uchun umumiy vaqt cheklovi (soniya). */
  timeLimitSeconds?: number
  /** Vaqt tugash vaqti (Date.now() + ms). */
  timerEndsAt?: number
  displayMode?: QuestionDisplayMode
  /** `all` rejimida: yakunlashgacha tanlangan javoblar (tekshirilmagan). */
  pendingAnswers?: Record<number, number[]>
}

export interface QuizResults {
  correct: number
  incorrect: number
  total: number
  percentage: number
  nextStartIndex: number | null
  /** Vaqt tugaganda avtomatik yakunlangan. */
  timedOut?: boolean
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
  endQuestionIndex?: number | null // For range-based tests: the end question index (inclusive)
  timeLimitSeconds?: number
  timerEndsAt?: number
  displayMode?: QuestionDisplayMode
  pendingAnswers?: Record<number, number[]>
}

export type ThemeMode = 'light' | 'dark'
export type Language = 'uz' | 'ru'
