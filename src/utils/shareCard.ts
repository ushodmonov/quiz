import { openShareLink } from './telegramWebApp'

export interface ResultCardOptions {
  percentage: number
  correct: number
  total: number
  testName: string
  streak: number
  botHandle: string
  /** UI tili — kartadagi yorliqlar uchun. */
  labels: {
    result: string // "Natija"
    correct: string // "to'g'ri"
    streakDays: string // "kun streak"
    cta: string // "Sen ham yech →"
  }
}

const SIZE = 1080

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function perfColors(pct: number): [string, string] {
  if (pct >= 80) return ['#1b5e20', '#2e7d32']
  if (pct >= 60) return ['#e65100', '#f57c00']
  return ['#b71c1c', '#c62828']
}

/** Natija kartasini canvas'da chizib, PNG Blob qaytaradi. */
export function generateResultCard(opts: ResultCardOptions): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = SIZE
    canvas.height = SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('Canvas 2D context mavjud emas'))
      return
    }

    const [c1, c2] = perfColors(opts.percentage)

    // Fon gradienti
    const grad = ctx.createLinearGradient(0, 0, SIZE, SIZE)
    grad.addColorStop(0, c1)
    grad.addColorStop(1, c2)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, SIZE, SIZE)

    // Yengil dekorativ doiralar
    ctx.fillStyle = 'rgba(255,255,255,0.06)'
    ctx.beginPath()
    ctx.arc(SIZE - 120, 160, 260, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(120, SIZE - 120, 200, 0, Math.PI * 2)
    ctx.fill()

    ctx.textAlign = 'center'

    // Sarlavha
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.font = '600 46px system-ui, -apple-system, Arial'
    ctx.fillText(opts.labels.result.toUpperCase(), SIZE / 2, 200)

    // Katta foiz
    ctx.fillStyle = '#ffffff'
    ctx.font = '800 320px system-ui, -apple-system, Arial'
    ctx.fillText(`${opts.percentage}%`, SIZE / 2, 540)

    // To'g'ri / jami
    ctx.fillStyle = 'rgba(255,255,255,0.95)'
    ctx.font = '600 52px system-ui, -apple-system, Arial'
    ctx.fillText(`${opts.correct} / ${opts.total} ${opts.labels.correct}`, SIZE / 2, 640)

    // Test nomi (uzun bo'lsa qisqartiramiz)
    let name = opts.testName || ''
    if (name.length > 34) name = name.slice(0, 33) + '…'
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.font = '400 40px system-ui, -apple-system, Arial'
    ctx.fillText(name, SIZE / 2, 720)

    // Streak rozetkasi
    if (opts.streak > 0) {
      const badgeText = `🔥 ${opts.streak} ${opts.labels.streakDays}`
      ctx.font = '700 48px system-ui, -apple-system, Arial'
      const w = ctx.measureText(badgeText).width + 80
      const bx = (SIZE - w) / 2
      ctx.fillStyle = 'rgba(0,0,0,0.22)'
      roundRect(ctx, bx, 770, w, 96, 48)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.fillText(badgeText, SIZE / 2, 836)
    }

    // Pastki CTA + bot
    ctx.fillStyle = '#ffffff'
    ctx.font = '700 50px system-ui, -apple-system, Arial'
    ctx.fillText(opts.labels.cta, SIZE / 2, 960)
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.font = '500 40px system-ui, -apple-system, Arial'
    ctx.fillText(opts.botHandle, SIZE / 2, 1020)

    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Canvas toBlob muvaffaqiyatsiz'))
    }, 'image/png')
  })
}

export type ShareOutcome = 'shared' | 'downloaded'

/**
 * Natija kartasini ulashadi.
 * 1) Web Share API (fayl bilan) — mavjud bo'lsa, Telegram/Instagram va h.k.ga yuboradi.
 * 2) Aks holda — rasmni yuklab oladi va Telegram havola ulashishni ochadi.
 */
export async function shareResultCard(
  blob: Blob,
  shareText: string,
  linkUrl: string,
  fileName = 'natija.png'
): Promise<ShareOutcome> {
  const file = new File([blob], fileName, { type: 'image/png' })

  const navAny = navigator as Navigator & {
    canShare?: (data?: { files?: File[] }) => boolean
    share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void>
  }

  if (navAny.share && navAny.canShare?.({ files: [file] })) {
    try {
      await navAny.share({ files: [file], title: shareText, text: `${shareText}\n${linkUrl}` })
      return 'shared'
    } catch (err) {
      // foydalanuvchi bekor qilgan bo'lsa ham, fallback'ga o'tmaymiz
      if ((err as Error)?.name === 'AbortError') return 'shared'
      // aks holda fallback
    }
  }

  // Fallback: rasmni yuklab olish + Telegram havola ulashish
  downloadBlob(blob, fileName)
  openShareLink(linkUrl, shareText)
  return 'downloaded'
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
