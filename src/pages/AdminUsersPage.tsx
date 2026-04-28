import { useEffect, useState } from 'react'
import {
  Box,
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
import { DeleteOutline, Search } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { deleteJwtTokensByTelegramUserId, getJwtTokenUsers, type JwtTokenUserItem } from '../utils/firebase'

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
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null)

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

  const handleDeleteUser = async (user: JwtTokenUserItem) => {
    const shouldDelete = window.confirm(
      t('adminUsers.confirmDelete', {
        userId: user.telegramUserId,
        name: user.name || '-'
      })
    )
    if (!shouldDelete) return

    try {
      setDeletingUserId(user.telegramUserId)
      setError('')
      await deleteJwtTokensByTelegramUserId(user.telegramUserId)
      setUsers((prev) => prev.filter((item) => item.telegramUserId !== user.telegramUserId))
    } catch (deleteError) {
      console.error('Delete JWT user error:', deleteError)
      setError(t('adminUsers.errorDelete'))
    } finally {
      setDeletingUserId(null)
    }
  }

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        background: (theme) => theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: { xs: 1, sm: 2 },
        px: { xs: 1, sm: 2 }
      }}
    >
      <Box sx={{ width: '100%' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1.5,
            px: { xs: 0.5, sm: 1 }
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'common.white', fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
            {t('adminUsers.title')}
          </Typography>
          <Button variant="contained" size="small" onClick={onBack}>
            {t('adminUsers.back')}
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : users.length === 0 ? (
          <Alert severity="info" sx={{ mb: 1.5 }}>
            {t('adminUsers.empty')}
          </Alert>
        ) : (
          <Box>
            <TextField
              fullWidth
              placeholder={t('adminUsers.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(0)
              }}
              sx={{ mb: 1.5, bgcolor: 'background.paper', borderRadius: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                )
              }}
            />
            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{
                width: '100%',
                overflowX: 'auto',
                maxHeight: 'calc(100vh - 240px)'
              }}
            >
              <Table size="small" stickyHeader sx={{ minWidth: 780 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('adminUsers.columns.telegramUserId')}</TableCell>
                    <TableCell>{t('adminUsers.columns.name')}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{t('adminUsers.columns.createdBy')}</TableCell>
                    <TableCell align="right">{t('adminUsers.columns.tokenCount')}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{t('adminUsers.columns.lastTokenTime')}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{t('adminUsers.columns.expiresAt')}</TableCell>
                    <TableCell align="center">{t('adminUsers.columns.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedUsers.map((user) => (
                    <TableRow key={user.telegramUserId} hover>
                      <TableCell>{user.telegramUserId}</TableCell>
                      <TableCell>{user.name || '-'}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{user.createdBy || '-'}</TableCell>
                      <TableCell align="right">{user.tokenCount}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        {formatDateTime(user.lastCreatedAt, i18n.language, t('adminUsers.unknownTime'))}
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        {formatDateTime(user.expiresAt, i18n.language, t('adminUsers.unknownTime'))}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          color="error"
                          size="small"
                          variant="outlined"
                          startIcon={<DeleteOutline />}
                          onClick={() => handleDeleteUser(user)}
                          disabled={deletingUserId === user.telegramUserId}
                        >
                          {t('adminUsers.delete')}
                        </Button>
                      </TableCell>
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
              sx={{ bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}
            />
          </Box>
        )}
      </Box>
    </Box>
  )
}
