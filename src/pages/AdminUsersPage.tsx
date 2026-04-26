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
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material'
import { getJwtTokenUsers, type JwtTokenUserItem } from '../utils/firebase'

interface AdminUsersPageProps {
  onBack: () => void
}

const formatDateTime = (date: Date | null): string => {
  if (!date) return 'Nomaʼlum vaqt'
  return new Intl.DateTimeFormat('uz-UZ', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

export default function AdminUsersPage({ onBack }: AdminUsersPageProps) {
  const [users, setUsers] = useState<JwtTokenUserItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoading(true)
        const list = await getJwtTokenUsers()
        setUsers(list)
      } catch (loadError) {
        console.error('Load JWT users error:', loadError)
        setError('Userlar roʻyxatini yuklab boʻlmadi')
      } finally {
        setIsLoading(false)
      }
    }

    loadUsers()
  }, [])

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
              JWT olgan userlar
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : users.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                Hozircha JWT generatsiya qilingan userlar yoʻq
              </Alert>
            ) : (
              <List sx={{ mb: 2 }}>
                {users.map((user, index) => (
                  <Box key={user.telegramUserId}>
                    <ListItem>
                      <ListItemText
                        primary={`User ID: ${user.telegramUserId}`}
                        secondary={`Tokenlar soni: ${user.tokenCount} | Oxirgi token: ${formatDateTime(user.lastCreatedAt)}`}
                      />
                    </ListItem>
                    {index < users.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            )}

            <Button fullWidth variant="text" onClick={onBack}>
              Orqaga qaytish
            </Button>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}
