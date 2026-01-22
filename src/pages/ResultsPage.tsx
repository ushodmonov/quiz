import { useState } from 'react'
import {
  Typography,
  Box,
  Button,
  LinearProgress
} from '@mui/material'
import { Refresh, ArrowForward, Home, Replay, Visibility } from '@mui/icons-material'
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
  onRetakeIncorrect: () => void
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
  onRetakeIncorrect,
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

  const getPerformanceText = () => {
    if (percentage >= 80) return t('results.excellent')
    if (percentage >= 60) return t('results.good')
    return t('results.poor')
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: (theme) => theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: { xs: 2, sm: 3 },
        px: { xs: 1.5, sm: 2 },
      }}
    >
      <Box sx={{ width: '100%', maxWidth: { xs: '100%', sm: 500 }, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Title */}
        <Typography 
          variant="h3" 
          component="h1" 
          align="center" 
          sx={{ 
            mb: { xs: 2, sm: 2.5 },
            fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2rem' },
            color: '#fff',
            fontWeight: 800,
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
          }}
        >
          {t('results.title')}
        </Typography>
      
        {/* Percentage Display - Large and Centered */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          mb: { xs: 3, sm: 3.5 },
          width: '100%',
        }}>
          <Typography 
            variant="h1" 
            component="div" 
            sx={{ 
              fontWeight: 900, 
              color: '#fff',
              fontSize: { xs: '3.5rem', sm: '5rem', md: '6rem' },
              lineHeight: 1,
              mb: { xs: 1, sm: 2 },
              textShadow: '0 4px 30px rgba(0, 0, 0, 0.4)',
            }}
          >
            {percentage}%
          </Typography>
          
          {/* Progress Bar */}
          <Box sx={{ width: '100%', maxWidth: 500, mb: { xs: 1, sm: 2 } }}>
            <LinearProgress 
              variant="determinate" 
              value={percentage} 
              sx={{
                height: { xs: 8, sm: 10 },
                borderRadius: { xs: 4, sm: 5 },
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: { xs: 4, sm: 5 },
                  backgroundColor: '#fff',
                  boxShadow: '0 0 20px rgba(255, 255, 255, 0.5)',
                }
              }}
            />
          </Box>
          
          <Typography 
            variant="h5" 
            sx={{ 
              color: '#fff',
              fontWeight: 700,
              fontSize: { xs: '0.9rem', sm: '1.1rem' },
              textTransform: 'uppercase',
              letterSpacing: { xs: 1, sm: 2 },
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
            }}
          >
            {getPerformanceText()}
          </Typography>
        </Box>

        {/* Stats - Text Only */}
        <Box
          sx={{
            width: '100%',
            mb: { xs: 2.5, sm: 3 },
            p: { xs: 2, sm: 2.5 },
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: { xs: 3, sm: 3 },
            border: '2px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(15px)',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
            {/* Correct Answers */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: '#fff',
                  fontSize: { xs: '0.85rem', sm: '1rem' },
                }}
              >
                {t('results.correct')}
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 900,
                  color: '#4caf50',
                  fontSize: { xs: '1.25rem', sm: '1.75rem' },
                  textShadow: '0 2px 10px rgba(76, 175, 80, 0.5)',
                }}
              >
                {results.correct}
              </Typography>
            </Box>

            {/* Incorrect Answers */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: '#fff',
                  fontSize: { xs: '0.85rem', sm: '1rem' },
                }}
              >
                {t('results.incorrect')}
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 900,
                  color: '#f44336',
                  fontSize: { xs: '1.25rem', sm: '1.75rem' },
                  textShadow: '0 2px 10px rgba(244, 67, 54, 0.5)',
                }}
              >
                {results.incorrect}
              </Typography>
            </Box>

            {/* Total Questions */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: '#fff',
                  fontSize: { xs: '0.85rem', sm: '1rem' },
                }}
              >
                {t('results.total')}
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 900,
                  color: '#fff',
                  fontSize: { xs: '1.25rem', sm: '1.75rem' },
                  textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
                }}
              >
                {totalQuestions}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Action Buttons - Improved Layout */}
        <Box sx={{ width: '100%', mt: 2 }}>
          {/* Wrong Answers Section */}
          {wrongAnswers.length > 0 && (
            <Box 
              sx={{ 
                mb: { xs: 2, sm: 2.5 }, 
                p: { xs: 1.5, sm: 2 },
                bgcolor: 'rgba(244, 67, 54, 0.15)',
                borderRadius: { xs: 2, sm: 3 },
                border: '2px solid rgba(244, 67, 54, 0.3)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  color: '#fff',
                  fontWeight: 600,
                  mb: { xs: 1.5, sm: 2 },
                  textAlign: 'center',
                  fontSize: { xs: '0.75rem', sm: '0.85rem' },
                  textTransform: 'uppercase',
                  letterSpacing: { xs: 0.5, sm: 1 },
                }}
              >
                {t('results.incorrect')}: {wrongAnswers.length}
              </Typography>
              <Box sx={{ display: 'flex', gap: { xs: 1, sm: 1.25 }, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Replay />}
                  onClick={onRetakeIncorrect}
                  sx={{
                    flex: 1,
                    fontSize: { xs: '0.75rem', sm: '0.85rem' },
                    py: { xs: 1.25, sm: 1.5 },
                    background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                    color: '#fff',
                    boxShadow: '0 4px 15px rgba(244, 67, 54, 0.4)',
                    transition: 'all 0.3s ease',
                    fontWeight: 700,
                    borderRadius: 2,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 25px rgba(244, 67, 54, 0.6)',
                    },
                  }}
                >
                  {t('results.retakeIncorrect') || `Noto'g'ri javoblarni qayta o'tish`}
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Visibility />}
                  onClick={() => setShowWrongAnswers(true)}
                  sx={{
                    flex: 1,
                    fontSize: { xs: '0.75rem', sm: '0.85rem' },
                    py: { xs: 1.25, sm: 1.5 },
                    borderWidth: 2,
                    borderColor: 'rgba(255, 255, 255, 0.6)',
                    color: '#fff',
                    fontWeight: 600,
                    borderRadius: 2,
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    '&:hover': {
                      borderWidth: 2,
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      borderColor: '#fff',
                      transform: 'translateY(-2px)',
                    },
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

          {/* Main Action Buttons */}
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: { xs: 1, sm: 1.25 }, 
              width: '100%',
            }}
          >
            {nextStartIndex !== null && nextStartIndex !== undefined && (
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<ArrowForward />}
                onClick={onNextTest}
                sx={{
                  fontSize: { xs: '0.8rem', sm: '1rem' },
                  py: { xs: 1.5, sm: 2 },
                  background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                  color: '#fff',
                  boxShadow: '0 4px 15px rgba(76, 175, 80, 0.4)',
                  transition: 'all 0.3s ease',
                  fontWeight: 700,
                  borderRadius: 2,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 25px rgba(76, 175, 80, 0.6)',
                  },
                }}
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
                sx={{
                  flex: 1,
                  fontSize: { xs: '0.8rem', sm: '0.9rem' },
                  py: { xs: 1.5, sm: 1.75 },
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                  transition: 'all 0.3s ease',
                  fontWeight: 700,
                  borderRadius: 2,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 25px rgba(102, 126, 234, 0.6)',
                  },
                }}
              >
                {t('results.restart')}
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                startIcon={<Home />}
                onClick={onBackToStart}
                sx={{
                  flex: 1,
                  fontSize: { xs: '0.8rem', sm: '0.9rem' },
                  py: { xs: 1.5, sm: 1.75 },
                  borderWidth: 2,
                  borderColor: 'rgba(255, 255, 255, 0.6)',
                  color: '#fff',
                  fontWeight: 700,
                  borderRadius: 2,
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderWidth: 2,
                    transform: 'translateY(-2px)',
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    borderColor: '#fff',
                    boxShadow: '0 4px 15px rgba(255, 255, 255, 0.2)',
                  },
                }}
              >
                {t('results.backToStart')}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
