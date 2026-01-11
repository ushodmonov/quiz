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
  Card,
  CardContent,
  IconButton,
  Tooltip
} from '@mui/material'
import { Telegram, Email, Close, CreditCard, AccountCircle, ContentCopy, Check } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { CONTACT_INFO } from '../constants/contact'
import { useState } from 'react'

interface ContactModalProps {
  open: boolean
  onClose: () => void
}

export default function ContactModal({ open, onClose }: ContactModalProps) {
  const { t } = useTranslation()
  const [copiedCardNumber, setCopiedCardNumber] = useState(false)
  const [copiedCardOwner, setCopiedCardOwner] = useState(false)

  const handleCopyCardNumber = async () => {
    if (CONTACT_INFO.donation?.cardNumber) {
      await navigator.clipboard.writeText(CONTACT_INFO.donation.cardNumber)
      setCopiedCardNumber(true)
      setTimeout(() => setCopiedCardNumber(false), 2000)
    }
  }

  const handleCopyCardOwnerName = async () => {
    if (CONTACT_INFO.donation?.cardOwnerName) {
      await navigator.clipboard.writeText(CONTACT_INFO.donation.cardOwnerName)
      setCopiedCardOwner(true)
      setTimeout(() => setCopiedCardOwner(false), 2000)
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
          {CONTACT_INFO.donation && (
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
                  {/* Card Number */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: (theme) => theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.02)',
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <CreditCard sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        {t('contact.cardNumber')}
                      </Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontFamily: 'monospace',
                          fontWeight: 500,
                          letterSpacing: 1
                        }}
                      >
                        {CONTACT_INFO.donation.cardNumber}
                      </Typography>
                    </Box>
                    <Tooltip title={copiedCardNumber ? t('contact.copied') || 'Nusxalandi' : t('contact.copy')}>
                      <IconButton
                        size="small"
                        onClick={handleCopyCardNumber}
                        color={copiedCardNumber ? 'success' : 'default'}
                        sx={{ ml: 1 }}
                      >
                        {copiedCardNumber ? <Check fontSize="small" /> : <ContentCopy fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                  
                  {/* Card Owner Name */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: (theme) => theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.02)',
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <AccountCircle sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        {t('contact.cardOwnerName')}
                      </Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 500,
                          textTransform: 'uppercase'
                        }}
                      >
                        {CONTACT_INFO.donation.cardOwnerName}
                      </Typography>
                    </Box>
                    <Tooltip title={copiedCardOwner ? t('contact.copied') || 'Nusxalandi' : t('contact.copy')}>
                      <IconButton
                        size="small"
                        onClick={handleCopyCardOwnerName}
                        color={copiedCardOwner ? 'success' : 'default'}
                        sx={{ ml: 1 }}
                      >
                        {copiedCardOwner ? <Check fontSize="small" /> : <ContentCopy fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

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
