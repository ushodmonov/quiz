import { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box, 
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
  SwipeableDrawer
} from '@mui/material'
import { Close, GetApp, PhoneAndroid, PhoneIphone } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface InstallModalProps {
  open: boolean
  onClose: () => void
  deferredPrompt?: BeforeInstallPromptEvent | null
}

export default function InstallModal({ open, onClose, deferredPrompt }: InstallModalProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if user is on iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(iOS)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
          console.log('User accepted the install prompt')
        }
      } catch (error) {
        console.error('Error showing install prompt:', error)
      }
      onClose()
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
        {isIOS ? (
          <PhoneIphone sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, color: 'primary.main' }} />
        ) : (
          <PhoneAndroid sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, color: 'primary.main' }} />
        )}
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 700, 
            color: 'primary.main',
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}
        >
          {t('install.title')}
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
    <Box sx={{ pt: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 }, flex: 1, overflow: 'auto' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="body1" sx={{ mb: 1 }}>
          {isIOS ? t('install.iosDescription') : t('install.androidDescription')}
        </Typography>

        {isIOS ? (
          <Box>
            <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, fontSize: { xs: '1rem', sm: '1.1rem' } }}>
              {t('install.iosSteps')}:
            </Typography>
            <List sx={{ pl: { xs: 1, sm: 2 } }}>
              <ListItem sx={{ px: 0, py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'primary.main',
                      color: 'white',
                      fontSize: '0.875rem',
                      fontWeight: 600
                    }}
                  >
                    1
                  </Box>
                </ListItemIcon>
                <ListItemText 
                  primary={t('install.iosStep1')}
                  primaryTypographyProps={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                />
              </ListItem>
              <ListItem sx={{ px: 0, py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'primary.main',
                      color: 'white',
                      fontSize: '0.875rem',
                      fontWeight: 600
                    }}
                  >
                    2
                  </Box>
                </ListItemIcon>
                <ListItemText 
                  primary={t('install.iosStep2')}
                  primaryTypographyProps={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                />
              </ListItem>
              <ListItem sx={{ px: 0, py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'primary.main',
                      color: 'white',
                      fontSize: '0.875rem',
                      fontWeight: 600
                    }}
                  >
                    3
                  </Box>
                </ListItemIcon>
                <ListItemText 
                  primary={t('install.iosStep3')}
                  primaryTypographyProps={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                />
              </ListItem>
            </List>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('install.androidInstructions') || 'Quyidagi tugmani bosib ilovani o\'rnatishingiz mumkin'}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )

  const footerContent = (
    <Box sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 }, pt: 1.5 }}>
      {!isIOS && deferredPrompt && (
        <Button
          variant="contained"
          fullWidth
          startIcon={<GetApp />}
          onClick={handleInstall}
          sx={{
            py: { xs: 1, sm: 1.25 },
            borderRadius: 1.5,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontWeight: 600,
            fontSize: { xs: '0.85rem', sm: '0.95rem' },
            textTransform: 'none',
            mb: 1,
            '&:hover': {
              background: 'linear-gradient(135deg, #5568d3 0%, #6a4190 100%)',
              transform: { xs: 'none', sm: 'translateY(-2px)' },
              boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
            },
            transition: 'all 0.3s ease'
          }}
        >
          {t('install.button')}
        </Button>
      )}
      <Button
        variant={isIOS || !deferredPrompt ? 'contained' : 'outlined'}
        fullWidth
        onClick={onClose}
        sx={{
          py: { xs: 1, sm: 1.25 },
          borderRadius: 1.5,
          ...(isIOS || !deferredPrompt ? {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5568d3 0%, #6a4190 100%)',
            }
          } : {}),
          fontWeight: 600,
          fontSize: { xs: '0.85rem', sm: '0.95rem' },
          textTransform: 'none'
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
