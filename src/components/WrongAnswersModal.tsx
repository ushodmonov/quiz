import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Divider,
  IconButton
} from '@mui/material'
import { Close } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { InlineMath, BlockMath } from 'react-katex'
import type { Question } from '../types'

interface WrongAnswer {
  question: Question
  questionIndex: number
  selected: number[]
  correct: number[]
}

interface WrongAnswersModalProps {
  open: boolean
  onClose: () => void
  wrongAnswers: WrongAnswer[]
}

export default function WrongAnswersModal({ open, onClose, wrongAnswers }: WrongAnswersModalProps) {
  const { t } = useTranslation()

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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '90vh',
          m: { xs: 1, sm: 2 },
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        p: { xs: 2, sm: 3 },
        pb: { xs: 1.5, sm: 2 }
      }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600,
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}
        >
          {t('results.wrongAnswers')} ({wrongAnswers.length})
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 3 } }}>
          {wrongAnswers.map((item, idx) => (
            <Box key={idx}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, mb: { xs: 1.5, sm: 2 }, flexWrap: 'wrap' }}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}
                >
                  {t('results.question')} {item.question.originalIndex !== undefined 
                    ? item.question.originalIndex + 1 
                    : item.questionIndex + 1}
                </Typography>
                <Chip 
                  label={t('results.incorrect')} 
                  color="error" 
                  size="small"
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                />
              </Box>
              
              <Typography 
                variant="body1" 
                sx={{ 
                  mb: { xs: 1.5, sm: 2 }, 
                  fontWeight: 500,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  lineHeight: 1.5
                }}
              >
                {renderText(item.question.text).map((part, partIdx) => {
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
              </Typography>
              
              <Divider sx={{ my: { xs: 1.5, sm: 2 } }} />
              
              <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    mb: { xs: 0.75, sm: 1 }, 
                    color: 'error.main', 
                    fontWeight: 600,
                    fontSize: { xs: '0.8rem', sm: '0.875rem' }
                  }}
                >
                  {t('results.yourAnswer')}:
                </Typography>
                {item.selected.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {item.selected.map((selectedIdx) => (
                      <Chip
                        key={selectedIdx}
                        label={renderText(item.question.answers[selectedIdx].text).map((part, partIdx) => {
                          if (part.type === 'inlineMath') {
                            try {
                              return <InlineMath key={partIdx} math={part.content} />
                            } catch (e) {
                              return <span key={partIdx}>${part.content}$</span>
                            }
                          } else {
                            return <span key={partIdx}>{part.content}</span>
                          }
                        })}
                        color="error"
                        variant="outlined"
                        sx={{ 
                          justifyContent: 'flex-start', 
                          height: 'auto', 
                          py: { xs: 0.75, sm: 1 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    Javob berilmagan
                  </Typography>
                )}
              </Box>
              
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    mb: { xs: 0.75, sm: 1 }, 
                    color: 'success.main', 
                    fontWeight: 600,
                    fontSize: { xs: '0.8rem', sm: '0.875rem' }
                  }}
                >
                  {t('results.correctAnswer')}:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {item.correct.map((correctIdx) => (
                    <Chip
                      key={correctIdx}
                      label={renderText(item.question.answers[correctIdx].text).map((part, partIdx) => {
                        if (part.type === 'inlineMath') {
                          try {
                            return <InlineMath key={partIdx} math={part.content} />
                          } catch (e) {
                            return <span key={partIdx}>${part.content}$</span>
                          }
                        } else {
                          return <span key={partIdx}>{part.content}</span>
                        }
                      })}
                      color="success"
                      variant="outlined"
                      sx={{ 
                        justifyContent: 'flex-start', 
                        height: 'auto', 
                        py: { xs: 0.75, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    />
                  ))}
                </Box>
              </Box>
              
              {idx < wrongAnswers.length - 1 && <Divider sx={{ mt: { xs: 2, sm: 3 } }} />}
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: { xs: 2, sm: 3 }, pt: { xs: 1.5, sm: 2 } }}>
        <Button 
          onClick={onClose} 
          variant="contained" 
          color="primary"
          fullWidth
          sx={{
            fontSize: { xs: '0.875rem', sm: '1rem' },
            py: { xs: 1, sm: 1.25 }
          }}
        >
          Yopish
        </Button>
      </DialogActions>
    </Dialog>
  )
}
