import { useEffect, useRef } from 'react'
import { Box, Typography, Tooltip, useMediaQuery, useTheme, alpha } from '@mui/material'
import type { Theme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'

export type SingleQuestionNavStatus = 'correct' | 'incorrect' | 'draft' | 'empty'

interface SingleModeQuestionNavProps {
  total: number
  currentIndex: number
  getQuestionNumber: (index: number) => number
  getStatus: (index: number) => SingleQuestionNavStatus
  onJump: (index: number) => void
  disabled?: boolean
}

function getQuestionButtonSx(
  status: SingleQuestionNavStatus,
  isCurrent: boolean,
  muiTheme: Theme
) {
  const size = {
    width: { xs: 32, sm: 34 },
    height: { xs: 32, sm: 34 },
    minWidth: { xs: 32, sm: 34 },
    borderRadius: 1.5
  }
  const base = {
    ...size,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    p: 0,
    fontWeight: 700,
    fontSize: { xs: '0.7rem', sm: '0.75rem' },
    fontFamily: 'inherit',
    lineHeight: 1,
    scrollSnapAlign: 'center' as const,
    transition: 'transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease'
  }

  if (isCurrent) {
    return {
      ...base,
      bgcolor: 'primary.main',
      color: 'primary.contrastText',
      border: 'none',
      boxShadow: `0 2px 10px ${alpha(muiTheme.palette.primary.main, 0.4)}`,
      transform: 'scale(1.06)',
      '&:hover:not(:disabled)': { transform: 'scale(1.08)' },
      '&:active:not(:disabled)': { transform: 'scale(1.02)' }
    }
  }

  switch (status) {
    case 'correct':
      return {
        ...base,
        bgcolor: alpha(muiTheme.palette.success.main, 0.14),
        color: 'success.dark',
        border: { xs: '1.5px solid', sm: '2px solid' },
        borderColor: 'success.main',
        boxShadow: 'none',
        '&:hover:not(:disabled)': {
          bgcolor: alpha(muiTheme.palette.success.main, 0.22),
          transform: 'scale(1.04)'
        }
      }
    case 'incorrect':
      return {
        ...base,
        bgcolor: alpha(muiTheme.palette.error.main, 0.12),
        color: 'error.dark',
        border: { xs: '1.5px solid', sm: '2px solid' },
        borderColor: 'error.main',
        boxShadow: 'none',
        '&:hover:not(:disabled)': {
          bgcolor: alpha(muiTheme.palette.error.main, 0.2),
          transform: 'scale(1.04)'
        }
      }
    case 'draft':
      return {
        ...base,
        bgcolor: alpha(muiTheme.palette.warning.main, 0.16),
        color: 'warning.dark',
        border: { xs: '1.5px solid', sm: '2px solid' },
        borderColor: 'warning.main',
        boxShadow: 'none',
        '&:hover:not(:disabled)': {
          bgcolor: alpha(muiTheme.palette.warning.main, 0.24),
          transform: 'scale(1.04)'
        }
      }
    default:
      return {
        ...base,
        bgcolor:
          muiTheme.palette.mode === 'dark'
            ? alpha(muiTheme.palette.common.white, 0.06)
            : alpha(muiTheme.palette.common.black, 0.04),
        color: 'text.secondary',
        border: '1.5px solid',
        borderColor: 'divider',
        boxShadow: 'none',
        '&:hover:not(:disabled)': {
          bgcolor:
            muiTheme.palette.mode === 'dark'
              ? alpha(muiTheme.palette.common.white, 0.1)
              : alpha(muiTheme.palette.common.black, 0.07),
          transform: 'scale(1.04)'
        }
      }
  }
}

export default function SingleModeQuestionNav({
  total,
  currentIndex,
  getQuestionNumber,
  getStatus,
  onJump,
  disabled = false
}: SingleModeQuestionNavProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const useHorizontalScroll = isMobile || total > 12
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!useHorizontalScroll || !scrollRef.current) return
    const active = scrollRef.current.querySelector<HTMLElement>(`[data-q-index="${currentIndex}"]`)
    active?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [currentIndex, useHorizontalScroll])

  const statusLabel = (status: SingleQuestionNavStatus) => {
    switch (status) {
      case 'correct':
        return t('test.nav.statusCorrect')
      case 'incorrect':
        return t('test.nav.statusIncorrect')
      case 'draft':
        return t('test.nav.statusDraft')
      default:
        return t('test.nav.statusEmpty')
    }
  }

  const statusShortLabel = (status: SingleQuestionNavStatus) => {
    switch (status) {
      case 'correct':
        return t('test.nav.statusCorrectShort')
      case 'incorrect':
        return t('test.nav.statusIncorrectShort')
      case 'draft':
        return t('test.nav.statusDraftShort')
      default:
        return t('test.nav.statusEmptyShort')
    }
  }

  const renderQuestionButton = (index: number) => {
    const status = getStatus(index)
    const isCurrent = index === currentIndex
    const num = getQuestionNumber(index)
    const label = t('test.nav.jumpTo', { number: num })
    const tip = `${t('test.questionNumber', { number: num })} — ${statusLabel(status)}`
    const buttonSx = getQuestionButtonSx(status, isCurrent, theme)

    const button = (
      <Box
        component="button"
        type="button"
        data-q-index={index}
        disabled={disabled}
        onClick={() => onJump(index)}
        aria-label={label}
        aria-current={isCurrent ? 'true' : undefined}
        sx={{
          flexShrink: 0,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.45 : 1,
          ...buttonSx,
          '&:active:not(:disabled)': { transform: 'scale(0.96)' }
        }}
      >
        {num}
      </Box>
    )

    if (isMobile) {
      return button
    }

    return (
      <Tooltip key={index} title={tip} arrow>
        <span style={{ display: 'inline-flex', flexShrink: 0 }}>{button}</span>
      </Tooltip>
    )
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        ref={scrollRef}
        sx={{
          display: 'flex',
          flexWrap: useHorizontalScroll ? 'nowrap' : 'wrap',
          gap: { xs: 0.625, sm: 0.75 },
          justifyContent: useHorizontalScroll ? 'flex-start' : 'center',
          ...(useHorizontalScroll ? { scrollSnapType: 'x mandatory' as const } : {}),
          py: 0.25,
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none', width: 0, height: 0 }
        }}
      >
        {Array.from({ length: total }, (_, index) => (
          <Box key={index} component="span" sx={{ display: 'inline-flex', flexShrink: 0 }}>
            {renderQuestionButton(index)}
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 0.5,
          mt: { xs: 0.75, sm: 1 }
        }}
      >
        {(['correct', 'incorrect', 'draft', 'empty'] as SingleQuestionNavStatus[]).map((status) => {
          const label = statusShortLabel(status)
          const dotColor =
            status === 'correct'
              ? 'success.main'
              : status === 'incorrect'
                ? 'error.main'
                : status === 'draft'
                  ? 'warning.main'
                  : 'action.disabled'

          return (
            <Box
              key={status}
              title={statusLabel(status)}
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                minWidth: 0
              }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  flexShrink: 0,
                  borderRadius: '50%',
                  bgcolor: dotColor
                }}
              />
              <Typography
                noWrap
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: '0.6rem', fontWeight: 500, lineHeight: 1 }}
              >
                {label}
              </Typography>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
