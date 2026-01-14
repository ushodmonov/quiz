import { useEffect, useState, useRef } from 'react'
import {
  isTelegramWebApp,
  getTelegramWebApp,
  initTelegramWebApp,
  getTelegramUser,
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
  const [isTelegram, setIsTelegram] = useState(false)
  const [user, setUser] = useState<ReturnType<typeof getTelegramUser>>(null)
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light')
  const colorSchemeRef = useRef<'light' | 'dark'>('light')

  useEffect(() => {
    const checkTelegram = isTelegramWebApp()
    setIsTelegram(checkTelegram)

    if (checkTelegram) {
      // Initialize Telegram Web App
      initTelegramWebApp()

      // Get user info
      const telegramUser = getTelegramUser()
      setUser(telegramUser)

      // Get color scheme
      const tg = getTelegramWebApp()
      if (tg) {
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
        const interval = setInterval(checkTheme, 2000)

        document.addEventListener('visibilitychange', handleVisibilityChange)
        window.addEventListener('focus', handleFocus)

        return () => {
          clearInterval(interval)
          document.removeEventListener('visibilitychange', handleVisibilityChange)
          window.removeEventListener('focus', handleFocus)
        }
      }
    }
  }, [])

  return {
    isTelegram,
    user,
    colorScheme,
    setHeaderColor: setTelegramHeaderColor,
    setBackgroundColor: setTelegramBackgroundColor,
    showBackButton: showTelegramBackButton,
    hideBackButton: hideTelegramBackButton,
    haptic: hapticFeedback,
    webApp: isTelegram ? getTelegramWebApp() : null
  }
}
