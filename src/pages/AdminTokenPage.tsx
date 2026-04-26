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
  Alert
} from '@mui/material'
import { Token } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { JWT_SECRET_KEY } from '../constants/contact'
import { saveJwtTokenToFirestore } from '../utils/firebase'
import { generateJwtToken } from '../utils/jwt'

const EXPIRY_OPTIONS = [
  { key: '3hours', seconds: 3 * 60 * 60 },
  { key: '6hours', seconds: 6 * 60 * 60 },
  { key: '24hours', seconds: 24 * 60 * 60 },
  { key: '3days', seconds: 3 * 24 * 60 * 60 },
  { key: '1week', seconds: 7 * 24 * 60 * 60 },
  { key: '1month', seconds: 30 * 24 * 60 * 60 }
]

interface AdminTokenPageProps {
  onBack: () => void
}

export default function AdminTokenPage({ onBack }: AdminTokenPageProps) {
  const { t } = useTranslation()
  const [telegramUserId, setTelegramUserId] = useState('')
  const [name, setName] = useState('')
  const [expirySeconds, setExpirySeconds] = useState<number>(EXPIRY_OPTIONS[0].seconds)
  const [token, setToken] = useState('')
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
        name.trim()
      )
      await saveJwtTokenToFirestore({
        token: generatedToken,
        telegramUserId: userId,
        expirySeconds
      })
      setToken(generatedToken)
      setSuccess(t('adminToken.success.saved'))
    } catch (generationError) {
      console.error('JWT generation error:', generationError)
      if (generationError instanceof Error && generationError.message === 'FIREBASE_NOT_CONFIGURED') {
        setError(t('adminToken.errors.firebaseNotConfigured'))
      } else {
        setError(t('adminToken.errors.generateFailed'))
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
        background: (theme) => theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4
      }}
    >
      <Container maxWidth="md">
        <Card
          sx={{
            background: (theme) => theme.palette.mode === 'dark'
              ? 'rgba(30, 30, 30, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
            <Typography variant="h5" align="center" sx={{ mb: 3, fontWeight: 800 }}>
              {t('adminToken.title')}
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <TextField
              fullWidth
              type="number"
              label={t('adminToken.telegramUserId')}
              value={telegramUserId}
              onChange={(e) => setTelegramUserId(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label={t('adminToken.name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
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

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Token />}
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {t('adminToken.generate')}
              </Button>
            </Box>

            <TextField
              fullWidth
              multiline
              minRows={5}
              label={t('adminToken.tokenField')}
              value={token}
              InputProps={{ readOnly: true }}
              sx={{ mb: 2 }}
            />

            <Button fullWidth variant="text" onClick={onBack}>
              {t('adminToken.back')}
            </Button>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}
