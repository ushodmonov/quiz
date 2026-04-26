import { useEffect, useState, useRef } from 'react'
import {
  isTelegramWebApp,
  getTelegramWebApp,
  initTelegramWebApp,
  getTelegramUser,
  getTelegramUserInfo,
  setTelegramHeaderColor,
  setTelegramBackgroundColor,
  showTelegramBackButton,
  hideTelegramBackButton,
  hapticFeedback
} from '../utils/telegramWebApp'

/**
 * Hook to use Telegram Web App features
 */
export const useTelegramWebApp = () => {
  const [isTelegram, setIsTelegram] = useState<boolean | null>(null)
  const [user, setUser] = useState<ReturnType<typeof getTelegramUser>>(null)
  const [userInfo, setUserInfo] = useState<ReturnType<typeof getTelegramUserInfo>>(null)
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light')
  const colorSchemeRef = useRef<'light' | 'dark'>('light')

  useEffect(() => {
    let themeInterval: ReturnType<typeof setInterval> | null = null
    let detectInterval: ReturnType<typeof setInterval> | null = null
    let attempts = 0
    const maxAttempts = 30

    const setupTelegramState = () => {
      // Initialize Telegram Web App
      initTelegramWebApp()

      // Get user info
      const telegramUser = getTelegramUser()
      setUser(telegramUser)
      setUserInfo(getTelegramUserInfo())

      // Get color scheme
      const tg = getTelegramWebApp()
      if (!tg) return

      const initialScheme = tg.colorScheme
      setColorScheme(initialScheme)
      colorSchemeRef.current = initialScheme

      // Listen for theme changes using visibility change and focus events
      const checkTheme = () => {
        const currentScheme = tg.colorScheme
        if (currentScheme !== colorSchemeRef.current) {
          colorSchemeRef.current = currentScheme
          setColorScheme(currentScheme)
        }
      }

      // Check theme when page becomes visible
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          checkTheme()
        }
      }

      // Check theme when window gets focus
      const handleFocus = () => {
        checkTheme()
      }

      // Check periodically (as fallback)
      themeInterval = setInterval(checkTheme, 2000)

      document.addEventListener('visibilitychange', handleVisibilityChange)
      window.addEventListener('focus', handleFocus)

      return () => {
        if (themeInterval) clearInterval(themeInterval)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        window.removeEventListener('focus', handleFocus)
      }
    }

    const cleanupTheme = setupTelegramState
    let themeCleanup: (() => void) | undefined

    const detectTelegram = () => {
      const checkTelegram = isTelegramWebApp()
      if (checkTelegram) {
        setIsTelegram(true)
        if (detectInterval) {
          clearInterval(detectInterval)
          detectInterval = null
        }
        themeCleanup = cleanupTheme()
        return
      }

      attempts += 1
      if (attempts >= maxAttempts) {
        setIsTelegram(false)
        if (detectInterval) {
          clearInterval(detectInterval)
          detectInterval = null
        }
      }
    }

    detectTelegram()
    if (isTelegram === null) {
      detectInterval = setInterval(detectTelegram, 100)
    }

    return () => {
      if (detectInterval) clearInterval(detectInterval)
      if (themeInterval) clearInterval(themeInterval)
      if (themeCleanup) themeCleanup()
    }
  }, [])

  return {
    isTelegram: isTelegram === true,
    isTelegramReady: isTelegram !== null,
    user,
    userInfo,
    colorScheme,
    setHeaderColor: setTelegramHeaderColor,
    setBackgroundColor: setTelegramBackgroundColor,
    showBackButton: showTelegramBackButton,
    hideBackButton: hideTelegramBackButton,
    haptic: hapticFeedback,
    webApp: isTelegram ? getTelegramWebApp() : null
  }
}
