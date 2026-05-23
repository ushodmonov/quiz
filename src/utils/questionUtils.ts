import type { Question } from '../types'

export function selectQuestions(
  questions: Question[],
  startIndex: number,
  count: number,
  method: 'sequential' | 'random',
  endIndex?: number | null
): Question[] {
  if (method === 'sequential') {
    const end = endIndex !== null && endIndex !== undefined 
      ? Math.min(endIndex + 1, startIndex + count)
      : startIndex + count
    return questions.slice(startIndex, end)
  } else {
    const availableIndices: number[] = []
    const maxIndex = endIndex !== null && endIndex !== undefined
      ? Math.min(endIndex, questions.length - 1)
      : questions.length - 1

    for (let i = startIndex; i <= maxIndex; i++) {
      availableIndices.push(i)
    }

    const actualCount = Math.min(count, availableIndices.length)
    const hasDifficulty = availableIndices.some(i => questions[i].difficulty)

    let selectedIndices: number[]

    if (hasDifficulty) {
      // Stratified sampling: pick proportionally from each difficulty group
      const groups: Record<string, number[]> = { '1': [], '2': [], '3': [], 'none': [] }
      for (const idx of availableIndices) {
        const d = questions[idx].difficulty
        groups[d ? String(d) : 'none'].push(idx)
      }

      const activeGroups = Object.entries(groups).filter(([, indices]) => indices.length > 0)
      const total = availableIndices.length

      // Proportional floor allocation
      const allocs = activeGroups.map(([key, indices]) => ({
        key,
        indices,
        allocated: Math.floor(actualCount * indices.length / total),
      }))

      // Distribute remainder to groups with largest fractional parts
      let remainder = actualCount - allocs.reduce((s, g) => s + g.allocated, 0)
      activeGroups
        .map(([, indices], i) => ({
          i,
          frac: (actualCount * indices.length / total) % 1,
        }))
        .sort((a, b) => b.frac - a.frac)
        .forEach(({ i }) => { if (remainder-- > 0) allocs[i].allocated++ })

      // Pick randomly from each group; overflow goes to a shared pool
      const pickedIndices: number[] = []
      const leftoverPool: number[] = []

      for (const { indices, allocated } of allocs) {
        const shuffledGroup = [...indices].sort(() => Math.random() - 0.5)
        pickedIndices.push(...shuffledGroup.slice(0, allocated))
        leftoverPool.push(...shuffledGroup.slice(allocated))
      }

      // Fill any shortfall from leftover pool (shouldn't normally happen)
      const shortfall = actualCount - pickedIndices.length
      if (shortfall > 0) {
        leftoverPool.sort(() => Math.random() - 0.5)
        pickedIndices.push(...leftoverPool.slice(0, shortfall))
      }

      selectedIndices = pickedIndices.sort(() => Math.random() - 0.5)
    } else {
      const shuffled = [...availableIndices].sort(() => Math.random() - 0.5)
      selectedIndices = shuffled.slice(0, actualCount)
    }

    return selectedIndices.map(index => ({
      ...questions[index],
      originalIndex: index
    }))
  }
}

export function calculateScore(question: Question, selectedAnswers: number[]): boolean {
  // Handle matching format questions
  if (question.isMatching) {
    // selectedAnswers[leftIndex] = rightIndex
    const leftAnswers = question.answers.filter(a => a.isLeftColumn)
    
    // Check if all left answers have a match
    if (selectedAnswers.length < leftAnswers.length) {
      return false
    }
    
    // Check if we have multiple variants
    const firstLeftAnswer = leftAnswers[0]
    if (firstLeftAnswer?.matchVariants && firstLeftAnswer.matchVariants.length > 0) {
      // Check against all variants - if any variant matches, the answer is correct
      for (const variant of firstLeftAnswer.matchVariants) {
        let variantMatches = true
        for (let leftIdx = 0; leftIdx < leftAnswers.length; leftIdx++) {
          const selectedRightIndex = selectedAnswers[leftIdx]
          const correctRightIndex = variant[leftIdx]
          
          if (selectedRightIndex === undefined || correctRightIndex === undefined || selectedRightIndex !== correctRightIndex) {
            variantMatches = false
            break
          }
        }
        // If this variant matches, return true
        if (variantMatches) {
          return true
        }
      }
      // None of the variants matched
      return false
    } else {
      // Single variant (backward compatibility)
      // Check each left answer's match
      for (let leftIdx = 0; leftIdx < leftAnswers.length; leftIdx++) {
        const leftAnswer = leftAnswers[leftIdx]
        const selectedRightIndex = selectedAnswers[leftIdx]
        const correctRightIndex = leftAnswer.matchIndex !== undefined ? leftAnswer.matchIndex : -1
        
        if (selectedRightIndex === undefined || selectedRightIndex !== correctRightIndex) {
          return false
        }
      }
      
      return true
    }
  }
  
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
