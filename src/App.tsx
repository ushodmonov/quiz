import { useState, useEffect } from 'react'
import { ThemeProvider, CssBaseline, Box, Container, Card, CardContent, Typography, Button } from '@mui/material'
import { useTranslation } from 'react-i18next'
import StartPage from './pages/StartPage'
import TestPage from './pages/TestPage'
import ResultsPage from './pages/ResultsPage'
import AllQuestionsPage from './pages/AllQuestionsPage'
import TestFormatsPage from './pages/TestFormatsPage'
import AdminTokenPage from './pages/AdminTokenPage'
import AdminUsersPage from './pages/AdminUsersPage'
import ResumeModal from './components/ResumeModal'
import AppBar from './components/AppBar'
import InstallPrompt from './components/InstallPrompt'
import { loadProgress, hasProgress, clearProgress, loadTheme, saveTheme, loadLanguage, saveLanguage, saveAllQuestions, loadAllQuestions } from './utils/storage'
import { selectQuestions } from './utils/questionUtils'
import { createAppTheme } from './theme/theme'
import { useTelegramWebApp } from './hooks/useTelegramWebApp'
import { ADMIN_CONTACTS, CONTACT_INFO, isAdminTelegramUser, JWT_SECRET_KEY } from './constants/contact'
import { getLatestJwtTokenByTelegramUserId } from './utils/firebase'
import { verifyJwtToken } from './utils/jwt'
import './i18n/config'
import type { QuizData, QuizResults, ThemeMode, Language, Question } from './types'

function App() {
  const { i18n } = useTranslation()
  const telegram = useTelegramWebApp()
  const [currentPage, setCurrentPage] = useState<'start' | 'test' | 'results' | 'questions' | 'formats' | 'admin-token' | 'admin-users'>('start')
  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [showResumeModal, setShowResumeModal] = useState(false)
  const [themeMode, setThemeMode] = useState<ThemeMode>(loadTheme())
  const [language, setLanguage] = useState<Language>(loadLanguage())
  const [hasValidAccessToken, setHasValidAccessToken] = useState(false)
  const [accessCheckLoading, setAccessCheckLoading] = useState(true)
  const isAdmin = isAdminTelegramUser(telegram.userInfo?.id)

  useEffect(() => {
    i18n.changeLanguage(language)
  }, [language, i18n])

  useEffect(() => {
    const checkTokenAccess = async () => {
      if (!telegram.isTelegramReady) return
      if (!telegram.isTelegram) {
        setAccessCheckLoading(false)
        return
      }

      if (isAdmin) {
        setHasValidAccessToken(true)
        setAccessCheckLoading(false)
        return
      }

      const telegramUserId = telegram.userInfo?.id
      if (!telegramUserId) {
        setHasValidAccessToken(false)
        setAccessCheckLoading(false)
        return
      }

      try {
        const token = await getLatestJwtTokenByTelegramUserId(telegramUserId)
        if (!token) {
          setHasValidAccessToken(false)
          return
        }

        const isValid = await verifyJwtToken(token, JWT_SECRET_KEY, telegramUserId)
        setHasValidAccessToken(isValid)
      } catch (error) {
        console.error('JWT access check failed:', error)
        setHasValidAccessToken(false)
      } finally {
        setAccessCheckLoading(false)
      }
    }

    checkTokenAccess()
  }, [telegram.isTelegramReady, telegram.isTelegram, telegram.userInfo?.id, isAdmin])

  const handleBackToStart = () => {
    if (currentPage === 'test' || currentPage === 'results') {
      if (window.confirm('Testni tark etmoqchimisiz? Barcha progress yo\'qoladi.')) {
        clearProgress()
        setQuizData(null)
        setCurrentPage('start')
      }
    } else {
      setQuizData(null)
      setCurrentPage('start')
    }
  }

  // Sync theme with Telegram if running in Telegram
  // This effect runs when Telegram colorScheme changes
  useEffect(() => {
    if (telegram.isTelegram && telegram.colorScheme) {
      const telegramTheme = telegram.colorScheme === 'dark' ? 'dark' : 'light'
      // Only sync if theme actually changed in Telegram
      if (telegramTheme !== themeMode) {
        setThemeMode(telegramTheme)
        saveTheme(telegramTheme)
        
        // Update Telegram header and background colors
        const headerColor = telegramTheme === 'dark' ? '#1e1e1e' : '#667eea'
        const bgColor = telegramTheme === 'dark' ? '#0f0c29' : '#667eea'
        telegram.setHeaderColor(headerColor)
        telegram.setBackgroundColor(bgColor)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telegram.colorScheme]) // Only depend on colorScheme to avoid infinite loop

  // Set Telegram header and background colors
  useEffect(() => {
    if (telegram.isTelegram) {
      const headerColor = themeMode === 'dark' ? '#1e1e1e' : '#667eea'
      const bgColor = themeMode === 'dark' ? '#0f0c29' : '#667eea'
      telegram.setHeaderColor(headerColor)
      telegram.setBackgroundColor(bgColor)
    }
  }, [telegram.isTelegram, themeMode, telegram])

  // Handle Telegram back button
  useEffect(() => {
    if (!telegram.isTelegram) return

    let cleanup: (() => void) | undefined

    if (currentPage === 'test' || currentPage === 'results' || currentPage === 'questions' || currentPage === 'formats' || currentPage === 'admin-token' || currentPage === 'admin-users') {
      cleanup = telegram.showBackButton(() => {
        telegram.haptic.impact('light')
        handleBackToStart()
      })
    } else {
      telegram.hideBackButton()
    }

    return () => {
      if (cleanup) cleanup()
    }
  }, [currentPage, telegram, handleBackToStart])

  useEffect(() => {
    if (hasProgress() && currentPage === 'start') {
      setShowResumeModal(true)
    }
  }, [])

  // Handle hash routing for questions page
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#questions') {
        const savedQuestions = loadAllQuestions()
        if (savedQuestions && savedQuestions.length > 0) {
          setAllQuestions(savedQuestions)
          setCurrentPage('questions')
        }
      } else if (window.location.hash === '' || !window.location.hash) {
        // If hash is cleared, go back to start
        if (currentPage === 'questions') {
          setCurrentPage('start')
        }
      }
    }

    // Check initial hash on mount
    if (window.location.hash === '#questions') {
      handleHashChange()
    }

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange)
    
    // Also listen for popstate (back/forward button)
    const handlePopState = () => {
      if (window.location.hash === '' || !window.location.hash) {
        if (currentPage === 'questions') {
          setCurrentPage('start')
        }
      }
    }
    window.addEventListener('popstate', handlePopState)
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [currentPage])

  const handleStartQuiz = (data: QuizData) => {
    telegram.haptic.impact('medium')
    clearProgress()
    setQuizData(data)
    setCurrentPage('test')
  }

  const handleResumeQuiz = () => {
    const progress = loadProgress()
    if (progress) {
      setQuizData(progress as QuizData)
      setCurrentPage('test')
    }
    setShowResumeModal(false)
  }

  const handleNewQuiz = () => {
    clearProgress()
    setShowResumeModal(false)
  }

  const handleTestComplete = (results: QuizResults) => {
    if (quizData) {
      telegram.haptic.notification('success')
      
      // If this is a retake and there's an original position to continue from
      if (quizData.isRetake && quizData.originalNextStartIndex !== null && quizData.originalNextStartIndex !== undefined) {
        const nextStart = quizData.originalNextStartIndex
        const remainingCount = quizData.allQuestions.length - nextStart
        const questionCount = Math.min(quizData.selectedQuestions?.length || 10, remainingCount)
        
        if (questionCount > 0) {
          // Continue from original position
          const selected = selectQuestions(
            quizData.allQuestions,
            nextStart,
            questionCount,
            quizData.selectionMethod || 'sequential',
            quizData.endQuestionIndex
          )
          
          const newData: QuizData = {
            ...quizData,
            currentQuestionIndex: 0,
            startIndex: nextStart,
            selectedQuestions: selected,
            answers: {},
            score: { correct: 0, incorrect: 0 },
            results: undefined,
            isRetake: false, // Clear retake flag
            originalNextStartIndex: undefined // Clear original position
          }
          setQuizData(newData)
          setCurrentPage('test')
          return
        }
      }
      
      // Normal completion - show results
      setQuizData({ ...quizData, results })
      setCurrentPage('results')
    }
  }

  const handleRestart = () => {
    clearProgress()
    setQuizData(null)
    setCurrentPage('start')
  }

  const handleNextTest = () => {
    if (quizData && quizData.results && quizData.results.nextStartIndex !== null && quizData.results.nextStartIndex !== undefined) {
      const nextStart = quizData.results.nextStartIndex
      
      // Calculate question count for next test
      let questionCount: number
      if (quizData.endQuestionIndex !== null && quizData.endQuestionIndex !== undefined) {
        // If endQuestionIndex is set, calculate remaining questions in range
        const remainingInRange = quizData.endQuestionIndex - nextStart + 1
        const defaultCount = quizData.selectedQuestions?.length || 10
        questionCount = Math.min(defaultCount, remainingInRange)
      } else {
        // Normal behavior: use remaining questions
        const remainingCount = quizData.allQuestions.length - nextStart
        questionCount = Math.min(quizData.selectedQuestions?.length || 10, remainingCount)
      }
      
      if (questionCount <= 0) {
        return
      }
      
      const selected = selectQuestions(
        quizData.allQuestions,
        nextStart,
        questionCount,
        quizData.selectionMethod || 'sequential',
        quizData.endQuestionIndex
      )
      
      const newData: QuizData = {
        ...quizData,
        currentQuestionIndex: 0,
        startIndex: nextStart,
        selectedQuestions: selected,
        answers: {},
        score: { correct: 0, incorrect: 0 },
        results: undefined
      }
      setQuizData(newData)
      setCurrentPage('test')
    }
  }

  const handleRetakeIncorrect = () => {
    if (!quizData || !quizData.selectedQuestions || !quizData.answers) return
    
    // Get all incorrect questions
    const incorrectQuestions = quizData.selectedQuestions.filter((_, index) => {
      const answerData = quizData.answers[index]
      return answerData && !answerData.correct
    })
    
    if (incorrectQuestions.length === 0) return
    
    // Save the original nextStartIndex to continue from after retake
    const originalNextStartIndex = quizData.results?.nextStartIndex ?? quizData.nextStartIndex ?? null
    
    // Create new quiz data with only incorrect questions
    const newData: QuizData = {
      ...quizData,
      selectedQuestions: incorrectQuestions,
      allQuestions: quizData.allQuestions, // Keep original allQuestions for continuation
      currentQuestionIndex: 0,
      startIndex: 0,
      answers: {},
      score: { correct: 0, incorrect: 0 },
      results: undefined,
      nextStartIndex: null, // Will be set after retake completion
      originalNextStartIndex: originalNextStartIndex, // Save original position
      isRetake: true, // Mark as retake
      fileName: `${quizData.fileName} - ${incorrectQuestions.length} noto'g'ri savollar`
    }
    
    clearProgress()
    setQuizData(newData)
    setCurrentPage('test')
  }

  const handleViewAllQuestions = (questions: Question[]) => {
    // Save questions to localStorage
    saveAllQuestions(questions)
    
    // In Telegram Mini App, don't open new tab - use same tab
    if (telegram.isTelegram) {
      setAllQuestions(questions)
      setCurrentPage('questions')
      return
    }
    
    // Open in new tab for regular browser
    const baseUrl = window.location.origin + import.meta.env.BASE_URL
    const newTab = window.open(`${baseUrl}#questions`, '_blank')
    if (!newTab) {
      // If popup blocked, fallback to same tab
      setAllQuestions(questions)
      setCurrentPage('questions')
    }
  }

  const handleBackFromQuestions = () => {
    setCurrentPage('start')
  }

  const handleViewFormats = () => {
    setCurrentPage('formats')
  }

  const handleBackFromFormats = () => {
    setCurrentPage('start')
  }

  const handleViewAdminToken = () => {
    setCurrentPage('admin-token')
  }

  const handleViewAdminUsers = () => {
    setCurrentPage('admin-users')
  }

  const handleThemeToggle = () => {
    telegram.haptic.selection()
    const newMode = themeMode === 'light' ? 'dark' : 'light'
    setThemeMode(newMode)
    saveTheme(newMode)
    
    // Update Telegram header and background colors immediately
    if (telegram.isTelegram) {
      const headerColor = newMode === 'dark' ? '#1e1e1e' : '#667eea'
      const bgColor = newMode === 'dark' ? '#0f0c29' : '#667eea'
      telegram.setHeaderColor(headerColor)
      telegram.setBackgroundColor(bgColor)
    }
  }

  const handleLanguageChange = (lang: Language) => {
    telegram.haptic.selection()
    setLanguage(lang)
    saveLanguage(lang)
  }

  const theme = createAppTheme(themeMode)

  if (!telegram.isTelegramReady) {
    return null
  }

  if (accessCheckLoading) {
    return null
  }

  if (!telegram.isTelegram) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            background: (currentTheme) => currentTheme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            py: 4
          }}
        >
          <Container maxWidth="sm">
            <Card
              sx={{
                background: (currentTheme) => currentTheme.palette.mode === 'dark'
                  ? 'rgba(30, 30, 30, 0.95)'
                  : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                <Typography variant="h5" align="center" sx={{ fontWeight: 800, mb: 2 }}>
                  Bu ilova faqat Telegram Mini App orqali ishlaydi
                </Typography>
                <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 3 }}>
                  Oddiy websaytdan foydalanish yopilgan. Iltimos, Telegram bot ichidan Mini App'ni oching.
                </Typography>
                <Box
                  sx={{
                    mb: 3,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'action.hover'
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    Telegram ma'lumotlari
                  </Typography>
                  {ADMIN_CONTACTS.map((admin) => (
                    <Typography key={admin.username} variant="body2" sx={{ mb: 0.5 }}>
                      Admin: @{admin.username}
                    </Typography>
                  ))}
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Telegram Kanal: {CONTACT_INFO.telegramChannel.name}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Telegram Bot: {CONTACT_INFO.telegramBot.name}
                  </Typography>
                  <Typography variant="body2">
                    Email: {CONTACT_INFO.email.address}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    href={CONTACT_INFO.telegramBot.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Telegram orqali ochish
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Container>
        </Box>
      </ThemeProvider>
    )
  }

  if (!hasValidAccessToken && !isAdmin) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            background: (currentTheme) => currentTheme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            py: 4
          }}
        >
          <Container maxWidth="sm">
            <Card
              sx={{
                background: (currentTheme) => currentTheme.palette.mode === 'dark'
                  ? 'rgba(30, 30, 30, 0.95)'
                  : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                <Typography variant="h5" align="center" sx={{ fontWeight: 800, mb: 2 }}>
                  Ro&apos;yxatdan o&apos;tmagansiz
                </Typography>
                <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 3 }}>
                  Siz uchun aktiv kirish tokeni topilmadi. Iltimos, ro&apos;yxatdan o&apos;tish uchun admin bilan bog&apos;laning.
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'center' }}>
                  {ADMIN_CONTACTS.map((admin) => (
                    <Button
                      key={admin.username}
                      variant="contained"
                      href={admin.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Murojaat qilish @{admin.username}
                    </Button>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Container>
        </Box>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar
          themeMode={themeMode}
          language={language}
          onThemeToggle={handleThemeToggle}
          onLanguageChange={handleLanguageChange}
          onTitleClick={handleBackToStart}
          onViewFormats={currentPage === 'start' ? handleViewFormats : undefined}
          onViewAdminToken={isAdmin ? handleViewAdminToken : undefined}
          onViewAdminUsers={isAdmin ? handleViewAdminUsers : undefined}
        />
        <Box sx={{ flexGrow: 1 }}>
          <ResumeModal
            open={showResumeModal}
            onResume={handleResumeQuiz}
            onNew={handleNewQuiz}
          />
          {currentPage === 'start' && (
            <StartPage 
              onStart={handleStartQuiz} 
              onViewAllQuestions={handleViewAllQuestions}
              telegramUserName={telegram.userInfo?.firstName}
            />
          )}
          {currentPage === 'formats' && (
            <TestFormatsPage onBack={handleBackFromFormats} />
          )}
          {currentPage === 'admin-token' && isAdmin && (
            <AdminTokenPage
              onBack={handleBackToStart}
              createdByTelegramUserId={telegram.userInfo?.id}
              createdByName={
                telegram.userInfo?.firstName ||
                telegram.userInfo?.username ||
                'Admin'
              }
            />
          )}
          {currentPage === 'admin-users' && isAdmin && (
            <AdminUsersPage onBack={handleBackToStart} />
          )}
          {currentPage === 'questions' && (
            <AllQuestionsPage questions={allQuestions} onBack={handleBackFromQuestions} />
          )}
          {currentPage === 'test' && quizData && (
            <TestPage
              quizData={quizData}
              onComplete={handleTestComplete}
              onUpdateData={setQuizData}
            />
          )}
          {currentPage === 'results' && quizData && quizData.results && (
            <ResultsPage
              results={quizData.results}
              totalQuestions={quizData.selectedQuestions?.length || 0}
              nextStartIndex={quizData.results?.nextStartIndex}
              questions={quizData.selectedQuestions}
              answers={quizData.answers}
              onRestart={handleRestart}
              onNextTest={handleNextTest}
              onRetakeIncorrect={handleRetakeIncorrect}
              onBackToStart={handleBackToStart}
            />
          )}
        </Box>
        <InstallPrompt />
      </Box>
    </ThemeProvider>
  )
}

export default App
