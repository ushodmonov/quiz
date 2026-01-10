import React, { useMemo } from 'react'
import { Box, FormControlLabel, Radio, Checkbox, Typography, Alert } from '@mui/material'
import { InlineMath, BlockMath } from 'react-katex'
import { useTranslation } from 'react-i18next'
import type { Question, Answer } from '../types'

interface QuestionDisplayProps {
  question: Question
  selectedAnswers: number[]
  isAnswered: boolean
  isCorrect: boolean
  onAnswerSelect: (index: number) => void
  questionNumber?: number
}

interface ShuffledAnswer extends Answer {
  originalIndex: number
}

function QuestionDisplay({ question, selectedAnswers, isAnswered, isCorrect, onAnswerSelect, questionNumber }: QuestionDisplayProps) {
  const { t } = useTranslation()

  // Shuffle answers randomly but keep track of original indices
  const shuffledAnswers = useMemo(() => {
    const answersWithIndex: ShuffledAnswer[] = question.answers.map((answer, index) => ({
      ...answer,
      originalIndex: index
    }))
    
    // Create a shuffled copy
    const shuffled = [...answersWithIndex]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    
    return shuffled
  }, [question.answers])

  // Convert selected answers from shuffled indices to original indices
  const convertToOriginalIndex = (shuffledIndex: number): number => {
    return shuffledAnswers[shuffledIndex].originalIndex
  }

  // Convert original indices to shuffled indices for display
  const convertToShuffledIndex = (originalIndex: number): number => {
    return shuffledAnswers.findIndex(a => a.originalIndex === originalIndex)
  }

  // Get answer color based on original index
  const getAnswerColor = (shuffledIndex: number): 'success' | 'error' | 'default' => {
    if (!isAnswered) return 'default'
    
    const answer = shuffledAnswers[shuffledIndex]
    const originalIndex = answer.originalIndex
    const isSelected = selectedAnswers.includes(originalIndex)
    
    if (answer.isCorrect) return 'success'
    if (isSelected && !answer.isCorrect) return 'error'
    return 'default'
  }

  const renderText = (text: string) => {
    const parts: Array<{ type: string; content: string }> = []
    let lastIndex = 0
    let inInlineMath = false
    let inBlockMath = false
    
    for (let i = 0; i < text.length; i++) {
      if (text.substring(i, i + 2) === '$$' && !inInlineMath) {
        if (inBlockMath) {
          parts.push({
            type: 'blockMath',
            content: text.substring(lastIndex + 2, i)
          })
          lastIndex = i + 2
          inBlockMath = false
        } else {
          if (i > lastIndex) {
            parts.push({
              type: 'text',
              content: text.substring(lastIndex, i)
            })
          }
          lastIndex = i
          inBlockMath = true
        }
        i++
      } else if (text[i] === '$' && !inBlockMath) {
        if (inInlineMath) {
          parts.push({
            type: 'inlineMath',
            content: text.substring(lastIndex + 1, i)
          })
          lastIndex = i + 1
          inInlineMath = false
        } else {
          if (i > lastIndex) {
            parts.push({
              type: 'text',
              content: text.substring(lastIndex, i)
            })
          }
          lastIndex = i
          inInlineMath = true
        }
      }
    }
    
    if (lastIndex < text.length) {
      parts.push({
        type: inBlockMath || inInlineMath ? (inBlockMath ? 'blockMath' : 'inlineMath') : 'text',
        content: text.substring(lastIndex + (inBlockMath || inInlineMath ? 2 : 0))
      })
    }
    
    return parts.length > 0 ? parts : [{ type: 'text', content: text }]
  }

  const questionParts = renderText(question.text)

  return (
    <Box>
      {questionNumber !== undefined && (
        <Typography 
          variant="subtitle1" 
          sx={{ 
            mb: { xs: 1.5, sm: 2 }, 
            color: 'text.secondary',
            fontWeight: 600,
            fontSize: { xs: '0.875rem', sm: '1rem' },
          }}
        >
          {t('test.questionNumber', { number: questionNumber })}
        </Typography>
      )}
      <Typography 
        variant="h5" 
        component="div" 
        gutterBottom 
        sx={{ 
          mb: { xs: 2, sm: 3 }, 
          fontWeight: 600,
          fontSize: { xs: '0.85rem', sm: '1.1rem', md: '1.25rem' },
          lineHeight: { xs: 1.3, sm: 1.4 }
        }}
      >
        {questionParts.map((part, idx) => {
          if (part.type === 'inlineMath') {
            try {
              return <InlineMath key={idx} math={part.content} />
            } catch (e) {
              return <span key={idx}>${part.content}$</span>
            }
          } else if (part.type === 'blockMath') {
            try {
              return <BlockMath key={idx} math={part.content} />
            } catch (e) {
              return <div key={idx}>$${part.content}$$</div>
            }
          } else {
            return <span key={idx}>{part.content}</span>
          }
        })}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {shuffledAnswers.map((answer, shuffledIndex) => {
          const answerParts = renderText(answer.text)
          const color = getAnswerColor(shuffledIndex)
          const originalIndex = answer.originalIndex
          const isSelected = selectedAnswers.includes(originalIndex)
          
          return (
            <Box
              key={shuffledIndex}
              sx={{
                p: { xs: 1, sm: 1.5, md: 2 },
                border: { xs: 1.5, sm: 2, md: 3 },
                borderColor: isAnswered 
                  ? (color === 'success' ? 'success.main' : color === 'error' ? 'error.main' : 'divider')
                  : (isSelected ? 'primary.main' : 'divider'),
                borderRadius: { xs: 2, sm: 3 },
                bgcolor: isAnswered 
                  ? (color === 'success' ? 'success.light' : color === 'error' ? 'error.light' : 'transparent')
                  : (isSelected ? 'action.selected' : 'transparent'),
                cursor: isAnswered ? 'default' : 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': isSelected && !isAnswered ? {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                  zIndex: 0,
                } : {},
                '&:hover': isAnswered ? {} : {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover',
                  transform: { xs: 'none', sm: 'translateX(8px)' },
                  boxShadow: { xs: 'none', sm: '0 4px 12px rgba(102, 126, 234, 0.2)' },
                }
              }}
              onClick={() => !isAnswered && onAnswerSelect(originalIndex)}
            >
              <FormControlLabel
                control={
                  question.isMultiSelect ? (
                    <Checkbox
                      checked={isSelected}
                      disabled={isAnswered}
                      color={color === 'default' ? 'primary' : color}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                    />
                  ) : (
                    <Radio
                      checked={isSelected}
                      disabled={isAnswered}
                      color={color === 'default' ? 'primary' : color}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                    />
                  )
                }
                label={
                  <Typography 
                    variant="body1"
                    sx={{ 
                      cursor: isAnswered ? 'default' : 'pointer', 
                      width: '100%', 
                      userSelect: 'none',
                      fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                      lineHeight: { xs: 1.3, sm: 1.4 }
                    }}
                  >
                    {answerParts.map((part, idx) => {
                      if (part.type === 'inlineMath') {
                        try {
                          return <InlineMath key={idx} math={part.content} />
                        } catch (e) {
                          return <span key={idx}>${part.content}$</span>
                        }
                      } else if (part.type === 'blockMath') {
                        try {
                          return <BlockMath key={idx} math={part.content} />
                        } catch (e) {
                          return <div key={idx}>$${part.content}$$</div>
                        }
                      } else {
                        return <span key={idx}>{part.content}</span>
                      }
                    })}
                  </Typography>
                }
                sx={{ m: 0, width: '100%', cursor: isAnswered ? 'default' : 'pointer', pointerEvents: 'none' }}
              />
            </Box>
          )
        })}
      </Box>

      {isAnswered && (
        <Alert 
          severity={isCorrect ? 'success' : 'error'} 
          sx={{ mt: 3 }}
        >
          {isCorrect ? t('test.correct') : t('test.incorrect')}
        </Alert>
      )}
    </Box>
  )
}

export default QuestionDisplay
