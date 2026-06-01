import { useState, useEffect, useRef } from 'react'
import {
  Typography,
  Box,
  Button,
  Fade,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material'
import { Refresh, ArrowForward, Home, Replay, Visibility, Share } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import WrongAnswersModal from '../components/WrongAnswersModal'
import TestResultsReview from '../components/TestResultsReview'
import Confetti from '../components/Confetti'
import { generateResultCard, shareResultCard } from '../utils/shareCard'
import { getEffectiveStreak } from '../utils/userStats'
import { CONTACT_INFO } from '../constants/contact'
import type { QuizResults, Question, QuestionDisplayMode } from '../types'

function useCountUp(target: number, duration = 900) {
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

const RING_R = 68
const RING_CIRC = 2 * Math.PI * RING_R

function ScoreRing({
  pct,
  color,
  label,
  displayPct,
}: {
  pct: number
  color: string
  label: string
  displayPct: number
}) {
  const dash = (pct / 100) * RING_CIRC
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1.5 }}>
      <svg
        width={160}
        height={160}
        viewBox="0 0 160 160"
        style={{ transform: 'rotate(-90deg)', display: 'block' }}
      >
        <circle
          cx="80" cy="80" r={RING_R}
          fill="none"
          stroke={color}
          strokeWidth="13"
          opacity="0.12"
        />
        <circle
          cx="80" cy="80" r={RING_R}
          fill="none"
          stroke={color}
          strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${RING_CIRC}`}
          style={{ transition: 'stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <Box
        sx={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 0,
        }}
      >
        <Typography
          component="div"
          sx={{
            fontWeight: 800,
            fontSize: '2.2rem',
            lineHeight: 1,
            color,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {displayPct}%
        </Typography>
        <Typography
          component="div"
          sx={{
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: 'uppercase',
            color,
            opacity: 0.8,
            mt: 0.5,
          }}
        >
          {label}
        </Typography>
      </Box>
    </Box>
  )
}

interface StatCardProps {
  value: number
  label: string
  color: string
  variant: 'success' | 'error' | 'neutral'
}
function StatCard({ value, label, color, variant }: StatCardProps) {
  const bgMap = {
    success: (th: { palette: { mode: string } }) =>
      th.palette.mode === 'dark' ? 'rgba(46,125,50,0.14)' : 'rgba(46,125,50,0.08)',
    error: (th: { palette: { mode: string } }) =>
      th.palette.mode === 'dark' ? 'rgba(198,40,40,0.14)' : 'rgba(198,40,40,0.08)',
    neutral: (th: { palette: { mode: string } }) =>
      th.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
  }
  return (
    <Box
      sx={{
        flex: 1,
        py: 1.5,
        px: 1,
        borderRadius: 2.5,
        bgcolor: bgMap[variant],
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.25,
      }}
    >
      <Typography
        sx={{
          fontWeight: 800,
          fontSize: { xs: '1.5rem', sm: '1.75rem' },
          color,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </Typography>
      <Typography
        sx={{
          fontSize: '0.7rem',
          color: 'text.secondary',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Typography>
    </Box>
  )
}

interface ResultsPageProps {
  results: QuizResults
  totalQuestions: number
  nextStartIndex: number | null | undefined
  questions?: Question[]
  answers?: Record<number, { selected: number[]; correct: boolean }>
  displayMode?: QuestionDisplayMode
  startIndex?: number
  testName?: string
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
  testName = '',
  onRestart,
  onNextTest,
  onRetakeIncorrect,
  onBackToStart,
}: ResultsPageProps) {
  const { t } = useTranslation()
  const [showWrongAnswers, setShowWrongAnswers] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [snack, setSnack] = useState<string | null>(null)
  const percentage = results.percentage || 0
  const animatedPct = useCountUp(percentage)
  const celebrate = percentage >= 80

  const handleShare = async () => {
    if (sharing) return
    setSharing(true)
    try {
      const blob = await generateResultCard({
        percentage,
        correct: results.correct,
        total: totalQuestions,
        testName,
        streak: getEffectiveStreak(),
        botHandle: CONTACT_INFO.telegramBot.name,
        labels: {
          result: t('results.shareCard.result', 'Natija'),
          correct: t('results.shareCard.correct', "to'g'ri"),
          streakDays: t('results.shareCard.streakDays', 'kun streak'),
          cta: t('results.shareCard.cta', 'Sen ham yech →'),
        },
      })
      const shareText = t('results.shareCard.text', { percentage, defaultValue: `Men testda ${percentage}% oldim! 🎯` })
      const outcome = await shareResultCard(blob, shareText, CONTACT_INFO.telegramBot.url)
      if (outcome === 'downloaded') {
        setSnack(t('results.shareCard.downloaded', "Rasm yuklab olindi — Telegram'ga yuborishingiz mumkin"))
      }
    } catch (e) {
      console.warn('Ulashish xatosi:', e)
      setSnack(t('results.shareCard.error', 'Ulashib bo\'lmadi'))
    } finally {
      setSharing(false)
    }
  }

  const wrongAnswers = questions
    .map((question, index) => {
      const answerData = answers[index]
      if (answerData && !answerData.correct) {
        return {
          question,
          questionIndex: index,
          selected: answerData.selected,
          correct: question.answers
            .map((ans, idx) => (ans.isCorrect ? idx : null))
            .filter((idx): idx is number => idx !== null),
        }
      }
      return null
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  const perf = (() => {
    if (percentage >= 80) return { text: t('results.excellent'), color: '#2e7d32', mainColor: 'success' as const }
    if (percentage >= 60) return { text: t('results.good'), color: '#e65100', mainColor: 'warning' as const }
    return { text: t('results.poor'), color: '#c62828', mainColor: 'error' as const }
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
        py: { xs: 3, sm: 4 },
        px: { xs: 2, sm: 3 },
        justifyContent: showPerQuestionReview ? 'flex-start' : 'center',
      }}
    >
      {celebrate && <Confetti />}
      <Fade in timeout={400}>
        <Box
          sx={{
            width: '100%',
            maxWidth: { xs: '100%', sm: 480 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Timed out banner */}
          {results.timedOut && (
            <Box
              sx={{
                mb: 2, px: 2, py: 1, borderRadius: 2,
                bgcolor: (th) => th.palette.mode === 'dark' ? 'rgba(253,214,99,0.14)' : 'rgba(249,171,0,0.10)',
                color: 'warning.dark',
                border: (th) => `1px solid ${th.palette.warning.main}44`,
                width: '100%', textAlign: 'center',
              }}
            >
              <Typography variant="body2" fontWeight={500}>{t('results.timedOut')}</Typography>
            </Box>
          )}

          {/* Score ring */}
          <ScoreRing
            pct={animatedPct}
            color={perf.color}
            label={perf.text}
            displayPct={animatedPct}
          />

          {/* Stats row */}
          <Box sx={{ display: 'flex', gap: 1.25, width: '100%', mb: 3 }}>
            <StatCard value={results.correct}   label={t('results.correct')}   color="#2e7d32"      variant="success" />
            <StatCard value={results.incorrect} label={t('results.incorrect')} color="#c62828"      variant="error"   />
            <StatCard value={totalQuestions}    label={t('results.total')}     color="text.primary" variant="neutral" />
          </Box>

          {/* Wrong answers section */}
          {wrongAnswers.length > 0 && (
            <Box
              sx={{
                width: '100%',
                mb: 2.5,
                p: 2,
                borderRadius: 2.5,
                bgcolor: (th) =>
                  th.palette.mode === 'dark'
                    ? 'rgba(198,40,40,0.10)'
                    : 'rgba(198,40,40,0.05)',
                border: (th) =>
                  `1px solid ${th.palette.mode === 'dark' ? 'rgba(242,139,130,0.25)' : 'rgba(198,40,40,0.18)'}`,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  display: 'block', textAlign: 'center', mb: 1.5,
                  color: 'error.main', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: 1,
                }}
              >
                {t('results.incorrect')}: {wrongAnswers.length}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="error"
                  size="medium"
                  startIcon={<Replay />}
                  onClick={onRetakeIncorrect}
                  fullWidth
                  sx={{ borderRadius: 2, fontWeight: 600, py: 1.1 }}
                >
                  {t('results.retakeIncorrect')}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="medium"
                  startIcon={<Visibility />}
                  onClick={() => setShowWrongAnswers(true)}
                  fullWidth
                  sx={{ borderRadius: 2, fontWeight: 600, py: 1.1 }}
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

          {/* Action buttons */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, width: '100%' }}>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              fullWidth
              startIcon={sharing ? <CircularProgress size={18} color="inherit" /> : <Share />}
              onClick={handleShare}
              disabled={sharing}
              sx={{ borderRadius: 2.5, py: 1.4, fontWeight: 700, fontSize: '0.95rem' }}
            >
              {t('results.share', 'Natijani ulashish')}
            </Button>

            {nextStartIndex !== null && nextStartIndex !== undefined && (
              <Button
                variant="contained"
                color="success"
                size="large"
                fullWidth
                startIcon={<ArrowForward />}
                onClick={onNextTest}
                sx={{ borderRadius: 2.5, py: 1.4, fontWeight: 700, fontSize: '0.95rem' }}
              >
                {t('results.nextTest')}
              </Button>
            )}

            <Box sx={{ display: 'flex', gap: 1.25 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<Refresh />}
                onClick={onRestart}
                fullWidth
                sx={{ borderRadius: 2.5, py: 1.4, fontWeight: 600 }}
              >
                {t('results.restart')}
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<Home />}
                onClick={onBackToStart}
                fullWidth
                sx={{ borderRadius: 2.5, py: 1.4, fontWeight: 600 }}
              >
                {t('results.backToStart')}
              </Button>
            </Box>
          </Box>
        </Box>
      </Fade>

      {showPerQuestionReview && (
        <Box sx={{ width: '100%', maxWidth: { xs: '100%', md: 'lg' }, mt: 3, px: { xs: 0, sm: 1 } }}>
          <TestResultsReview
            questions={questions}
            answers={answers}
            startIndex={startIndex}
          />
        </Box>
      )}

      <Snackbar
        open={!!snack}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" variant="filled" onClose={() => setSnack(null)} sx={{ width: '100%' }}>
          {snack}
        </Alert>
      </Snackbar>
    </Box>
  )
}
