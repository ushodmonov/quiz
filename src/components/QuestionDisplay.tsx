import { useMemo } from 'react'
import { Box, FormControlLabel, Radio, Checkbox, Typography, Alert, useTheme, Select, MenuItem, FormControl, InputLabel, Chip } from '@mui/material'
import { InlineMath, BlockMath } from 'react-katex'
import { useTranslation } from 'react-i18next'
import type { Question, Answer } from '../types'

interface QuestionDisplayProps {
  question: Question
  selectedAnswers: number[]
  isAnswered: boolean
  isCorrect: boolean
  onAnswerSelect: (index: number) => void
  onSequenceSelect?: (position: number, answerIndex: number) => void
  onMatchingSelect?: (leftIndex: number, rightIndex: number) => void
  questionNumber?: number
  showAlert?: boolean
}

interface ShuffledAnswer extends Answer {
  originalIndex: number
}

function QuestionDisplay({ question, selectedAnswers, isAnswered, isCorrect, onAnswerSelect, onSequenceSelect, onMatchingSelect, questionNumber, showAlert = true }: QuestionDisplayProps) {
  const { t } = useTranslation()
  const theme = useTheme()

  // For sequence questions, selectedAnswers[position] = answerIndex
  // For regular questions, selectedAnswers contains selected answer indices

  // Shuffle answers randomly but keep track of original indices
  // Include questionNumber in dependencies to ensure answers are shuffled each time question is displayed
  // Don't shuffle for sequence or matching questions - keep original order
  const shuffledAnswers = useMemo(() => {
    const answersWithIndex: ShuffledAnswer[] = question.answers.map((answer, index) => ({
      ...answer,
      originalIndex: index
    }))
    
    if (question.isSequence || question.isMatching) {
      // For sequence and matching questions, don't shuffle - keep original order
      return answersWithIndex
    }
    
    // Create a shuffled copy using Fisher-Yates shuffle algorithm
    const shuffled = [...answersWithIndex]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    
    return shuffled
  }, [question.answers, questionNumber, question.text, question.isSequence, question.isMatching])

  // Get answer color based on original index
  const getAnswerColor = (shuffledIndex: number): 'success' | 'error' | 'default' => {
    if (!isAnswered) return 'default'
    
    const answer = shuffledAnswers[shuffledIndex]
    const originalIndex = answer.originalIndex
    
    if (question.isMatching) {
      // Matching format is handled separately in the matching UI
      return 'default'
    } else if (question.isSequence) {
      // For sequence: check if this answer is at the correct position
      const correctPosition = (answer.orderNumber || 0) - 1 // Convert to 0-based
      const selectedPosition = selectedAnswers.indexOf(originalIndex)
      
      if (selectedPosition === correctPosition && selectedPosition !== -1) {
        return 'success'
      } else if (selectedPosition !== -1) {
        return 'error'
      }
      return 'default'
    }
    
    // Regular format
    const isSelected = selectedAnswers.includes(originalIndex)
    
    if (answer.isCorrect) return 'success'
    if (isSelected && !answer.isCorrect) return 'error'
    return 'default'
  }

  // Get selected position for sequence questions
  const getSelectedPosition = (answerIndex: number): number => {
    return selectedAnswers.indexOf(answerIndex)
  }

  // Handle sequence order selection
  const handleSequenceSelect = (answerIndex: number, position: number) => {
    if (onSequenceSelect && !isAnswered) {
      onSequenceSelect(position, answerIndex)
    }
  }

  // Get matching answers (left and right columns)
  const getMatchingAnswers = () => {
    const leftAnswers: ShuffledAnswer[] = []
    const rightAnswers: ShuffledAnswer[] = []
    
    shuffledAnswers.forEach((answer) => {
      if (answer.isLeftColumn) {
        leftAnswers.push(answer)
      } else {
        rightAnswers.push(answer)
      }
    })
    
    return { leftAnswers, rightAnswers }
  }

  // Get selected right index for a left answer
  const getSelectedRightIndex = (leftIndex: number): number => {
    return selectedAnswers[leftIndex] !== undefined ? selectedAnswers[leftIndex] : -1
  }

  // Handle matching selection
  const handleMatchingSelect = (leftIndex: number, rightIndex: number) => {
    if (onMatchingSelect && !isAnswered) {
      onMatchingSelect(leftIndex, rightIndex)
    }
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

  // Get question format type
  const getQuestionFormat = () => {
    if (question.isMatching) {
      return { label: t('test.format.matching'), color: 'warning' as const }
    } else if (question.isSequence) {
      return { label: t('test.format.sequence'), color: 'info' as const }
    } else if (question.isMultiSelect) {
      return { label: t('test.format.multiSelect'), color: 'secondary' as const }
    } else {
      return { label: t('test.format.singleSelect'), color: 'primary' as const }
    }
  }

  const formatInfo = getQuestionFormat()

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: { xs: 1.5, sm: 2 }, flexWrap: 'wrap' }}>
      {questionNumber !== undefined && (
        <Typography 
          variant="subtitle1" 
          sx={{ 
            color: 'text.secondary',
            fontWeight: 600,
            fontSize: { xs: '0.875rem', sm: '1rem' },
          }}
        >
          {t('test.questionNumber', { number: questionNumber })}
        </Typography>
      )}
        <Chip
          label={formatInfo.label}
          color={formatInfo.color}
          size="small"
          variant="outlined"
          sx={{ 
            fontSize: { xs: '0.7rem', sm: '0.75rem' },
            height: { xs: 24, sm: 28 },
            fontWeight: 600
          }}
        />
      </Box>
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

      {question.isMatching ? (
        // Matching format: show left and right columns
        (() => {
          const { leftAnswers, rightAnswers } = getMatchingAnswers()
          return (
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
              {/* Left Column */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {t('test.matching.leftColumn')}
                </Typography>
                {leftAnswers.map((answer, index) => {
                  const answerParts = renderText(answer.text)
                  const leftIndex = answer.originalIndex
                  const selectedRightIndex = getSelectedRightIndex(leftIndex)
                  const correctRightIndex = answer.matchIndex !== undefined ? answer.matchIndex : -1
                  const isCorrect = isAnswered && selectedRightIndex === correctRightIndex && selectedRightIndex !== -1
                  const isIncorrect = isAnswered && selectedRightIndex !== -1 && selectedRightIndex !== correctRightIndex
                  
                  return (
                    <Box
                      key={index}
                      sx={{
                        p: { xs: 1.5, sm: 2 },
                        border: 2,
                        borderColor: isAnswered
                          ? (isCorrect ? 'success.main' : isIncorrect ? 'error.main' : 'divider')
                          : (selectedRightIndex !== -1 ? 'primary.main' : 'divider'),
                        borderRadius: 2,
                        bgcolor: isAnswered
                          ? (isCorrect
                              ? (theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.2)' : 'success.light')
                              : isIncorrect
                                ? (theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.2)' : 'error.light')
                                : 'transparent')
                          : (selectedRightIndex !== -1 ? 'action.selected' : 'transparent'),
                      }}
                    >
                      <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
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
                      <FormControl size="small" fullWidth>
                        <InputLabel>{t('test.matching.selectMatch')}</InputLabel>
                        <Select
                          value={selectedRightIndex !== -1 ? selectedRightIndex : ''}
                          onChange={(e) => {
                            const rightIndex = parseInt(e.target.value as string)
                            handleMatchingSelect(leftIndex, rightIndex)
                          }}
                          disabled={isAnswered}
                          label={t('test.matching.selectMatch')}
                        >
                          <MenuItem value="">
                            <em>{t('test.matching.none')}</em>
                          </MenuItem>
                          {rightAnswers.map((rightAnswer, rightIdx) => {
                            const rightAnswerIndex = rightAnswer.originalIndex
                            return (
                              <MenuItem key={rightIdx} value={rightAnswerIndex}>
                                {renderText(rightAnswer.text).map((part, partIdx) => {
                                  if (part.type === 'inlineMath') {
                                    try {
                                      return <InlineMath key={partIdx} math={part.content} />
                                    } catch (e) {
                                      return <span key={partIdx}>${part.content}$</span>
                                    }
                                  } else if (part.type === 'blockMath') {
                                    try {
                                      return <BlockMath key={partIdx} math={part.content} />
                                    } catch (e) {
                                      return <div key={partIdx}>$${part.content}$$</div>
                                    }
                                  } else {
                                    return <span key={partIdx}>{part.content}</span>
                                  }
                                })}
                              </MenuItem>
                            )
                          })}
                        </Select>
                      </FormControl>
                    </Box>
                  )
                })}
              </Box>

              {/* Right Column */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {t('test.matching.rightColumn')}
                </Typography>
                {rightAnswers.map((answer, index) => {
                  const answerParts = renderText(answer.text)
                  return (
                    <Box
                      key={index}
                      sx={{
                        p: { xs: 1.5, sm: 2 },
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 2,
                        bgcolor: 'transparent',
                      }}
                    >
                      <Typography variant="body1">
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
                    </Box>
                  )
                })}
              </Box>
            </Box>
          )
        })()
      ) : (
        // Regular, sequence, or multi-select format
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {shuffledAnswers.map((answer, shuffledIndex) => {
          const answerParts = renderText(answer.text)
          const color = getAnswerColor(shuffledIndex)
          const originalIndex = answer.originalIndex
          const isSelected = question.isSequence 
            ? getSelectedPosition(originalIndex) !== -1
            : selectedAnswers.includes(originalIndex)
          const selectedPosition = question.isSequence ? getSelectedPosition(originalIndex) : -1
          
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
                  ? (color === 'success' 
                      ? (theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.2)' : 'success.light')
                      : color === 'error' 
                        ? (theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.2)' : 'error.light')
                        : 'transparent')
                  : (isSelected ? 'action.selected' : 'transparent'),
                cursor: isAnswered ? 'default' : (question.isSequence ? 'default' : 'pointer'),
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                '&::before': isSelected && !isAnswered && !question.isSequence ? {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                  zIndex: 0,
                } : {},
                '&:hover': isAnswered || question.isSequence ? {} : {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover',
                  transform: { xs: 'none', sm: 'translateX(8px)' },
                  boxShadow: { xs: 'none', sm: '0 4px 12px rgba(102, 126, 234, 0.2)' },
                }
              }}
              onClick={() => !isAnswered && !question.isSequence && onAnswerSelect(originalIndex)}
            >
              {question.isSequence ? (
                <>
                  <FormControl 
                    size="small" 
                    sx={{ 
                      minWidth: { xs: 80, sm: 100 },
                      '& .MuiOutlinedInput-root': {
                        bgcolor: isAnswered 
                          ? (color === 'success' 
                              ? (theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.1)')
                              : color === 'error' 
                                ? (theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.1)' : 'rgba(244, 67, 54, 0.1)')
                                : 'transparent')
                          : 'transparent',
                      }
                    }}
                  >
                    <InputLabel>{t('test.sequence.order')}</InputLabel>
                    <Select
                      value={selectedPosition !== -1 ? selectedPosition + 1 : ''}
                      onChange={(e) => {
                        const position = parseInt(e.target.value as string) - 1
                        handleSequenceSelect(originalIndex, position)
                      }}
                      disabled={isAnswered}
                      label={t('test.sequence.order')}
                    >
                      {question.answers.map((_, idx) => (
                        <MenuItem key={idx} value={idx + 1}>
                          {idx + 1}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography 
                    variant="body1"
                    sx={{ 
                      flex: 1,
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
                </>
              ) : (
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
              )}
            </Box>
          )
        })}
      </Box>
      )}

      {isAnswered && showAlert && (
        <Alert 
          severity={isCorrect ? 'success' : 'error'} 
          sx={{ mt: 3 }}
        >
          {isCorrect ? (
            t('test.correct')
          ) : (
            <Box>
              <Typography variant="body2" sx={{ mb: (question.isSequence || question.isMatching) ? 1 : 0 }}>
                {t('test.incorrect')}
              </Typography>
              {question.isMatching && !isCorrect && (() => {
                const firstLeftAnswer = question.answers.find(a => a.isLeftColumn)
                const hasMultipleVariants = firstLeftAnswer?.matchVariants && firstLeftAnswer.matchVariants.length > 1
                const leftAnswers = question.answers.filter(a => a.isLeftColumn)
                
                return (
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                      {t('test.matching.correctMatches')}:
                    </Typography>
                    {hasMultipleVariants && firstLeftAnswer?.matchVariants ? (
                      // Show all variants
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {firstLeftAnswer.matchVariants.map((variant, variantIndex) => (
                          <Box key={variantIndex}>
                            {variantIndex > 0 && (
                              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5, display: 'block' }}>
                                {t('test.matching.variant')} {variantIndex + 1}:
                              </Typography>
                            )}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pl: variantIndex > 0 ? 1 : 0 }}>
                              {leftAnswers.map((leftAnswer, leftIdx) => {
                                const rightIndex = variant[leftIdx]
                                const rightAnswer = rightIndex !== undefined && rightIndex >= 0
                                  ? question.answers[rightIndex]
                                  : null
                                return (
                                  <Typography 
                                    key={leftIdx}
                                    variant="body2" 
                                    sx={{ 
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1,
                                      pl: 1
                                    }}
                                  >
                                    <Chip
                                      label={leftAnswer.text}
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                      sx={{ 
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        maxWidth: '200px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                      }}
                                    />
                                    <span>→</span>
                                    <Chip
                                      label={rightAnswer?.text || ''}
                                      size="small"
                                      color="success"
                                      variant="outlined"
                                      sx={{ 
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        maxWidth: '200px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                      }}
                                    />
                                  </Typography>
                                )
                              })}
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      // Show single variant (backward compatibility)
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {leftAnswers.map((leftAnswer, leftIdx) => {
                          // leftAnswer.matchIndex is the absolute index of the right answer
                          const rightAnswer = leftAnswer.matchIndex !== undefined && leftAnswer.matchIndex >= 0
                            ? question.answers[leftAnswer.matchIndex]
                            : null
                          return (
                            <Typography 
                              key={leftIdx}
                              variant="body2" 
                              sx={{ 
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                pl: 1
                              }}
                            >
                              <Chip
                                label={leftAnswer.text}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ 
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  maxWidth: '200px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                              />
                              <span>→</span>
                              <Chip
                                label={rightAnswer?.text || ''}
                                size="small"
                                color="success"
                                variant="outlined"
                                sx={{ 
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  maxWidth: '200px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                              />
                            </Typography>
                          )
                        })}
                      </Box>
                    )}
                  </Box>
                )
              })()}
              {question.isSequence && !isCorrect && (
                <Box sx={{ mt: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    {t('test.sequence.correctOrder')}:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {question.answers
                      .map((answer, index) => ({ answer, index }))
                      .sort((a, b) => (a.answer.orderNumber || 0) - (b.answer.orderNumber || 0))
                      .map(({ answer, index }, sortedIndex) => (
                        <Typography 
                          key={index}
                          variant="body2" 
                          sx={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            pl: 1
                          }}
                        >
                          <Chip
                            label={answer.orderNumber || sortedIndex + 1}
                            size="small"
                            color="success"
                            variant="outlined"
                            sx={{ 
                              minWidth: 40,
                              height: 24,
                              fontSize: '0.7rem',
                              fontWeight: 600
                            }}
                          />
                          <span>{answer.text}</span>
                        </Typography>
                      ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Alert>
      )}
    </Box>
  )
}

export default QuestionDisplay
