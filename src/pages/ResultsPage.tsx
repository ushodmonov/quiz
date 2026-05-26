import { useState, useEffect, useRef } from 'react'
import {
  Typography,
  Box,
  Button,
  LinearProgress,
  Fade
} from '@mui/material'
import { Refresh, ArrowForward, Home, Replay, Visibility, CheckCircleOutline, CancelOutlined, FormatListBulleted } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import WrongAnswersModal from '../components/WrongAnswersModal'
import TestResultsReview from '../components/TestResultsReview'
import type { QuizResults, Question, QuestionDisplayMode } from '../types'

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0)
  const startedFor = useRef<number | null>(null)
  useEffect(() => {
    if (startedFor.current === target) return
    startedFor.current = target
    let raf = 0
    const start = performance.now()
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

interface ResultsPageProps {
  results: QuizResults
  totalQuestions: number
  nextStartIndex: number | null | undefined
  questions?: Question[]
  answers?: Record<number, { selected: number[]; correct: boolean }>
  displayMode?: QuestionDisplayMode
  startIndex?: number
  onRestart: () => void
  onNextTest: () => void
  onRetakeIncorrect: () => void
  onBackToStart: () => void
}

export default function ResultsPage({
  results,
  totalQuestions,
  nextStartIndex,
  questions = [],
  answers = {},
  displayMode = 'single',
  startIndex = 0,
  onRestart,
  onNextTest,
  onRetakeIncorrect,
  onBackToStart
}: ResultsPageProps) {
  const { t } = useTranslation()
  const [showWrongAnswers, setShowWrongAnswers] = useState(false)
  const percentage = results.percentage || 0
  const animatedPercentage = useCountUp(percentage)

  // Get wrong answers
  const wrongAnswers = questions
    .map((question, index) => {
      const answerData = answers[index]
      if (answerData && !answerData.correct) {
        return {
          question,
          questionIndex: index,
          selected: answerData.selected,
          correct: question.answers
            .map((ans, idx) => ans.isCorrect ? idx : null)
            .filter((idx): idx is number => idx !== null)
        }
      }
      return null
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  const performance = (() => {
    if (percentage >= 80) {
      return { text: t('results.excellent'), color: 'success.main' as const, mainColor: 'success' as const }
    }
    if (percentage >= 60) {
      return { text: t('results.good'), color: 'warning.main' as const, mainColor: 'warning' as const }
    }
    return { text: t('results.poor'), color: 'error.main' as const, mainColor: 'error' as const }
  })()

  const showPerQuestionReview =
    displayMode === 'all' && questions.length > 0 && Object.keys(answers).length > 0

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        bgcolor: 'background.default',
        py: { xs: 2, sm: 3, md: 4 },
        px: { xs: 1.5, sm: 2, md: 3 },
        justifyContent: showPerQuestionReview ? 'flex-start' : 'center',
      }}
    >
      <Fade in timeout={350}>
        <Box
          sx={{
            width: '100%',
            maxWidth: { xs: '100%', sm: 520, md: 560 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {results.timedOut && (
            <Box
              sx={{
                mb: 2,
                px: 2,
                py: 1,
                borderRadius: 2,
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(253, 214, 99, 0.16)'
                    : 'rgba(249, 171, 0, 0.10)',
                color: 'warning.dark',
                fontWeight: 500,
                maxWidth: '100%',
                textAlign: 'center',
                border: (theme) => `1px solid ${theme.palette.warning.main}55`,
              }}
            >
              <Typography variant="body2">{t('results.timedOut')}</Typography>
            </Box>
          )}

          {/* Title */}
          <Typography
            variant="h3"
            component="h1"
            align="center"
            sx={{
              mb: { xs: 1.5, sm: 2 },
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              color: 'text.primary',
              fontWeight: 500,
            }}
          >
            {t('results.title')}
          </Typography>

          {/* Percentage Display */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: { xs: 3, sm: 3.5 },
              width: '100%',
            }}
          >
            <Typography
              variant="h1"
              component="div"
              sx={{
                fontWeight: 500,
                color: performance.color,
                fontSize: { xs: '4rem', sm: '5rem', md: '6rem' },
                lineHeight: 1,
                mb: { xs: 1.5, sm: 2 },
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {animatedPercentage}%
            </Typography>

            {/* Progress Bar */}
            <Box sx={{ width: '100%', maxWidth: 480, mb: { xs: 1, sm: 1.5 } }}>
              <LinearProgress
                variant="determinate"
                value={animatedPercentage}
                color={performance.mainColor}
                sx={{
                  height: { xs: 8, sm: 10 },
                  borderRadius: 4,
                  bgcolor: 'action.hover',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                  },
                }}
              />
            </Box>

            <Typography
              variant="overline"
              sx={{
                color: performance.color,
                fontWeight: 600,
                fontSize: { xs: '0.75rem', sm: '0.85rem' },
                letterSpacing: { xs: 1.5, sm: 2 },
                lineHeight: 1.2,
                mt: 0.5,
              }}
            >
              {performance.text}
            </Typography>
          </Box>

          {/* Stats card */}
          <Box
            sx={{
              width: '100%',
              mb: { xs: 2, sm: 2.5 },
              p: { xs: 1.75, sm: 2.25, md: 2.5 },
              bgcolor: 'background.paper',
              border: (theme) => `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.25, sm: 1.75 } }}>
              {[
                { icon: <CheckCircleOutline />, label: t('results.correct'), value: results.correct, color: 'success.main' },
                { icon: <CancelOutlined />, label: t('results.incorrect'), value: results.incorrect, color: 'error.main' },
                { icon: <FormatListBulleted />, label: t('results.total'), value: totalQuestions, color: 'text.primary' },
              ].map((stat) => (
                <Box
                  key={stat.label}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                    <Box sx={{ color: stat.color, display: 'flex' }}>
                      {stat.icon}
                    </Box>
                    <Typography
                      sx={{
                        fontWeight: 500,
                        color: 'text.primary',
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                      }}
                    >
                      {stat.label}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontWeight: 500,
                      color: stat.color,
                      fontSize: { xs: '1.3rem', sm: '1.5rem', md: '1.75rem' },
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {stat.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ width: '100%' }}>
            {wrongAnswers.length > 0 && (
              <Box
                sx={{
                  mb: { xs: 1.5, sm: 2 },
                  p: { xs: 1.5, sm: 2 },
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(242, 139, 130, 0.10)'
                      : 'rgba(217, 48, 37, 0.06)',
                  borderRadius: 2,
                  border: (theme) =>
                    `1px solid ${theme.palette.mode === 'dark' ? 'rgba(242,139,130,0.30)' : 'rgba(217,48,37,0.20)'}`,
                }}
              >
                <Typography
                  variant="overline"
                  sx={{
                    color: 'error.main',
                    fontWeight: 600,
                    mb: { xs: 1.25, sm: 1.5 },
                    textAlign: 'center',
                    display: 'block',
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    letterSpacing: 1,
                    lineHeight: 1.2,
                  }}
                >
                  {t('results.incorrect')}: {wrongAnswers.length}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    gap: { xs: 1, sm: 1.25 },
                    flexDirection: { xs: 'column', sm: 'row' },
                  }}
                >
                  <Button
                    variant="contained"
                    color="error"
                    size="medium"
                    startIcon={<Replay />}
                    onClick={onRetakeIncorrect}
                    sx={{
                      flex: 1,
                      fontSize: { xs: '0.85rem', sm: '0.875rem' },
                      py: { xs: 1.25, sm: 1.25 },
                    }}
                  >
                    {t('results.retakeIncorrect')}
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="medium"
                    startIcon={<Visibility />}
                    onClick={() => setShowWrongAnswers(true)}
                    sx={{
                      flex: 1,
                      fontSize: { xs: '0.85rem', sm: '0.875rem' },
                      py: { xs: 1.25, sm: 1.25 },
                    }}
                  >
                    {t('results.wrongAnswers')}
                  </Button>
                </Box>
              </Box>
            )}

            <WrongAnswersModal
              open={showWrongAnswers}
              onClose={() => setShowWrongAnswers(false)}
              wrongAnswers={wrongAnswers}
            />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1, sm: 1.25 }, width: '100%' }}>
              {nextStartIndex !== null && nextStartIndex !== undefined && (
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  fullWidth
                  startIcon={<ArrowForward />}
                  onClick={onNextTest}
                  sx={{ fontSize: { xs: '0.9rem', sm: '0.95rem' }, py: { xs: 1.25, sm: 1.5 } }}
                >
                  {t('results.nextTest')}
                </Button>
              )}

              <Box sx={{ display: 'flex', gap: { xs: 1, sm: 1.25 }, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Refresh />}
                  onClick={onRestart}
                  sx={{ flex: 1, fontSize: { xs: '0.875rem', sm: '0.9rem' }, py: { xs: 1.25, sm: 1.5 } }}
                >
                  {t('results.restart')}
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Home />}
                  onClick={onBackToStart}
                  sx={{ flex: 1, fontSize: { xs: '0.875rem', sm: '0.9rem' }, py: { xs: 1.25, sm: 1.5 } }}
                >
                  {t('results.backToStart')}
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Fade>

      {showPerQuestionReview && (
        <Box sx={{ width: '100%', maxWidth: { xs: '100%', md: 'lg' }, mt: { xs: 2, sm: 3 }, px: { xs: 0, sm: 1 } }}>
          <TestResultsReview
            questions={questions}
            answers={answers}
            startIndex={startIndex}
          />
        </Box>
      )}
    </Box>
  )
}
