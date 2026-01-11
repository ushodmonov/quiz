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
 * Parse sequence table structure from HTML
 * Table format: 3 columns - index, order number, answer text
 */
function parseSequenceTableFromHTML(html: string): { index: string, orderNumber: number, text: string }[][] {
  const tablesAnswers: { index: string, orderNumber: number, text: string }[][] = []
  
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const tables = doc.querySelectorAll('table')
  
  for (const table of tables) {
    const tableAnswers: { index: string, orderNumber: number, text: string }[] = []
    const rows = table.querySelectorAll('tr')
    
    for (const row of rows) {
      const cells = row.querySelectorAll('td, th')
      
      if (cells.length >= 3) {
        // Column 1: Index (e.g., "1", "2", etc.)
        const index = cells[0].textContent?.trim() || ''
        
        // Column 2: Order number (sequence position)
        const orderText = cells[1].textContent?.trim() || ''
        const orderNumber = parseInt(orderText)
        
        // Column 3: Answer text
        let text = cells[2].textContent?.trim() || ''
        
        // Handle text with '/' separator
        if (text.includes('/')) {
          text = text.replace(/\s*\/\s*/g, ' / ')
        }
        
        // Skip header rows (if index is not a number or orderNumber is invalid)
        if (index && text && !isNaN(parseInt(index)) && !isNaN(orderNumber) && orderNumber > 0) {
          tableAnswers.push({ index, orderNumber, text })
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
 * Parse answers table from HTML (at the end of file)
 * Table format: 2 columns - question number, answer order numbers (e.g., "1=2, 2=1, 3=3, 4=4, 5=5")
 */
function parseAnswersTableFromHTML(html: string): Record<number, Record<number, number>> {
  const answers: Record<number, Record<number, number>> = {}
  
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const tables = doc.querySelectorAll('table')
  
  // Find the table after "Ответы:" text
  let foundAnswersSection = false
  
  for (const table of tables) {
    // Check if this table is after "Ответы:" marker
    const prevText = table.previousSibling?.textContent || ''
    if (prevText.includes('Ответы:') || prevText.includes('Ответы')) {
      foundAnswersSection = true
    }
    
    if (foundAnswersSection) {
      const rows = table.querySelectorAll('tr')
      
      for (const row of rows) {
        const cells = row.querySelectorAll('td, th')
        
        if (cells.length >= 2) {
          // Column 1: Question number (e.g., "#1", "1", etc.)
          const questionText = cells[0].textContent?.trim() || ''
          const questionMatch = questionText.match(/#?(\d+)/)
          
          if (questionMatch) {
            const questionNum = parseInt(questionMatch[1])
            
            // Column 2: Answer order numbers (e.g., "1=2, 2=1, 3=3, 4=4, 5=5")
            const orderText = cells[1].textContent?.trim() || ''
            const orderMap: Record<number, number> = {}
            
            // Parse "1=2, 2=1, 3=3" format
            const pairs = orderText.split(',').map(p => p.trim())
            for (const pair of pairs) {
              const match = pair.match(/(\d+)\s*=\s*(\d+)/)
              if (match) {
                const answerIndex = parseInt(match[1]) - 1 // Convert to 0-based index
                const orderNumber = parseInt(match[2])
                orderMap[answerIndex] = orderNumber
              }
            }
            
            if (Object.keys(orderMap).length > 0) {
              answers[questionNum] = orderMap
            }
          }
        }
      }
    }
  }
  
  return answers
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
/**
 * Parse DOCX file from ArrayBuffer
 */
export async function parseDocxFileFromBuffer(arrayBuffer: ArrayBuffer): Promise<Question[]> {
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
  
  // Check if this is a sequence format file
  const isSequenceFormat = rawText.includes('Укажите порядок следования') || rawText.includes('порядок следования')
  
  // Parse answers table from HTML (for sequence format)
  let answersTable: Record<number, Record<number, number>> = {}
  if (isSequenceFormat && htmlResult && htmlResult.value) {
    answersTable = parseAnswersTableFromHTML(htmlResult.value)
  }
  
  // Parse all tables from HTML
  let tablesAnswers: { index: string, isCorrect: boolean, text: string }[][] = []
  let sequenceTablesAnswers: { index: string, orderNumber: number, text: string }[][] = []
  
  if (htmlResult && htmlResult.value) {
    if (isSequenceFormat) {
      sequenceTablesAnswers = parseSequenceTableFromHTML(htmlResult.value)
    } else {
      tablesAnswers = parseTableFromHTML(htmlResult.value)
    }
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
      
      const questionNumMatch = line.match(/Задание\s*№\s*(\d+)/i)
      questionIndex = questionNumMatch ? parseInt(questionNumMatch[1]) : questionIndex + 1
      
      currentQuestion = {
        text: '',
        answers: [],
        isSequence: isSequenceFormat
      }
      isCollectingQuestionText = true
      continue
    }
    
    // Skip instruction line and stop collecting question text
    // Check for both formats: "Выберите..." and "Укажите порядок следования..."
    if (line.match(/Выберите.*из.*вариантов\s*ответа?:?/i) || 
        line.match(/Укажите\s*порядок\s*следования/i)) {
      // If we have tables and current question exists, add answers from table
      if (currentQuestion) {
        if (isSequenceFormat && sequenceTablesAnswers.length > tableIndex) {
          // Sequence format: use order numbers from table
          const tableAnswers = sequenceTablesAnswers[tableIndex]
          // Get correct order numbers from answers table if available
          const correctOrders = answersTable[questionIndex] || {}
          
          for (const answer of tableAnswers) {
            const answerIndex = parseInt(answer.index) - 1 // Convert to 0-based
            const correctOrder = correctOrders[answerIndex] !== undefined 
              ? correctOrders[answerIndex] 
              : answer.orderNumber
            
            currentQuestion.answers.push({
              text: answer.text,
              isCorrect: true, // All answers are "correct" in sequence format
              orderNumber: correctOrder
            })
          }
        } else if (!isSequenceFormat && tablesAnswers.length > tableIndex) {
          // Regular format: use correctness from table
          const tableAnswers = tablesAnswers[tableIndex]
          for (const answer of tableAnswers) {
            currentQuestion.answers.push({
              text: answer.text,
              isCorrect: answer.isCorrect
            })
          }
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
        // Skip "Ответы:" section
        if (line.match(/^Ответы?:?/i)) {
          isCollectingQuestionText = false
          continue
        }
        
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

export async function parseDocxFile(file: File): Promise<Question[]> {
  const arrayBuffer = await file.arrayBuffer()
  return parseDocxFileFromBuffer(arrayBuffer)
}

export function isMultiSelect(question: Question): boolean {
  const correctCount = question.answers.filter(a => a.isCorrect).length
  return correctCount > 1
}
