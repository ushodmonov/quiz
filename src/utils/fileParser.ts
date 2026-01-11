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

/**
 * Parse table structure from HTML
 * Table format: 3 columns - index, correctness (+/-), answer text
 */
function parseTableFromHTML(html: string): { index: string, isCorrect: boolean, text: string }[][] {
  const tablesAnswers: { index: string, isCorrect: boolean, text: string }[][] = []
  
  // Create a temporary DOM element to parse HTML
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const tables = doc.querySelectorAll('table')
  
  for (const table of tables) {
    const tableAnswers: { index: string, isCorrect: boolean, text: string }[] = []
    const rows = table.querySelectorAll('tr')
    
    for (const row of rows) {
      const cells = row.querySelectorAll('td, th')
      
      if (cells.length >= 3) {
        // Column 1: Index (e.g., "1", "2", etc.)
        const index = cells[0].textContent?.trim() || ''
        
        // Column 2: Correctness (+ or -)
        const correctness = cells[1].textContent?.trim() || ''
        const isCorrect = correctness === '+' || correctness.includes('+')
        
        // Column 3: Answer text
        let text = cells[2].textContent?.trim() || ''
        
        // Handle text with '/' separator (e.g., "Вazal/Базальный")
        if (text.includes('/')) {
          text = text.replace(/\s*\/\s*/g, ' / ')
        }
        
        // Skip header rows (if index is not a number)
        if (index && text && !isNaN(parseInt(index))) {
          tableAnswers.push({ index, isCorrect, text })
        }
      }
    }
    
    if (tableAnswers.length > 0) {
      tablesAnswers.push(tableAnswers)
    }
  }
  
  return tablesAnswers
}

/**
 * Parse questions from DOCX file with table format support
 */
export async function parseDocxFile(file: File): Promise<Question[]> {
  const arrayBuffer = await file.arrayBuffer()
  
  // Get HTML to extract table structure
  let htmlResult
  try {
    htmlResult = await mammoth.convertToHtml({ arrayBuffer })
  } catch (error) {
    console.warn('Failed to convert to HTML, falling back to raw text:', error)
  }
  
  // Get raw text for question text extraction
  const textResult = await mammoth.extractRawText({ arrayBuffer })
  const rawText = textResult.value
  
  // Parse all tables from HTML
  let tablesAnswers: { index: string, isCorrect: boolean, text: string }[][] = []
  if (htmlResult && htmlResult.value) {
    tablesAnswers = parseTableFromHTML(htmlResult.value)
  }
  
  // Parse questions from raw text
  const questions: Question[] = []
  const lines = rawText.split('\n')
  
  let currentQuestion: Question | null = null
  let questionIndex = 0
  let tableIndex = 0
  let isCollectingQuestionText = true
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    if (!line) {
      // Empty line - continue collecting question text if we haven't hit instruction line yet
      continue
    }
    
    // Detect new format: "Задание №" followed by a number
    if (line.match(/^Задание\s*№\s*\d+/i)) {
      // Save previous question if exists
      if (currentQuestion && currentQuestion.answers.length >= 2) {
        questions.push(currentQuestion)
      }
      
      currentQuestion = {
        text: '',
        answers: []
      }
      questionIndex++
      isCollectingQuestionText = true
      continue
    }
    
    // Skip instruction line and stop collecting question text
    if (line.match(/Выберите.*из.*вариантов\s*ответа?:?/i)) {
      // If we have tables and current question exists, add answers from table
      if (currentQuestion && tablesAnswers.length > tableIndex) {
        const tableAnswers = tablesAnswers[tableIndex]
        for (const answer of tableAnswers) {
          currentQuestion.answers.push({
            text: answer.text,
            isCorrect: answer.isCorrect
          })
        }
        tableIndex++
      }
      isCollectingQuestionText = false
      continue
    }
    
    // Collect question text only before instruction line
    if (currentQuestion && isCollectingQuestionText) {
      // Skip lines that look like table data (numbers, +, -, etc.)
      // Don't add lines that are part of table structure
      if (!line.match(/^\d+\)?\s*[+-]/) && !line.match(/^\d+\s*$/) && line !== '+' && line !== '-') {
        if (currentQuestion.text) {
          currentQuestion.text += ' ' + line
        } else {
          currentQuestion.text = line
        }
      }
    }
  }
  
  // Save last question
  if (currentQuestion && currentQuestion.answers.length >= 2) {
    questions.push(currentQuestion)
  }
  
  // If no questions found with table parsing, fallback to text parsing
  if (questions.length === 0) {
    return parseTxtFile(rawText)
  }
  
  return questions
}

export function isMultiSelect(question: Question): boolean {
  const correctCount = question.answers.filter(a => a.isCorrect).length
  return correctCount > 1
}
