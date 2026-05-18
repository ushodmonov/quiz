import { useState, useEffect, useCallback, useRef } from 'react'
import { Container, Box, LinearProgress, Typography, Button, Card, CardContent, Chip, Alert } from '@mui/material'
import { AccessTime } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { calculateScore } from '../utils/questionUtils'
import { saveProgress } from '../utils/storage'
import { formatTimerDisplay, getRemainingSeconds } from '../utils/quizTimer'
import QuestionDisplay from '../components/QuestionDisplay'
import type { QuizData, QuizResults } from '../types'

interface TestPageProps {
  quizData: QuizData
  onComplete: (results: QuizResults) => void
  onUpdateData: (data: QuizData) => void
}

export default function TestPage({ quizData, onComplete, onUpdateData }: TestPageProps) {
  const { t } = useTranslation()
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [isAnswered, setIsAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)
  const [timedOut, setTimedOut] = useState(false)
  const expiryHandledRef = useRef(false)

  const hasTimer = quizData.timerEndsAt != null
  const currentQuestion = quizData.selectedQuestions[quizData.currentQuestionIndex]
  const totalQuestions = quizData.selectedQuestions.length
  const progress = ((quizData.currentQuestionIndex + 1) / totalQuestions) * 100

  const finishTest = useCallback((options?: { timedOut?: boolean }) => {
    const nextStartIndex = quizData.startIndex + totalQuestions

    let finalNextStartIndex: number | null = null
    if (quizData.endQuestionIndex !== null && quizData.endQuestionIndex !== undefined) {
      if (nextStartIndex <= quizData.endQuestionIndex) {
        finalNextStartIndex = nextStartIndex
      }
    } else {
      finalNextStartIndex = nextStartIndex < quizData.allQuestions.length ? nextStartIndex : null
    }

    onComplete({
      correct: quizData.score.correct,
      incorrect: quizData.score.incorrect,
      total: totalQuestions,
      percentage: Math.round((quizData.score.correct / totalQuestions) * 100),
      nextStartIndex: finalNextStartIndex,
      timedOut: options?.timedOut
    })
  }, [quizData, totalQuestions, onComplete])

  const handleTimeExpired = useCallback(() => {
    if (expiryHandledRef.current) return
    expiryHandledRef.current = true
    setTimedOut(true)
    setRemainingSeconds(0)
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200])
    }
    finishTest({ timedOut: true })
  }, [finishTest])

  useEffect(() => {
    if (!hasTimer) {
      setRemainingSeconds(null)
      return
    }

    const tick = () => {
      const remaining = getRemainingSeconds(quizData.timerEndsAt)
      setRemainingSeconds(remaining)
      if (remaining !== null && remaining <= 0) {
        handleTimeExpired()
      }
    }

    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [hasTimer, quizData.timerEndsAt, handleTimeExpired])

  useEffect(() => {
    const savedAnswer = quizData.answers[quizData.currentQuestionIndex]
    
    if (savedAnswer) {
      setSelectedAnswers(savedAnswer.selected)
      setIsAnswered(true)
      setIsCorrect(savedAnswer.correct)
    } else {
      setSelectedAnswers([])
      setIsAnswered(false)
      setIsCorrect(false)
    }
  }, [quizData.currentQuestionIndex, quizData.answers])

  const handleAnswerSelect = (answerIndex: number) => {
    if (isAnswered || timedOut) return

    if (currentQuestion.isMultiSelect) {
      setSelectedAnswers((prev: number[]) => {
        if (prev.includes(answerIndex)) {
          return prev.filter((i: number) => i !== answerIndex)
        } else {
          return [...prev, answerIndex]
        }
      })
    } else {
      setSelectedAnswers([answerIndex])
    }
  }

  const handleSequenceSelect = (position: number, answerIndex: number) => {
    if (isAnswered || timedOut) return

    setSelectedAnswers((prev: number[]) => {
      const newAnswers = [...prev]
      const prevPosition = newAnswers.indexOf(answerIndex)
      if (prevPosition !== -1) {
        newAnswers[prevPosition] = -1
      }
      while (newAnswers.length <= position) {
        newAnswers.push(-1)
      }
      newAnswers[position] = answerIndex
      return newAnswers
    })
  }

  const handleMatchingSelect = (leftIndex: number, rightIndex: number) => {
    if (isAnswered || timedOut) return

    setSelectedAnswers((prev: number[]) => {
      const newAnswers = [...prev]
      while (newAnswers.length <= leftIndex) {
        newAnswers.push(-1)
      }
      newAnswers[leftIndex] = rightIndex
      return newAnswers
    })
  }

  const handleSubmit = () => {
    if (timedOut) return
    if (currentQuestion.isMatching) {
      const leftAnswers = currentQuestion.answers.filter(a => a.isLeftColumn)
      const allMatched = leftAnswers.every((_, leftIdx) => 
        selectedAnswers[leftIdx] !== undefined && selectedAnswers[leftIdx] !== -1
      )
      if (!allMatched) return
    } else if (selectedAnswers.length === 0) {
      return
    }

    const correct = calculateScore(currentQuestion, selectedAnswers)
    setIsCorrect(correct)
    setIsAnswered(true)

    if (!correct && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100])
    }

    const newScore = {
      correct: correct ? quizData.score.correct + 1 : quizData.score.correct,
      incorrect: correct ? quizData.score.incorrect : quizData.score.incorrect + 1
    }

    const newAnswers = {
      ...quizData.answers,
      [quizData.currentQuestionIndex]: {
        selected: selectedAnswers,
        correct
      }
    }

    const updatedData: QuizData = {
      ...quizData,
      score: newScore,
      answers: newAnswers
    }

    onUpdateData(updatedData)

    saveProgress({
      ...updatedData,
      timestamp: Date.now()
    })
  }

  const handleNext = () => {
    if (timedOut) return
    const nextIndex = quizData.currentQuestionIndex + 1
    
    if (nextIndex >= totalQuestions) {
      finishTest()
    } else {
      onUpdateData({
        ...quizData,
        currentQuestionIndex: nextIndex
      })
    }
  }

  const canSubmit = (() => {
    if (isAnswered || timedOut) return false
    if (currentQuestion.isMatching) {
      const leftAnswers = currentQuestion.answers.filter(a => a.isLeftColumn)
      return leftAnswers.every((_, leftIdx) => 
        selectedAnswers[leftIdx] !== undefined && selectedAnswers[leftIdx] !== -1
      )
    } else if (currentQuestion.isSequence) {
      return selectedAnswers.filter(a => a !== -1 && a !== undefined).length === currentQuestion.answers.length
    } else {
      return selectedAnswers.length > 0
    }
  })()

  const timerUrgent = remainingSeconds !== null && remainingSeconds <= 60 && remainingSeconds > 0
  const timerDisplay =
    remainingSeconds !== null ? formatTimerDisplay(remainingSeconds) : null

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        background: (theme) => theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: { xs: 2, sm: 3 },
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2 } }}>
        {timedOut && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t('test.timer.expired')}
          </Alert>
        )}

        <Card 
          sx={{ 
            mb: { xs: 2, sm: 3 },
            background: (theme) => theme.palette.mode === 'dark'
              ? 'rgba(30, 30, 30, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ mb: { xs: 1.5, sm: 2 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' }
                }}
              >
                {t('test.progress', { current: quizData.currentQuestionIndex + 1, total: totalQuestions })}
              </Typography>
              {hasTimer && timerDisplay !== null && (
                <Chip
                  icon={<AccessTime sx={{ fontSize: '1rem !important' }} />}
                  label={timerDisplay}
                  color={timedOut ? 'error' : timerUrgent ? 'warning' : 'default'}
                  variant={timedOut || timerUrgent ? 'filled' : 'outlined'}
                  sx={{
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    fontSize: { xs: '0.95rem', sm: '1.05rem' },
                    '& .MuiChip-label': { px: 1 }
                  }}
                />
              )}
            </Box>
            <Box sx={{ mb: { xs: 1, sm: 1.5 } }}>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ 
                  height: { xs: 8, sm: 12 }, 
                  borderRadius: { xs: 1, sm: 2 },
                  bgcolor: 'action.hover',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                  },
                }} 
              />
            </Box>
            {hasTimer && quizData.timeLimitSeconds && !timedOut && (
              <Typography variant="caption" color="text.secondary" align="center" display="block">
                {t('test.timer.limit', { minutes: Math.round(quizData.timeLimitSeconds / 60) })}
              </Typography>
            )}
          </CardContent>
        </Card>

        <Card
          sx={{
            background: (theme) => theme.palette.mode === 'dark'
              ? 'rgba(30, 30, 30, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            opacity: timedOut ? 0.85 : 1,
            pointerEvents: timedOut ? 'none' : 'auto',
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <QuestionDisplay
            question={currentQuestion}
            selectedAnswers={selectedAnswers}
            isAnswered={isAnswered}
            isCorrect={isCorrect}
            onAnswerSelect={handleAnswerSelect}
            onSequenceSelect={handleSequenceSelect}
            onMatchingSelect={handleMatchingSelect}
            questionNumber={currentQuestion.originalIndex !== undefined 
              ? currentQuestion.originalIndex + 1 
              : quizData.startIndex + quizData.currentQuestionIndex + 1}
          />

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 3, sm: 4 } }}>
            {!isAnswered && !timedOut && (
              <Button
                variant="contained"
                size="large"
                onClick={handleSubmit}
                disabled={!canSubmit}
                fullWidth
                sx={{ 
                  maxWidth: { xs: '100%', sm: 220 },
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  py: { xs: 1.25, sm: 1.5 },
                  background: canSubmit 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : undefined,
                  '&:hover': canSubmit ? {
                    background: 'linear-gradient(135deg, #5568d3 0%, #5e35b1 100%)',
                  } : {},
                }}
              >
                {t('test.checkAnswer')}
              </Button>
            )}
            
            {isAnswered && !timedOut && (
              <Button
                variant="contained"
                color="success"
                size="large"
                onClick={handleNext}
                fullWidth
                sx={{ 
                  maxWidth: { xs: '100%', sm: 220 },
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  py: { xs: 1.25, sm: 1.5 },
                  background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #43a047 0%, #1b5e20 100%)',
                  },
                }}
              >
                {quizData.currentQuestionIndex + 1 >= totalQuestions 
                  ? t('test.viewResults')
                  : t('test.nextQuestion')}
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
      </Container>
    </Box>
  )
}
