import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Link,
  Divider,
  TextField,
  Card,
  CardContent,
  InputAdornment
} from '@mui/material'
import { Telegram, Email, Close, CreditCard, AccountCircle } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { CONTACT_INFO } from '../constants/contact'
import { useState } from 'react'

interface ContactModalProps {
  open: boolean
  onClose: () => void
}

export default function ContactModal({ open, onClose }: ContactModalProps) {
  const { t } = useTranslation()
  const [cardNumber, setCardNumber] = useState('')
  const [cardOwnerName, setCardOwnerName] = useState('')

  const handleCopyCardNumber = () => {
    if (cardNumber) {
      navigator.clipboard.writeText(cardNumber)
    }
  }

  const handleCopyCardOwnerName = () => {
    if (cardOwnerName) {
      navigator.clipboard.writeText(cardOwnerName)
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: 2, sm: 3 }
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {t('footer.contact')}
        </Typography>
        <Button
          onClick={onClose}
          size="small"
          sx={{ minWidth: 'auto', p: 0.5 }}
        >
          <Close />
        </Button>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Donation Section */}
          <Card
            sx={{
              bgcolor: (theme) => theme.palette.mode === 'dark' 
                ? 'rgba(102, 126, 234, 0.1)' 
                : 'rgba(102, 126, 234, 0.05)',
              border: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CreditCard color="primary" />
                {t('contact.donation')}
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label={t('contact.cardNumber')}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder={t('contact.cardNumberPlaceholder')}
                  fullWidth
                  size="small"
                  InputProps={{
                    endAdornment: cardNumber && (
                      <InputAdornment position="end">
                        <Button
                          size="small"
                          onClick={handleCopyCardNumber}
                          sx={{ minWidth: 'auto', px: 1 }}
                        >
                          {t('contact.copy')}
                        </Button>
                      </InputAdornment>
                    ),
                  }}
                />
                
                <TextField
                  label={t('contact.cardOwnerName')}
                  value={cardOwnerName}
                  onChange={(e) => setCardOwnerName(e.target.value)}
                  placeholder={t('contact.cardOwnerNamePlaceholder')}
                  fullWidth
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccountCircle sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                    endAdornment: cardOwnerName && (
                      <InputAdornment position="end">
                        <Button
                          size="small"
                          onClick={handleCopyCardOwnerName}
                          sx={{ minWidth: 'auto', px: 1 }}
                        >
                          {t('contact.copy')}
                        </Button>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </CardContent>
          </Card>

          <Divider />

          {/* Contact Section */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Telegram color="primary" />
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Telegram
                </Typography>
                <Link
                  href={CONTACT_INFO.telegram.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  @{CONTACT_INFO.telegram.username}
                </Link>
              </Box>
            </Box>

            {CONTACT_INFO.telegramChannel.url && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Telegram color="primary" />
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Telegram Kanal
                  </Typography>
                  <Link
                    href={CONTACT_INFO.telegramChannel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: 'primary.main',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    {CONTACT_INFO.telegramChannel.name || CONTACT_INFO.telegramChannel.url}
                  </Link>
                </Box>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Email color="primary" />
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Email
                </Typography>
                <Link
                  href={CONTACT_INFO.email.url}
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  {CONTACT_INFO.email.address}
                </Link>
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained" fullWidth>
          {t('common.close')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
