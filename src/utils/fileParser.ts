import mammoth from 'mammoth'
import type { Question, Answer } from '../types'

export function parseTxtFile(content: string): Question[] {
  // Check if content uses the new format (==== and ++++ separators)
  const hasNewFormat = content.includes('====') && content.includes('++++')
  
  if (hasNewFormat) {
    return parseNewFormat(content)
  }
  
  // Original format parsing
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
 * Parse new format where:
 * - Questions are separated by ++++
 * - Options are separated by ====
 * - Correct answer is marked with # at the beginning
 */
function parseNewFormat(content: string): Question[] {
  const questions: Question[] = []
  
  // Split by ++++ to get individual questions
  const questionBlocks = content.split('++++').map(block => block.trim()).filter(Boolean)
  
  for (const block of questionBlocks) {
    // Split by ==== to get question text and options
    const parts = block.split('====').map(part => part.trim()).filter(Boolean)
    
    if (parts.length < 2) {
      // Need at least question text and one option
      continue
    }
    
    const questionText = parts[0]
    const options = parts.slice(1)
    
    if (options.length < 2) {
      // Need at least 2 options
      continue
    }
    
    const answers: Answer[] = options.map(option => {
      const isCorrect = option.startsWith('#')
      const text = isCorrect ? option.substring(1).trim() : option.trim()
      return {
        text,
        isCorrect
      }
    })
    
    questions.push({
      text: questionText,
      answers
    })
  }
  
  return questions
}

/**
 * Parse matching table structure from HTML
 * Supports two formats:
 * 1) 5-column: index | left index | left text | right index | right text
 * 2) 4-column: index | left variant index | right variant index | match index
 */
function parseMatchingTableFromHTML(html: string): { leftIndex: number, leftText: string, rightIndex: number, rightText: string }[][] {
  const tablesAnswers: { leftIndex: number, leftText: string, rightIndex: number, rightText: string }[][] = []

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const tables = doc.querySelectorAll('table')

  for (const table of tables) {
    const tableAnswers: { leftIndex: number, leftText: string, rightIndex: number, rightText: string }[] = []
    const rows = table.querySelectorAll('tr')

    // Collect all left/right texts for 4-column tables
    const allLeftTexts = new Map<number, string>()
    const allRightTexts = new Map<number, string>()

    rows.forEach(row => {
      const cells = row.querySelectorAll('td, th')
      if (cells.length >= 4) {
        const rowIndex = parseInt(cells[0].textContent?.trim() || '0')
        const col2Text = cells[1].textContent?.trim() || ''
        const col3Text = cells[2].textContent?.trim() || ''

        if (rowIndex > 0) {
          if (col2Text && isNaN(Number(col2Text))) allLeftTexts.set(rowIndex, col2Text.replace(/\s*\/\s*/g, ' / '))
          if (col3Text && isNaN(Number(col3Text))) allRightTexts.set(rowIndex, col3Text.replace(/\s*\/\s*/g, ' / '))
        }
      }
    })

    rows.forEach(row => {
      const cells = row.querySelectorAll('td, th')

      if (cells.length >= 5) {
        // 5-column format
        const leftIndex = parseInt(cells[1].textContent?.trim() || '0')
        const leftText = (cells[2].textContent?.trim() || '').replace(/\s*\/\s*/g, ' / ')
        const rightIndex = parseInt(cells[3].textContent?.trim() || '0') || leftIndex
        const rightText = (cells[4].textContent?.trim() || '').replace(/\s*\/\s*/g, ' / ')

        if (leftIndex > 0 && leftText) {
          tableAnswers.push({ leftIndex, leftText, rightIndex, rightText })
        }
      } else if (cells.length >= 4) {
        // 4-column format
        const rowIndex = parseInt(cells[0].textContent?.trim() || '0')
        const leftVariantIndex = parseInt(cells[1].textContent?.trim() || '0')
        const rightVariantIndex = parseInt(cells[2].textContent?.trim() || '0')
        const matchIndex = parseInt(cells[3].textContent?.trim() || '0')

        if (rowIndex > 0 && leftVariantIndex > 0 && rightVariantIndex > 0 && matchIndex > 0) {
          const leftText = allLeftTexts.get(leftVariantIndex) || `Left ${leftVariantIndex}`
          const rightText = allRightTexts.get(rightVariantIndex) || `Right ${rightVariantIndex}`
          tableAnswers.push({ leftIndex: rowIndex, leftText, rightIndex: matchIndex, rightText })
        }
      }
    })

    if (tableAnswers.length) tablesAnswers.push(tableAnswers)
  }

  return tablesAnswers
}

/**
 * Parse matching answers table from HTML (after "Ответы:" marker)
 * Table format: 2 columns - question number, matching pairs
 * Example cell: "1=4, 2=3, 3=2, 4=1" or multiple variants separated by semicolons
 */
function parseMatchingAnswersTableFromHTML(html: string): Record<number, Record<number, number>[]> {
  const answers: Record<number, Record<number, number>[]> = {}

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const tables = Array.from(doc.querySelectorAll('table'))

  // Find table after "Ответы:" marker
  let foundAnswersSection = false
  for (const table of tables) {
    const prevText = table.previousSibling?.textContent || ''
    if (!foundAnswersSection && /Ответы:?/i.test(prevText)) {
      foundAnswersSection = true
    }
    if (!foundAnswersSection) continue

    const rows = Array.from(table.querySelectorAll('tr'))
    for (const row of rows) {
      const cells = Array.from(row.querySelectorAll('td, th'))
      if (cells.length < 2) continue

      // Column 1: Question number
      const questionText = cells[0].textContent?.trim() || ''
      const questionMatch = questionText.match(/#?(\d+)/)
      if (!questionMatch) continue
      const questionNum = parseInt(questionMatch[1])

      // Column 2: Matching pairs
      const matchText = cells[1].textContent?.trim() || ''
      if (!matchText) continue

      const variantStrings = matchText.split(';').map(v => v.trim()).filter(Boolean)
      const matchVariants: Record<number, number>[] = []

      for (const variant of variantStrings.length ? variantStrings : [matchText]) {
        const pairs = variant.split(',').map(p => p.trim())
        const matchMap: Record<number, number> = {}
        for (const pair of pairs) {
          const m = pair.match(/(\d+)\s*=\s*(\d+)/)
          if (m) {
            const leftIndex = parseInt(m[1]) - 1 // 0-based
            const rightIndex = parseInt(m[2]) - 1 // 0-based
            matchMap[leftIndex] = rightIndex
          }
        }
        if (Object.keys(matchMap).length > 0) {
          matchVariants.push(matchMap)
        }
      }

      if (matchVariants.length > 0) {
        answers[questionNum] = matchVariants
      }
    }

    // Stop after first answers table
    break
  }

  return answers
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
  // Get raw text for question text extraction
  const textResult = await mammoth.extractRawText({ arrayBuffer })
  const rawText = textResult.value
  
  // Check if content uses the new format (==== and ++++ separators)
  // If so, use parseTxtFile directly as it handles this format
  const hasNewFormat = rawText.includes('====') && rawText.includes('++++')
  if (hasNewFormat) {
    return parseTxtFile(rawText)
  }
  
  // Get HTML to extract table structure
  let htmlResult
  try {
    htmlResult = await mammoth.convertToHtml({ arrayBuffer })
  } catch (error) {
    console.warn('Failed to convert to HTML, falling back to raw text:', error)
  }
  
  // Check format type
  const isSequenceFormat = rawText.includes('Укажите порядок следования') || rawText.includes('порядок следования')
  const isMatchingFormat = rawText.includes('Укажите соответствие') || rawText.includes('соответствие для всех')
  
  // Parse answers table from HTML (for sequence and matching formats)
  let answersTable: Record<number, Record<number, number>> = {}
  let matchingAnswersTable: Record<number, Record<number, number>[]> = {}
  if (htmlResult && htmlResult.value) {
    if (isSequenceFormat) {
      answersTable = parseAnswersTableFromHTML(htmlResult.value)
    } else if (isMatchingFormat) {
      matchingAnswersTable = parseMatchingAnswersTableFromHTML(htmlResult.value)
    }
  }
  
  // Parse all tables from HTML
  let tablesAnswers: { index: string, isCorrect: boolean, text: string }[][] = []
  let sequenceTablesAnswers: { index: string, orderNumber: number, text: string }[][] = []
  let matchingTablesAnswers: { leftIndex: number, leftText: string, rightIndex: number, rightText: string }[][] = []
  
  if (htmlResult && htmlResult.value) {
    if (isSequenceFormat) {
      sequenceTablesAnswers = parseSequenceTableFromHTML(htmlResult.value)
    } else if (isMatchingFormat) {
      matchingTablesAnswers = parseMatchingTableFromHTML(htmlResult.value)
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
        isSequence: isSequenceFormat,
        isMatching: isMatchingFormat
      }
      isCollectingQuestionText = true
      continue
    }
    
    // Skip instruction line and stop collecting question text
    // Check for all formats: "Выберите...", "Укажите порядок следования...", "Укажите соответствие..."
    if (line.match(/Выберите.*из.*вариантов\s*ответа?:?/i) || 
        line.match(/Укажите\s*порядок\s*следования/i) ||
        line.match(/Укажите\s*соответствие/i)) {
      // If we have tables and current question exists, add answers from table
      if (currentQuestion) {
          let answersAdded = false
          
        if (isMatchingFormat && matchingTablesAnswers.length > tableIndex) {
          // Matching format: parse left and right columns
          const tableAnswers = matchingTablesAnswers[tableIndex]
            
            // Check if this is 4-column format
            // 4-column format: each row has leftText and rightText directly (not indices)
            // 5-column format: uses indices to reference answers
            // We can detect 4-column format by checking if leftText doesn't look like an index
            // Also check if we have more left answers than unique right answers (typical of 4-column format)
            const is4ColumnFormat = tableAnswers.length > 0 && (
              (!tableAnswers[0].leftText.match(/^\d+$/) && tableAnswers[0].leftText.length > 3) ||
              // If we have many rows with same rightIndex but different leftText, it's 4-column format
              (() => {
                const uniqueRightIndices = new Set(tableAnswers.map(a => a.rightIndex))
                return tableAnswers.length > uniqueRightIndices.size
              })()
            )
          
          // Create left column answers (column 2-3)
          const leftAnswers: Answer[] = []
          // Create right column answers (column 4-5)
          const rightAnswers: Answer[] = []
          
          // Group by left and right indices
          const leftMap = new Map<number, string>()
          const rightMap = new Map<number, string>()
            const matchMap = new Map<number, number>() // For 4-column format: leftIndex -> rightIndex
            
            if (is4ColumnFormat) {
              // For 4-column format, preserve ALL left answers in order (don't deduplicate)
              // Each row represents a left answer, so we keep all rows
              // Also collect unique right answers
              const rightAnswersSet = new Set<number>()
              
              for (let i = 0; i < tableAnswers.length; i++) {
                const answer = tableAnswers[i]
                // Use sequential index (i+1) for left answers to preserve all rows
                leftMap.set(i + 1, answer.leftText)
                // Track match: leftArrayIndex (i+1) -> rightIndex (matchIndex from column 4)
                matchMap.set(i + 1, answer.rightIndex)
                
                // Collect unique right answers
                if (!rightAnswersSet.has(answer.rightIndex)) {
                  rightAnswersSet.add(answer.rightIndex)
                  rightMap.set(answer.rightIndex, answer.rightText)
                }
              }
            } else {
              // For 5-column format, preserve ALL rows - nechta row bo'lsa, shuncha variant chiqish kerak
              // Column 2: left column indexlari (1-based) - 1, 2, 3, 4, 5, 6
              // Column 4: right column indexlari (1-based) - 2, 3, 3, 1, 2, 1
              // Use leftColumnIndex from Column 2 to preserve all rows with their indices
              for (const answer of tableAnswers) {
                // Use leftColumnIndex (from Column 2) as leftIndex to preserve all rows
                leftMap.set(answer.leftIndex, answer.leftText)
                // Collect unique right answers by rightIndex (from Column 4)
                if (!rightMap.has(answer.rightIndex)) {
                  rightMap.set(answer.rightIndex, answer.rightText)
                }
              }
          }
          
          // Create answers in order
            // For 4-column format, sortedLeft should have all rows in order (1, 2, 3, 4, 5, 6...)
          const sortedLeft = Array.from(leftMap.entries()).sort((a, b) => a[0] - b[0])
          const sortedRight = Array.from(rightMap.entries()).sort((a, b) => a[0] - b[0])
            
            let matchVariants: Record<number, number>[] = []
            
            if (is4ColumnFormat) {
              // For 4-column format, use matchMap from table columns (no need for "Ответы:" table)
              const variant: Record<number, number> = {}
              for (const [leftIndex, matchIndex] of matchMap.entries()) {
                // Find the position of leftIndex in sortedLeft
                const leftArrayIndex = sortedLeft.findIndex(([idx]) => idx === leftIndex)
                if (leftArrayIndex !== -1) {
                  // Find the position of matchIndex in sortedRight
                  const rightArrayIndex = sortedRight.findIndex(([idx]) => idx === matchIndex)
                  if (rightArrayIndex !== -1) {
                    // Convert to absolute index (right column starts after left column)
                    const absoluteRightIndex = rightArrayIndex + sortedLeft.length
                    variant[leftArrayIndex] = absoluteRightIndex
                  }
                }
              }
              if (Object.keys(variant).length > 0) {
                matchVariants = [variant]
              }
            } else {
              // For 5-column format, use "Ответы:" table if available
              // Example: "1=2, 2=3, 3=3, 4=1, 5=2, 6=1"
              // Column 2: left column indexlari (1-based) - 1, 2, 3, 4, 5, 6
              // Column 4: right column indexlari (1-based) - 2, 3, 3, 1, 2, 1
              // "Ответы:" jadvalidan: "1=2, 2=3, 3=3, 4=1, 5=2, 6=1" (1-based)
              const correctMatchesVariants = matchingAnswersTable[questionIndex] || []
              matchVariants = correctMatchesVariants.map(variant => {
                const convertedVariant: Record<number, number> = {}
                for (const [leftIdx, rightColumnIdx] of Object.entries(variant)) {
                  // leftIdx is 0-based from parseMatchingAnswersTableFromHTML (0, 1, 2, 3, 4, 5)
                  // Convert to 1-based to match Column 2 indices (1, 2, 3, 4, 5, 6)
                  const leftIndex1Based = parseInt(leftIdx) + 1
                  // Find the position of leftIndex1Based in sortedLeft
                  const leftArrayIndex = sortedLeft.findIndex(([idx]) => idx === leftIndex1Based)
                  if (leftArrayIndex !== -1) {
                    // rightColumnIdx is 0-based from parseMatchingAnswersTableFromHTML (1, 2, 2, 0, 1, 0)
                    // Convert to 1-based to match Column 4 indices (2, 3, 3, 1, 2, 1)
                    const rightIndex1Based = rightColumnIdx + 1
                    // Find the position of rightIndex1Based in sortedRight
                    const rightArrayIndex = sortedRight.findIndex(([idx]) => idx === rightIndex1Based)
                    if (rightArrayIndex !== -1) {
                      // Convert to absolute index (right column starts after left column)
                      const absoluteRightIndex = rightArrayIndex + sortedLeft.length
                      convertedVariant[leftArrayIndex] = absoluteRightIndex
                    }
                  }
                }
                return convertedVariant
              })
            }
          
          // Add left column answers
          sortedLeft.forEach(([_index, text], arrayIndex) => {
              // Use first variant as default matchIndex for backward compatibility
              const firstVariant = matchVariants.length > 0 ? matchVariants[0] : {}
              const rightColumnIndex = firstVariant[arrayIndex] !== undefined 
                ? firstVariant[arrayIndex] 
              : -1
            leftAnswers.push({
                text: is4ColumnFormat && text.startsWith('Left Answer ') ? text.replace('Left Answer ', '') : text,
              isCorrect: true,
                matchIndex: rightColumnIndex !== -1 ? rightColumnIndex : undefined,
                matchVariants: matchVariants.length > 0 ? matchVariants : undefined,
              isLeftColumn: true
            })
          })
          
          // Add right column answers
          sortedRight.forEach(([_index, text], arrayIndex) => {
            rightAnswers.push({
                text: is4ColumnFormat && text.startsWith('Right Answer ') ? text.replace('Right Answer ', '') : text,
              isCorrect: true,
              matchIndex: arrayIndex, // This is the index within right column
              isLeftColumn: false
            })
          })
          
          // Combine: first all left, then all right
          // Only add if we have at least 1 left and 1 right answer
          if (leftAnswers.length >= 1 && rightAnswers.length >= 1) {
            currentQuestion.answers = [...leftAnswers, ...rightAnswers]
              answersAdded = true
          }
        } else if (isSequenceFormat && sequenceTablesAnswers.length > tableIndex) {
          // Sequence format: use order numbers from table
          const tableAnswers = sequenceTablesAnswers[tableIndex]
          // Get correct order numbers from answers table if available
          const correctOrders = answersTable[questionIndex] || {}
          
          // Only add if we have at least 2 answers
          if (tableAnswers.length >= 2) {
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
              answersAdded = true
          }
        } else if (!isSequenceFormat && !isMatchingFormat && tablesAnswers.length > tableIndex) {
          // Regular format: use correctness from table
          const tableAnswers = tablesAnswers[tableIndex]
          // Only add if we have at least 2 answers
          if (tableAnswers.length >= 2) {
            for (const answer of tableAnswers) {
              currentQuestion.answers.push({
                text: answer.text,
                isCorrect: answer.isCorrect
              })
            }
              answersAdded = true
            }
          }
          
          // If no answers were added (table not found or empty), clear the question
          if (!answersAdded) {
            currentQuestion.answers = []
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
