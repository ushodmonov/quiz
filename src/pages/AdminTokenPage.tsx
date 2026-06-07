import { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Container,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  IconButton,
  CircularProgress,
  Stack
} from '@mui/material'
import { Token, ArrowBack } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { JWT_SECRET_KEY } from '../constants/contact'
import { saveJwtTokenToFirestore } from '../utils/firebase'
import { generateJwtToken } from '../utils/jwt'

const EXPIRY_OPTIONS = [
  { key: '6hours', seconds: 6 * 60 * 60 },
  { key: '24hours', seconds: 24 * 60 * 60 },
  { key: '3days', seconds: 3 * 24 * 60 * 60 },
  { key: '1week', seconds: 7 * 24 * 60 * 60 },
  { key: '2weeks', seconds: 14 * 24 * 60 * 60 },
  { key: '1month', seconds: 30 * 24 * 60 * 60 }
]

interface AdminTokenPageProps {
  onBack: () => void
  createdByTelegramUserId?: number
  createdByName?: string
}

export default function AdminTokenPage({ onBack, createdByTelegramUserId, createdByName }: AdminTokenPageProps) {
  const { t } = useTranslation()
  const [telegramUserId, setTelegramUserId] = useState('')
  const [name, setName] = useState('')
  const [expirySeconds, setExpirySeconds] = useState<number>(EXPIRY_OPTIONS[0].seconds)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    setError('')
    setSuccess('')

    const userId = Number(telegramUserId)
    if (!telegramUserId || Number.isNaN(userId) || userId <= 0) {
      setError(t('adminToken.errors.invalidUserId'))
      return
    }
    if (!name.trim()) {
      setError(t('adminToken.errors.invalidName'))
      return
    }

    try {
      setIsGenerating(true)
      const generatedToken = await generateJwtToken(
        userId,
        expirySeconds,
        JWT_SECRET_KEY,
        name.trim(),
        createdByTelegramUserId,
        createdByName
      )
      await saveJwtTokenToFirestore({
        token: generatedToken,
        telegramUserId: userId,
        name: name.trim(),
        expirySeconds,
        createdByTelegramUserId,
        createdByName
      })
      setSuccess(t('adminToken.success.saved'))
      setTelegramUserId('')
      setName('')
    } catch (generationError) {
      console.error('JWT generation error:', generationError)
      const firebaseCode = (generationError as { code?: string })?.code

      if (generationError instanceof Error && generationError.message === 'FIREBASE_NOT_CONFIGURED') {
        setError(t('adminToken.errors.firebaseNotConfigured'))
      } else if (firebaseCode === 'permission-denied') {
        setError(t('adminToken.errors.firebasePermissionDenied'))
      } else if (firebaseCode === 'failed-precondition') {
        setError(t('adminToken.errors.firebaseIndexRequired'))
      } else {
        const fallbackMessage = generationError instanceof Error ? generationError.message : ''
        setError(`${t('adminToken.errors.generateFailed')}${fallbackMessage ? `: ${fallbackMessage}` : ''}`)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 128px)',
        display: 'flex',
        alignItems: 'center',
        bgcolor: 'background.default',
        py: { xs: 2, sm: 4 }
      }}
    >
      <Container maxWidth="md">
        <Card>
          <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
              <IconButton onClick={onBack} aria-label={t('adminToken.back')} size="small">
                <ArrowBack />
              </IconButton>
              <Typography
                variant="h5"
                sx={{ flex: 1, fontWeight: 500, color: 'primary.main', textAlign: 'center', pr: 4 }}
              >
                {t('adminToken.title')}
              </Typography>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

            <TextField
              fullWidth
              type="number"
              label={t('adminToken.telegramUserId')}
              value={telegramUserId}
              onChange={(e) => setTelegramUserId(e.target.value)}
              disabled={isGenerating}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label={t('adminToken.name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isGenerating}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 3 }} disabled={isGenerating}>
              <InputLabel>{t('adminToken.expiryLabel')}</InputLabel>
              <Select
                value={expirySeconds}
                label={t('adminToken.expiryLabel')}
                onChange={(e) => setExpirySeconds(Number(e.target.value))}
              >
                {EXPIRY_OPTIONS.map((option) => (
                  <MenuItem key={option.seconds} value={option.seconds}>
                    {t(`adminToken.expiryOptions.${option.key}`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              fullWidth
              size="large"
              variant="contained"
              startIcon={isGenerating ? <CircularProgress size={18} color="inherit" /> : <Token />}
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {t('adminToken.generate')}
            </Button>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}
