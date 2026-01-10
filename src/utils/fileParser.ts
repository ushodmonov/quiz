import mammoth from 'mammoth'
import type { Question, Answer } from '../types'

export function parseTxtFile(content: string): Question[] {
  const lines = content.split('\n')
  const questions: Question[] = []
  let currentQuestion: Question | null = null
  let currentAnswer: Answer | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    if (!line) {
      if (currentAnswer) {
        if (currentQuestion) {
          currentQuestion.answers.push(currentAnswer)
        }
        currentAnswer = null
      }
      continue
    }

    if (line.startsWith('#')) {
      if (currentQuestion && currentQuestion.answers.length >= 2) {
        questions.push(currentQuestion)
      }
      currentQuestion = {
        text: line.substring(1).trim(),
        answers: []
      }
      currentAnswer = null
    } else if (line.startsWith('+') || line.startsWith('-')) {
      if (currentAnswer && currentQuestion) {
        currentQuestion.answers.push(currentAnswer)
      }
      const isCorrect = line.startsWith('+')
      const answerText = line.substring(1).trim()
      currentAnswer = {
        text: answerText,
        isCorrect
      }
    } else if (currentAnswer) {
      currentAnswer.text += ' ' + line
    } else if (currentQuestion && currentQuestion.text) {
      currentQuestion.text += ' ' + line
    }
  }

  if (currentAnswer && currentQuestion) {
    currentQuestion.answers.push(currentAnswer)
  }

  if (currentQuestion && currentQuestion.answers.length >= 2) {
    questions.push(currentQuestion)
  }

  return questions
}

export async function parseDocxFile(file: File): Promise<Question[]> {
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  const content = result.value
  return parseTxtFile(content)
}

export function isMultiSelect(question: Question): boolean {
  const correctCount = question.answers.filter(a => a.isCorrect).length
  return correctCount > 1
}
