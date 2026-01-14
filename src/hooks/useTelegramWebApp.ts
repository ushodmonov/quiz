import { useEffect, useState } from 'react'
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
        setColorScheme(tg.colorScheme)

        // Telegram doesn't have a direct event for theme change,
        // but we can check periodically or on visibility change
        const checkTheme = () => {
          if (tg.colorScheme !== colorScheme) {
            setColorScheme(tg.colorScheme)
          }
        }

        const interval = setInterval(checkTheme, 1000)
        return () => clearInterval(interval)
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
