import { useState } from 'react'
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Grid
} from '@mui/material'
import { CheckCircle, Cancel, Assessment, Refresh, ArrowForward, Home } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import WrongAnswersModal from '../components/WrongAnswersModal'
import type { QuizResults, Question } from '../types'

interface ResultsPageProps {
  results: QuizResults
  totalQuestions: number
  nextStartIndex: number | null | undefined
  questions?: Question[]
  answers?: Record<number, { selected: number[]; correct: boolean }>
  onRestart: () => void
  onNextTest: () => void
  onBackToStart: () => void
}

export default function ResultsPage({
  results,
  totalQuestions,
  nextStartIndex,
  questions = [],
  answers = {},
  onRestart,
  onNextTest,
  onBackToStart
}: ResultsPageProps) {
  const { t } = useTranslation()
  const [showWrongAnswers, setShowWrongAnswers] = useState(false)
  const percentage = results.percentage || 0

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

  const getPerformanceColor = () => {
    if (percentage >= 80) return 'success.main'
    if (percentage >= 60) return 'warning.main'
    return 'error.main'
  }

  const getPerformanceText = () => {
    if (percentage >= 80) return t('results.excellent')
    if (percentage >= 60) return t('results.good')
    return t('results.poor')
  }

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        background: (theme) => theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="md" sx={{ px: { xs: 1, sm: 2 } }}>
        <Card
          sx={{
            background: (theme) => theme.palette.mode === 'dark'
              ? 'rgba(30, 30, 30, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom 
              align="center" 
              sx={{ 
                mb: { xs: 3, sm: 4 },
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
                background: (theme) => theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #90caf9 0%, #f48fb1 100%)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: 800,
              }}
            >
              {t('results.title')}
            </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: { xs: 2.5, sm: 4 } }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography 
                variant="h2" 
                component="div" 
                sx={{ 
                  fontWeight: 800, 
                  color: getPerformanceColor(),
                  fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
                  lineHeight: 1,
                  mb: 1,
                }}
              >
                {percentage}%
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'text.secondary', 
                  fontWeight: 600,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                }}
              >
                {getPerformanceText()}
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mb: { xs: 2.5, sm: 4 } }}>
            <Grid item xs={4}>
              <Card
                sx={{
                  textAlign: 'center',
                  p: { xs: 1, sm: 2 },
                  bgcolor: 'success.light',
                  borderRadius: { xs: 1.5, sm: 3 },
                  border: '2px solid',
                  borderColor: 'success.main',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(46, 125, 50, 0.1) 100%)',
                    opacity: 0,
                    transition: 'opacity 0.3s',
                  },
                  '&:hover': {
                    transform: { xs: 'none', sm: 'translateY(-6px) scale(1.02)' },
                    boxShadow: { xs: 'none', sm: '0 12px 24px rgba(76, 175, 80, 0.4)' },
                    '&::before': {
                      opacity: 1,
                    },
                  },
                }}
              >
                <CheckCircle 
                  sx={{ 
                    fontSize: { xs: '1.25rem', sm: '2.5rem' }, 
                    color: 'success.main',
                    mb: { xs: 0.5, sm: 1 },
                  }} 
                />
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 800, 
                    color: 'success.main', 
                    mb: { xs: 0.25, sm: 0.5 },
                    fontSize: { xs: '1.25rem', sm: '2.25rem', md: '2.75rem' },
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {results.correct}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600, 
                    color: 'text.secondary',
                    fontSize: { xs: '0.65rem', sm: '0.875rem' },
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {t('results.correct')}
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card
                sx={{
                  textAlign: 'center',
                  p: { xs: 1, sm: 2 },
                  bgcolor: 'error.light',
                  borderRadius: { xs: 1.5, sm: 3 },
                  border: '2px solid',
                  borderColor: 'error.main',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%, rgba(198, 40, 40, 0.1) 100%)',
                    opacity: 0,
                    transition: 'opacity 0.3s',
                  },
                  '&:hover': {
                    transform: { xs: 'none', sm: 'translateY(-6px) scale(1.02)' },
                    boxShadow: { xs: 'none', sm: '0 12px 24px rgba(244, 67, 54, 0.4)' },
                    '&::before': {
                      opacity: 1,
                    },
                  },
                }}
              >
                <Cancel 
                  sx={{ 
                    fontSize: { xs: '1.25rem', sm: '2.5rem' }, 
                    color: 'error.main',
                    mb: { xs: 0.5, sm: 1 },
                  }} 
                />
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 800, 
                    color: 'error.main', 
                    mb: { xs: 0.25, sm: 0.5 },
                    fontSize: { xs: '1.25rem', sm: '2.25rem', md: '2.75rem' },
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {results.incorrect}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600, 
                    color: 'text.secondary',
                    fontSize: { xs: '0.65rem', sm: '0.875rem' },
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {t('results.incorrect')}
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card
                sx={{
                  textAlign: 'center',
                  p: { xs: 1, sm: 2 },
                  bgcolor: 'primary.light',
                  borderRadius: { xs: 1.5, sm: 3 },
                  border: '2px solid',
                  borderColor: 'primary.main',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                    opacity: 0,
                    transition: 'opacity 0.3s',
                  },
                  '&:hover': {
                    transform: { xs: 'none', sm: 'translateY(-6px) scale(1.02)' },
                    boxShadow: { xs: 'none', sm: '0 12px 24px rgba(102, 126, 234, 0.4)' },
                    '&::before': {
                      opacity: 1,
                    },
                  },
                }}
              >
                <Assessment 
                  sx={{ 
                    fontSize: { xs: '1.25rem', sm: '2.5rem' }, 
                    color: 'primary.main',
                    mb: { xs: 0.5, sm: 1 },
                  }} 
                />
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 800, 
                    color: 'primary.main', 
                    mb: { xs: 0.25, sm: 0.5 },
                    fontSize: { xs: '1.25rem', sm: '2.25rem', md: '2.75rem' },
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {totalQuestions}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600, 
                    color: 'text.secondary',
                    fontSize: { xs: '0.65rem', sm: '0.875rem' },
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {t('results.total')}
                </Typography>
              </Card>
            </Grid>
          </Grid>

          {wrongAnswers.length > 0 && (
            <Box sx={{ mb: { xs: 2, sm: 4 }, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                color="error"
                size="large"
                onClick={() => setShowWrongAnswers(true)}
                fullWidth
                sx={{
                  maxWidth: { xs: '100%', sm: 400 },
                  fontSize: { xs: '0.8rem', sm: '1rem' },
                  py: { xs: 1, sm: 1.5 },
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                  },
                }}
              >
                {t('results.wrongAnswers')} ({wrongAnswers.length})
              </Button>
            </Box>
          )}

          <WrongAnswersModal
            open={showWrongAnswers}
            onClose={() => setShowWrongAnswers(false)}
            wrongAnswers={wrongAnswers}
          />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1, sm: 2 } }}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<Refresh sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />}
              onClick={onRestart}
              sx={{
                fontSize: { xs: '0.8rem', sm: '1rem' },
                py: { xs: 1.25, sm: 1.75 },
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #5e35b1 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 16px rgba(102, 126, 234, 0.5)',
                },
              }}
            >
              {t('results.restart')}
            </Button>
            
            {nextStartIndex !== null && nextStartIndex !== undefined && (
              <Button
                variant="contained"
                color="success"
                size="large"
                fullWidth
                startIcon={<ArrowForward sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />}
                onClick={onNextTest}
                sx={{
                  fontSize: { xs: '0.8rem', sm: '1rem' },
                  py: { xs: 1.25, sm: 1.75 },
                  background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
                  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #43a047 0%, #1b5e20 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 16px rgba(76, 175, 80, 0.5)',
                  },
                }}
              >
                {t('results.nextTest')}
              </Button>
            )}
            
            <Button
              variant="outlined"
              size="large"
              fullWidth
              startIcon={<Home sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />}
              onClick={onBackToStart}
              sx={{
                fontSize: { xs: '0.8rem', sm: '1rem' },
                py: { xs: 1.25, sm: 1.75 },
                borderWidth: 2,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  borderWidth: 2,
                  transform: 'translateY(-2px)',
                  bgcolor: 'action.hover',
                },
              }}
            >
              {t('results.backToStart')}
            </Button>
          </Box>
        </CardContent>
      </Card>
      </Container>
    </Box>
  )
}
