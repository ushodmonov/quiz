import { useState, useEffect, Fragment, useMemo } from 'react'
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  InputAdornment,
  Pagination,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  MenuItem,
  Select,
  InputLabel
} from '@mui/material'
import { CloudUpload, Description, Search, ExpandMore, Folder, FolderOpen, PlayArrow, FilterList, Download } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { parseTxtFile, parseDocxFile, isMultiSelect } from '../utils/fileParser'
import { selectQuestions } from '../utils/questionUtils'
import { clearProgress } from '../utils/storage'
import { loadTestCatalog, loadTestQuestions, type TestCatalogItem } from '../utils/testCatalog'
import type { QuizData, Question } from '../types'

interface StartPageProps {
  onStart: (data: QuizData) => void
  onViewAllQuestions?: (questions: Question[]) => void
}

export default function StartPage({ onStart, onViewAllQuestions }: StartPageProps) {
  const { t } = useTranslation()
  const [tabValue, setTabValue] = useState(1)
  const [files, setFiles] = useState<File[]>([])
  const [selectedTest, setSelectedTest] = useState<TestCatalogItem | null>(null)
  const [testCatalog, setTestCatalog] = useState<TestCatalogItem[]>([])
  const [startQuestion, setStartQuestion] = useState<string>('1')
  const [questionCount, setQuestionCount] = useState<string>('10')
  const [selectionMethod, setSelectionMethod] = useState<'sequential' | 'random'>('sequential')
  const [loading, setLoading] = useState(false)
  const [loadingCatalog, setLoadingCatalog] = useState(false)
  const [error, setError] = useState('')
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('')
  const [catalogPage, setCatalogPage] = useState(1)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [selectedInstitute, setSelectedInstitute] = useState<string>('')
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [selectedLanguage, setSelectedLanguage] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [allQuestions, setAllQuestions] = useState<Array<{ text: string; answers: Array<{ text: string; isCorrect: boolean }>; isMultiSelect?: boolean }>>([])

  const TESTS_PER_PAGE = 10

  const handleCategoryToggle = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const hasSubCatalogs = (test: TestCatalogItem): boolean => {
    return !!(test.sub_catalogs && test.sub_catalogs.length > 0) || !!(test.sub_catologs && test.sub_catologs.length > 0)
  }

  const getSubCatalogs = (test: TestCatalogItem): TestCatalogItem[] => {
    return test.sub_catalogs || test.sub_catologs || []
  }

  const formatTestInfo = (test: TestCatalogItem): string => {
    const parts: string[] = []
    if (test.institute) {
      parts.push(test.institute)
    }
    if (test.courses) {
      let coursesText = ''
      if (Array.isArray(test.courses)) {
        coursesText = test.courses.map(c => `${c}-kurs`).join(', ')
      } else {
        coursesText = `${test.courses}-kurs`
      }
      parts.push(coursesText)
    }
    if (test.semester) {
      parts.push(`${t('start.semester') || 'Semestr'}: ${test.semester}`)
    }
    if (test.years) {
      parts.push(test.years)
    }
    if (test.language) {
      let languageLabel = test.language
      if (test.language === 'uz') {
        languageLabel = t('start.filter.uzbek') || 'O\'zbekcha'
      } else if (test.language === 'ru') {
        languageLabel = t('start.filter.russian') || 'Ruscha'
      } else if (test.language === 'uz/ru') {
        languageLabel = t('start.filter.uzbekRussian') || 'O\'zbekcha/Ruscha'
      }
      parts.push(languageLabel)
    }
    return parts.join(' • ')
  }

  const formatTestSecondary = (test: TestCatalogItem): string => {
    return formatTestInfo(test)
  }

  /**
   * Check if file path is a local asset (not a URL)
   */
  const isLocalAsset = (path?: string): boolean => {
    if (!path) return false
    return !/^https?:\/\//i.test(path)
  }

  /**
   * Download local asset file
   */
  const handleDownloadFile = async (test: TestCatalogItem, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent test selection
    
    if (!test.path || !isLocalAsset(test.path)) {
      setError('Bu fayl yuklab olinmaydi (faqat lokal fayllar)')
      return
    }

    try {
      const baseUrl = import.meta.env.BASE_URL || '/'
      const finalBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
      const encodedPath = test.path
        .split('/')
        .map(segment => encodeURIComponent(segment))
        .join('/')
      const fileUrl = `${finalBaseUrl}assets/${encodedPath}`
      
      // Fetch the file
      const response = await fetch(fileUrl)
      if (!response.ok) {
        throw new Error(`Failed to load file: ${response.statusText}`)
      }

      // Get file content
      const blob = await response.blob()
      
      // Get filename from path
      const filename = test.path.split('/').pop() || test.name || 'file'
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      setError(`Fayl yuklab olishda xatolik: ${error.message}`)
    }
  }

  useEffect(() => {
    // Load test catalog when component mounts
    const loadCatalog = async () => {
      setLoadingCatalog(true)
      try {
        const catalog = await loadTestCatalog()
        setTestCatalog(catalog.tests)
      } catch (err) {
        console.error('Failed to load test catalog:', err)
      } finally {
        setLoadingCatalog(false)
      }
    }
    loadCatalog()
  }, [])

  // Get unique institutes and courses from catalog
  const uniqueInstitutes = useMemo(() => {
    const institutes = new Set<string>()
    testCatalog.forEach(test => {
      if (test.institute) {
        institutes.add(test.institute)
      }
    })
    return Array.from(institutes).sort()
  }, [testCatalog])

  const uniqueCourses = useMemo(() => {
    const courses = new Set<string>()
    testCatalog.forEach(test => {
      if (test.courses) {
        if (Array.isArray(test.courses)) {
          test.courses.forEach(c => courses.add(c.toString()))
        } else {
          courses.add(test.courses.toString())
        }
      }
    })
    return Array.from(courses).sort((a, b) => parseInt(a) - parseInt(b))
  }, [testCatalog])

  const uniqueLanguages = useMemo(() => {
    const languages = new Set<string>()
    testCatalog.forEach(test => {
      if (test.language) {
        languages.add(test.language)
      }
    })
    return Array.from(languages).sort()
  }, [testCatalog])

  // Filter catalog based on search query, institute, course, and language (including sub catalogs)
  const filteredCatalog = useMemo(() => {
    let filtered = testCatalog

    // Filter by institute
    if (selectedInstitute) {
      filtered = filtered.filter(test => test.institute === selectedInstitute)
    }

    // Filter by course
    if (selectedCourse) {
      filtered = filtered.filter(test => {
        if (!test.courses) return false
        if (Array.isArray(test.courses)) {
          return test.courses.some(c => c.toString() === selectedCourse)
        }
        return test.courses.toString() === selectedCourse
      })
    }

    // Filter by language
    if (selectedLanguage) {
      filtered = filtered.filter(test => test.language === selectedLanguage)
    }

    // Filter by search query
    if (catalogSearchQuery.trim()) {
    const query = catalogSearchQuery.toLowerCase()
    
    const matchesTest = (test: TestCatalogItem): boolean => {
      // Check courses field
      let coursesMatch = false
      if (test.courses) {
        if (Array.isArray(test.courses)) {
          coursesMatch = test.courses.some(c => 
            c.toString().toLowerCase().includes(query) || 
            `${c}-kurs`.toLowerCase().includes(query)
          )
        } else {
          const coursesStr = test.courses.toString().toLowerCase()
          coursesMatch = coursesStr.includes(query) || `${test.courses}-kurs`.toLowerCase().includes(query)
        }
      }
      
      return (
        (test.subject || test.name || '').toLowerCase().includes(query) ||
        (test.path && test.path.toLowerCase().includes(query)) ||
        (test.institute && test.institute.toLowerCase().includes(query)) ||
        (test.semester && test.semester.toString().toLowerCase().includes(query)) ||
        (test.years && test.years.toLowerCase().includes(query)) ||
        coursesMatch
      )
    }
    
      filtered = filtered.filter(test => {
      // Check main test
      const matchesMain = matchesTest(test)
      
      // Check sub catalogs
      const subCatalogs = getSubCatalogs(test)
      const hasMatchingSubs = subCatalogs.some(subTest => matchesTest(subTest))
      
      return matchesMain || hasMatchingSubs
    })
    }

    return filtered
  }, [testCatalog, catalogSearchQuery, selectedInstitute, selectedCourse, selectedLanguage])

  // Pagination for catalog
  const catalogTotalPages = Math.max(1, Math.ceil(filteredCatalog.length / TESTS_PER_PAGE))
  const catalogStartIndex = (catalogPage - 1) * TESTS_PER_PAGE
  const catalogEndIndex = catalogStartIndex + TESTS_PER_PAGE
  const paginatedCatalog = filteredCatalog.slice(catalogStartIndex, catalogEndIndex)

  // Reset page if current page is out of bounds
  useEffect(() => {
    if (catalogPage > catalogTotalPages && catalogTotalPages > 0) {
      setCatalogPage(catalogTotalPages)
    }
  }, [catalogPage, catalogTotalPages])

  // Reset to page 1 when search query or institute changes
  useEffect(() => {
    setCatalogPage(1)
  }, [catalogSearchQuery, selectedInstitute])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length === 0) return

    setFiles(selectedFiles)
    setSelectedTest(null)
    setError('')
    setLoading(true)

    try {
      const allQuestions: Question[] = []
      
      for (const selectedFile of selectedFiles) {
        let questions: Question[] = []
        
        const fileName = selectedFile.name.toLowerCase()
        if (fileName.endsWith('.txt')) {
          const text = await selectedFile.text()
          questions = parseTxtFile(text)
        } else if (fileName.endsWith('.docx')) {
          questions = await parseDocxFile(selectedFile)
        } else if (fileName.endsWith('.doc')) {
          // .doc files are not supported
          setError(t('start.error.oldDocFormat') || 'Eski .doc format qo\'llab-quvvatlanmaydi. Iltimos, faylni .docx formatiga o\'tkazing.')
          setLoading(false)
          return
        } else {
          setError(t('start.error.invalidFile'))
          setLoading(false)
          return
        }

        if (questions.length > 0) {
          const processedQuestions = questions.map(q => ({
            ...q,
            isMultiSelect: isMultiSelect(q)
          }))
          allQuestions.push(...processedQuestions)
        }
      }

      if (allQuestions.length === 0) {
        setError(t('start.error.noQuestions'))
        setLoading(false)
        return
      }

      setAllQuestions(allQuestions)
    } catch (err: any) {
      setError(t('start.error.noQuestions') + ': ' + (err.message || 'Noma\'lum xatolik'))
    } finally {
      setLoading(false)
    }
  }

  const handleTestSelect = async (test: TestCatalogItem) => {
    // If test has sub catalogs, load all sub catalogs
    if (hasSubCatalogs(test)) {
      const subCatalogs = getSubCatalogs(test)
      if (subCatalogs.length === 0) {
        return
      }

      setSelectedTest(test)
      setFiles([])
      setError('')
      setLoading(true)

      try {
        // Load questions from all sub catalogs
        const allQuestionsPromises = subCatalogs
          .filter(subTest => subTest.path)
          .map(subTest => loadTestQuestions(subTest.path!, subTest.fileType))
        
        const questionsArrays = await Promise.all(allQuestionsPromises)
        
        // Combine all questions from all sub catalogs
        const allLoadedQuestions = questionsArrays.flat()
        
        if (allLoadedQuestions.length === 0) {
          setError(t('start.error.noQuestions'))
          setLoading(false)
          return
        }

        const processedQuestions = allLoadedQuestions.map(q => ({
          ...q,
          isMultiSelect: isMultiSelect(q)
        }))

        setAllQuestions(processedQuestions)
      } catch (err: any) {
        setError('Testni yuklashda xatolik: ' + err.message)
      } finally {
        setLoading(false)
      }
      return
    }

    // Regular test without sub catalogs
    if (!test.path) {
      setError(t('start.error.noFileName') || 'Fayl nomi topilmadi')
      return
    }

    setSelectedTest(test)
    setFiles([])
    setError('')
    setLoading(true)

    try {
      const questions = await loadTestQuestions(test.path, test.fileType)
      
      if (questions.length === 0) {
        setError(t('start.error.noQuestions'))
        setLoading(false)
        return
      }

      const processedQuestions = questions.map(q => ({
        ...q,
        isMultiSelect: isMultiSelect(q)
      }))

      setAllQuestions(processedQuestions)
    } catch (err: any) {
      setError('Testni yuklashda xatolik: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStart = () => {
    if ((files.length === 0 && !selectedTest) || allQuestions.length === 0) {
      setError(t('start.error.fileRequired'))
      return
    }

    const startNum = parseInt(startQuestion) || 1
    const startIndex = startNum - 1
    if (startIndex < 0 || startIndex >= allQuestions.length) {
      setError(t('start.error.invalidStart'))
      return
    }

    const count = parseInt(questionCount) || 1
    if (count < 1 || startIndex + count > allQuestions.length) {
      setError(t('start.error.invalidCount') + `: ${allQuestions.length - startIndex}`)
      return
    }

    const selected = selectQuestions(allQuestions, startIndex, count, selectionMethod)
    
    const fileId = files.length > 0
      ? files.map(f => `${f.name}_${f.size}_${f.lastModified}`).join('|')
      : `${selectedTest?.id}_${selectedTest?.path}`

    const fileName = files.length > 0 
      ? files.map(f => f.name).join(', ')
      : (selectedTest?.name || 'Test')

    clearProgress()

    onStart({
      fileId,
      fileName,
      allQuestions,
      selectedQuestions: selected,
      startIndex,
      currentQuestionIndex: 0,
      selectionMethod,
      answers: {},
      score: { correct: 0, incorrect: 0 }
    })
  }

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 128px)',
        display: 'flex',
        alignItems: 'center',
        background: (theme) => theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="md" sx={{ px: { xs: 1, sm: 2 } }}>
        <Card
          sx={{
            background: (theme) => theme.palette.mode === 'dark'
              ? 'rgba(30, 30, 30, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom 
              align="center" 
              sx={{ 
                mb: { xs: 3, sm: 4 },
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
                background: (theme) => theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #90caf9 0%, #f48fb1 100%)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: 800,
              }}
            >
              {t('start.title')}
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Tabs 
                value={tabValue} 
                onChange={(_, newValue) => {
                  setTabValue(newValue)
                  setFiles([])
                  setSelectedTest(null)
                  setAllQuestions([])
                  setError('')
                }}
              >
                <Tab label={t('start.selectFile')} />
                <Tab label={t('start.selectFromCatalog')} />
              </Tabs>
            </Box>

            {tabValue === 0 && (
              <Box 
                sx={{ 
                  mb: { xs: 2, sm: 3 },
                  p: { xs: 2, sm: 3 },
                  border: '2px dashed',
                  borderColor: 'primary.main',
                  borderRadius: { xs: 2, sm: 3 },
                  bgcolor: 'action.hover',
                  transition: 'all 0.3s',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    bgcolor: 'action.selected',
                    transform: { xs: 'none', sm: 'scale(1.01)' },
                  },
                }}
              >
                <input
                  accept=".txt,.docx"
                  style={{ display: 'none' }}
                  id="file-upload"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  disabled={loading}
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="contained"
                    component="span"
                    startIcon={<CloudUpload />}
                    fullWidth
                    disabled={loading}
                    sx={{ 
                      py: { xs: 1.5, sm: 2 },
                      fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                    }}
                  >
                    {t('start.selectFile')}
                  </Button>
                </label>
                {files.length > 0 && (
                  <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
                      {files.map((file, index) => (
                        <Chip 
                          key={index}
                          label={file.name} 
                          color="primary" 
                          sx={{ fontSize: '0.9rem', fontWeight: 600 }}
                        />
                      ))}
                    </Box>
                    {allQuestions.length > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Chip 
                          label={`${t('start.totalQuestions')}: ${allQuestions.length}`} 
                          color="success"
                          sx={{ fontSize: '0.9rem', fontWeight: 600 }}
                        />
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            )}

            {tabValue === 1 && (
              <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                {loadingCatalog ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : testCatalog.length === 0 ? (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {t('start.noTestsAvailable')}
                  </Alert>
                ) : (
                  <>
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                      <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, fontWeight: 600 }}>
                        {t('start.selectFromCatalog')}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label={`${testCatalog.length} ${testCatalog.length === 1 ? t('start.test') : t('start.tests')}`}
                          color="primary"
                          variant="outlined"
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 600 }}
                        />
                        <Button
                          variant="outlined"
                          startIcon={<FilterList />}
                          onClick={() => setShowFilters(!showFilters)}
                          sx={{ 
                            minWidth: 'auto',
                            fontSize: { xs: '0.75rem', sm: '0.875rem' }
                          }}
                        >
                          {t('start.filter.title') || 'Filter'}
                        </Button>
                      </Box>
                    </Box>
                    
                    {/* Institute Tabs */}
                    {uniqueInstitutes.length > 0 && (
                      <Box sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs
                          value={selectedInstitute || 'all'}
                          onChange={(_, newValue) => {
                            setSelectedInstitute(newValue === 'all' ? '' : newValue)
                            setCatalogPage(1) // Reset to first page when tab changes
                          }}
                          variant="scrollable"
                          scrollButtons="auto"
                          sx={{
                            '& .MuiTab-root': {
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              minHeight: { xs: 40, sm: 48 },
                              textTransform: 'none',
                              fontWeight: 600,
                            }
                          }}
                        >
                          <Tab 
                            label={t('start.filter.all') || 'Barchasi'} 
                            value="all"
                          />
                          {uniqueInstitutes.map(institute => (
                            <Tab 
                              key={institute} 
                              label={institute} 
                              value={institute}
                            />
                          ))}
                        </Tabs>
                      </Box>
                    )}
                    
                    <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                        fullWidth
                        placeholder={t('start.searchTests') || 'Testlarni qidirish...'}
                        value={catalogSearchQuery}
                        onChange={(e) => setCatalogSearchQuery(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Search color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                      
                      {showFilters && (
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', pt: 1 }}>
                          
                          <FormControl sx={{ minWidth: { xs: '100%', sm: 200 } }}>
                            <InputLabel>{t('start.filter.course') || 'Kurs'}</InputLabel>
                            <Select
                              value={selectedCourse}
                              onChange={(e) => {
                                setSelectedCourse(e.target.value)
                                setCatalogPage(1) // Reset to first page when filter changes
                              }}
                              label={t('start.filter.course') || 'Kurs'}
                            >
                              <MenuItem value="">
                                <em>{t('start.filter.all') || 'Barchasi'}</em>
                              </MenuItem>
                              {uniqueCourses.map(course => (
                                <MenuItem key={course} value={course}>
                                  {course}-{t('start.filter.courseLabel') || 'kurs'}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          <FormControl sx={{ minWidth: { xs: '100%', sm: 200 } }}>
                            <InputLabel>{t('start.filter.language') || 'Til'}</InputLabel>
                            <Select
                              value={selectedLanguage}
                              onChange={(e) => {
                                setSelectedLanguage(e.target.value)
                                setCatalogPage(1) // Reset to first page when filter changes
                              }}
                              label={t('start.filter.language') || 'Til'}
                            >
                              <MenuItem value="">
                                <em>{t('start.filter.all') || 'Barchasi'}</em>
                              </MenuItem>
                              {uniqueLanguages.map(language => {
                                let label = language
                                if (language === 'uz') {
                                  label = t('start.filter.uzbek') || 'O\'zbekcha'
                                } else if (language === 'ru') {
                                  label = t('start.filter.russian') || 'Ruscha'
                                } else if (language === 'uz/ru') {
                                  label = t('start.filter.uzbekRussian') || 'O\'zbekcha/Ruscha'
                                }
                                return (
                                  <MenuItem key={language} value={language}>
                                    {label}
                                  </MenuItem>
                                )
                              })}
                            </Select>
                          </FormControl>
                        </Box>
                      )}
                    </Box>

                    {filteredCatalog.length === 0 ? (
                      <Alert severity="info">
                        {t('start.noTestsFound') || 'Testlar topilmadi'}
                      </Alert>
                    ) : (
                      <>
                        <Card variant="outlined">
                          <List>
                            {paginatedCatalog.map((test, index) => {
                              const hasSubs = hasSubCatalogs(test)
                              const subCatalogs = getSubCatalogs(test)
                              const isExpanded = expandedCategories.has(test.id)
                              
                              return (
                                <Fragment key={test.id}>
                                  {hasSubs ? (
                                    <>
                                      <Accordion 
                                        expanded={isExpanded}
                                        onChange={() => handleCategoryToggle(test.id)}
                                        sx={{ 
                                          boxShadow: 'none',
                                          '&:before': { display: 'none' },
                                          '&.Mui-expanded': { margin: 0 }
                                        }}
                                      >
                                        <AccordionSummary
                                          expandIcon={<ExpandMore />}
                                          sx={{ 
                                            px: 2,
                                            '&:hover': { bgcolor: 'action.hover' }
                                          }}
                                        >
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                            {isExpanded ? (
                                              <FolderOpen color="primary" fontSize="small" />
                                            ) : (
                                              <Folder color="primary" fontSize="small" />
                                            )}
                                            <ListItemText
                                              primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                  <span>{test.subject || test.name}</span>
                                                  {test.language && (
                                                    <Chip
                                                      label={
                                                        test.language === 'uz'
                                                          ? t('start.filter.uzbek') || 'O\'zbekcha'
                                                          : test.language === 'ru'
                                                          ? t('start.filter.russian') || 'Ruscha'
                                                          : test.language === 'uz/ru'
                                                          ? t('start.filter.uzbekRussian') || 'O\'zbekcha/Ruscha'
                                                          : test.language
                                                      }
                                                      size="small"
                                                      color="primary"
                                                      variant="outlined"
                                                      sx={{ fontSize: '0.7rem', height: 20 }}
                                                    />
                                                  )}
                                                </Box>
                                              }
                                              secondary={formatTestSecondary(test)}
                                            />
                                          </Box>
                                        </AccordionSummary>
                                        <AccordionDetails sx={{ p: 0, pt: 0 }}>
                                          {test.work_it_all === true && (
                                            <Box sx={{ bgcolor: 'action.hover', p: 1 }}>
                                              <Button
                                                variant="contained"
                                                size="small"
                                                startIcon={<PlayArrow />}
                                                onClick={() => handleTestSelect(test)}
                                                disabled={loading}
                                                fullWidth
                                                sx={{ mb: 1 }}
                                              >
                                                {t('start.loadAllSubTests') || 'Barcha sub-testlarni yuklash'}
                                              </Button>
                                            </Box>
                                          )}
                                          <List sx={{ bgcolor: 'action.hover' }}>
                                            {subCatalogs.map((subTest, subIndex) => (
                                              <Fragment key={subTest.id}>
                                                <ListItem disablePadding>
                                                  <ListItemButton
                                                    selected={selectedTest?.id === subTest.id}
                                                    onClick={() => handleTestSelect(subTest)}
                                                    disabled={loading}
                                                    sx={{ pl: 4 }}
                                                  >
                                                    <Box sx={{ mr: 1.5 }}>
                                                      <Description color="primary" />
                                                    </Box>
                                                    <ListItemText
                                                      primary={subTest.name}
                                                    />
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                                                      {isLocalAsset(subTest.path) && (
                                                        <Button
                                                          size="small"
                                                          variant="outlined"
                                                          onClick={(e) => handleDownloadFile(subTest, e)}
                                                          sx={{ minWidth: 'auto', px: 1 }}
                                                          title="Faylni yuklab olish"
                                                        >
                                                          <Download fontSize="small" />
                                                        </Button>
                                                      )}
                                                    </Box>
                                                  </ListItemButton>
                                                </ListItem>
                                                {subIndex < subCatalogs.length - 1 && <Divider />}
                                              </Fragment>
                                            ))}
                                          </List>
                                        </AccordionDetails>
                                      </Accordion>
                                    </>
                                  ) : (
                                    <ListItem disablePadding>
                                      <ListItemButton
                                        selected={selectedTest?.id === test.id}
                                        onClick={() => handleTestSelect(test)}
                                        disabled={loading || !test.path}
                                      >
                                        <Box sx={{ mr: 1.5 }}>
                                          <Description color="primary" />
                                        </Box>
                                        <ListItemText
                                          primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                              <span>{test.subject || test.name}</span>
                                              {test.language && (
                                                <Chip
                                                  label={
                                                    test.language === 'uz'
                                                      ? t('start.filter.uzbek') || 'O\'zbekcha'
                                                      : test.language === 'ru'
                                                      ? t('start.filter.russian') || 'Ruscha'
                                                      : test.language === 'uz/ru'
                                                      ? t('start.filter.uzbekRussian') || 'O\'zbekcha/Ruscha'
                                                      : test.language
                                                  }
                                                  size="small"
                                                  color="primary"
                                                  variant="outlined"
                                                  sx={{ fontSize: '0.7rem', height: 20 }}
                                                />
                                              )}
                                            </Box>
                                          }
                                          secondary={formatTestSecondary(test)}
                                        />
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                                          {isLocalAsset(test.path) && (
                                            <Button
                                              size="small"
                                              variant="outlined"
                                              onClick={(e) => handleDownloadFile(test, e)}
                                              sx={{ minWidth: 'auto', px: 1 }}
                                              title="Faylni yuklab olish"
                                            >
                                              <Download fontSize="small" />
                                            </Button>
                                          )}
                                        </Box>
                                      </ListItemButton>
                                    </ListItem>
                                  )}
                                  {index < paginatedCatalog.length - 1 && <Divider />}
                                </Fragment>
                              )
                            })}
                          </List>
                        </Card>
                        
                        {catalogTotalPages > 1 && (
                          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <Pagination
                              count={catalogTotalPages}
                              page={catalogPage}
                              onChange={(_, page) => setCatalogPage(page)}
                              color="primary"
                              size="small"
                              showFirstButton
                              showLastButton
                            />
                          </Box>
                        )}
                        
                        {filteredCatalog.length > TESTS_PER_PAGE && (
                          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              {t('start.showing') || 'Ko\'rsatilmoqda'}: {catalogStartIndex + 1}-{Math.min(catalogEndIndex, filteredCatalog.length)} {t('start.of') || 'dan'} {filteredCatalog.length}
                            </Typography>
                          </Box>
                        )}
                      </>
                    )}
                  </>
                )}
                {selectedTest && allQuestions.length > 0 && (
                  <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
                    <Chip 
                      label={selectedTest.name} 
                      color="primary" 
                      sx={{ fontSize: '0.9rem', fontWeight: 600 }}
                    />
                  </Box>
                )}
              </Box>
            )}

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {allQuestions.length > 0 && (
            <>
              <Box sx={{ mb: { xs: 1.5, sm: 2 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' }, color: 'text.secondary', fontWeight: 500 }}>
                  {t('start.totalQuestions')}: <strong style={{ color: 'inherit' }}>{allQuestions.length}</strong>
                </Typography>
                {onViewAllQuestions && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => onViewAllQuestions(allQuestions as Question[])}
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    {t('start.viewAllQuestions')}
                  </Button>
                )}
              </Box>
              <TextField
                fullWidth
                label={t('start.startQuestion')}
                type="number"
                value={startQuestion}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value
                  const numValue = Number(value)
                  if (value === '' || (!isNaN(numValue) && numValue >= 1 && numValue <= allQuestions.length)) {
                    setStartQuestion(value)
                    // Update questionCount max when startQuestion changes
                    const currentCount = parseInt(questionCount) || 1
                    const newMax = allQuestions.length - (numValue || 1) + 1
                    if (currentCount > newMax) {
                      setQuestionCount(newMax.toString())
                    }
                  }
                }}
                inputProps={{ min: 1, max: allQuestions.length }}
                sx={{ mb: { xs: 2, sm: 3 } }}
              />

              <TextField
                fullWidth
                label={t('start.questionCount')}
                type="number"
                value={questionCount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value
                  const startNum = parseInt(startQuestion) || 1
                  const maxAvailable = allQuestions.length - startNum + 1
                  if (value === '' || (!isNaN(Number(value)) && Number(value) >= 1 && Number(value) <= maxAvailable)) {
                    setQuestionCount(value)
                  }
                }}
                inputProps={{ min: 1, max: allQuestions.length - (parseInt(startQuestion) || 1) + 1 }}
                helperText={`${t('start.maxAvailable')}: ${allQuestions.length - (parseInt(startQuestion) || 1) + 1}`}
                sx={{ mb: { xs: 2, sm: 3 } }}
              />

              <FormControl component="fieldset" sx={{ mb: { xs: 2, sm: 3 } }}>
                <FormLabel component="legend" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  {t('start.selectionMethod')}
                </FormLabel>
                <RadioGroup
                  row={false}
                  sx={{
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 1, sm: 0 }
                  }}
                  value={selectionMethod}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectionMethod(e.target.value as 'sequential' | 'random')}
                >
                  <FormControlLabel 
                    value="sequential" 
                    control={<Radio size="small" />} 
                    label={t('start.sequential')}
                    sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                  />
                  <FormControlLabel 
                    value="random" 
                    control={<Radio size="small" />} 
                    label={t('start.random')}
                    sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                  />
                </RadioGroup>
              </FormControl>

              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleStart}
                disabled={loading}
                sx={{ 
                  py: { xs: 1.5, sm: 2 },
                  fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #5e35b1 100%)',
                  },
                }}
              >
                {t('start.startTest')}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
      </Container>
    </Box>
  )
}
