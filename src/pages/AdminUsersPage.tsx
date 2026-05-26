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
  TablePagination,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Stack,
  useMediaQuery,
  useTheme
} from '@mui/material'
import { DeleteOutline, Search, ArrowBack, Refresh } from '@mui/icons-material'
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
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [users, setUsers] = useState<JwtTokenUserItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null)
  const [confirmUser, setConfirmUser] = useState<JwtTokenUserItem | null>(null)

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      setError('')
      const list = await getJwtTokenUsers()
      setUsers(list)
    } catch (loadError) {
      console.error('Load JWT users error:', loadError)
      setError(t('adminUsers.errorLoad'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
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

  const handleConfirmDelete = async () => {
    if (!confirmUser) return
    const user = confirmUser
    setConfirmUser(null)
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
        bgcolor: 'background.default',
        py: { xs: 1, sm: 2 },
        px: { xs: 1, sm: 2 }
      }}
    >
      <Box sx={{ width: '100%' }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ mb: 1.5, px: { xs: 0.5, sm: 1 } }}
        >
          <IconButton onClick={onBack} aria-label={t('adminUsers.back')} size="small">
            <ArrowBack />
          </IconButton>
          <Typography
            variant="h5"
            sx={{ flex: 1, fontWeight: 500, color: 'primary.main', fontSize: { xs: '1.1rem', sm: '1.5rem' } }}
          >
            {t('adminUsers.title')}
            {!isLoading && users.length > 0 && (
              <Typography component="span" variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
                ({users.length})
              </Typography>
            )}
          </Typography>
          <Tooltip title={t('adminUsers.refresh')}>
            <span>
              <IconButton onClick={loadUsers} disabled={isLoading} size="small">
                <Refresh />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>

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
            {filteredUsers.length === 0 ? (
              <Alert severity="info" sx={{ mb: 1.5 }}>
                {t('adminUsers.noSearchResults')}
              </Alert>
            ) : (
            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{
                width: '100%',
                overflowX: 'auto',
                maxHeight: 'calc(100vh - 240px)'
              }}
            >
              <Table size="small" stickyHeader sx={{ minWidth: { xs: 0, md: 780 } }}>
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
                      <TableCell>
                        <Box sx={{ fontWeight: 500 }}>{user.name || '-'}</Box>
                        <Box sx={{ display: { xs: 'block', md: 'none' }, fontSize: '0.7rem', color: 'text.secondary', mt: 0.25 }}>
                          {formatDateTime(user.expiresAt, i18n.language, t('adminUsers.unknownTime'))}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{user.createdBy || '-'}</TableCell>
                      <TableCell align="right">{user.tokenCount}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        {formatDateTime(user.lastCreatedAt, i18n.language, t('adminUsers.unknownTime'))}
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        {formatDateTime(user.expiresAt, i18n.language, t('adminUsers.unknownTime'))}
                      </TableCell>
                      <TableCell align="center">
                        {isMobile ? (
                          <Tooltip title={t('adminUsers.delete')}>
                            <span>
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => setConfirmUser(user)}
                                disabled={deletingUserId === user.telegramUserId}
                              >
                                {deletingUserId === user.telegramUserId ? (
                                  <CircularProgress size={18} color="inherit" />
                                ) : (
                                  <DeleteOutline />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                        ) : (
                          <Button
                            color="error"
                            size="small"
                            variant="outlined"
                            startIcon={
                              deletingUserId === user.telegramUserId ? (
                                <CircularProgress size={14} color="inherit" />
                              ) : (
                                <DeleteOutline />
                              )
                            }
                            onClick={() => setConfirmUser(user)}
                            disabled={deletingUserId === user.telegramUserId}
                          >
                            {t('adminUsers.delete')}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            )}
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

      <Dialog
        open={confirmUser !== null}
        onClose={() => setConfirmUser(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 500 }}>
          {t('adminUsers.delete')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmUser && t('adminUsers.confirmDelete', {
              userId: confirmUser.telegramUserId,
              name: confirmUser.name || '-'
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmUser(null)} color="inherit">
            {t('adminUsers.cancel') || 'Bekor qilish'}
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            startIcon={<DeleteOutline />}
          >
            {t('adminUsers.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
