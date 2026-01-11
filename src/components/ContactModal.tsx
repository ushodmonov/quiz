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
  Tooltip,
  Chip,
  Stack,
  SwipeableDrawer
} from '@mui/material'
import { Telegram, Email, Close, CreditCard, AccountCircle, ContentCopy, Check, Favorite } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { CONTACT_INFO } from '../constants/contact'
import { useState } from 'react'
import { useMediaQuery, useTheme } from '@mui/material'

interface ContactModalProps {
  open: boolean
  onClose: () => void
}

export default function ContactModal({ open, onClose }: ContactModalProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
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

  const headerContent = (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      pb: { xs: 1, sm: 1.5 },
      pt: { xs: 1.5, sm: 2 },
      px: { xs: 1.5, sm: 2.5 },
      background: (theme) => theme.palette.mode === 'dark'
        ? 'rgba(102, 126, 234, 0.1)'
        : 'rgba(102, 126, 234, 0.05)',
      borderBottom: (theme) => `1px solid ${theme.palette.divider}`
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1 } }}>
        <Box
          sx={{
            width: { xs: 32, sm: 36 },
            height: { xs: 32, sm: 36 },
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: (theme) => theme.palette.mode === 'dark'
              ? 'rgba(102, 126, 234, 0.2)'
              : 'rgba(102, 126, 234, 0.1)',
            color: 'primary.main'
          }}
        >
          <Telegram sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
        </Box>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 700, 
            color: 'primary.main',
            fontSize: { xs: '1rem', sm: '1.1rem' }
          }}
        >
          {t('footer.contact')}
        </Typography>
      </Box>
      <IconButton
        onClick={onClose}
        size="small"
        sx={{
          '&:hover': {
            background: (theme) => theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.05)'
          }
        }}
      >
        <Close />
      </IconButton>
    </Box>
  )

  const mainContent = (
    <Box sx={{ pt: { xs: 1.5, sm: 2 }, px: { xs: 1.5, sm: 2.5 }, pb: { xs: 1.5, sm: 2 }, flex: 1, overflow: 'auto' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 2.5 } }}>
        {/* Donation Section */}
        {CONTACT_INFO.donation && (
          <Card
            sx={{
              background: (theme) => theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)'
                : 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
              border: (theme) => `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              boxShadow: (theme) => theme.palette.mode === 'dark'
                ? '0 2px 12px rgba(0, 0, 0, 0.2)'
                : '0 2px 12px rgba(0, 0, 0, 0.08)',
              overflow: 'hidden',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
              }
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1 }, mb: { xs: 1.5, sm: 2 } }}>
                <Box
                  sx={{
                    width: { xs: 32, sm: 36 },
                    height: { xs: 32, sm: 36 },
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                    flexShrink: 0
                  }}
                >
                  <Favorite sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontWeight: 600, 
                      mb: 0.25,
                      fontSize: { xs: '0.9rem', sm: '1rem' }
                    }}
                  >
                    {t('contact.donation')}
                  </Typography>
                  <Chip 
                    label={t('contact.support') || 'Qo\'llab-quvvatlash'} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                    sx={{ 
                      height: { xs: 16, sm: 18 }, 
                      fontSize: { xs: '0.6rem', sm: '0.65rem' } 
                    }}
                  />
                </Box>
              </Box>
              
              <Stack spacing={1.5}>
                {/* Card Number */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: { xs: 1, sm: 1.5 },
                    p: { xs: 1, sm: 1.5 },
                    borderRadius: 1.5,
                    bgcolor: (theme) => theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.08)' 
                      : 'rgba(255, 255, 255, 0.6)',
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: { xs: 'none', sm: 'translateY(-2px)' },
                      boxShadow: (theme) => theme.palette.mode === 'dark'
                        ? '0 2px 8px rgba(0, 0, 0, 0.2)'
                        : '0 2px 8px rgba(0, 0, 0, 0.08)',
                    }
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: 32, sm: 36 },
                      height: { xs: 32, sm: 36 },
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: (theme) => theme.palette.mode === 'dark'
                        ? 'rgba(102, 126, 234, 0.2)'
                        : 'rgba(102, 126, 234, 0.1)',
                      color: 'primary.main',
                      flexShrink: 0
                    }}
                  >
                    <CreditCard sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                      variant="caption" 
                      color="text.secondary" 
                      sx={{ 
                        display: 'block', 
                        mb: 0.25, 
                        fontWeight: 500,
                        fontSize: { xs: '0.65rem', sm: '0.7rem' }
                      }}
                    >
                      {t('contact.cardNumber')}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        letterSpacing: { xs: 0.3, sm: 1 },
                        fontSize: { xs: '0.8rem', sm: '0.95rem' },
                        color: 'text.primary',
                        wordBreak: 'break-all'
                      }}
                    >
                      {CONTACT_INFO.donation.cardNumber}
                    </Typography>
                  </Box>
                  <Tooltip title={copiedCardNumber ? t('contact.copied') || 'Nusxalandi' : t('contact.copy')}>
                    <IconButton
                      size="small"
                      onClick={handleCopyCardNumber}
                      color={copiedCardNumber ? 'success' : 'primary'}
                      sx={{ 
                        ml: { xs: 0.5, sm: 0.75 },
                        flexShrink: 0,
                        background: copiedCardNumber 
                          ? (theme) => theme.palette.mode === 'dark'
                            ? 'rgba(76, 175, 80, 0.2)'
                            : 'rgba(76, 175, 80, 0.1)'
                          : 'transparent',
                        '&:hover': {
                          background: (theme) => theme.palette.mode === 'dark'
                            ? 'rgba(102, 126, 234, 0.2)'
                            : 'rgba(102, 126, 234, 0.1)',
                        }
                      }}
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
                    gap: { xs: 1, sm: 1.5 },
                    p: { xs: 1, sm: 1.5 },
                    borderRadius: 1.5,
                    bgcolor: (theme) => theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.08)' 
                      : 'rgba(255, 255, 255, 0.6)',
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: { xs: 'none', sm: 'translateY(-2px)' },
                      boxShadow: (theme) => theme.palette.mode === 'dark'
                        ? '0 2px 8px rgba(0, 0, 0, 0.2)'
                        : '0 2px 8px rgba(0, 0, 0, 0.08)',
                    }
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: 32, sm: 36 },
                      height: { xs: 32, sm: 36 },
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: (theme) => theme.palette.mode === 'dark'
                        ? 'rgba(102, 126, 234, 0.2)'
                        : 'rgba(102, 126, 234, 0.1)',
                      color: 'primary.main',
                      flexShrink: 0
                    }}
                  >
                    <AccountCircle sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                      variant="caption" 
                      color="text.secondary" 
                      sx={{ 
                        display: 'block', 
                        mb: 0.25, 
                        fontWeight: 500,
                        fontSize: { xs: '0.65rem', sm: '0.7rem' }
                      }}
                    >
                      {t('contact.cardOwnerName')}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        fontSize: { xs: '0.8rem', sm: '0.95rem' },
                        letterSpacing: { xs: 0.1, sm: 0.3 },
                        wordBreak: 'break-word'
                      }}
                    >
                      {CONTACT_INFO.donation.cardOwnerName}
                    </Typography>
                  </Box>
                  <Tooltip title={copiedCardOwner ? t('contact.copied') || 'Nusxalandi' : t('contact.copy')}>
                    <IconButton
                      size="small"
                      onClick={handleCopyCardOwnerName}
                      color={copiedCardOwner ? 'success' : 'primary'}
                      sx={{ 
                        ml: { xs: 0.5, sm: 0.75 },
                        flexShrink: 0,
                        background: copiedCardOwner 
                          ? (theme) => theme.palette.mode === 'dark'
                            ? 'rgba(76, 175, 80, 0.2)'
                            : 'rgba(76, 175, 80, 0.1)'
                          : 'transparent',
                        '&:hover': {
                          background: (theme) => theme.palette.mode === 'dark'
                            ? 'rgba(102, 126, 234, 0.2)'
                            : 'rgba(102, 126, 234, 0.1)',
                        }
                      }}
                    >
                      {copiedCardOwner ? <Check fontSize="small" /> : <ContentCopy fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        )}

        <Divider sx={{ my: { xs: 1.5, sm: 2 }, opacity: 0.5 }} />

        {/* Contact Section */}
        <Box>
          <Typography 
            variant="overline" 
            sx={{ 
              display: 'block',
              mb: { xs: 1.5, sm: 2 },
              color: 'text.secondary',
              fontWeight: 600,
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
              letterSpacing: '0.1em'
            }}
          >
            {t('contact.contactMethods') || 'Bog\'lanish usullari'}
          </Typography>
          <Stack spacing={1.5}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: { xs: 1, sm: 1.5 },
                p: { xs: 1, sm: 1.5 },
                borderRadius: 1.5,
                bgcolor: (theme) => theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'rgba(0, 0, 0, 0.02)',
                border: (theme) => `1px solid ${theme.palette.divider}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: { xs: 'none', sm: 'translateX(4px)' },
                  bgcolor: (theme) => theme.palette.mode === 'dark' 
                    ? 'rgba(102, 126, 234, 0.1)' 
                    : 'rgba(102, 126, 234, 0.05)',
                }
              }}
            >
              <Box
                sx={{
                  width: { xs: 32, sm: 36 },
                  height: { xs: 32, sm: 36 },
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(102, 126, 234, 0.2)'
                    : 'rgba(102, 126, 234, 0.1)',
                  color: 'primary.main',
                  flexShrink: 0
                }}
              >
                <Telegram sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  sx={{ 
                    mb: 0.25, 
                    fontWeight: 500,
                    fontSize: { xs: '0.65rem', sm: '0.7rem' }
                  }}
                >
                  Telegram
                </Typography>
                <Link
                  href={CONTACT_INFO.telegram.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: { xs: '0.8rem', sm: '0.9rem' },
                    wordBreak: 'break-all',
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
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: { xs: 1, sm: 1.5 },
                  p: { xs: 1, sm: 1.5 },
                  borderRadius: 1.5,
                  bgcolor: (theme) => theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(0, 0, 0, 0.02)',
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: { xs: 'none', sm: 'translateX(4px)' },
                    bgcolor: (theme) => theme.palette.mode === 'dark' 
                      ? 'rgba(102, 126, 234, 0.1)' 
                      : 'rgba(102, 126, 234, 0.05)',
                  }
                }}
              >
                <Box
                  sx={{
                    width: { xs: 32, sm: 36 },
                    height: { xs: 32, sm: 36 },
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(102, 126, 234, 0.2)'
                      : 'rgba(102, 126, 234, 0.1)',
                    color: 'primary.main',
                    flexShrink: 0
                  }}
                >
                  <Telegram sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 0.25, 
                      fontWeight: 500,
                      fontSize: { xs: '0.65rem', sm: '0.7rem' }
                    }}
                  >
                    {t('contact.telegramChannel') || 'Telegram Kanal'}
                  </Typography>
                  <Link
                    href={CONTACT_INFO.telegramChannel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: 'primary.main',
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: { xs: '0.8rem', sm: '0.9rem' },
                      wordBreak: 'break-all',
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
            
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: { xs: 1, sm: 1.5 },
                p: { xs: 1, sm: 1.5 },
                borderRadius: 1.5,
                bgcolor: (theme) => theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'rgba(0, 0, 0, 0.02)',
                border: (theme) => `1px solid ${theme.palette.divider}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: { xs: 'none', sm: 'translateX(4px)' },
                  bgcolor: (theme) => theme.palette.mode === 'dark' 
                    ? 'rgba(102, 126, 234, 0.1)' 
                    : 'rgba(102, 126, 234, 0.05)',
                }
              }}
            >
              <Box
                sx={{
                  width: { xs: 32, sm: 36 },
                  height: { xs: 32, sm: 36 },
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(102, 126, 234, 0.2)'
                    : 'rgba(102, 126, 234, 0.1)',
                  color: 'primary.main',
                  flexShrink: 0
                }}
              >
                <Email sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  sx={{ 
                    mb: 0.25, 
                    fontWeight: 500,
                    fontSize: { xs: '0.65rem', sm: '0.7rem' }
                  }}
                >
                  Email
                </Typography>
                <Link
                  href={CONTACT_INFO.email.url}
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: { xs: '0.8rem', sm: '0.9rem' },
                    wordBreak: 'break-all',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  {CONTACT_INFO.email.address}
                </Link>
              </Box>
            </Box>
          </Stack>
        </Box>
      </Box>
    </Box>
  )

  const footerContent = (
    <Box sx={{ px: { xs: 1.5, sm: 2.5 }, pb: { xs: 2, sm: 2.5 }, pt: 1.5 }}>
      <Button 
        onClick={onClose} 
        variant="contained" 
        fullWidth
        sx={{
          py: { xs: 1, sm: 1.25 },
          borderRadius: 1.5,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          fontWeight: 600,
          fontSize: { xs: '0.85rem', sm: '0.95rem' },
          textTransform: 'none',
          '&:hover': {
            background: 'linear-gradient(135deg, #5568d3 0%, #6a4190 100%)',
            transform: { xs: 'none', sm: 'translateY(-2px)' },
            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
          },
          transition: 'all 0.3s ease'
        }}
      >
        {t('common.close')}
      </Button>
    </Box>
  )

  if (isMobile) {
    return (
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        onOpen={() => {}}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '90vh',
            overflow: 'hidden',
            background: (theme) => theme.palette.mode === 'dark'
              ? 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)'
              : 'linear-gradient(180deg, #f5f7fa 0%, #ffffff 100%)',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
        ModalProps={{
          keepMounted: false
        }}
      >
        {/* Drag handle */}
        <Box
          sx={{
            width: 40,
            height: 4,
            borderRadius: 2,
            bgcolor: 'text.disabled',
            mx: 'auto',
            mt: 1.5,
            mb: 1
          }}
        />
        {headerContent}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {mainContent}
        </Box>
        {footerContent}
      </SwipeableDrawer>
    )
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          m: 2,
          maxHeight: '90vh',
          background: (theme) => theme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)'
            : 'linear-gradient(180deg, #f5f7fa 0%, #ffffff 100%)',
        }
      }}
    >
      <DialogTitle sx={{ p: 0 }}>
        {headerContent}
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        {mainContent}
      </DialogContent>
      <DialogActions sx={{ p: 0 }}>
        {footerContent}
      </DialogActions>
    </Dialog>
  )
}
