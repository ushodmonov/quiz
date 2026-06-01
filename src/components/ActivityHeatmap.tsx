import { useMemo } from 'react'
import { Box, Typography, Tooltip } from '@mui/material'
import { useTranslation } from 'react-i18next'
import type { ActivityMap } from '../utils/userStats'

interface ActivityHeatmapProps {
  activity: ActivityMap
  weeks?: number
}

function dateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** GitHub uslubidagi faollik kalendari — har bir kvadrat bir kun. */
export default function ActivityHeatmap({ activity, weeks = 17 }: ActivityHeatmapProps) {
  const { t } = useTranslation()

  const { columns, maxCount, activeDays } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Joriy haftaning dushanbasi (Mon-first: (getDay()+6)%7)
    const todayMonOffset = (today.getDay() + 6) % 7
    const lastMonday = new Date(today)
    lastMonday.setDate(today.getDate() - todayMonOffset)

    const firstMonday = new Date(lastMonday)
    firstMonday.setDate(lastMonday.getDate() - (weeks - 1) * 7)

    const cols: Array<Array<{ date: string; count: number; future: boolean }>> = []
    let max = 0
    let active = 0
    const todayStr = dateStr(today)

    for (let w = 0; w < weeks; w++) {
      const col: Array<{ date: string; count: number; future: boolean }> = []
      for (let d = 0; d < 7; d++) {
        const cur = new Date(firstMonday)
        cur.setDate(firstMonday.getDate() + w * 7 + d)
        const ds = dateStr(cur)
        const count = activity[ds] || 0
        if (count > max) max = count
        if (count > 0) active++
        col.push({ date: ds, count, future: ds > todayStr })
      }
      cols.push(col)
    }
    return { columns: cols, maxCount: max, activeDays: active }
  }, [activity, weeks])

  const levelColor = (count: number): string => {
    if (count <= 0) return 'action.hover'
    const ratio = maxCount > 0 ? count / maxCount : 0
    if (ratio > 0.66 || count >= 40) return 'success.dark'
    if (ratio > 0.33 || count >= 15) return 'success.main'
    return 'success.light'
  }

  const weekdayLabels = [
    t('stats.heatmap.mon', 'Du'),
    '',
    t('stats.heatmap.wed', 'Cho'),
    '',
    t('stats.heatmap.fri', 'Ju'),
    '',
    '',
  ]

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          {t('stats.heatmap.title', 'Faollik kalendari')}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {activeDays} {t('stats.heatmap.activeDays', 'faol kun')}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 0.75, overflowX: 'auto', pb: 1 }}>
        {/* Hafta kunlari yorlig'i */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '3px', pr: 0.5, flexShrink: 0 }}>
          {weekdayLabels.map((label, i) => (
            <Box key={i} sx={{ height: 13, display: 'flex', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary', lineHeight: 1 }}>
                {label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Haftalar */}
        {columns.map((col, ci) => (
          <Box key={ci} sx={{ display: 'flex', flexDirection: 'column', gap: '3px', flexShrink: 0 }}>
            {col.map((cell, ri) => (
              <Tooltip
                key={ri}
                title={cell.future ? '' : `${cell.date} · ${cell.count} ${t('stats.heatmap.questions', 'savol')}`}
                arrow
                disableInteractive
              >
                <Box
                  sx={{
                    width: 13,
                    height: 13,
                    borderRadius: '3px',
                    bgcolor: cell.future ? 'transparent' : levelColor(cell.count),
                    opacity: cell.future ? 0 : 1,
                  }}
                />
              </Tooltip>
            ))}
          </Box>
        ))}
      </Box>

      {/* Legenda */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, justifyContent: 'flex-end' }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
          {t('stats.heatmap.less', 'kam')}
        </Typography>
        {['action.hover', 'success.light', 'success.main', 'success.dark'].map((c) => (
          <Box key={c} sx={{ width: 11, height: 11, borderRadius: '2px', bgcolor: c }} />
        ))}
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
          {t('stats.heatmap.more', "ko'p")}
        </Typography>
      </Box>
    </Box>
  )
}
