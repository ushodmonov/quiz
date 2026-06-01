import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Container,
  Box,
  LinearProgress,
  Typography,
  Button,
  Chip,
  Alert,
  Fade,
  Grow
} from '@mui/material'
import { keyframes } from '@mui/system'
import type { Theme } from '@mui/material/styles'
import { AccessTime, ArrowBack, ArrowForward } from '@mui/icons-material'
import SingleModeQuestionNav, { type SingleQuestionNavStatus } from '../components/SingleModeQuestionNav'
import { useTranslation } from 'react-i18next'
import { calculateScore } from '../utils/questionUtils'
import { saveProgress } from '../utils/storage'
import { questionKey, isBookmarked as isQuestionBookmarked, toggleBookmark } from '../utils/userStats'
import { formatTimerDisplay, getRemainingSeconds } from '../utils/quizTimer'
import { canSubmitQuestionSelection, hasQuestionDraftSelection } from '../utils/questionSubmit'
import QuestionDisplay from '../components/QuestionDisplay'
import type { QuizData, QuizResults, Question } from '../types'

interface TestPageProps {
  quizData: QuizData
  onComplete: (results: QuizResults, patch?: Partial<QuizData>) => void
  onUpdateData: (data: QuizData) => void
}

function getQuestionNumber(quizData: QuizData, questionIndex: number, question: Question): number {
  if (question.originalIndex !== undefined) return question.originalIndex + 1
  return quizData.startIndex + questionIndex + 1
}

const pulseRing = keyframes`
  0%   { box-shadow: 0 0 0 0 rgba(217, 48, 37, 0.45); }
  70%  { box-shadow: 0 0 0 10px rgba(217, 48, 37, 0); }
  100% { box-shadow: 0 0 0 0 rgba(217, 48, 37, 0); }
`

const TEST_PANEL_PADDING = { p: { xs: 2, sm: 3 } }

function testPageGradient(theme: Theme) {
  return theme.palette.background.default
}

function testPanelBackground(theme: Theme) {
  return theme.palette.background.paper
}

const testPanelSx = {
  borderRadius: { xs: 0, sm: 2 },
  boxShadow: 'none',
  border: { xs: 'none', sm: (theme: Theme) => `1px solid ${theme.palette.divider}` },
  bgcolor: (theme: Theme) => testPanelBackground(theme)
}

function TestPageHeader({
  quizData,
  progressValue,
  progressLabel,
  remainingSeconds,
  timedOut,
  hasTimer
}: {
  quizData: QuizData
  progressValue: number
  progressLabel: string
  remainingSeconds: number | null
  timedOut: boolean
  hasTimer: boolean
}) {
  const { t } = useTranslation()
  const timerUrgent = remainingSeconds !== null && remainingSeconds <= 60 && remainingSeconds > 0
  const timerDisplay = remainingSeconds !== null ? formatTimerDisplay(remainingSeconds) : null

  return (
    <Box sx={TEST_PANEL_PADDING}>
      <Box
        sx={{
          mb: { xs: 1.5, sm: 2 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          flexWrap: 'wrap'
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' } }}>
          {progressLabel}
        </Typography>
        {hasTimer && timerDisplay !== null && (
          <Chip
            icon={<AccessTime sx={{ fontSize: '1rem !important' }} />}
            label={timerDisplay}
            color={timedOut ? 'error' : timerUrgent ? 'error' : 'default'}
            variant={timedOut || timerUrgent ? 'filled' : 'outlined'}
            sx={{
              fontWeight: 700,
              fontFamily: 'monospace',
              fontSize: { xs: '0.95rem', sm: '1.05rem' },
              '& .MuiChip-label': { px: 1 },
              ...(timerUrgent && !timedOut
                ? { animation: `${pulseRing} 1.4s ease-out infinite` }
                : {})
            }}
          />
        )}
      </Box>
      <Box sx={{ mb: { xs: 1, sm: 1.5 } }}>
        <LinearProgress
          variant="determinate"
          value={progressValue}
          sx={{
            height: { xs: 8, sm: 10 },
            borderRadius: 4,
            bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': {
              transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            }
          }}
        />
      </Box>
      {hasTimer && quizData.timeLimitSeconds && !timedOut && (
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          {t('test.timer.limit', { minutes: Math.round(quizData.timeLimitSeconds / 60) })}
        </Typography>
      )}
    </Box>
  )
}

export default function TestPage({ quizData, onComplete, onUpdateData }: TestPageProps) {
  const { t } = useTranslation()
  const isAllMode = (quizData.displayMode ?? 'single') === 'all'

  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [isAnswered, setIsAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [draftAnswers, setDraftAnswers] = useState<Record<number, number[]>>({})
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)
  const [timedOut, setTimedOut] = useState(false)
  const expiryHandledRef = useRef(false)
  // Bookmark holatini yangilash uchun versiya hisoblagichi
  const [, setBookmarkVersion] = useState(0)

  const bookmarkKeyFor = useCallback(
    (question: Question) => question.sourceKey ?? questionKey(quizData.fileId, question),
    [quizData.fileId]
  )

  const handleToggleBookmark = useCallback(
    (question: Question) => {
      const key = bookmarkKeyFor(question)
      toggleBookmark(key, quizData.fileId, quizData.fileName, question)
      setBookmarkVersion((v) => v + 1)
    },
    [bookmarkKeyFor, quizData.fileId, quizData.fileName]
  )

  const hasTimer = quizData.timerEndsAt != null
  const totalQuestions = quizData.selectedQuestions.length
  const currentQuestion = quizData.selectedQuestions[quizData.currentQuestionIndex]
  const finishTest = useCallback(
    (options?: {
      timedOut?: boolean
      score?: { correct: number; incorrect: number }
      patch?: Partial<QuizData>
    }) => {
      const nextStartIndex = quizData.startIndex + totalQuestions
      const score = options?.score ?? quizData.score

      let finalNextStartIndex: number | null = null
      if (quizData.endQuestionIndex !== null && quizData.endQuestionIndex !== undefined) {
        if (nextStartIndex <= quizData.endQuestionIndex) {
          finalNextStartIndex = nextStartIndex
        }
      } else {
        finalNextStartIndex = nextStartIndex < quizData.allQuestions.length ? nextStartIndex : null
      }

      onComplete(
        {
          correct: score.correct,
          incorrect: score.incorrect,
          total: totalQuestions,
          percentage: Math.round((score.correct / totalQuestions) * 100),
          nextStartIndex: finalNextStartIndex,
          timedOut: options?.timedOut
        },
        options?.patch
      )
    },
    [quizData, totalQuestions, onComplete]
  )

  const persistQuiz = useCallback(
    (updated: QuizData) => {
      onUpdateData(updated)
      saveProgress({ ...updated, timestamp: Date.now() })
    },
    [onUpdateData]
  )

  const getPendingSelection = useCallback(
    (index: number): number[] => {
      if (draftAnswers[index] !== undefined) return draftAnswers[index]
      return quizData.pendingAnswers?.[index] ?? []
    },
    [draftAnswers, quizData.pendingAnswers]
  )

  const gradeAndFinishAllMode = useCallback(
    (options?: { timedOut?: boolean }) => {
      let correct = 0
      let incorrect = 0
      const answers: QuizData['answers'] = {}

      for (let i = 0; i < totalQuestions; i++) {
        const question = quizData.selectedQuestions[i]
        const selected = getPendingSelection(i)
        const hasSelection = canSubmitQuestionSelection(question, selected)
        const isQuestionCorrect = hasSelection && calculateScore(question, selected)

        if (isQuestionCorrect) {
          correct++
        } else {
          incorrect++
        }

        answers[i] = {
          selected: hasSelection ? selected : [],
          correct: isQuestionCorrect
        }
      }

      const score = { correct, incorrect }
      const updated: QuizData = {
        ...quizData,
        answers,
        score,
        pendingAnswers: undefined
      }
      persistQuiz(updated)
      finishTest({
        timedOut: options?.timedOut,
        score,
        patch: { answers, score, pendingAnswers: undefined }
      })
    },
    [quizData, totalQuestions, getPendingSelection, persistQuiz, finishTest]
  )

  const answeredCountAll = isAllMode
    ? quizData.selectedQuestions.filter((q, i) =>
        canSubmitQuestionSelection(q, getPendingSelection(i))
      ).length
    : 0
  const allAnswered = isAllMode && answeredCountAll >= totalQuestions

  const handleTimeExpired = useCallback(() => {
    if (expiryHandledRef.current) return
    expiryHandledRef.current = true
    setTimedOut(true)
    setRemainingSeconds(0)
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200])
    }
    if (isAllMode) {
      gradeAndFinishAllMode({ timedOut: true })
    } else {
      finishTest({ timedOut: true })
    }
  }, [isAllMode, gradeAndFinishAllMode, finishTest])

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
    if (isAllMode && quizData.pendingAnswers) {
      setDraftAnswers(quizData.pendingAnswers)
    }
  }, [isAllMode, quizData.fileId])

  const getSingleQuestionStatus = useCallback(
    (index: number): SingleQuestionNavStatus => {
      const saved = quizData.answers[index]
      if (saved) return saved.correct ? 'correct' : 'incorrect'

      const question = quizData.selectedQuestions[index]
      if (index === quizData.currentQuestionIndex) {
        if (hasQuestionDraftSelection(question, selectedAnswers)) return 'draft'
      }

      const pending = quizData.pendingAnswers?.[index]
      if (pending && hasQuestionDraftSelection(question, pending)) return 'draft'
      return 'empty'
    },
    [
      quizData.answers,
      quizData.pendingAnswers,
      quizData.currentQuestionIndex,
      quizData.selectedQuestions,
      selectedAnswers
    ]
  )

  const buildPendingPatchForIndex = useCallback(
    (idx: number, selection: number[]) => {
      if (quizData.answers[idx]) return quizData.pendingAnswers

      const question = quizData.selectedQuestions[idx]
      if (!hasQuestionDraftSelection(question, selection)) {
        if (!quizData.pendingAnswers?.[idx]) return quizData.pendingAnswers
        const pendingAnswers = { ...quizData.pendingAnswers }
        delete pendingAnswers[idx]
        return Object.keys(pendingAnswers).length > 0 ? pendingAnswers : undefined
      }
      return { ...quizData.pendingAnswers, [idx]: selection }
    },
    [quizData]
  )

  const goToQuestion = useCallback(
    (index: number) => {
      if (timedOut || index < 0 || index >= totalQuestions || index === quizData.currentQuestionIndex) {
        return
      }

      const fromIdx = quizData.currentQuestionIndex
      const pendingAnswers = buildPendingPatchForIndex(fromIdx, selectedAnswers)

      persistQuiz({
        ...quizData,
        pendingAnswers,
        currentQuestionIndex: index
      })
    },
    [timedOut, totalQuestions, quizData, selectedAnswers, buildPendingPatchForIndex, persistQuiz]
  )

  // —— Single-question mode ——
  useEffect(() => {
    if (isAllMode) return
    const idx = quizData.currentQuestionIndex
    const savedAnswer = quizData.answers[idx]

    if (savedAnswer) {
      setSelectedAnswers(savedAnswer.selected)
      setIsAnswered(true)
      setIsCorrect(savedAnswer.correct)
    } else {
      const pending = quizData.pendingAnswers?.[idx]
      setSelectedAnswers(pending ?? [])
      setIsAnswered(false)
      setIsCorrect(false)
    }
  }, [isAllMode, quizData.currentQuestionIndex, quizData.answers, quizData.pendingAnswers])

  const handleAnswerSelect = (answerIndex: number) => {
    if (isAnswered || timedOut) return
    if (currentQuestion.isMultiSelect) {
      setSelectedAnswers((prev) =>
        prev.includes(answerIndex) ? prev.filter((i) => i !== answerIndex) : [...prev, answerIndex]
      )
    } else {
      setSelectedAnswers([answerIndex])
    }
  }

  const handleSequenceSelect = (position: number, answerIndex: number) => {
    if (isAnswered || timedOut) return
    setSelectedAnswers((prev) => {
      const newAnswers = [...prev]
      const prevPosition = newAnswers.indexOf(answerIndex)
      if (prevPosition !== -1) newAnswers[prevPosition] = -1
      while (newAnswers.length <= position) newAnswers.push(-1)
      newAnswers[position] = answerIndex
      return newAnswers
    })
  }

  const handleMatchingSelect = (leftIndex: number, rightIndex: number) => {
    if (isAnswered || timedOut) return
    setSelectedAnswers((prev) => {
      const newAnswers = [...prev]
      while (newAnswers.length <= leftIndex) newAnswers.push(-1)
      newAnswers[leftIndex] = rightIndex
      return newAnswers
    })
  }

  const handleSubmitSingle = () => {
    if (timedOut) return
    if (!canSubmitQuestionSelection(currentQuestion, selectedAnswers)) return

    const correct = calculateScore(currentQuestion, selectedAnswers)
    setIsCorrect(correct)
    setIsAnswered(true)

    if (!correct && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100])
    }

    const idx = quizData.currentQuestionIndex
    const pendingAnswers = { ...(quizData.pendingAnswers ?? {}) }
    delete pendingAnswers[idx]

    persistQuiz({
      ...quizData,
      pendingAnswers: Object.keys(pendingAnswers).length > 0 ? pendingAnswers : undefined,
      score: {
        correct: correct ? quizData.score.correct + 1 : quizData.score.correct,
        incorrect: correct ? quizData.score.incorrect : quizData.score.incorrect + 1
      },
      answers: {
        ...quizData.answers,
        [idx]: { selected: selectedAnswers, correct }
      }
    })
  }

  const handlePrevSingle = () => {
    goToQuestion(quizData.currentQuestionIndex - 1)
  }

  const handleNextSkipSingle = () => {
    goToQuestion(quizData.currentQuestionIndex + 1)
  }

  const handleNextSingle = () => {
    if (timedOut) return
    const nextIndex = quizData.currentQuestionIndex + 1
    if (nextIndex >= totalQuestions) {
      finishTest({
        patch: { answers: quizData.answers, score: quizData.score, pendingAnswers: undefined }
      })
    } else {
      goToQuestion(nextIndex)
    }
  }

  const checkedCountSingle = Object.keys(quizData.answers).length
  const canFinishSingle = checkedCountSingle >= totalQuestions

  const handleFinishSingle = () => {
    if (timedOut || !canFinishSingle) return
    const idx = quizData.currentQuestionIndex
    const pendingAnswers = buildPendingPatchForIndex(idx, selectedAnswers)
    finishTest({
      patch: {
        answers: quizData.answers,
        score: quizData.score,
        pendingAnswers,
        currentQuestionIndex: idx
      }
    })
  }

  // —— All-questions mode ——
  const savePendingSelection = (index: number, selected: number[]) => {
    setDraftAnswers((prev) => ({ ...prev, [index]: selected }))
    const pendingAnswers = { ...quizData.pendingAnswers, [index]: selected }
    persistQuiz({ ...quizData, pendingAnswers })
  }

  const handleAnswerSelectAll = (questionIndex: number, answerIndex: number) => {
    if (timedOut) return
    const question = quizData.selectedQuestions[questionIndex]
    const current = getPendingSelection(questionIndex)
    let next: number[]
    if (question.isMultiSelect) {
      next = current.includes(answerIndex)
        ? current.filter((i) => i !== answerIndex)
        : [...current, answerIndex]
    } else {
      next = [answerIndex]
    }
    savePendingSelection(questionIndex, next)
  }

  const handleSequenceSelectAll = (questionIndex: number, position: number, answerIndex: number) => {
    if (timedOut) return
    const current = [...getPendingSelection(questionIndex)]
    const prevPosition = current.indexOf(answerIndex)
    if (prevPosition !== -1) current[prevPosition] = -1
    while (current.length <= position) current.push(-1)
    current[position] = answerIndex
    savePendingSelection(questionIndex, current)
  }

  const handleMatchingSelectAll = (questionIndex: number, leftIndex: number, rightIndex: number) => {
    if (timedOut) return
    const current = [...getPendingSelection(questionIndex)]
    while (current.length <= leftIndex) current.push(-1)
    current[leftIndex] = rightIndex
    savePendingSelection(questionIndex, current)
  }

  const singleProgress =
    totalQuestions > 0 ? (checkedCountSingle / totalQuestions) * 100 : 0
  const allProgress = totalQuestions > 0 ? (answeredCountAll / totalQuestions) * 100 : 0
  const canSubmitSingle =
    !isAnswered && !timedOut && canSubmitQuestionSelection(currentQuestion, selectedAnswers)

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: { xs: 'calc(100dvh - 56px)', sm: 'calc(100vh - 64px)' },
        background: (theme: Theme) => testPageGradient(theme),
        py: { xs: 0, sm: 3 }
      }}
    >
      <Container
        maxWidth="lg"
        disableGutters
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          px: { xs: 0, sm: 2 },
          pb: { xs: 0, sm: 3 }
        }}
      >
        {timedOut && (
          <Alert severity="warning" sx={{ mx: { xs: 2, sm: 0 }, mt: { xs: 2, sm: 0 }, mb: { xs: 1, sm: 2 } }}>
            {t('test.timer.expired')}
          </Alert>
        )}

        <Box
          sx={{
            flexShrink: 0,
            mb: { xs: 0, sm: 3 },
            ...testPanelSx,
            borderBottom: { xs: 1, sm: 0 },
            borderColor: 'divider'
          }}
        >
          <TestPageHeader
            quizData={quizData}
            progressValue={isAllMode ? allProgress : singleProgress}
            progressLabel={
              isAllMode
                ? t('test.progressAnswered', { answered: answeredCountAll, total: totalQuestions })
                : t('test.progressChecked', { checked: checkedCountSingle, total: totalQuestions })
            }
            remainingSeconds={remainingSeconds}
            timedOut={timedOut}
            hasTimer={hasTimer}
          />
        </Box>

        {isAllMode ? (
          <Box
            sx={{
              flex: { xs: 1, sm: 'none' },
              minHeight: { xs: 0, sm: 'auto' },
              overflow: { xs: 'auto', sm: 'visible' },
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {quizData.selectedQuestions.map((question, index) => {
              const selected = getPendingSelection(index)

              return (
                <Box
                  key={index}
                  sx={{
                    ...testPanelSx,
                    mb: { xs: 0, sm: 2 },
                    opacity: timedOut ? 0.85 : 1,
                    borderBottom: { xs: 1, sm: 0 },
                    borderColor: 'divider'
                  }}
                >
                  <Box sx={TEST_PANEL_PADDING}>
                    <QuestionDisplay
                      question={question}
                      selectedAnswers={selected}
                      isAnswered={false}
                      isCorrect={false}
                      showAlert={false}
                      onAnswerSelect={(answerIndex) => handleAnswerSelectAll(index, answerIndex)}
                      onSequenceSelect={(position, answerIndex) =>
                        handleSequenceSelectAll(index, position, answerIndex)
                      }
                      onMatchingSelect={(leftIndex, rightIndex) =>
                        handleMatchingSelectAll(index, leftIndex, rightIndex)
                      }
                      questionNumber={getQuestionNumber(quizData, index, question)}
                      bookmarkable
                      isBookmarked={isQuestionBookmarked(bookmarkKeyFor(question))}
                      onToggleBookmark={() => handleToggleBookmark(question)}
                    />
                  </Box>
                </Box>
              )
            })}

            <Box
              sx={{
                ...testPanelSx,
                pointerEvents: timedOut ? 'none' : 'auto',
                pb: 'max(16px, env(safe-area-inset-bottom, 0px))'
              }}
            >
              <Box sx={{ ...TEST_PANEL_PADDING, textAlign: 'center' }}>
                {!allAnswered && !timedOut && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t('test.allMode.finishHint', {
                      remaining: totalQuestions - answeredCountAll
                    })}
                  </Typography>
                )}
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  onClick={() => gradeAndFinishAllMode()}
                  disabled={!allAnswered || timedOut}
                >
                  {t('test.allMode.finishTest')}
                </Button>
              </Box>
            </Box>
          </Box>
        ) : (
          <>
            <Box
              sx={{
                flex: { xs: 1, sm: 'none' },
                minHeight: { xs: 0, sm: 'auto' },
                overflow: { xs: 'auto', sm: 'visible' },
                WebkitOverflowScrolling: 'touch',
                mb: { xs: 0, sm: 3 },
                ...testPanelSx,
                opacity: timedOut ? 0.85 : 1,
                pointerEvents: timedOut ? 'none' : 'auto',
                borderBottom: { xs: 1, sm: 0 },
                borderColor: 'divider'
              }}
            >
              <Box sx={{ ...TEST_PANEL_PADDING, p: { xs: 2, sm: 3, md: 4 } }}>
                <Fade in key={quizData.currentQuestionIndex} timeout={280}>
                  <Box>
                    <QuestionDisplay
                      question={currentQuestion}
                      selectedAnswers={selectedAnswers}
                      isAnswered={isAnswered}
                      isCorrect={isCorrect}
                      onAnswerSelect={handleAnswerSelect}
                      onSequenceSelect={handleSequenceSelect}
                      onMatchingSelect={handleMatchingSelect}
                      questionNumber={getQuestionNumber(
                        quizData,
                        quizData.currentQuestionIndex,
                        currentQuestion
                      )}
                      bookmarkable
                      isBookmarked={isQuestionBookmarked(bookmarkKeyFor(currentQuestion))}
                      onToggleBookmark={() => handleToggleBookmark(currentQuestion)}
                    />
                  </Box>
                </Fade>

                {!timedOut && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                      mt: { xs: 2, sm: 3 },
                      flexWrap: 'wrap'
                    }}
                  >
                    <Button
                      variant="outlined"
                      startIcon={<ArrowBack />}
                      onClick={handlePrevSingle}
                      disabled={quizData.currentQuestionIndex <= 0}
                      sx={{
                        flex: { xs: '1 1 45%', sm: '0 0 auto' },
                        minWidth: { xs: 0, sm: 120 },
                        minHeight: { xs: 44, sm: 36 },
                        fontSize: { xs: '0.8rem', sm: '0.875rem' }
                      }}
                    >
                      {t('test.nav.previous')}
                    </Button>
                    <Button
                      variant="outlined"
                      endIcon={<ArrowForward />}
                      onClick={handleNextSkipSingle}
                      disabled={quizData.currentQuestionIndex >= totalQuestions - 1}
                      sx={{
                        flex: { xs: '1 1 45%', sm: '0 0 auto' },
                        minWidth: { xs: 0, sm: 120 },
                        minHeight: { xs: 44, sm: 36 },
                        fontSize: { xs: '0.8rem', sm: '0.875rem' }
                      }}
                    >
                      {t('test.nav.next')}
                    </Button>
                  </Box>
                )}

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    mt: { xs: 2, sm: 3 },
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1.5,
                    pb: { xs: 1, sm: 0 }
                  }}
                >
                  {!isAnswered && !timedOut && (
                    <Grow in timeout={250}>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={handleSubmitSingle}
                        disabled={!canSubmitSingle}
                        fullWidth
                        sx={{ maxWidth: { xs: '100%', sm: 280 } }}
                      >
                        {t('test.checkAnswer')}
                      </Button>
                    </Grow>
                  )}

                  {canFinishSingle && !timedOut && (
                    <Grow in timeout={250}>
                      <Button
                        variant="contained"
                        color="success"
                        size="large"
                        onClick={handleFinishSingle}
                        fullWidth
                        sx={{ maxWidth: { xs: '100%', sm: 280 } }}
                      >
                        {t('test.viewResults')}
                      </Button>
                    </Grow>
                  )}

                  {isAnswered && !canFinishSingle && !timedOut && (
                    <Grow in timeout={250}>
                      <Button
                        variant="contained"
                        color="success"
                        size="large"
                        onClick={handleNextSingle}
                        fullWidth
                        sx={{ maxWidth: { xs: '100%', sm: 280 } }}
                      >
                        {t('test.nextQuestion')}
                      </Button>
                    </Grow>
                  )}
                </Box>
              </Box>
            </Box>

            <Box
              sx={{
                flexShrink: 0,
                mt: { xs: 0, sm: 3 },
                position: { xs: 'sticky', sm: 'static' },
                bottom: { xs: 0, sm: 'auto' },
                zIndex: { xs: 2, sm: 'auto' },
                borderRadius: { xs: 0, sm: 2 },
                bgcolor: (theme: Theme) => testPanelBackground(theme),
                borderTop: { xs: (theme: Theme) => `1px solid ${theme.palette.divider}`, sm: 'none' },
                border: { xs: 'none', sm: (theme: Theme) => `1px solid ${theme.palette.divider}` },
                boxShadow: {
                  xs: (theme: Theme) =>
                    theme.palette.mode === 'dark'
                      ? '0 -4px 12px rgba(0,0,0,0.5)'
                      : '0 -2px 8px rgba(60,64,67,0.08)',
                  sm: 'none'
                },
                pointerEvents: timedOut ? 'none' : 'auto',
                pb: 'max(10px, env(safe-area-inset-bottom, 0px))'
              }}
            >
              <Box sx={{ px: { xs: 1.5, sm: 2.5 }, py: { xs: 1, sm: 1.5 } }}>
                <SingleModeQuestionNav
                  total={totalQuestions}
                  currentIndex={quizData.currentQuestionIndex}
                  getQuestionNumber={(index) =>
                    getQuestionNumber(quizData, index, quizData.selectedQuestions[index])
                  }
                  getStatus={getSingleQuestionStatus}
                  onJump={goToQuestion}
                  disabled={timedOut}
                />
              </Box>
            </Box>
          </>
        )}
      </Container>
    </Box>
  )
}
