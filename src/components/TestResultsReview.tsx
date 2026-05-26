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
          color: 'text.primary',
          fontWeight: 500,
          mb: 2,
          textAlign: 'center',
          fontSize: { xs: '1rem', sm: '1.15rem' },
        }}
      >
        {t('results.perQuestionReview')}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.25, sm: 1.75 } }}>
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
              elevation={0}
              sx={{
                bgcolor: 'background.paper',
                border: '1.5px solid',
                borderColor: answerData.correct ? 'success.main' : 'error.main',
              }}
            >
              <CardContent sx={{ p: { xs: 1.75, sm: 2.5 } }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 1.5,
                    flexWrap: 'wrap',
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 500, color: 'text.secondary' }}
                  >
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
                    sx={{ fontWeight: 500 }}
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
