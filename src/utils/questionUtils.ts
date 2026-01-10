import type { Question } from '../types'

export function selectQuestions(
  questions: Question[],
  startIndex: number,
  count: number,
  method: 'sequential' | 'random'
): Question[] {
  if (method === 'sequential') {
    return questions.slice(startIndex, startIndex + count)
  } else {
    const availableIndices: number[] = []
    for (let i = startIndex; i < questions.length; i++) {
      availableIndices.push(i)
    }
    
    const selectedIndices: number[] = []
    const shuffled = [...availableIndices].sort(() => Math.random() - 0.5)
    
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
      selectedIndices.push(shuffled[i])
    }
    
    return selectedIndices.map(index => ({
      ...questions[index],
      originalIndex: index
    }))
  }
}

export function calculateScore(question: Question, selectedAnswers: number[]): boolean {
  const correctAnswers = question.answers
    .map((answer, index) => answer.isCorrect ? index : null)
    .filter((index): index is number => index !== null)
  
  const selectedSet = new Set(selectedAnswers)
  const correctSet = new Set(correctAnswers)
  
  if (selectedSet.size !== correctSet.size) {
    return false
  }
  
  for (const index of selectedSet) {
    if (!correctSet.has(index)) {
      return false
    }
  }
  
  return true
}
