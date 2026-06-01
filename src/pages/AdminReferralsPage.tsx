import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Stack,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material'
import { Search, ArrowBack, Refresh, ExpandMore, EmojiEvents, PersonAddAlt1, Group } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { getAllReferrals, type ReferralRecord } from '../utils/firebase'
import { REFERRAL_BONUS_SECONDS } from '../constants/contact'

interface AdminReferralsPageProps {
  onBack: () => void
}

interface ReferrerGroup {
  id: number
  name: string
  count: number
  lastDate: Date | null
  invitees: ReferralRecord[]
}

const BONUS_DAYS = Math.round(REFERRAL_BONUS_SECONDS / 86400)

function formatDateTime(date: Date | null, locale: string, fallback: string): string {
  if (!date) return fallback
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'uz-UZ', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export default function AdminReferralsPage({ onBack }: AdminReferralsPageProps) {
  const { t, i18n } = useTranslation()
  const [records, setRecords] = useState<ReferralRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const load = async () => {
    try {
      setIsLoading(true)
      setError('')
      const list = await getAllReferrals()
      setRecords(list)
    } catch (e) {
      console.error('Load referrals error:', e)
      const detail = e instanceof Error ? e.message : String(e)
      setError(`${t('adminReferrals.errorLoad', 'Ma\'lumotni yuklab bo\'lmadi')}: ${detail}`)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const referrers = useMemo<ReferrerGroup[]>(() => {
    const map = new Map<number, ReferrerGroup>()
    for (const r of records) {
      const existing = map.get(r.referrerTelegramUserId)
      if (existing) {
        existing.count += 1
        existing.invitees.push(r)
        if (r.createdAt && (!existing.lastDate || r.createdAt > existing.lastDate)) existing.lastDate = r.createdAt
        if (existing.name.startsWith('ID:') && !r.referrerName.startsWith('ID:')) existing.name = r.referrerName
      } else {
        map.set(r.referrerTelegramUserId, {
          id: r.referrerTelegramUserId,
          name: r.referrerName,
          count: 1,
          lastDate: r.createdAt,
          invitees: [r],
        })
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count)
  }, [records])

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return referrers
    return referrers.filter((r) => r.id.toString().includes(q) || r.name.toLowerCase().includes(q))
  }, [referrers, searchQuery])

  const totalReferrers = referrers.length
  const totalReferrals = records.length

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        bgcolor: 'background.default',
        py: { xs: 1, sm: 2 },
        px: { xs: 1, sm: 2 },
      }}
    >
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5, px: { xs: 0.5, sm: 1 } }}>
          <IconButton onClick={onBack} size="small">
            <ArrowBack />
          </IconButton>
          <Typography
            variant="h5"
            sx={{ flex: 1, fontWeight: 500, color: 'primary.main', fontSize: { xs: '1.1rem', sm: '1.5rem' } }}
          >
            {t('adminReferrals.title', 'Referral statistikasi')}
          </Typography>
          <Tooltip title={t('adminReferrals.refresh', 'Yangilash')}>
            <span>
              <IconButton onClick={load} disabled={isLoading} size="small">
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
        ) : records.length === 0 ? (
          <Alert severity="info">{t('adminReferrals.empty', 'Hozircha referral yo\'q')}</Alert>
        ) : (
          <>
            {/* Umumiy raqamlar */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              <Chip
                icon={<Group sx={{ fontSize: '1.1rem !important' }} />}
                label={`${totalReferrers} ${t('adminReferrals.referrers', 'chaqiruvchi')}`}
                color="primary"
              />
              <Chip
                icon={<PersonAddAlt1 sx={{ fontSize: '1.1rem !important' }} />}
                label={`${totalReferrals} ${t('adminReferrals.referrals', 'chaqirilgan')}`}
                color="success"
              />
            </Box>

            <TextField
              fullWidth
              placeholder={t('adminReferrals.searchPlaceholder', 'Ism yoki ID bo\'yicha qidirish...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ mb: 1.5, bgcolor: 'background.paper', borderRadius: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />

            {filtered.length === 0 ? (
              <Alert severity="info">{t('adminReferrals.noSearchResults', 'Topilmadi')}</Alert>
            ) : (
              filtered.map((ref) => {
                const rank = referrers.indexOf(ref) + 1
                return (
                  <Accordion
                    key={ref.id}
                    disableGutters
                    sx={{ mb: 1, borderRadius: 2, '&:before': { display: 'none' }, border: '1px solid', borderColor: 'divider' }}
                  >
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', pr: 1 }}>
                        <Typography
                          sx={{
                            width: 28,
                            textAlign: 'center',
                            fontWeight: 800,
                            color: rank <= 3 ? 'warning.main' : 'text.secondary',
                            fontSize: rank <= 3 ? '1.1rem' : '0.95rem',
                          }}
                        >
                          {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank}
                        </Typography>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {ref.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {ref.id} · {formatDateTime(ref.lastDate, i18n.language, '-')}
                          </Typography>
                        </Box>
                        <Chip
                          icon={<PersonAddAlt1 sx={{ fontSize: '0.9rem !important' }} />}
                          label={ref.count}
                          color="primary"
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                        <Chip
                          icon={<EmojiEvents sx={{ fontSize: '0.9rem !important' }} />}
                          label={`+${ref.count * BONUS_DAYS}${t('adminReferrals.daysShort', 'k')}`}
                          color="success"
                          size="small"
                          variant="outlined"
                          sx={{ display: { xs: 'none', sm: 'flex' } }}
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                        {t('adminReferrals.invitees', 'Chaqirilganlar')} ({ref.count})
                      </Typography>
                      <List dense disablePadding>
                        {ref.invitees.map((inv, i) => (
                          <Box key={`${inv.inviteeTelegramUserId}_${i}`}>
                            {i > 0 && <Divider component="li" />}
                            <ListItem disableGutters>
                              <ListItemText
                                primary={inv.inviteeName}
                                secondary={`ID: ${inv.inviteeTelegramUserId} · ${formatDateTime(inv.createdAt, i18n.language, '-')}`}
                                primaryTypographyProps={{ variant: 'body2' }}
                                secondaryTypographyProps={{ variant: 'caption' }}
                              />
                            </ListItem>
                          </Box>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                )
              })
            )}
          </>
        )}
      </Box>
    </Box>
  )
}
