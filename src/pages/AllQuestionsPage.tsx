import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Box,
  InputAdornment,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Slide,
  AppBar,
  Toolbar,
  Fade,
  CircularProgress
} from '@mui/material'
import { Search, ExpandMore, ArrowBack } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import QuestionDisplay from '../components/QuestionDisplay'
import { loadAllQuestions } from '../utils/storage'
import { isTelegramWebApp } from '../utils/telegramWebApp'
import type { Question } from '../types'

interface AllQuestionsPageProps {
  questions: Question[]
  onBack: () => void
}

const QUESTIONS_PER_BATCH = 20

export default function AllQuestionsPage({ questions: propsQuestions, onBack }: AllQuestionsPageProps) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedQuestion, setExpandedQuestion] = useState<number | false>(false)
  const [loadedCount, setLoadedCount] = useState(QUESTIONS_PER_BATCH)
  const [showStickySearch, setShowStickySearch] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  
  // Load questions from localStorage if propsQuestions is empty (for new tab scenario)
  const [questions] = useState<Question[]>(() => {
    if (propsQuestions && propsQuestions.length > 0) {
      return propsQuestions
    }
    const savedQuestions = loadAllQuestions()
    return savedQuestions || []
  })

  // Filter questions based on search query
  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) {
      return questions.map((q, index) => ({ question: q, originalIndex: index }))
    }
    
    const query = searchQuery.toLowerCase().trim()
    return questions
      .map((question, index) => ({ question, originalIndex: index }))
      .filter(({ question, originalIndex }) => {
        // Search in question text
        const questionText = question.text.toLowerCase().replace(/<[^>]*>/g, '')
        if (questionText.includes(query)) {
          return true
        }
        
        // Search in answers
        const answerTexts = question.answers.map(a => a.text.toLowerCase().replace(/<[^>]*>/g, '')).join(' ')
        if (answerTexts.includes(query)) {
          return true
        }
        
        // Search by question number
        if ((originalIndex + 1).toString().includes(query)) {
          return true
        }
        
        return false
      })
  }, [questions, searchQuery])

  // Infinite scroll: take the first `loadedCount` filtered questions
  const visibleQuestions = filteredQuestions.slice(0, loadedCount)
  const hasMore = loadedCount < filteredQuestions.length

  // Reset infinite scroll when filter changes
  useEffect(() => {
    setLoadedCount(QUESTIONS_PER_BATCH)
  }, [searchQuery])

  // IntersectionObserver — load next batch when the sentinel becomes visible
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setLoadedCount((prev) => Math.min(prev + QUESTIONS_PER_BATCH, filteredQuestions.length))
        }
      },
      { rootMargin: '400px 0px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, filteredQuestions.length])

  // Handle scroll to show/hide sticky search
  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        const headerBottom = headerRef.current.getBoundingClientRect().bottom
        setShowStickySearch(headerBottom < 0)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleAccordionChange = (questionIndex: number) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedQuestion(isExpanded ? questionIndex : false)
  }

  return (
    <>
      {/* Sticky Search Bar */}
      <Slide direction="down" in={showStickySearch} mountOnEnter unmountOnExit>
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            top: 64,
            bgcolor: 'background.paper',
            color: 'text.primary',
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            boxShadow: (theme) =>
              theme.palette.mode === 'dark'
                ? '0 2px 6px rgba(0,0,0,0.4)'
                : '0 1px 3px rgba(60,64,67,0.08)',
            zIndex: 1100,
          }}
        >
          <Toolbar sx={{ justifyContent: 'center', py: 1, minHeight: { xs: 52, sm: 56 } }}>
            <Container maxWidth="lg" sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
                <Chip
                  label={`${t('questions.total')}: ${questions.length}`}
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ fontWeight: 500 }}
                />
                {searchQuery && (
                  <Chip
                    label={`${t('questions.found')}: ${filteredQuestions.length}`}
                    color="secondary"
                    variant="filled"
                    size="small"
                    sx={{ fontWeight: 500 }}
                  />
                )}
              </Box>
              <TextField
                placeholder={t('questions.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  minWidth: { xs: 180, sm: 280 },
                  maxWidth: { xs: 260, sm: 380 },
                }}
              />
            </Container>
          </Toolbar>
        </AppBar>
      </Slide>

      <Box
        sx={{
          minHeight: 'calc(100vh - 64px)',
          bgcolor: 'background.default',
          py: { xs: 2, sm: 3 },
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2 } }}>
          <Card
            ref={headerRef}
            sx={{ mb: { xs: 2, sm: 3 } }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              {/* Header Section */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <IconButton 
                    onClick={() => {
                      // In Telegram Mini App, always use callback (same tab)
                      if (isTelegramWebApp()) {
                        onBack()
                        return
                      }
                      
                      // If opened in new tab, try to close it
                      if (window.opener && !window.opener.closed) {
                        // Try to close the window
                        window.close()
                        // If close() doesn't work (blocked by browser), navigate parent window
                        setTimeout(() => {
                          if (!window.closed && window.opener && !window.opener.closed) {
                            try {
                              // Navigate parent window back to start (remove hash)
                              const baseUrl = window.opener.location.origin + window.opener.location.pathname
                              window.opener.location.href = baseUrl
                            } catch (e) {
                              // Cross-origin error - can't access parent location
                              // Just try to close again
                              window.close()
                            }
                          }
                        }, 100)
                      } else {
                        // Same tab - navigate back
                        if (window.location.hash === '#questions') {
                          // Remove hash to trigger hashchange event
                          const baseUrl = window.location.origin + window.location.pathname
                          window.location.href = baseUrl
                        } else {
                          // Use callback
                          onBack()
                        }
                      }
                    }} 
                    color="primary" 
                    sx={{ 
                      bgcolor: 'action.hover',
                      '&:hover': {
                        bgcolor: 'action.selected',
                      }
                    }}
                  >
                    <ArrowBack />
                  </IconButton>
                  <Typography
                    variant="h4"
                    sx={{
                      fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                      fontWeight: 500,
                      color: 'primary.main',
                      flex: 1,
                    }}
                  >
                    {t('questions.allQuestions')}
                  </Typography>
                </Box>
                
                {/* Stats and Search Row */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { xs: 'stretch', sm: 'center' } }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Chip
                      label={`${t('questions.total')}: ${questions.length}`}
                      color="primary"
                      variant="outlined"
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                    {searchQuery && (
                      <Chip
                        label={`${t('questions.found')}: ${filteredQuestions.length}`}
                        color="secondary"
                        variant="filled"
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    )}
                  </Box>

                  <TextField
                    fullWidth={false}
                    placeholder={t('questions.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      minWidth: { xs: '100%', sm: 250 },
                      maxWidth: { xs: '100%', sm: 400 },
                      ml: { xs: 0, sm: 'auto' },
                    }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>

        {filteredQuestions.length === 0 ? (
          <Card>
            <CardContent sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                {t('questions.noResults')}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1, sm: 1.25 }, mb: { xs: 2, sm: 3 } }}>
              {visibleQuestions.map(({ question, originalIndex }, index) => {
                const questionNumber = originalIndex + 1
                const displayIndex = index + 1

                return (
                  <Fade in timeout={250} key={`${originalIndex}-${searchQuery}`}>
                  <Accordion
                    expanded={expandedQuestion === originalIndex}
                    onChange={handleAccordionChange(originalIndex)}
                    elevation={0}
                    disableGutters
                    sx={{
                      bgcolor: 'background.paper',
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                      borderRadius: 2,
                      overflow: 'hidden',
                      '&:before': { display: 'none' },
                      '&.Mui-expanded': {
                        borderColor: 'primary.main',
                      },
                      transition: 'border-color 0.2s ease',
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMore sx={{ color: 'text.secondary' }} />}
                      sx={{
                        px: { xs: 1.5, sm: 2.5 },
                        py: { xs: 0.5, sm: 1 },
                        '&:hover': { bgcolor: 'action.hover' },
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.25, sm: 2 }, width: '100%', pr: 1 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                          <Chip
                            label={`#${questionNumber}`}
                            color="primary"
                            variant="outlined"
                            size="small"
                            sx={{
                              minWidth: { xs: 42, sm: 52 },
                              fontWeight: 500,
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            }}
                          />
                          {searchQuery && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                              {displayIndex}
                            </Typography>
                          )}
                        </Box>
                        <Typography
                          variant="body1"
                          sx={{
                            flex: 1,
                            fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
                            fontWeight: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            color: 'text.primary',
                            lineHeight: 1.5,
                          }}
                        >
                          {question.text.replace(/<[^>]*>/g, '').substring(0, 150)}
                          {question.text.replace(/<[^>]*>/g, '').length > 150 ? '...' : ''}
                        </Typography>
                        <Box sx={{ 
                          display: { xs: 'none', sm: 'flex' }, 
                          gap: 0.5, 
                          ml: 'auto',
                          alignItems: 'center',
                        }}>
                          <Chip
                            label={`${question.answers.filter(a => a.isCorrect).length}/${question.answers.length}`}
                            size="small"
                            color="success"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 24 }}
                          />
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ 
                      px: { xs: 2, sm: 3 }, 
                      pb: { xs: 2, sm: 3 },
                      pt: { xs: 1, sm: 2 },
                      borderTop: (theme) => `1px solid ${theme.palette.divider}`,
                    }}>
                      <Box>
                      <QuestionDisplay
                        question={question}
                        selectedAnswers={
                          // For matching questions, show correct matches
                          // selectedAnswers[leftIndex] = rightIndex format (rightIndex is absolute index)
                          question.isMatching
                            ? (() => {
                                const leftAnswers = question.answers.filter(a => a.isLeftColumn)
                                const result: number[] = []
                                leftAnswers.forEach((leftAnswer, leftIdx) => {
                                  // Use first variant if available, otherwise use matchIndex
                                  if (leftAnswer.matchVariants && leftAnswer.matchVariants.length > 0) {
                                    // Use first variant
                                    const firstVariant = leftAnswer.matchVariants[0]
                                    if (firstVariant[leftIdx] !== undefined) {
                                      result[leftIdx] = firstVariant[leftIdx]
                                    }
                                  } else if (leftAnswer.matchIndex !== undefined && leftAnswer.matchIndex >= 0) {
                                    // Fallback to matchIndex for backward compatibility
                                    result[leftIdx] = leftAnswer.matchIndex
                                  }
                                })
                                return result
                              })()
                            : question.isSequence
                            ? (() => {
                                // Create array with correct order
                                const sorted = question.answers
                                  .map((answer, index) => ({ answer, index }))
                                  .sort((a, b) => (a.answer.orderNumber || 0) - (b.answer.orderNumber || 0))
                                // Create array where position = answerIndex
                                const result: number[] = []
                                sorted.forEach(({ index }) => {
                                  const position = (question.answers[index].orderNumber || 0) - 1 // Convert to 0-based
                                  result[position] = index
                                })
                                return result
                              })()
                            : []
                        }
                        isAnswered={true}
                        isCorrect={true}
                        onAnswerSelect={() => {}}
                        onSequenceSelect={() => {}}
                        onMatchingSelect={() => {}}
                        questionNumber={questionNumber}
                        showAlert={false}
                      />
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                  </Fade>
                )
              })}
            </Box>

            {/* Infinity scroll sentinel + loading indicator */}
            {hasMore && (
              <Box
                ref={sentinelRef}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  py: 3,
                  minHeight: 80,
                }}
              >
                <CircularProgress size={28} thickness={4} />
              </Box>
            )}

            {!hasMore && filteredQuestions.length > 0 && (
              <Box sx={{ py: { xs: 2, sm: 3 }, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  {t('questions.showing')} {visibleQuestions.length} {t('questions.of')} {filteredQuestions.length}
                  {searchQuery && ` (${t('questions.total')}: ${questions.length})`}
                </Typography>
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
    </>
  )
}
