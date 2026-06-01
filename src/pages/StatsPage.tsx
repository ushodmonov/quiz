import { useEffect, useMemo, useState } from 'react'
import {
  Container,
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Chip,
  Divider,
  LinearProgress,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  TextField,
  InputAdornment,
} from '@mui/material'
import {
  LocalFireDepartment,
  ArrowBack,
  Replay,
  Bookmark,
  EmojiEvents,
  Quiz,
  CheckCircleOutline,
  TrendingUp,
  DeleteOutline,
  PlayArrow,
  PersonAddAlt1,
  ContentCopy,
  Share,
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { buildReferralLink } from '../utils/accessControl'
import { countReferralsByReferrer, getReferralLeaderboard, type ReferralLeaderboardItem } from '../utils/firebase'
import { openShareLink } from '../utils/telegramWebApp'
import { REFERRAL_TRIAL_SECONDS } from '../constants/contact'
import {
  loadStats,
  loadStreak,
  getEffectiveStreak,
  getSrsCounts,
  getDueSrsItems,
  loadSrsStore,
  getBookmarks,
  loadActivityMap,
  clearStats,
  clearActivity,
  clearSrs,
  clearBookmarks,
} from '../utils/userStats'
import ActivityHeatmap from '../components/ActivityHeatmap'
import type { Question } from '../types'

interface StatsPageProps {
  onBack: () => void
  onStartCustomQuiz: (questions: Question[], fileName: string, kind: 'srs' | 'bookmark') => void
  telegramUserId?: number
  telegramUserName?: string
}

function StatCard({
  icon,
  value,
  label,
  color = 'primary.main',
}: {
  icon: React.ReactNode
  value: string | number
  label: string
  color?: string
}) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2, flex: '1 1 140px', minWidth: 140 }}>
      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, color }}>
          {icon}
          <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.3rem', sm: '1.6rem' } }}>
            {value}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3 }}>
          {label}
        </Typography>
      </CardContent>
    </Card>
  )
}

export default function StatsPage({ onBack, onStartCustomQuiz, telegramUserId }: StatsPageProps) {
  const { t } = useTranslation()
  const [refresh, setRefresh] = useState(0)
  const [snack, setSnack] = useState<string | null>(null)

  // —— Referral (do'st chaqirish) ——
  const referralLink = telegramUserId ? buildReferralLink(telegramUserId) : ''
  const [referralCount, setReferralCount] = useState<number | null>(null)
  const [leaderboard, setLeaderboard] = useState<ReferralLeaderboardItem[]>([])

  useEffect(() => {
    if (!telegramUserId) return
    let cancelled = false
    countReferralsByReferrer(telegramUserId)
      .then((c) => { if (!cancelled) setReferralCount(c) })
      .catch(() => { if (!cancelled) setReferralCount(0) })
    getReferralLeaderboard(10)
      .then((lb) => { if (!cancelled) setLeaderboard(lb) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [telegramUserId])

  const trialHours = Math.round(REFERRAL_TRIAL_SECONDS / 3600)

  const handleCopyLink = async () => {
    if (!referralLink) return
    try {
      await navigator.clipboard.writeText(referralLink)
      setSnack(t('referral.copied', 'Havola nusxalandi'))
    } catch {
      setSnack(referralLink)
    }
  }

  const handleShareLink = () => {
    if (!referralLink) return
    const text = t('referral.shareText', {
      hours: trialHours,
      defaultValue: `Men bu botda imtihonga tayyorlanyapman — sen ham qo'shil! ${trialHours} soat bepul 🎓`,
    })
    openShareLink(referralLink, text)
  }

  const stats = useMemo(() => loadStats(), [refresh])
  const streak = useMemo(() => loadStreak(), [refresh])
  const effectiveStreak = useMemo(() => getEffectiveStreak(), [refresh])
  const srsCounts = useMemo(() => getSrsCounts(), [refresh])
  const bookmarks = useMemo(() => getBookmarks(), [refresh])
  const activity = useMemo(() => loadActivityMap(), [refresh])
  const hasActivity = useMemo(() => Object.keys(activity).length > 0, [activity])

  const totalQuestions = stats.totalCorrect + stats.totalIncorrect
  const avgPercent = totalQuestions > 0 ? Math.round((stats.totalCorrect / totalQuestions) * 100) : 0

  const subjectList = useMemo(() => {
    return Object.values(stats.subjects)
      .map((s) => {
        const tot = s.correct + s.incorrect
        return { ...s, total: tot, percent: tot > 0 ? Math.round((s.correct / tot) * 100) : 0 }
      })
      .sort((a, b) => a.percent - b.percent) // zaiflari yuqorida
  }, [stats])

  const handleStartSrs = () => {
    const due = getDueSrsItems()
    const items = due.length > 0 ? due : Object.values(loadSrsStore())
    if (items.length === 0) return
    const questions: Question[] = items.map((it) => ({ ...it.question, sourceKey: it.key }))
    onStartCustomQuiz(questions, t('stats.srs.quizName', 'Xatolar ustida ishlash'), 'srs')
  }

  const handleStartBookmarks = () => {
    if (bookmarks.length === 0) return
    const questions: Question[] = bookmarks.map((b) => ({ ...b.question, sourceKey: b.key }))
    onStartCustomQuiz(questions, t('stats.bookmarks.quizName', 'Belgilangan savollar'), 'bookmark')
  }

  const handleClearStats = () => {
    if (!window.confirm(t('stats.confirmClear', 'Barcha statistikani tozalashni xohlaysizmi?'))) return
    clearStats()
    clearActivity()
    clearStreak_safe()
    setRefresh((v) => v + 1)
  }

  // streak'ni alohida tozalash uchun kichik yordamchi (clearStreak userStats'da yo'q — to'g'ridan-to'g'ri)
  function clearStreak_safe() {
    try {
      localStorage.removeItem('quiz_streak')
    } catch {
      /* ignore */
    }
  }

  const fmtDate = (ts: number) => {
    try {
      return new Date(ts).toLocaleDateString()
    } catch {
      return ''
    }
  }

  const pctColor = (p: number): 'success' | 'warning' | 'error' =>
    p >= 70 ? 'success' : p >= 50 ? 'warning' : 'error'

  const isEmpty = stats.totalTests === 0 && srsCounts.total === 0 && bookmarks.length === 0

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: 'calc(100vh - 64px)', py: { xs: 2, sm: 3 } }}>
      <Container maxWidth="md" sx={{ px: { xs: 1.5, sm: 2 } }}>
        {/* Sarlavha */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <IconButton onClick={onBack} size="small">
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" fontWeight={600} sx={{ flex: 1, fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
            {t('stats.title', 'Statistika')}
          </Typography>
          {stats.totalTests > 0 && (
            <Tooltip title={t('stats.clear', 'Tozalash')}>
              <IconButton onClick={handleClearStats} size="small" color="error">
                <DeleteOutline fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Do'st chaqirish (referral) */}
        {telegramUserId && (
          <Card
            sx={{
              borderRadius: 2,
              mb: 2,
              background: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #0d2a4a 0%, #10384f 100%)'
                  : 'linear-gradient(135deg, #e3f2fd 0%, #e8f5e9 100%)',
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PersonAddAlt1 color="primary" />
                <Typography variant="subtitle1" fontWeight={700}>
                  {t('referral.title', "Do'st chaqir — bonus oling")}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {t('referral.desc', {
                  hours: trialHours,
                  defaultValue: `Do'stingiz ${trialHours} soat bepul ishlatadi. Har bir chaqirgan do'stingiz uchun sizga +3 kun qo'shiladi.`,
                })}
              </Typography>

              <TextField
                value={referralLink}
                fullWidth
                size="small"
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={handleCopyLink} edge="end">
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 1.5, '& input': { fontSize: '0.8rem' } }}
              />

              <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                <Button variant="contained" startIcon={<Share />} onClick={handleShareLink} fullWidth>
                  {t('referral.share', 'Ulashish')}
                </Button>
                <Button variant="outlined" startIcon={<ContentCopy />} onClick={handleCopyLink} fullWidth>
                  {t('referral.copy', 'Nusxalash')}
                </Button>
              </Box>

              {referralCount !== null && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<PersonAddAlt1 sx={{ fontSize: '1rem !important' }} />}
                    label={`${referralCount} ${t('referral.invited', 'chaqirilgan')}`}
                    color={referralCount > 0 ? 'primary' : 'default'}
                    size="small"
                  />
                  {referralCount > 0 && (
                    <Chip
                      icon={<EmojiEvents sx={{ fontSize: '1rem !important' }} />}
                      label={`+${referralCount * 3} ${t('referral.bonusDays', 'kun bonus')}`}
                      color="success"
                      size="small"
                    />
                  )}
                </Box>
              )}

              {leaderboard.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {t('referral.leaderboard', 'Eng faol chaqiruvchilar')}
                  </Typography>
                  <Box sx={{ mt: 0.75, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {leaderboard.map((item, i) => (
                      <Box
                        key={item.referrerTelegramUserId}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          py: 0.5,
                          px: 1,
                          borderRadius: 1.5,
                          bgcolor: item.referrerTelegramUserId === telegramUserId ? 'action.selected' : 'transparent',
                        }}
                      >
                        <Typography variant="body2" sx={{ width: 24, fontWeight: 700, color: i < 3 ? 'warning.main' : 'text.secondary' }}>
                          {i + 1}
                        </Typography>
                        <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }} noWrap>
                          {item.name}
                          {item.referrerTelegramUserId === telegramUserId && ` (${t('referral.you', 'siz')})`}
                        </Typography>
                        <Chip label={item.count} size="small" variant="outlined" sx={{ height: 20, fontWeight: 700 }} />
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {isEmpty ? (
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center', py: 5 }}>
              <TrendingUp sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary">
                {t('stats.empty', "Hozircha ma'lumot yo'q. Birinchi testni yechib ko'ring!")}
              </Typography>
              <Button variant="contained" startIcon={<PlayArrow />} onClick={onBack} sx={{ mt: 2 }}>
                {t('stats.startFirst', 'Test boshlash')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Streak banner */}
            <Card
              sx={{
                borderRadius: 2,
                mb: 2,
                background: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, #4a2c00 0%, #5a1a00 100%)'
                    : 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
              }}
            >
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: { xs: 2, sm: 2.5 } }}>
                <LocalFireDepartment
                  sx={{ fontSize: { xs: 40, sm: 52 }, color: effectiveStreak > 0 ? '#ff6d00' : 'text.disabled' }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1, fontSize: { xs: '1.8rem', sm: '2.2rem' } }}>
                    {effectiveStreak}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    {t('stats.streak.days', 'kun ketma-ket')}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                    <EmojiEvents sx={{ fontSize: '1rem', color: '#fbc02d' }} />
                    <Typography variant="body2" fontWeight={700}>
                      {streak.longest}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('stats.streak.best', 'eng uzun')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    {t('stats.streak.total', 'Jami faol kun')}: {streak.totalDays}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Umumiy raqamlar */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
              <StatCard icon={<Quiz fontSize="small" />} value={stats.totalTests} label={t('stats.totalTests', 'Yechilgan test')} />
              <StatCard icon={<CheckCircleOutline fontSize="small" />} value={totalQuestions} label={t('stats.totalQuestions', 'Jami savol')} />
              <StatCard
                icon={<TrendingUp fontSize="small" />}
                value={`${avgPercent}%`}
                label={t('stats.avgScore', "O'rtacha natija")}
                color={`${pctColor(avgPercent)}.main`}
              />
            </Box>

            {/* Faollik kalendari */}
            {hasActivity && (
              <Card variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
                <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                  <ActivityHeatmap activity={activity} />
                </CardContent>
              </Card>
            )}

            {/* Amal kartalari: SRS + Bookmark */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
              <Card variant="outlined" sx={{ borderRadius: 2, flex: '1 1 240px', minWidth: 240 }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Replay color="primary" />
                    <Typography variant="subtitle1" fontWeight={600}>
                      {t('stats.srs.title', 'Xatolar ustida ishlash')}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {t('stats.srs.desc', "Xato qilgan savollaringiz takrorlash uchun to'planadi.")}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                    <Chip
                      label={`${t('stats.srs.due', 'Bugun')}: ${srsCounts.due}`}
                      color={srsCounts.due > 0 ? 'warning' : 'default'}
                      size="small"
                    />
                    <Chip label={`${t('stats.srs.total', 'Jami')}: ${srsCounts.total}`} variant="outlined" size="small" />
                  </Box>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<Replay />}
                    disabled={srsCounts.total === 0}
                    onClick={handleStartSrs}
                  >
                    {srsCounts.due > 0
                      ? t('stats.srs.review', 'Takrorlash')
                      : t('stats.srs.reviewAll', 'Hammasini takrorlash')}
                  </Button>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ borderRadius: 2, flex: '1 1 240px', minWidth: 240 }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Bookmark sx={{ color: 'warning.main' }} />
                    <Typography variant="subtitle1" fontWeight={600}>
                      {t('stats.bookmarks.title', 'Belgilangan savollar')}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {t('stats.bookmarks.desc', 'Test paytida yulduzcha bilan belgilagan savollaringiz.')}
                  </Typography>
                  <Box sx={{ mb: 1.5 }}>
                    <Chip label={`${bookmarks.length} ta`} variant="outlined" size="small" />
                  </Box>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<Bookmark />}
                    disabled={bookmarks.length === 0}
                    onClick={handleStartBookmarks}
                  >
                    {t('stats.bookmarks.start', 'Yechish')}
                  </Button>
                </CardContent>
              </Card>
            </Box>

            {/* Fanlar bo'yicha */}
            {subjectList.length > 0 && (
              <Card variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
                <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
                    {t('stats.bySubject', "Fanlar bo'yicha")}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {subjectList.slice(0, 12).map((s) => (
                      <Box key={s.name}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, gap: 1 }}>
                          <Typography variant="body2" sx={{ wordBreak: 'break-word', flex: 1 }}>
                            {s.name}
                          </Typography>
                          <Typography variant="body2" fontWeight={700} color={`${pctColor(s.percent)}.main`}>
                            {s.percent}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={s.percent}
                          color={pctColor(s.percent)}
                          sx={{ height: 6, borderRadius: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {s.tests} {t('stats.testsShort', 'test')} · {s.correct}/{s.total} {t('stats.correctShort', "to'g'ri")}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Tarix */}
            {stats.history.length > 0 && (
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                    {t('stats.history', 'Oxirgi natijalar')}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    {stats.history.slice(0, 20).map((h, i) => (
                      <Box key={i}>
                        {i > 0 && <Divider />}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" noWrap title={h.fileName}>
                              {h.fileName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {fmtDate(h.timestamp)} · {h.correct}/{h.total}
                            </Typography>
                          </Box>
                          <Chip
                            label={`${h.percentage}%`}
                            size="small"
                            color={pctColor(h.percentage)}
                            sx={{ fontWeight: 700 }}
                          />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Tozalash tugmalari */}
            <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
              {srsCounts.total > 0 && (
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteOutline fontSize="small" />}
                  onClick={() => {
                    if (window.confirm(t('stats.srs.confirmClear', 'SRS savollarini tozalaysizmi?'))) {
                      clearSrs()
                      setRefresh((v) => v + 1)
                    }
                  }}
                >
                  {t('stats.srs.clear', 'SRS tozalash')}
                </Button>
              )}
              {bookmarks.length > 0 && (
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteOutline fontSize="small" />}
                  onClick={() => {
                    if (window.confirm(t('stats.bookmarks.confirmClear', 'Belgilarni tozalaysizmi?'))) {
                      clearBookmarks()
                      setRefresh((v) => v + 1)
                    }
                  }}
                >
                  {t('stats.bookmarks.clear', 'Belgilarni tozalash')}
                </Button>
              )}
            </Box>
          </>
        )}
      </Container>

      <Snackbar
        open={!!snack}
        autoHideDuration={3000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setSnack(null)} sx={{ width: '100%' }}>
          {snack}
        </Alert>
      </Snackbar>
    </Box>
  )
}
