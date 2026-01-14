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
  Pagination,
  Slide,
  AppBar,
  Toolbar
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

const QUESTIONS_PER_PAGE = 20

export default function AllQuestionsPage({ questions: propsQuestions, onBack }: AllQuestionsPageProps) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedQuestion, setExpandedQuestion] = useState<number | false>(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [showStickySearch, setShowStickySearch] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  
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

  // Pagination - always show pagination if there are filtered results
  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / QUESTIONS_PER_PAGE))
  const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE
  const endIndex = startIndex + QUESTIONS_PER_PAGE
  const paginatedQuestions = filteredQuestions.slice(startIndex, endIndex)

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  // Reset page if current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

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
          sx={{
            top: 64,
            bgcolor: (theme) => theme.palette.mode === 'dark'
              ? 'rgba(30, 30, 30, 0.98)'
              : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)',
            boxShadow: (theme) => theme.palette.mode === 'dark'
              ? '0 2px 8px rgba(0, 0, 0, 0.3)'
              : '0 2px 8px rgba(0, 0, 0, 0.1)',
            zIndex: 1100,
          }}
        >
          <Toolbar sx={{ justifyContent: 'center', py: 1 }}>
            <Container maxWidth="lg" sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
                {searchQuery && (
                  <Chip 
                    label={`${t('questions.found')}: ${filteredQuestions.length}`}
                    color="secondary"
                    variant="filled"
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                )}
                {totalPages > 1 && (
                  <Chip 
                    label={`${t('questions.page')} ${currentPage} / ${totalPages}`}
                    color="info"
                    variant="outlined"
                    size="small"
                    sx={{ fontWeight: 600 }}
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
                  minWidth: { xs: 200, sm: 300 },
                  maxWidth: { xs: 300, sm: 400 },
                }}
              />
            </Container>
          </Toolbar>
        </AppBar>
      </Slide>

      <Box
        sx={{
          minHeight: 'calc(100vh - 64px)',
          background: (theme) => theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          py: { xs: 2, sm: 3 },
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2 } }}>
          <Card
            ref={headerRef}
            sx={{
              background: (theme) => theme.palette.mode === 'dark'
                ? 'rgba(30, 30, 30, 0.95)'
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              mb: { xs: 2, sm: 3 }
            }}
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
                      fontWeight: 700,
                      background: (theme) => theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, #90caf9 0%, #f48fb1 100%)'
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
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
                      variant="filled"
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                    {searchQuery && (
                      <Chip 
                        label={`${t('questions.found')}: ${filteredQuestions.length}`}
                        color="secondary"
                        variant="filled"
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                    {totalPages > 1 && (
                      <Chip 
                        label={`${t('questions.page')} ${currentPage} / ${totalPages}`}
                        color="info"
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 600 }}
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
                    }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>

        {filteredQuestions.length === 0 ? (
          <Card
            sx={{
              background: (theme) => theme.palette.mode === 'dark'
                ? 'rgba(30, 30, 30, 0.95)'
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                {t('questions.noResults')}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 }, mb: { xs: 2, sm: 3 } }}>
              {paginatedQuestions.map(({ question, originalIndex }, index) => {
                const questionNumber = originalIndex + 1
                const displayIndex = startIndex + index + 1
                
                return (
                  <Accordion
                    key={`${originalIndex}-${searchQuery}`}
                    expanded={expandedQuestion === originalIndex}
                    onChange={handleAccordionChange(originalIndex)}
                    sx={{
                      background: (theme) => theme.palette.mode === 'dark'
                        ? 'rgba(30, 30, 30, 0.95)'
                        : 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      boxShadow: (theme) => theme.palette.mode === 'dark'
                        ? '0 2px 8px rgba(0, 0, 0, 0.3)'
                        : '0 2px 8px rgba(0, 0, 0, 0.1)',
                      borderRadius: 2,
                      mb: 1,
                      '&:before': {
                        display: 'none',
                      },
                      '&:hover': {
                        boxShadow: (theme) => theme.palette.mode === 'dark'
                          ? '0 4px 12px rgba(0, 0, 0, 0.4)'
                          : '0 4px 12px rgba(0, 0, 0, 0.15)',
                      },
                      transition: 'box-shadow 0.2s ease',
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMore sx={{ color: 'primary.main' }} />}
                      sx={{
                        px: { xs: 2, sm: 3 },
                        py: { xs: 1.5, sm: 2 },
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                          <Chip
                            label={`#${questionNumber}`}
                            color="primary"
                            size="small"
                            sx={{ 
                              minWidth: { xs: 45, sm: 55 },
                              fontWeight: 700,
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
                )
              })}
            </Box>
            
            {filteredQuestions.length > 0 && (
              <Card
                sx={{
                  background: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(30, 30, 30, 0.95)'
                    : 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: (theme) => theme.palette.mode === 'dark'
                    ? '0 2px 8px rgba(0, 0, 0, 0.3)'
                    : '0 2px 8px rgba(0, 0, 0, 0.1)',
                  mt: 2,
                }}
              >
                <CardContent sx={{ 
                  p: { xs: 2, sm: 3 }, 
                  display: 'flex', 
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'column',
                  gap: 2,
                }}>
                  {totalPages > 1 && (
                    <Pagination
                      count={totalPages}
                      page={currentPage}
                      onChange={(_, page) => setCurrentPage(page)}
                      color="primary"
                      size="large"
                      showFirstButton
                      showLastButton
                      sx={{
                        '& .MuiPaginationItem-root': {
                          fontSize: { xs: '0.875rem', sm: '1rem' },
                        },
                      }}
                    />
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                    {t('questions.showing')} {startIndex + 1} - {Math.min(endIndex, filteredQuestions.length)} {t('questions.of')} {filteredQuestions.length}
                    {searchQuery && ` (${t('questions.total')}: ${questions.length})`}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </Container>
    </Box>
    </>
  )
}
