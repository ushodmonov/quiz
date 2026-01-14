// Telegram Web App utility functions

// Type definitions for Telegram Web App
interface TelegramWebApp {
  initData: string
  initDataUnsafe: {
    query_id?: string
    user?: {
      id: number
      first_name: string
      last_name?: string
      username?: string
      language_code?: string
      is_premium?: boolean
    }
    auth_date?: number
    hash?: string
  }
  version: string
  platform: string
  colorScheme: 'light' | 'dark'
  themeParams: {
    bg_color?: string
    text_color?: string
    hint_color?: string
    link_color?: string
    button_color?: string
    button_text_color?: string
    secondary_bg_color?: string
  }
  isExpanded: boolean
  viewportHeight: number
  viewportStableHeight: number
  headerColor: string
  backgroundColor: string
  isClosingConfirmationEnabled: boolean
  BackButton: {
    isVisible: boolean
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
    show: () => void
    hide: () => void
  }
  MainButton: {
    text: string
    color: string
    textColor: string
    isVisible: boolean
    isActive: boolean
    isProgressVisible: boolean
    setText: (text: string) => void
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
    show: () => void
    hide: () => void
    enable: () => void
    disable: () => void
    showProgress: (leaveActive?: boolean) => void
    hideProgress: () => void
    setParams: (params: {
      text?: string
      color?: string
      text_color?: string
      is_active?: boolean
      is_visible?: boolean
    }) => void
  }
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void
    selectionChanged: () => void
  }
  CloudStorage: {
    setItem: (key: string, value: string, callback?: (error: Error | null, success: boolean) => void) => void
    getItem: (key: string, callback: (error: Error | null, value: string | null) => void) => void
    getItems: (keys: string[], callback: (error: Error | null, values: Record<string, string>) => void) => void
    removeItem: (key: string, callback?: (error: Error | null, success: boolean) => void) => void
    removeItems: (keys: string[], callback?: (error: Error | null, success: boolean) => void) => void
    getKeys: (callback: (error: Error | null, keys: string[]) => void) => void
  }
  ready: () => void
  expand: () => void
  close: () => void
  sendData: (data: string) => void
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void
  openTelegramLink: (url: string) => void
  openInvoice: (url: string, callback?: (status: string) => void) => void
  showPopup: (params: {
    title?: string
    message: string
    buttons?: Array<{
      id?: string
      type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive'
      text?: string
    }>
  }, callback?: (id: string) => void) => void
  showAlert: (message: string, callback?: () => void) => void
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void
  showScanQrPopup: (params: {
    text?: string
  }, callback?: (data: string) => void) => void
  closeScanQrPopup: () => void
  readTextFromClipboard: (callback?: (text: string) => void) => void
  requestWriteAccess: (callback?: (granted: boolean) => void) => void
  requestContact: (callback?: (granted: boolean) => void) => void
  onEvent: (eventType: string, eventHandler: () => void) => void
  offEvent: (eventType: string, eventHandler: () => void) => void
  enableClosingConfirmation: () => void
  disableClosingConfirmation: () => void
  enableVerticalSwipes: () => void
  disableVerticalSwipes: () => void
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}

/**
 * Check if the app is running inside Telegram
 */
export const isTelegramWebApp = (): boolean => {
  return typeof window !== 'undefined' && window.Telegram?.WebApp !== undefined
}

/**
 * Get Telegram Web App instance
 */
export const getTelegramWebApp = (): TelegramWebApp | null => {
  if (isTelegramWebApp()) {
    return window.Telegram!.WebApp
  }
  return null
}

/**
 * Initialize Telegram Web App
 * Call this when the app starts
 */
export const initTelegramWebApp = (): void => {
  const tg = getTelegramWebApp()
  if (!tg) return

  // Expand the app to full height
  tg.expand()

  // Enable closing confirmation
  tg.enableClosingConfirmation()

  // Set app theme based on Telegram theme
  if (tg.colorScheme === 'dark') {
    // Telegram dark mode detected
    document.documentElement.setAttribute('data-telegram-theme', 'dark')
  } else {
    document.documentElement.setAttribute('data-telegram-theme', 'light')
  }

  // Apply Telegram theme colors if available
  if (tg.themeParams) {
    const root = document.documentElement
    if (tg.themeParams.bg_color) {
      root.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color)
    }
    if (tg.themeParams.text_color) {
      root.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color)
    }
    if (tg.themeParams.hint_color) {
      root.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color)
    }
    if (tg.themeParams.link_color) {
      root.style.setProperty('--tg-theme-link-color', tg.themeParams.link_color)
    }
    if (tg.themeParams.button_color) {
      root.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color)
    }
    if (tg.themeParams.button_text_color) {
      root.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color)
    }
    if (tg.themeParams.secondary_bg_color) {
      root.style.setProperty('--tg-theme-secondary-bg-color', tg.themeParams.secondary_bg_color)
    }
  }

  // Set viewport height for proper mobile display
  const setViewportHeight = () => {
    const vh = tg.viewportHeight || window.innerHeight
    document.documentElement.style.setProperty('--tg-viewport-height', `${vh}px`)
  }
  setViewportHeight()
  window.addEventListener('resize', setViewportHeight)

  // Notify Telegram that the app is ready
  tg.ready()
}

/**
 * Get Telegram user information
 */
export const getTelegramUser = () => {
  const tg = getTelegramWebApp()
  return tg?.initDataUnsafe?.user || null
}

/**
 * Set header color in Telegram
 */
export const setTelegramHeaderColor = (color: string): void => {
  const tg = getTelegramWebApp()
  if (tg) {
    tg.headerColor = color
  }
}

/**
 * Set background color in Telegram
 */
export const setTelegramBackgroundColor = (color: string): void => {
  const tg = getTelegramWebApp()
  if (tg) {
    tg.backgroundColor = color
  }
}

/**
 * Show Telegram back button
 */
export const showTelegramBackButton = (onClick: () => void): (() => void) => {
  const tg = getTelegramWebApp()
  if (!tg) return () => {}

  tg.BackButton.show()
  tg.BackButton.onClick(onClick)

  // Return cleanup function
  return () => {
    tg.BackButton.hide()
    tg.BackButton.offClick(onClick)
  }
}

/**
 * Hide Telegram back button
 */
export const hideTelegramBackButton = (): void => {
  const tg = getTelegramWebApp()
  if (tg) {
    tg.BackButton.hide()
  }
}

/**
 * Haptic feedback
 */
export const hapticFeedback = {
  impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
    const tg = getTelegramWebApp()
    tg?.HapticFeedback.impactOccurred(style)
  },
  notification: (type: 'error' | 'success' | 'warning' = 'success') => {
    const tg = getTelegramWebApp()
    tg?.HapticFeedback.notificationOccurred(type)
  },
  selection: () => {
    const tg = getTelegramWebApp()
    tg?.HapticFeedback.selectionChanged()
  }
}
