import { useState, useEffect } from 'react'
import { ThemeProvider, CssBaseline, Box } from '@mui/material'
import { useTranslation } from 'react-i18next'
import StartPage from './pages/StartPage'
import TestPage from './pages/TestPage'
import ResultsPage from './pages/ResultsPage'
import AllQuestionsPage from './pages/AllQuestionsPage'
import TestFormatsPage from './pages/TestFormatsPage'
import ResumeModal from './components/ResumeModal'
import AppBar from './components/AppBar'
import { loadProgress, hasProgress, clearProgress, loadTheme, saveTheme, loadLanguage, saveLanguage, saveAllQuestions, loadAllQuestions } from './utils/storage'
import { selectQuestions } from './utils/questionUtils'
import { createAppTheme } from './theme/theme'
import './i18n/config'
import type { QuizData, QuizResults, ThemeMode, Language, Question } from './types'

function App() {
  const { i18n } = useTranslation()
  const [currentPage, setCurrentPage] = useState<'start' | 'test' | 'results' | 'questions' | 'formats'>('start')
  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [showResumeModal, setShowResumeModal] = useState(false)
  const [themeMode, setThemeMode] = useState<ThemeMode>(loadTheme())
  const [language, setLanguage] = useState<Language>(loadLanguage())

  useEffect(() => {
    i18n.changeLanguage(language)
  }, [language, i18n])

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
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [currentPage])

  const handleStartQuiz = (data: QuizData) => {
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
      const remainingCount = quizData.allQuestions.length - nextStart
      const questionCount = Math.min(quizData.selectedQuestions?.length || 10, remainingCount)
      
      if (questionCount <= 0) {
        return
      }
      
      const selected = selectQuestions(
        quizData.allQuestions,
        nextStart,
        questionCount,
        quizData.selectionMethod || 'sequential'
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

  const handleViewAllQuestions = (questions: Question[]) => {
    // Save questions to localStorage
    saveAllQuestions(questions)
    // Open in new tab
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

  const handleThemeToggle = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light'
    setThemeMode(newMode)
    saveTheme(newMode)
  }

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
    saveLanguage(lang)
  }

  const theme = createAppTheme(themeMode)

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
            />
          )}
          {currentPage === 'formats' && (
            <TestFormatsPage onBack={handleBackFromFormats} />
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
              onBackToStart={handleBackToStart}
            />
          )}
        </Box>
      </Box>
    </ThemeProvider>
  )
}

export default App
