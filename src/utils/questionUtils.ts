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
  // Handle sequence format questions
  if (question.isSequence) {
    // selectedAnswers[i] = answerIndex at position i
    // We need to check if the order matches the correct order numbers
    const answers = question.answers
    
    // Check if all answers are selected
    if (selectedAnswers.length !== answers.length) {
      return false
    }
    
    // For each position, check if the selected answer has the correct order number
    for (let position = 0; position < selectedAnswers.length; position++) {
      const selectedAnswerIndex = selectedAnswers[position]
      const selectedAnswer = answers[selectedAnswerIndex]
      
      if (!selectedAnswer || selectedAnswer.orderNumber === undefined) {
        return false
      }
      
      // Position is 0-based, orderNumber is 1-based
      if (selectedAnswer.orderNumber !== position + 1) {
        return false
      }
    }
    
    return true
  }
  
  // Regular format: check if selected answers match correct answers
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
