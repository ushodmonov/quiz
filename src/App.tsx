import { useState, useEffect, useCallback } from 'react'
import { ThemeProvider, CssBaseline, Box, Container, Card, CardContent, Typography, Button } from '@mui/material'
import { useTranslation } from 'react-i18next'
import StartPage from './pages/StartPage'
import TestPage from './pages/TestPage'
import ResultsPage from './pages/ResultsPage'
import AllQuestionsPage from './pages/AllQuestionsPage'
import TestFormatsPage from './pages/TestFormatsPage'
import AdminTokenPage from './pages/AdminTokenPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminReferralsPage from './pages/AdminReferralsPage'
import StatsPage from './pages/StatsPage'
import KonspektPage from './pages/KonspektPage'
import ResumeModal from './components/ResumeModal'
import AppBar from './components/AppBar'
import InstallPrompt from './components/InstallPrompt'
import { loadProgress, hasProgress, clearProgress, loadTheme, saveTheme, loadLanguage, saveLanguage, saveAllQuestions, loadAllQuestions, loadAccessJwt, saveAccessJwt, clearAccessJwt, isBrowserDevModeEnabled } from './utils/storage'
import { saveTestSession, isIndexedDBSupported } from './utils/indexedDb'
import { selectQuestions } from './utils/questionUtils'
import { createAppTheme, gmailColors } from './theme/theme'
import { useTelegramWebApp } from './hooks/useTelegramWebApp'
import { ADMIN_CONTACTS, CONTACT_INFO, isAdminTelegramUser, JWT_SECRET_KEY } from './constants/contact'
import { getJwtTokensByTelegramUserId } from './utils/firebase'
import { verifyJwtToken } from './utils/jwt'
import { processReferralAndRewards } from './utils/accessControl'
import { recordTestResult, recordActivity, recordDailyActivity, addWrongAnswersToSrs, recordSrsReview } from './utils/userStats'
import './i18n/config'
import type { QuizData, QuizResults, ThemeMode, Language, Question } from './types'

function App() {
  const { i18n } = useTranslation()
  const telegram = useTelegramWebApp()
  const [currentPage, setCurrentPage] = useState<'start' | 'test' | 'results' | 'questions' | 'formats' | 'admin-token' | 'admin-users' | 'admin-referrals' | 'stats' | 'konspekt'>('start')
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
      if (isBrowserDevModeEnabled()) {
        setHasValidAccessToken(true)
        setAccessCheckLoading(false)
        return
      }
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

      // Referral mukofotlari: chaqirilgan do'stga 6 soat trial, chaqirgan odamga +3 kun/chaqirish.
      // Token mintlab localStorage'ga saqlaydi — pastdagi tekshiruv ularni topadi. Offline'da jim o'tadi.
      try {
        await processReferralAndRewards(
          { id: telegramUserId, name: telegram.userInfo?.firstName || telegram.userInfo?.username },
          telegram.userInfo?.startParam
        )
      } catch (referralError) {
        console.warn('Referral processing skipped:', referralError)
      }

      try {
        const localToken = loadAccessJwt(telegramUserId)
        if (localToken) {
          const isLocalTokenValid = await verifyJwtToken(localToken, JWT_SECRET_KEY, telegramUserId)
          if (isLocalTokenValid) {
            setHasValidAccessToken(true)
            return
          }
          clearAccessJwt(telegramUserId)
        }

        const tokens = await getJwtTokensByTelegramUserId(telegramUserId, 20)
        if (tokens.length === 0) {
          setHasValidAccessToken(false)
          return
        }

        for (const token of tokens) {
          const isValid = await verifyJwtToken(token, JWT_SECRET_KEY, telegramUserId)
          if (isValid) {
            saveAccessJwt(telegramUserId, token)
            setHasValidAccessToken(true)
            return
          }
        }
        clearAccessJwt(telegramUserId)
        setHasValidAccessToken(false)
      } catch (error) {
        console.error('JWT access check failed:', error)
        setHasValidAccessToken(false)
      } finally {
        setAccessCheckLoading(false)
      }
    }

    checkTokenAccess()
  }, [telegram.isTelegramReady, telegram.isTelegram, telegram.userInfo?.id, isAdmin])

  const browserDevMode = isBrowserDevModeEnabled()

  const handleBackToStart = useCallback(() => {
    if (currentPage === 'test' || currentPage === 'results') {
      if (window.confirm('Testni tark etmoqchimisiz? Barcha progress yo\'qoladi.')) {
        // Save current session to IndexedDB before clearing
        if (quizData && isIndexedDBSupported()) {
          saveTestSession(quizData.fileId, {
            lastQuestionIndex: quizData.currentQuestionIndex,
            score: quizData.score,
            results: quizData.results
              ? {
                  correct: quizData.results.correct,
                  incorrect: quizData.results.incorrect,
                  total: quizData.results.total,
                  percentage: quizData.results.percentage,
                }
              : undefined,
            savedAt: Date.now(),
            // Only save resumeData if test is still in progress (not completed)
            resumeData: !quizData.results ? {
              selectedQuestions: quizData.selectedQuestions,
              startIndex: quizData.startIndex,
              currentQuestionIndex: quizData.currentQuestionIndex,
              answers: quizData.answers,
              score: quizData.score,
              selectionMethod: quizData.selectionMethod,
              displayMode: quizData.displayMode,
              endQuestionIndex: quizData.endQuestionIndex,
            } : undefined,
          }).catch(() => {})
        }
        clearProgress()
        setQuizData(null)
        setCurrentPage('start')
      }
    } else {
      setQuizData(null)
      setCurrentPage('start')
    }
  }, [currentPage, quizData])

  // Sync theme with Telegram if running in Telegram
  // This effect runs when Telegram colorScheme changes
  useEffect(() => {
    if (telegram.isTelegram && telegram.colorScheme) {
      const telegramTheme = telegram.colorScheme === 'dark' ? 'dark' : 'light'
      // Only sync if theme actually changed in Telegram
      if (telegramTheme !== themeMode) {
        setThemeMode(telegramTheme)
        saveTheme(telegramTheme)
        const c = gmailColors[telegramTheme]
        telegram.setHeaderColor(c.headerBar)
        telegram.setBackgroundColor(c.background)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telegram.colorScheme]) // Only depend on colorScheme to avoid infinite loop

  // Set Telegram header and background colors
  useEffect(() => {
    if (telegram.isTelegram) {
      const c = gmailColors[themeMode]
      telegram.setHeaderColor(c.headerBar)
      telegram.setBackgroundColor(c.background)
    }
  }, [telegram.isTelegram, themeMode, telegram])

  // Handle Telegram back button
  // Destructure stable references to avoid re-running on every render
  const { isTelegram, showBackButton, hideBackButton, haptic } = telegram
  useEffect(() => {
    if (!isTelegram) return

    let cleanup: (() => void) | undefined

    if (currentPage === 'test' || currentPage === 'results' || currentPage === 'questions' || currentPage === 'formats' || currentPage === 'admin-token' || currentPage === 'admin-users' || currentPage === 'admin-referrals' || currentPage === 'stats' || currentPage === 'konspekt') {
      cleanup = showBackButton(() => {
        haptic.impact('light')
        handleBackToStart()
      })
    } else {
      hideBackButton()
    }

    return () => {
      if (cleanup) cleanup()
    }
  }, [currentPage, isTelegram, showBackButton, hideBackButton, haptic, handleBackToStart])

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

  const handleTestComplete = (results: QuizResults, patch?: Partial<QuizData>) => {
    if (quizData) {
      telegram.haptic.notification('success')

      // Save completed session to IndexedDB
      if (isIndexedDBSupported()) {
        saveTestSession(quizData.fileId, {
          lastQuestionIndex: quizData.currentQuestionIndex,
          score: quizData.score,
          results: {
            correct: results.correct,
            incorrect: results.incorrect,
            total: results.total,
            percentage: results.percentage,
          },
          savedAt: Date.now(),
        }).catch(() => {})
      }
      
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
      
      // Normal completion - show results (patch: all-mode grading yozilgan javoblar)
      const finalData: QuizData = { ...quizData, ...patch, results }

      // —— Statistika / streak / SRS qaydlari ——
      try {
        recordActivity() // streak — barcha test turlari uchun
        recordDailyActivity(results.total) // kunlik faollik (heatmap)
        if (finalData.quizKind === 'srs') {
          // Takrorlash testi: har bir savol bo'yicha Leitner qutilarini yangilaymiz
          finalData.selectedQuestions.forEach((q, i) => {
            if (q.sourceKey) recordSrsReview(q.sourceKey, !!finalData.answers[i]?.correct)
          })
        } else {
          // Oddiy yoki bookmark testi: statistikaga yozamiz va xatolarni SRS'ga qo'shamiz
          recordTestResult({
            fileId: finalData.fileId,
            fileName: finalData.fileName,
            correct: results.correct,
            incorrect: results.incorrect,
            total: results.total,
            percentage: results.percentage,
          })
          addWrongAnswersToSrs(
            finalData.fileId,
            finalData.fileName,
            finalData.selectedQuestions,
            finalData.answers
          )
        }
      } catch (e) {
        console.warn('Statistika qayd etilmadi:', e)
      }

      setQuizData(finalData)
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

  const handleViewAdminReferrals = () => {
    setCurrentPage('admin-referrals')
  }

  const handleViewStats = () => {
    telegram.haptic.impact('light')
    setCurrentPage('stats')
  }

  const handleBackFromStats = () => {
    setCurrentPage('start')
  }

  const handleViewKonspekt = () => {
    telegram.haptic.impact('light')
    setCurrentPage('konspekt')
  }

  // SRS takrorlash / bookmark testlarini ishga tushirish (savollar ro'yxati tayyor)
  const handleStartCustomQuiz = (
    questions: Question[],
    fileName: string,
    kind: 'srs' | 'bookmark'
  ) => {
    if (questions.length === 0) return
    telegram.haptic.impact('medium')
    clearProgress()
    const fileId = kind === 'srs' ? 'srs_review' : 'bookmark_quiz'
    setQuizData({
      fileId,
      fileName,
      allQuestions: questions,
      selectedQuestions: questions,
      startIndex: 0,
      currentQuestionIndex: 0,
      selectionMethod: 'sequential',
      answers: {},
      score: { correct: 0, incorrect: 0 },
      displayMode: 'single',
      quizKind: kind,
    })
    setCurrentPage('test')
  }

  const handleThemeToggle = () => {
    telegram.haptic.selection()
    const newMode = themeMode === 'light' ? 'dark' : 'light'
    setThemeMode(newMode)
    saveTheme(newMode)

    if (telegram.isTelegram) {
      const c = gmailColors[newMode]
      telegram.setHeaderColor(c.headerBar)
      telegram.setBackgroundColor(c.background)
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

  if (!telegram.isTelegram && !browserDevMode) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'background.default',
            py: 4
          }}
        >
          <Container maxWidth="sm">
            <Card>
              <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                <Typography variant="h5" align="center" sx={{ fontWeight: 500, mb: 2 }}>
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
            bgcolor: 'background.default',
            py: 4
          }}
        >
          <Container maxWidth="sm">
            <Card>
              <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                <Typography variant="h5" align="center" sx={{ fontWeight: 500, mb: 2 }}>
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
          onViewStats={currentPage === 'start' ? handleViewStats : undefined}
          onViewKonspekt={currentPage === 'start' ? handleViewKonspekt : undefined}
          onViewAdminToken={isAdmin ? handleViewAdminToken : undefined}
          onViewAdminUsers={isAdmin ? handleViewAdminUsers : undefined}
          onViewAdminReferrals={isAdmin ? handleViewAdminReferrals : undefined}
        />
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0
          }}
        >
          <ResumeModal
            open={showResumeModal}
            onResume={handleResumeQuiz}
            onNew={handleNewQuiz}
          />
          {currentPage === 'start' && (
            <StartPage
              onStart={handleStartQuiz}
              onViewAllQuestions={handleViewAllQuestions}
              onViewStats={handleViewStats}
            />
          )}
          {currentPage === 'stats' && (
            <StatsPage
              onBack={handleBackFromStats}
              onStartCustomQuiz={handleStartCustomQuiz}
              telegramUserId={telegram.userInfo?.id}
              telegramUserName={telegram.userInfo?.firstName || telegram.userInfo?.username}
            />
          )}
          {currentPage === 'formats' && (
            <TestFormatsPage onBack={handleBackFromFormats} />
          )}
          {currentPage === 'konspekt' && (
            <KonspektPage onBack={handleBackFromStats} />
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
          {currentPage === 'admin-referrals' && isAdmin && (
            <AdminReferralsPage onBack={handleBackToStart} />
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
              displayMode={quizData.displayMode}
              startIndex={quizData.startIndex}
              testName={quizData.fileName}
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
