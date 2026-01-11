import React, { useState, useEffect } from 'react'
import { 
  AppBar as MuiAppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Box, 
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Switch,
  useMediaQuery,
  useTheme
} from '@mui/material'
import { 
  Brightness4, 
  Brightness7, 
  HelpOutline, 
  MenuBook, 
  InfoOutlined,
  Menu as MenuIcon,
  Close,
  GetApp
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import ContactModal from './ContactModal'
import InstallModal from './InstallModal'
import type { ThemeMode, Language } from '../types'

interface AppBarProps {
  themeMode: ThemeMode
  language: Language
  onThemeToggle: () => void
  onLanguageChange: (lang: Language) => void
  onTitleClick?: () => void
  onViewFormats?: () => void
}

export default function AppBar({ themeMode, language, onThemeToggle, onLanguageChange, onTitleClick, onViewFormats }: AppBarProps) {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [installModalOpen, setInstallModalOpen] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  // Check if app is already installed
  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true ||
                          document.referrer.includes('android-app://')
      setIsInstalled(isStandalone)
    }
    checkInstalled()

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = () => {
    setInstallModalOpen(true)
    setDrawerOpen(false)
  }

  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
  }

  const isAndroid = () => {
    return /Android/.test(navigator.userAgent)
  }

  const canInstall = !isInstalled && (isIOS() || isAndroid())

  const handleLanguageSelect = (lang: Language) => {
    i18n.changeLanguage(lang)
    onLanguageChange(lang)
  }

  const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (
      event.type === 'keydown' &&
      ((event as React.KeyboardEvent).key === 'Tab' ||
        (event as React.KeyboardEvent).key === 'Shift')
    ) {
      return
    }
    setDrawerOpen(open)
  }

  const drawerContent = (
    <Box 
      sx={{ 
        width: { xs: '100%', sm: 320 },
        height: '100%',
        background: (theme) => theme.palette.mode === 'dark'
          ? 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)'
          : 'linear-gradient(180deg, #f5f7fa 0%, #ffffff 100%)',
      }} 
      role="presentation"
    >
      {/* Header */}
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          p: { xs: 2, sm: 3 },
          background: (theme) => theme.palette.mode === 'dark'
            ? 'rgba(102, 126, 234, 0.1)'
            : 'rgba(102, 126, 234, 0.05)',
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
          <MenuBook sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            {t('app.title')}
          </Typography>
        </Box>
        <IconButton 
          onClick={toggleDrawer(false)}
          size={isMobile ? 'small' : 'medium'}
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

      <List sx={{ px: { xs: 1, sm: 2 }, py: { xs: 1.5, sm: 2 } }}>
        {/* Language Section */}
        {!isMobile && (
          <Typography 
            variant="overline" 
            sx={{ 
              px: { xs: 1, sm: 2 }, 
              py: { xs: 0.5, sm: 1 }, 
              display: 'block',
              color: 'text.secondary',
              fontWeight: 600,
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
              letterSpacing: '0.1em'
            }}
          >
            {t('drawer.language') || 'Til'}
          </Typography>
        )}
        <ListItem disablePadding sx={{ mb: { xs: 0.25, sm: 0.5 } }}>
          <ListItemButton 
            onClick={() => {
              handleLanguageSelect('uz')
              setDrawerOpen(false)
            }}
            sx={{
              borderRadius: { xs: 1.5, sm: 2 },
              py: { xs: 0.75, sm: 1 },
              background: language === 'uz' 
                ? (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(102, 126, 234, 0.2)'
                  : 'rgba(102, 126, 234, 0.1)'
                : 'transparent',
              '&:hover': {
                background: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.04)',
                transform: { xs: 'none', sm: 'translateX(4px)' },
                transition: 'all 0.2s ease'
              },
              transition: 'all 0.2s ease'
            }}
          >
            <ListItemIcon sx={{ minWidth: { xs: 36, sm: 40 } }}>
              <Box
                component="span"
                sx={{
                  fontSize: { xs: '1.5rem', sm: '2rem' },
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: { xs: 32, sm: 40 },
                  height: { xs: 32, sm: 40 },
                  borderRadius: '50%',
                  background: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.05)',
                  p: 0.5
                }}
              >
                🇺🇿
              </Box>
            </ListItemIcon>
            <ListItemText 
              primary={
                <Typography variant="body2" sx={{ fontWeight: language === 'uz' ? 600 : 400, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  O'zbek
                </Typography>
              }
              secondary={language === 'uz' ? (isMobile ? '' : (t('drawer.selected') || 'Tanlangan')) : ''}
              secondaryTypographyProps={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
            />
            {language === 'uz' && (
              <Box 
                sx={{ 
                  color: 'primary.main', 
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  ml: 1
                }}
              >
                ✓
              </Box>
            )}
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding sx={{ mb: { xs: 0.5, sm: 1 } }}>
          <ListItemButton 
            onClick={() => {
              handleLanguageSelect('ru')
              setDrawerOpen(false)
            }}
            sx={{
              borderRadius: { xs: 1.5, sm: 2 },
              py: { xs: 0.75, sm: 1 },
              background: language === 'ru' 
                ? (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(102, 126, 234, 0.2)'
                  : 'rgba(102, 126, 234, 0.1)'
                : 'transparent',
              '&:hover': {
                background: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.04)',
                transform: { xs: 'none', sm: 'translateX(4px)' },
                transition: 'all 0.2s ease'
              },
              transition: 'all 0.2s ease'
            }}
          >
            <ListItemIcon sx={{ minWidth: { xs: 36, sm: 40 } }}>
              <Box
                component="span"
                sx={{
                  fontSize: { xs: '1.5rem', sm: '2rem' },
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: { xs: 32, sm: 40 },
                  height: { xs: 32, sm: 40 },
                  borderRadius: '50%',
                  background: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.05)',
                  p: 0.5
                }}
              >
                🇷🇺
              </Box>
            </ListItemIcon>
            <ListItemText 
              primary={
                <Typography variant="body2" sx={{ fontWeight: language === 'ru' ? 600 : 400, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  Русский
                </Typography>
              }
              secondary={language === 'ru' ? (isMobile ? '' : (t('drawer.selected') || 'Tanlangan')) : ''}
              secondaryTypographyProps={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
            />
            {language === 'ru' && (
              <Box 
                sx={{ 
                  color: 'primary.main', 
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  ml: 1
                }}
              >
                ✓
              </Box>
            )}
          </ListItemButton>
        </ListItem>

        <Divider sx={{ my: { xs: 1, sm: 2 }, opacity: 0.5 }} />

        {/* Theme Section */}
        {!isMobile && (
          <Typography 
            variant="overline" 
            sx={{ 
              px: { xs: 1, sm: 2 }, 
              py: { xs: 0.5, sm: 1 }, 
              display: 'block',
              color: 'text.secondary',
              fontWeight: 600,
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
              letterSpacing: '0.1em'
            }}
          >
            {t('drawer.appearance') || 'Ko\'rinish'}
          </Typography>
        )}
        <ListItem disablePadding sx={{ mb: { xs: 0.5, sm: 1 } }}>
          <ListItemButton
            sx={{
              borderRadius: { xs: 1.5, sm: 2 },
              py: { xs: 0.75, sm: 1 },
              '&:hover': {
                background: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.04)',
                transform: { xs: 'none', sm: 'translateX(4px)' },
                transition: 'all 0.2s ease'
              },
              transition: 'all 0.2s ease'
            }}
          >
            <ListItemIcon sx={{ minWidth: { xs: 36, sm: 40 } }}>
              <Box
                sx={{
                  width: { xs: 32, sm: 40 },
                  height: { xs: 32, sm: 40 },
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.05)',
                  color: 'primary.main'
                }}
              >
                {themeMode === 'dark' ? <Brightness7 sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} /> : <Brightness4 sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />}
              </Box>
            </ListItemIcon>
            <ListItemText 
              primary={<Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{t('drawer.theme') || 'Tema'}</Typography>}
              secondary={isMobile ? '' : (themeMode === 'dark' ? t('drawer.dark') || 'Qorong\'i' : t('drawer.light') || 'Yorug\'')}
              secondaryTypographyProps={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
            />
            <Switch
              checked={themeMode === 'dark'}
              onChange={onThemeToggle}
              color="primary"
              size={isMobile ? 'small' : 'medium'}
            />
          </ListItemButton>
        </ListItem>

        <Divider sx={{ my: { xs: 1, sm: 2 }, opacity: 0.5 }} />

        {/* Contact Section */}
        <ListItem disablePadding sx={{ mb: { xs: 0.5, sm: 0.5 } }}>
          <ListItemButton 
            onClick={() => {
              setContactModalOpen(true)
              setDrawerOpen(false)
            }}
            sx={{
              borderRadius: { xs: 1.5, sm: 2 },
              py: { xs: 0.75, sm: 1 },
              '&:hover': {
                background: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(102, 126, 234, 0.2)'
                  : 'rgba(102, 126, 234, 0.1)',
                transform: { xs: 'none', sm: 'translateX(4px)' },
                transition: 'all 0.2s ease'
              },
              transition: 'all 0.2s ease'
            }}
          >
            <ListItemIcon sx={{ minWidth: { xs: 36, sm: 40 } }}>
              <Box
                sx={{
                  width: { xs: 32, sm: 40 },
                  height: { xs: 32, sm: 40 },
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.05)',
                  color: 'primary.main'
                }}
              >
                <HelpOutline sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
              </Box>
            </ListItemIcon>
            <ListItemText 
              primary={<Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{t('footer.contact')}</Typography>}
              secondary={isMobile ? '' : (t('drawer.contactDescription') || 'Murojaat va yordam')}
              secondaryTypographyProps={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
            />
          </ListItemButton>
        </ListItem>

        {/* Test Formats Section */}
        {onViewFormats && (
          <ListItem disablePadding sx={{ mb: { xs: 0.5, sm: 0.5 } }}>
            <ListItemButton 
              onClick={() => {
                onViewFormats()
                setDrawerOpen(false)
              }}
              sx={{
                borderRadius: { xs: 1.5, sm: 2 },
                py: { xs: 0.75, sm: 1 },
                '&:hover': {
                  background: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(102, 126, 234, 0.2)'
                    : 'rgba(102, 126, 234, 0.1)',
                  transform: { xs: 'none', sm: 'translateX(4px)' },
                  transition: 'all 0.2s ease'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <ListItemIcon sx={{ minWidth: { xs: 36, sm: 40 } }}>
                <Box
                  sx={{
                    width: { xs: 32, sm: 40 },
                    height: { xs: 32, sm: 40 },
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.05)',
                    color: 'primary.main'
                  }}
                >
                  <InfoOutlined sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                </Box>
              </ListItemIcon>
              <ListItemText 
                primary={<Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{t('formats.title') || 'Formatlar'}</Typography>}
                secondary={isMobile ? '' : (t('formats.description') || 'Test formatlari haqida ma\'lumot')}
                secondaryTypographyProps={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
              />
            </ListItemButton>
          </ListItem>
        )}

        {/* Install App Section - Moved to the end */}
        {canInstall && (
          <>
            <Divider sx={{ my: { xs: 1, sm: 2 }, opacity: 0.5 }} />
            <ListItem disablePadding>
              <ListItemButton 
                onClick={handleInstallClick}
                sx={{
                  borderRadius: { xs: 1.5, sm: 2 },
                  py: { xs: 0.75, sm: 1 },
                  '&:hover': {
                    background: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(102, 126, 234, 0.2)'
                      : 'rgba(102, 126, 234, 0.1)',
                    transform: { xs: 'none', sm: 'translateX(4px)' },
                    transition: 'all 0.2s ease'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <ListItemIcon sx={{ minWidth: { xs: 36, sm: 40 } }}>
                  <Box
                    sx={{
                      width: { xs: 32, sm: 40 },
                      height: { xs: 32, sm: 40 },
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: (theme) => theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.05)',
                      color: 'primary.main'
                    }}
                  >
                    <GetApp sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                  </Box>
                </ListItemIcon>
                <ListItemText 
                  primary={<Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{t('drawer.installApp') || 'Mini app o\'rnatish'}</Typography>}
                  secondary={isMobile ? '' : (
                    isIOS() 
                      ? t('drawer.installIOS') || 'iOS uchun qo\'llanma'
                      : deferredPrompt
                      ? t('drawer.installAndroid') || 'Android uchun o\'rnatish'
                      : t('drawer.installNotAvailable') || 'O\'rnatish mavjud emas'
                  )}
                  secondaryTypographyProps={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>
    </Box>
  )

  return (
    <>
    <MuiAppBar position="sticky" elevation={1}>
      <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={toggleDrawer(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5,
            flexGrow: 1,
            cursor: onTitleClick ? 'pointer' : 'default',
          }}
          onClick={onTitleClick}
        >
          <MenuBook 
            sx={{ 
              fontSize: { xs: '1.75rem', sm: '2rem' }, 
              color: 'inherit',
              transition: 'transform 0.3s',
              '&:hover': onTitleClick ? {
                transform: 'scale(1.1)',
                opacity: 0.9
              } : {}
            }} 
          />
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              fontSize: { xs: '1rem', sm: '1.25rem' },
              fontWeight: 700,
              letterSpacing: '0.5px',
              userSelect: 'none',
              '&:hover': onTitleClick ? {
                opacity: 0.8
              } : {}
            }}
          >
            {t('app.title')}
          </Typography>
        </Box>
        </Toolbar>
      </MuiAppBar>
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        {drawerContent}
      </Drawer>
      <ContactModal 
        open={contactModalOpen} 
        onClose={() => setContactModalOpen(false)} 
      />
      <InstallModal
        open={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
      />
    </>
  )
}
