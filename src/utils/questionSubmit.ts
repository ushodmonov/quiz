import type { Question } from '../types'

/** Javob berish mumkinligi (tekshirishdan oldin). */
export function canSubmitQuestionSelection(question: Question, selectedAnswers: number[]): boolean {
  if (question.isMatching) {
    const leftAnswers = question.answers.filter((a) => a.isLeftColumn)
    return leftAnswers.every(
      (_, leftIdx) =>
        selectedAnswers[leftIdx] !== undefined && selectedAnswers[leftIdx] !== -1
    )
  }
  if (question.isSequence) {
    return (
      selectedAnswers.filter((a) => a !== -1 && a !== undefined).length ===
      question.answers.length
    )
  }
  return selectedAnswers.length > 0
}

/** Tanlangan, lekin hali tekshirilmagan (qisman tanlov ham hisoblanadi). */
export function hasQuestionDraftSelection(question: Question, selectedAnswers: number[]): boolean {
  if (canSubmitQuestionSelection(question, selectedAnswers)) return true
  if (question.isMatching || question.isSequence) {
    return selectedAnswers.some((v) => v !== undefined && v !== -1)
  }
  return selectedAnswers.length > 0
}
