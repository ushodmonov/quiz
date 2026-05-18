import { Box, Card, CardContent, Chip, Typography } from '@mui/material'
import { CheckCircle, Cancel } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import QuestionDisplay from './QuestionDisplay'
import type { Question } from '../types'

interface TestResultsReviewProps {
  questions: Question[]
  answers: Record<number, { selected: number[]; correct: boolean }>
  startIndex?: number
}

export default function TestResultsReview({
  questions,
  answers,
  startIndex = 0
}: TestResultsReviewProps) {
  const { t } = useTranslation()

  return (
    <Box sx={{ width: '100%', mt: { xs: 2, sm: 3 } }}>
      <Typography
        variant="h6"
        sx={{
          color: '#fff',
          fontWeight: 700,
          mb: 2,
          textAlign: 'center',
          fontSize: { xs: '1rem', sm: '1.15rem' },
          textShadow: '0 2px 8px rgba(0,0,0,0.25)'
        }}
      >
        {t('results.perQuestionReview')}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {questions.map((question, index) => {
          const answerData = answers[index]
          if (!answerData) return null

          const questionNumber =
            question.originalIndex !== undefined
              ? question.originalIndex + 1
              : startIndex + index + 1

          return (
            <Card
              key={index}
              sx={{
                background: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(30, 30, 30, 0.95)'
                    : 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(10px)',
                border: '2px solid',
                borderColor: answerData.correct ? 'success.main' : 'error.main'
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 1.5,
                    flexWrap: 'wrap'
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {t('results.question')} {questionNumber}
                  </Typography>
                  <Chip
                    icon={
                      answerData.correct ? (
                        <CheckCircle sx={{ fontSize: '1rem !important' }} />
                      ) : (
                        <Cancel sx={{ fontSize: '1rem !important' }} />
                      )
                    }
                    label={
                      answerData.correct
                        ? t('results.statusCorrect')
                        : t('results.statusIncorrect')
                    }
                    color={answerData.correct ? 'success' : 'error'}
                    size="small"
                    variant="filled"
                  />
                </Box>

                <QuestionDisplay
                  question={question}
                  selectedAnswers={answerData.selected}
                  isAnswered
                  isCorrect={answerData.correct}
                  showAlert
                  questionNumber={questionNumber}
                  onAnswerSelect={() => {}}
                />
              </CardContent>
            </Card>
          )
        })}
      </Box>
    </Box>
  )
}
