import { useEffect, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Container,
  Typography,
  Button,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination
} from '@mui/material'
import { Search } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { getJwtTokenUsers, type JwtTokenUserItem } from '../utils/firebase'

interface AdminUsersPageProps {
  onBack: () => void
}

const formatDateTime = (date: Date | null, locale: string, fallbackText: string): string => {
  if (!date) return fallbackText
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'uz-UZ', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

export default function AdminUsersPage({ onBack }: AdminUsersPageProps) {
  const { t, i18n } = useTranslation()
  const [users, setUsers] = useState<JwtTokenUserItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoading(true)
        const list = await getJwtTokenUsers()
        setUsers(list)
      } catch (loadError) {
        console.error('Load JWT users error:', loadError)
        setError(t('adminUsers.errorLoad'))
      } finally {
        setIsLoading(false)
      }
    }

    loadUsers()
  }, [])

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return true
    return (
      user.telegramUserId.toString().includes(query) ||
      user.name.toLowerCase().includes(query)
    )
  })

  const paginatedUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 128px)',
        display: 'flex',
        alignItems: 'center',
        background: (theme) => theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4
      }}
    >
      <Container maxWidth="md">
        <Card
          sx={{
            background: (theme) => theme.palette.mode === 'dark'
              ? 'rgba(30, 30, 30, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
            <Typography variant="h5" align="center" sx={{ mb: 2, fontWeight: 800 }}>
              {t('adminUsers.title')}
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : users.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                {t('adminUsers.empty')}
              </Alert>
            ) : (
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  placeholder={t('adminUsers.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setPage(0)
                  }}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    )
                  }}
                />
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('adminUsers.columns.telegramUserId')}</TableCell>
                        <TableCell>{t('adminUsers.columns.name')}</TableCell>
                        <TableCell>{t('adminUsers.columns.createdBy')}</TableCell>
                        <TableCell align="right">{t('adminUsers.columns.tokenCount')}</TableCell>
                        <TableCell>{t('adminUsers.columns.lastTokenTime')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedUsers.map((user) => (
                        <TableRow key={user.telegramUserId} hover>
                          <TableCell>{user.telegramUserId}</TableCell>
                          <TableCell>{user.name || '-'}</TableCell>
                          <TableCell>{user.createdBy || '-'}</TableCell>
                          <TableCell align="right">{user.tokenCount}</TableCell>
                          <TableCell>{formatDateTime(user.lastCreatedAt, i18n.language, t('adminUsers.unknownTime'))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={filteredUsers.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[5, 10, 20, 50]}
                  labelRowsPerPage={t('adminUsers.rowsPerPage')}
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
                />
              </Box>
            )}

            <Button fullWidth variant="text" onClick={onBack}>
              {t('adminUsers.back')}
            </Button>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}
