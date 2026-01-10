import { createTheme } from '@mui/material/styles'
import type { ThemeMode } from '../types'

export const createAppTheme = (mode: ThemeMode) => {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? '#90caf9' : '#667eea',
        light: mode === 'dark' ? '#e3f2fd' : '#e8eaf6',
        dark: mode === 'dark' ? '#42a5f5' : '#5568d3',
      },
      secondary: {
        main: mode === 'dark' ? '#f48fb1' : '#764ba2',
        light: mode === 'dark' ? '#fce4ec' : '#f3e5f5',
        dark: mode === 'dark' ? '#c2185b' : '#5e35b1',
      },
      success: {
        main: '#4caf50',
        light: '#e8f5e9',
        dark: '#2e7d32',
      },
      error: {
        main: '#f44336',
        light: '#ffebee',
        dark: '#c62828',
      },
      warning: {
        main: '#ff9800',
        light: '#fff3e0',
        dark: '#f57c00',
      },
      background: {
        default: mode === 'dark' ? '#0f0c29' : '#667eea',
        paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
      },
    },
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h4: {
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h5: {
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      h6: {
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 16,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            padding: '12px 32px',
            borderRadius: 12,
            boxShadow: '0 4px 14px 0 rgba(0, 118, 255, 0.39)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 20px rgba(0, 118, 255, 0.4)',
            },
          },
          outlined: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 4px 14px 0 rgba(0, 118, 255, 0.2)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            boxShadow: mode === 'dark' 
              ? '0 8px 32px rgba(0, 0, 0, 0.4)' 
              : '0 8px 32px rgba(0, 0, 0, 0.12)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              boxShadow: mode === 'dark'
                ? '0 12px 40px rgba(0, 0, 0, 0.5)'
                : '0 12px 40px rgba(0, 0, 0, 0.15)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-2px)',
              },
            },
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            height: 10,
          },
          bar: {
            borderRadius: 10,
          },
        },
      },
    },
  })
}
