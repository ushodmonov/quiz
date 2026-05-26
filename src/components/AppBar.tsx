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
  GetApp,
  AdminPanelSettings,
  Group
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import ContactModal from './ContactModal'
import InstallModal from './InstallModal'
import { isTelegramWebApp } from '../utils/telegramWebApp'
import type { ThemeMode, Language } from '../types'

interface AppBarProps {
  themeMode: ThemeMode
  language: Language
  onThemeToggle: () => void
  onLanguageChange: (lang: Language) => void
  onTitleClick?: () => void
  onViewFormats?: () => void
  onViewAdminToken?: () => void
  onViewAdminUsers?: () => void
}

export default function AppBar({ themeMode, language, onThemeToggle, onLanguageChange, onTitleClick, onViewFormats, onViewAdminToken, onViewAdminUsers }: AppBarProps) {
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

  // Don't show install option if running in Telegram Mini App
  const canInstall = !isTelegramWebApp() && !isInstalled && (isIOS() || isAndroid())

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

  const sectionLabelSx = {
    px: 2,
    pt: { xs: 1.5, sm: 2 },
    pb: { xs: 0.5, sm: 0.75 },
    display: 'block',
    color: 'text.secondary',
    fontWeight: 500,
    fontSize: '0.7rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  }

  const navItemSx = {
    borderRadius: 2,
    py: { xs: 0.75, sm: 1 },
    px: 1.5,
    transition: 'background-color 0.15s ease',
    '&:hover': {
      bgcolor: 'action.hover',
    },
  }

  const navIconSx = {
    minWidth: 0,
    mr: 2,
    color: 'text.secondary',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  }

  const renderLanguageItem = (lang: Language, label: string, flag: string) => {
    const selected = language === lang
    return (
      <ListItem disablePadding sx={{ mb: 0.25 }}>
        <ListItemButton
          onClick={() => {
            handleLanguageSelect(lang)
            setDrawerOpen(false)
          }}
          sx={{
            ...navItemSx,
            bgcolor: selected
              ? (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(138,180,248,0.14)'
                    : 'rgba(26,115,232,0.08)'
              : 'transparent',
            '&:hover': {
              bgcolor: selected
                ? (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(138,180,248,0.20)'
                      : 'rgba(26,115,232,0.12)'
                : 'action.hover',
            },
          }}
        >
          <Box
            component="span"
            sx={{
              fontSize: '1.4rem',
              lineHeight: 1,
              mr: 2,
              width: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {flag}
          </Box>
          <ListItemText
            primary={
              <Typography
                variant="body2"
                sx={{
                  fontWeight: selected ? 500 : 400,
                  color: selected ? 'primary.main' : 'text.primary',
                  fontSize: '0.9rem',
                }}
              >
                {label}
              </Typography>
            }
          />
          {selected && (
            <Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', ml: 1 }}>
              {/* Compact check */}
              <Box component="span" sx={{ fontSize: '1.1rem', lineHeight: 1, fontWeight: 600 }}>✓</Box>
            </Box>
          )}
        </ListItemButton>
      </ListItem>
    )
  }

  const renderNavItem = (
    icon: React.ReactNode,
    primary: string,
    onClick: () => void,
    secondary?: string,
  ) => (
    <ListItem disablePadding sx={{ mb: 0.25 }}>
      <ListItemButton
        onClick={() => {
          onClick()
          setDrawerOpen(false)
        }}
        sx={navItemSx}
      >
        <Box sx={navIconSx}>{icon}</Box>
        <ListItemText
          primary={
            <Typography variant="body2" sx={{ fontSize: '0.9rem', color: 'text.primary' }}>
              {primary}
            </Typography>
          }
          secondary={
            !isMobile && secondary
              ? (
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  {secondary}
                </Typography>
              )
              : null
          }
        />
      </ListItemButton>
    </ListItem>
  )

  const drawerContent = (
    <Box
      sx={{
        width: { xs: '85vw', sm: 320 },
        maxWidth: 360,
        height: '100%',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
      }}
      role="presentation"
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <MenuBook sx={{ fontSize: '1.5rem', color: 'primary.main' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 500, color: 'text.primary' }}>
            {t('app.title')}
          </Typography>
        </Box>
        <IconButton onClick={toggleDrawer(false)} size="small">
          <Close />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <List sx={{ px: 1, py: 1 }}>
          <Typography sx={sectionLabelSx}>{t('drawer.language') || 'Til'}</Typography>
          {renderLanguageItem('uz', "O'zbek", '🇺🇿')}
          {renderLanguageItem('ru', 'Русский', '🇷🇺')}

          <Divider sx={{ my: 1 }} />

          <Typography sx={sectionLabelSx}>{t('drawer.appearance') || "Ko'rinish"}</Typography>
          <ListItem disablePadding sx={{ mb: 0.25 }}>
            <ListItemButton onClick={onThemeToggle} sx={navItemSx}>
              <Box sx={navIconSx}>
                {themeMode === 'dark'
                  ? <Brightness7 sx={{ fontSize: 22 }} />
                  : <Brightness4 sx={{ fontSize: 22 }} />}
              </Box>
              <ListItemText
                primary={
                  <Typography variant="body2" sx={{ fontSize: '0.9rem', color: 'text.primary' }}>
                    {t('drawer.theme') || 'Tema'}
                  </Typography>
                }
                secondary={
                  !isMobile && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      {themeMode === 'dark' ? (t('drawer.dark') || "Qorong'i") : (t('drawer.light') || "Yorug'")}
                    </Typography>
                  )
                }
              />
              <Switch
                checked={themeMode === 'dark'}
                onChange={(e) => {
                  e.stopPropagation()
                  onThemeToggle()
                }}
                onClick={(e) => e.stopPropagation()}
                color="primary"
                size="small"
              />
            </ListItemButton>
          </ListItem>

          <Divider sx={{ my: 1 }} />

          <Typography sx={sectionLabelSx}>{t('drawer.more') || "Boshqalar"}</Typography>
          {renderNavItem(
            <HelpOutline sx={{ fontSize: 22 }} />,
            t('footer.contact'),
            () => setContactModalOpen(true),
            t('drawer.contactDescription') || 'Murojaat va yordam',
          )}
          {onViewFormats && renderNavItem(
            <InfoOutlined sx={{ fontSize: 22 }} />,
            t('formats.title') || 'Formatlar',
            onViewFormats,
            t('formats.description') || "Test formatlari haqida ma'lumot",
          )}
          {onViewAdminToken && renderNavItem(
            <AdminPanelSettings sx={{ fontSize: 22 }} />,
            t('drawer.adminAddUser'),
            onViewAdminToken,
            t('drawer.adminAddUserDescription'),
          )}
          {onViewAdminUsers && renderNavItem(
            <Group sx={{ fontSize: 22 }} />,
            t('drawer.adminJwtUsers'),
            onViewAdminUsers,
            t('drawer.adminJwtUsersDescription'),
          )}
          {canInstall && (
            <>
              <Divider sx={{ my: 1 }} />
              {renderNavItem(
                <GetApp sx={{ fontSize: 22 }} />,
                t('drawer.installApp') || "Mini app o'rnatish",
                handleInstallClick,
                isIOS()
                  ? (t('drawer.installIOS') || "iOS uchun qo'llanma")
                  : deferredPrompt
                  ? (t('drawer.installAndroid') || "Android uchun o'rnatish")
                  : (t('drawer.installNotAvailable') || "O'rnatish mavjud emas"),
              )}
            </>
          )}
        </List>
      </Box>
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
