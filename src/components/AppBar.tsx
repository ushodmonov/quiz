import React, { useState } from 'react'
import { AppBar as MuiAppBar, Toolbar, Typography, IconButton, Box, Menu, MenuItem, Button } from '@mui/material'
import { Brightness4, Brightness7, Language as LanguageIcon, HelpOutline, MenuBook } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import ContactModal from './ContactModal'
import type { ThemeMode, Language } from '../types'

interface AppBarProps {
  themeMode: ThemeMode
  language: Language
  onThemeToggle: () => void
  onLanguageChange: (lang: Language) => void
  onTitleClick?: () => void
}

export default function AppBar({ themeMode, language, onThemeToggle, onLanguageChange, onTitleClick }: AppBarProps) {
  const { t, i18n } = useTranslation()
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const [contactModalOpen, setContactModalOpen] = useState(false)

  const handleLanguageMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleLanguageMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLanguageSelect = (lang: Language) => {
    i18n.changeLanguage(lang)
    onLanguageChange(lang)
    handleLanguageMenuClose()
  }

  return (
    <MuiAppBar position="sticky" elevation={1}>
      <Toolbar>
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
        <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 }, alignItems: 'center' }}>
          <Button
            color="inherit"
            startIcon={<HelpOutline fontSize="medium" />}
            onClick={() => setContactModalOpen(true)}
            sx={{ 
              fontSize: { xs: '0.875rem', sm: '1rem' },
              px: { xs: 1.5, sm: 2.5 },
              py: { xs: 0.75, sm: 1 },
              display: { xs: 'none', sm: 'flex' }
            }}
          >
            {t('footer.contact')}
          </Button>
          <IconButton
            onClick={() => setContactModalOpen(true)}
            color="inherit"
            size="medium"
            sx={{ display: { xs: 'flex', sm: 'none' } }}
          >
            <HelpOutline fontSize="medium" />
          </IconButton>
          <IconButton onClick={handleLanguageMenuOpen} color="inherit" size="medium">
            <LanguageIcon fontSize="medium" />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleLanguageMenuClose}
          >
            <MenuItem onClick={() => handleLanguageSelect('uz')} selected={language === 'uz'}>
              O'zbek
            </MenuItem>
            <MenuItem onClick={() => handleLanguageSelect('ru')} selected={language === 'ru'}>
              Русский
            </MenuItem>
          </Menu>
          <IconButton onClick={onThemeToggle} color="inherit" size="medium">
            {themeMode === 'dark' ? <Brightness7 fontSize="medium" /> : <Brightness4 fontSize="medium" />}
          </IconButton>
        </Box>
      </Toolbar>
      <ContactModal 
        open={contactModalOpen} 
        onClose={() => setContactModalOpen(false)} 
      />
    </MuiAppBar>
  )
}
