import { useState, useEffect } from 'react'
import { Box, Card, CardContent, Typography, Button, IconButton } from '@mui/material'
import { Close, GetApp, PhoneAndroid, PhoneIphone } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const { t } = useTranslation()
  const [showPrompt, setShowPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)

  useEffect(() => {
    // Check if user is on iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(iOS)

    // Check if user is on Android
    const android = /Android/.test(navigator.userAgent)
    setIsAndroid(android)

    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true ||
                        document.referrer.includes('android-app://')

    if (isStandalone) {
      return // Don't show prompt if already installed
    }

    // Check if user has dismissed the prompt before (stored in localStorage)
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10)
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        return
      }
    }

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      if (android) {
        setShowPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Show prompt for iOS after a delay
    if (iOS) {
      setTimeout(() => {
        setShowPrompt(true)
      }, 3000) // Show after 3 seconds
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
      } else {
        console.log('User dismissed the install prompt')
      }
      
      setDeferredPrompt(null)
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  if (!showPrompt || (!isIOS && !isAndroid && !deferredPrompt)) {
    return null
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1300,
        width: '90%',
        maxWidth: 400,
        animation: 'slideUp 0.3s ease-out',
        '@keyframes slideUp': {
          from: {
            transform: 'translateX(-50%) translateY(100%)',
            opacity: 0
          },
          to: {
            transform: 'translateX(-50%) translateY(0)',
            opacity: 1
          }
        }
      }}
    >
      <Card
        sx={{
          background: (theme) => theme.palette.mode === 'dark'
            ? 'rgba(30, 30, 30, 0.98)'
            : 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          border: (theme) => `1px solid ${theme.palette.divider}`
        }}
      >
        <CardContent sx={{ p: 2, position: 'relative' }}>
          <IconButton
            size="small"
            onClick={handleDismiss}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: 'text.secondary'
            }}
          >
            <Close fontSize="small" />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, pr: 4 }}>
            {isIOS ? (
              <PhoneIphone sx={{ fontSize: 32, color: 'primary.main', mr: 1.5 }} />
            ) : (
              <PhoneAndroid sx={{ fontSize: 32, color: 'primary.main', mr: 1.5 }} />
            )}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                {t('install.title')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isIOS ? t('install.iosDescription') : t('install.androidDescription')}
              </Typography>
            </Box>
          </Box>

          {isIOS ? (
            <Box>
              <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 500 }}>
                {t('install.iosSteps')}:
              </Typography>
              <Box component="ol" sx={{ pl: 2.5, mb: 2, '& li': { mb: 0.5 } }}>
                <Typography component="li" variant="body2">
                  {t('install.iosStep1')}
                </Typography>
                <Typography component="li" variant="body2">
                  {t('install.iosStep2')}
                </Typography>
                <Typography component="li" variant="body2">
                  {t('install.iosStep3')}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Button
              variant="contained"
              fullWidth
              startIcon={<GetApp />}
              onClick={handleInstall}
              sx={{
                mb: 1,
                py: 1.2,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #6a4190 100%)'
                }
              }}
            >
              {t('install.button')}
            </Button>
          )}

          <Button
            variant="text"
            fullWidth
            size="small"
            onClick={handleDismiss}
            sx={{ color: 'text.secondary' }}
          >
            {t('install.dismiss')}
          </Button>
        </CardContent>
      </Card>
    </Box>
  )
}
