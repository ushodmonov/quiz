import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  IconButton,
  useMediaQuery,
  useTheme
} from '@mui/material'
import { Close, Cancel, CheckCircle } from '@mui/icons-material'
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

type RenderedPart = { type: 'text' | 'inlineMath' | 'blockMath'; content: string }

function renderText(text: string): RenderedPart[] {
  const parts: RenderedPart[] = []
  let lastIndex = 0
  let inInlineMath = false
  let inBlockMath = false

  for (let i = 0; i < text.length; i++) {
    if (text.substring(i, i + 2) === '$$' && !inInlineMath) {
      if (inBlockMath) {
        parts.push({ type: 'blockMath', content: text.substring(lastIndex + 2, i) })
        lastIndex = i + 2
        inBlockMath = false
      } else {
        if (i > lastIndex) parts.push({ type: 'text', content: text.substring(lastIndex, i) })
        lastIndex = i
        inBlockMath = true
      }
      i++
    } else if (text[i] === '$' && !inBlockMath) {
      if (inInlineMath) {
        parts.push({ type: 'inlineMath', content: text.substring(lastIndex + 1, i) })
        lastIndex = i + 1
        inInlineMath = false
      } else {
        if (i > lastIndex) parts.push({ type: 'text', content: text.substring(lastIndex, i) })
        lastIndex = i
        inInlineMath = true
      }
    }
  }

  if (lastIndex < text.length) {
    parts.push({
      type: inBlockMath || inInlineMath ? (inBlockMath ? 'blockMath' : 'inlineMath') : 'text',
      content: text.substring(lastIndex + (inBlockMath || inInlineMath ? 2 : 0)),
    })
  }

  return parts.length > 0 ? parts : [{ type: 'text', content: text }]
}

function RichText({ text, inline = false }: { text: string; inline?: boolean }) {
  return (
    <>
      {renderText(text).map((part, idx) => {
        if (part.type === 'inlineMath') {
          try { return <InlineMath key={idx} math={part.content} /> }
          catch { return <span key={idx}>${part.content}$</span> }
        }
        if (part.type === 'blockMath' && !inline) {
          try { return <BlockMath key={idx} math={part.content} /> }
          catch { return <div key={idx}>$${part.content}$$</div> }
        }
        if (part.type === 'blockMath') {
          // block math inside an inline context — fall back to inline
          try { return <InlineMath key={idx} math={part.content} /> }
          catch { return <span key={idx}>${part.content}$</span> }
        }
        return <span key={idx}>{part.content}</span>
      })}
    </>
  )
}

function AnswerRow({
  text,
  variant,
}: {
  text: string
  variant: 'correct' | 'incorrect'
}) {
  const color = variant === 'correct' ? 'success' : 'error'
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1,
        p: { xs: 1, sm: 1.25 },
        bgcolor: (theme) =>
          variant === 'correct'
            ? theme.palette.mode === 'dark' ? 'rgba(129, 201, 149, 0.10)' : 'rgba(24, 128, 56, 0.06)'
            : theme.palette.mode === 'dark' ? 'rgba(242, 139, 130, 0.10)' : 'rgba(217, 48, 37, 0.06)',
        border: '1.5px solid',
        borderColor: `${color}.main`,
        borderRadius: 1.5,
      }}
    >
      <Box sx={{ color: `${color}.main`, display: 'flex', alignItems: 'center', flexShrink: 0, mt: '2px' }}>
        {variant === 'correct'
          ? <CheckCircle sx={{ fontSize: 18 }} />
          : <Cancel sx={{ fontSize: 18 }} />}
      </Box>
      <Typography
        component="div"
        sx={{
          fontSize: { xs: '0.85rem', sm: '0.9rem' },
          lineHeight: 1.5,
          color: 'text.primary',
          wordBreak: 'break-word',
          flex: 1,
        }}
      >
        <RichText text={text} inline />
      </Typography>
    </Box>
  )
}

export default function WrongAnswersModal({ open, onClose, wrongAnswers }: WrongAnswersModalProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          maxHeight: { xs: '100%', sm: '90vh' },
          m: { xs: 0, sm: 2 },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1,
          px: { xs: 2, sm: 3 },
          py: { xs: 1.5, sm: 2 },
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 500,
              fontSize: { xs: '1rem', sm: '1.15rem' },
              color: 'text.primary',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {t('results.wrongAnswers')}
          </Typography>
          <Chip
            label={wrongAnswers.length}
            color="error"
            size="small"
            sx={{ fontWeight: 500, height: 22 }}
          />
        </Box>
        <IconButton onClick={onClose} size="small" aria-label={t('common.close')}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 1.5, sm: 2.5 }, bgcolor: 'background.default' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
          {wrongAnswers.map((item, idx) => {
            const questionNumber = item.question.originalIndex !== undefined
              ? item.question.originalIndex + 1
              : item.questionIndex + 1

            return (
              <Box
                key={idx}
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  bgcolor: 'background.paper',
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25, flexWrap: 'wrap' }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 500,
                      color: 'text.secondary',
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    }}
                  >
                    {t('results.question')} #{questionNumber}
                  </Typography>
                </Box>

                <Typography
                  component="div"
                  sx={{
                    mb: 1.75,
                    fontWeight: 500,
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    lineHeight: 1.5,
                    color: 'text.primary',
                  }}
                >
                  <RichText text={item.question.text} />
                </Typography>

                <Typography
                  variant="caption"
                  sx={{
                    color: 'error.main',
                    fontWeight: 600,
                    display: 'block',
                    mb: 0.75,
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {t('results.yourAnswer')}
                </Typography>
                {item.selected.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 1.5 }}>
                    {item.selected.map((selectedIdx) => (
                      <AnswerRow
                        key={selectedIdx}
                        text={item.question.answers[selectedIdx]?.text || ''}
                        variant="incorrect"
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1.5, fontStyle: 'italic', fontSize: { xs: '0.85rem', sm: '0.9rem' } }}
                  >
                    {t('results.noAnswerGiven')}
                  </Typography>
                )}

                <Typography
                  variant="caption"
                  sx={{
                    color: 'success.main',
                    fontWeight: 600,
                    display: 'block',
                    mb: 0.75,
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {t('results.correctAnswer')}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {item.correct.map((correctIdx) => (
                    <AnswerRow
                      key={correctIdx}
                      text={item.question.answers[correctIdx]?.text || ''}
                      variant="correct"
                    />
                  ))}
                </Box>
              </Box>
            )
          })}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: { xs: 1.5, sm: 2 },
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Button
          onClick={onClose}
          variant="contained"
          fullWidth
          sx={{ fontSize: { xs: '0.875rem', sm: '0.95rem' }, py: { xs: 1, sm: 1.25 } }}
        >
          {t('common.close')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
