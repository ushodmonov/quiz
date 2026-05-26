import { createTheme } from '@mui/material/styles'
import type { ThemeMode } from '../types'

// Calm, study-friendly Google palette
// Primary: Google blue (focus, easy on the eyes for long sessions)
// Secondary: soft teal accent
export const gmailColors = {
  light: {
    primary: '#1A73E8',          // Google blue — calm, focused
    primaryHover: '#185ABC',
    secondary: '#00897B',        // soft teal accent
    secondaryHover: '#00695C',
    surface: '#FFFFFF',
    background: '#F6F8FC',
    hover: '#F1F3F4',
    border: '#DADCE0',
    textPrimary: '#202124',
    textSecondary: '#5F6368',
    success: '#188038',
    error: '#D93025',
    warning: '#F9AB00',
    headerBar: '#FFFFFF',
  },
  dark: {
    primary: '#8AB4F8',          // soft blue
    primaryHover: '#AECBFA',
    secondary: '#80CBC4',        // muted teal
    secondaryHover: '#A7D8D2',
    surface: '#2A2A2C',
    background: '#1F1F1F',
    hover: '#3C4043',
    border: '#3C4043',
    textPrimary: '#E8EAED',
    textSecondary: '#9AA0A6',
    success: '#81C995',
    error: '#F28B82',
    warning: '#FDD663',
    headerBar: '#2A2A2C',
  },
}

export const createAppTheme = (mode: ThemeMode) => {
  const c = mode === 'dark' ? gmailColors.dark : gmailColors.light

  return createTheme({
    palette: {
      mode,
      primary: {
        main: c.primary,
        light: mode === 'dark' ? '#D2E3FC' : '#E8F0FE',
        dark: c.primaryHover,
        contrastText: mode === 'dark' ? '#202124' : '#FFFFFF',
      },
      secondary: {
        main: c.secondary,
        light: mode === 'dark' ? '#B2DFDB' : '#E0F2F1',
        dark: c.secondaryHover,
        contrastText: mode === 'dark' ? '#202124' : '#FFFFFF',
      },
      success: {
        main: c.success,
        light: mode === 'dark' ? '#A8DAB5' : '#E6F4EA',
        dark: '#0D652D',
      },
      error: {
        main: c.error,
        light: mode === 'dark' ? '#FAD2CF' : '#FCE8E6',
        dark: '#A50E0E',
      },
      warning: {
        main: c.warning,
        light: mode === 'dark' ? '#FEEFC3' : '#FEF7E0',
        dark: '#E37400',
      },
      background: {
        default: c.background,
        paper: c.surface,
      },
      text: {
        primary: c.textPrimary,
        secondary: c.textSecondary,
      },
      divider: c.border,
      action: {
        hover: c.hover,
      },
    },
    typography: {
      fontFamily: [
        '"Google Sans"',
        'Roboto',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h4: {
        fontWeight: 500,
        letterSpacing: '-0.01em',
      },
      h5: {
        fontWeight: 500,
        letterSpacing: 0,
      },
      h6: {
        fontWeight: 500,
      },
      button: {
        fontWeight: 500,
        letterSpacing: '0.01em',
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: c.headerBar,
            color: c.textPrimary,
            boxShadow: 'none',
            borderBottom: `1px solid ${c.border}`,
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            padding: '8px 20px',
            borderRadius: 20,
            boxShadow: 'none',
            transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
            '&:hover': {
              boxShadow: 'none',
            },
          },
          contained: {
            '&:hover': {
              boxShadow: mode === 'dark'
                ? '0 1px 3px rgba(0,0,0,0.5)'
                : '0 1px 3px rgba(60,64,67,0.15)',
            },
          },
          outlined: {
            borderColor: c.border,
            '&:hover': {
              borderColor: c.border,
              backgroundColor: c.hover,
            },
          },
          text: {
            '&:hover': {
              backgroundColor: c.hover,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            border: `1px solid ${c.border}`,
            boxShadow: 'none',
            backgroundImage: 'none',
            transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
            '&:hover': {
              boxShadow: mode === 'dark'
                ? '0 1px 2px 0 rgba(0,0,0,0.6), 0 1px 3px 1px rgba(0,0,0,0.4)'
                : '0 1px 2px 0 rgba(60,64,67,0.10), 0 1px 3px 1px rgba(60,64,67,0.08)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              backgroundColor: mode === 'dark' ? c.surface : '#FFFFFF',
              '& fieldset': {
                borderColor: c.border,
              },
              '&:hover fieldset': {
                borderColor: c.textSecondary,
              },
              '&.Mui-focused fieldset': {
                borderColor: c.secondary,
                borderWidth: 2,
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 500,
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            height: 4,
            backgroundColor: c.hover,
          },
          bar: {
            borderRadius: 4,
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: c.border,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 0,
            '&:hover': {
              backgroundColor: c.hover,
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            backgroundImage: 'none',
          },
        },
      },
    },
  })
}
