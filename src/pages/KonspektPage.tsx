import { useState, useMemo, useRef, useEffect, Fragment } from 'react'
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
  Divider,
  CircularProgress,
  MenuItem,
  ListSubheader,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  AppBar,
  Toolbar,
  Collapse,
  Backdrop,
  LinearProgress,
  Snackbar,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { ArrowBack, UploadFile, PictureAsPdf, Visibility, Close, Wallpaper, ChevronLeft, ChevronRight, RestartAlt, Layers, Tune, ExpandLess, ExpandMore, ContentCopy, AutoAwesome, Download } from '@mui/icons-material'
import { toJpeg } from 'html-to-image'
import { useTranslation } from 'react-i18next'

/**
 * Qo'lda yozilgan katakli daftar (A5) konspekt generatori.
 * task.md dagi aniq o'lchamlar va dizayn tokenlariga mos.
 */

interface KonspektPageProps {
  onBack: () => void
}

// —— Dizayn tokenlari (task.md) ——
const COLORS = {
  bg: '#fefefe',
  grid: '#cfe0f4',
  redBorder: '#e88883',
  ink: '#22439c',
  inkBlack: '#1c1c22',
  title: '#1a2c74',
  titleTag: '#d23a3a',
  heading: '#c62f2a',
  star: '#d99a1f',
  quote: '#1f7a3c',
  heart: '#c62f2a',
}

// Qo'lyozma (handwriting) shriftlar — Google Fonts'dan yuklanadi.
// group: 'cursive' — harflar ulangan; 'print' — harflar ajralgan bosma qo'lyozma.
// scale: har bir shriftning x-balandligi turlicha, o'lchamni tenglashtiradi.
type FontGroup = 'cursive' | 'print'
const FONTS: { label: string; family: string; query: string; scale: number; group: FontGroup }[] = [
  // —— Cursive: harflar ulangan (chinakam qo'lyozmadek) ——
  { label: 'Caveat', family: 'Caveat', query: 'Caveat:wght@400;600;700', scale: 1, group: 'cursive' },
  { label: 'Dancing Script', family: 'Dancing Script', query: 'Dancing+Script:wght@400;600;700', scale: 1.05, group: 'cursive' },
  { label: 'Nanum Pen Script', family: 'Nanum Pen Script', query: 'Nanum+Pen+Script', scale: 1.15, group: 'cursive' },
  { label: 'Homemade Apple', family: 'Homemade Apple', query: 'Homemade+Apple', scale: 0.7, group: 'cursive' },
  { label: 'Edu NSW ACT Foundation', family: 'Edu NSW ACT Foundation', query: 'Edu+NSW+ACT+Foundation:wght@400;500;600;700', scale: 0.92, group: 'cursive' },
  { label: 'Shadows Into Light', family: 'Shadows Into Light', query: 'Shadows+Into+Light', scale: 0.95, group: 'cursive' },
  // —— Bosma qo'lyozma: harflar ajralgan, lekin qo'lda yozilgandek ——
  { label: 'Kalam', family: 'Kalam', query: 'Kalam:wght@300;400;700', scale: 0.92, group: 'print' },
  { label: 'Handlee', family: 'Handlee', query: 'Handlee', scale: 0.95, group: 'print' },
  { label: 'Gochi Hand', family: 'Gochi Hand', query: 'Gochi+Hand', scale: 0.9, group: 'print' },
  { label: 'Indie Flower', family: 'Indie Flower', query: 'Indie+Flower', scale: 0.9, group: 'print' },
  { label: 'Neucha', family: 'Neucha', query: 'Neucha', scale: 0.95, group: 'print' },
  { label: 'Delius', family: 'Delius', query: 'Delius', scale: 0.95, group: 'print' },
]

const DEFAULT_TEXT = `@title: Konspekt yuritish

# Reja:
1. Konspekt nima?
2. Konspektning foydasi

* Konspekt nima?
- Dars yoki kitobning qisqa, tizimli yozuvi.
- Asosiy fikrlar o'z so'zlaringizda yoziladi.

* Konspektning foydasi
- Materialni tez takrorlash imkonini beradi.
- Bilim xotirada uzoq saqlanadi.
> "Yozilgan narsa esda qoladi."

= Xulosa: Yaxshi konspekt — bilim kaliti! ♥`

// AI (ChatGPT va h.k.)ga berish uchun tayyor prompt — shu format asosida konspekt yozdiradi.
const PROMPT_TEXT = `Menga quyidagi MAVZU bo'yicha konspekt tayyorla.
Faqat quyidagi belgilash (markup) formatida yoz — boshqa hech qanday izoh yoki matn qo'shma:

@title: sahifa sarlavhasi (bitta bo'ladi)
# qizil sarlavha (masalan "Reja:")
* yulduzchali bo'lim sarlavhasi
- bullet qatori (tire bilan, asosiy fikr)
> yashil iqtibos (qo'shtirnoq ichida)
= xulosa qatori (oxirida ♥ qo'yishing mumkin)
Bo'sh satr — bo'limlar orasidagi bo'shliq.

Qoidalar: qisqa, aniq va tushunarli yoz; har bir bo'lim uchun * sarlavha va 2-4 ta - bullet ishlat;
kamida bitta > iqtibos va oxirida = xulosa qo'sh.

MAVZU: `

type LineKind = 'title' | 'heading' | 'star' | 'bullet' | 'quote' | 'summary' | 'gap' | 'text'

interface ParsedLine {
  kind: LineKind
  text: string
}

function parseMarkup(input: string): { title: string; lines: ParsedLine[] } {
  let title = ''
  const lines: ParsedLine[] = []
  const raw = input.replace(/\r\n/g, '\n').split('\n')

  for (const line of raw) {
    const trimmed = line.trim()
    if (trimmed === '') {
      lines.push({ kind: 'gap', text: '' })
      continue
    }
    if (/^@title:/i.test(trimmed)) {
      title = trimmed.replace(/^@title:/i, '').trim()
      continue
    }
    if (trimmed.startsWith('*')) {
      lines.push({ kind: 'star', text: trimmed.slice(1).trim() })
    } else if (trimmed.startsWith('#')) {
      lines.push({ kind: 'heading', text: trimmed.slice(1).trim() })
    } else if (trimmed.startsWith('-')) {
      lines.push({ kind: 'bullet', text: trimmed.slice(1).trim() })
    } else if (trimmed.startsWith('>')) {
      lines.push({ kind: 'quote', text: trimmed.slice(1).trim() })
    } else if (trimmed.startsWith('=')) {
      lines.push({ kind: 'summary', text: trimmed.slice(1).trim() })
    } else {
      lines.push({ kind: 'text', text: trimmed })
    }
  }

  return { title, lines }
}

/** Word HTML (mammoth) ni konspekt markup formatiga o'giradi. */
function htmlToMarkup(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const out: string[] = []
  let titleSet = false

  const clean = (s: string) => s.replace(/\s+/g, ' ').trim()

  const walk = (nodes: NodeListOf<ChildNode> | ChildNode[]) => {
    nodes.forEach((node) => {
      if (node.nodeType !== 1) return
      const el = node as HTMLElement
      const tag = el.tagName.toLowerCase()
      const txt = clean(el.textContent || '')

      if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4' || tag === 'h5') {
        if (!txt) return
        if (!titleSet && tag === 'h1') {
          out.push(`@title: ${txt}`, '')
          titleSet = true
        } else {
          out.push('', `* ${txt}`)
        }
      } else if (tag === 'ul' || tag === 'ol') {
        el.querySelectorAll(':scope > li').forEach((li) => {
          const t = clean(li.textContent || '')
          if (t) out.push(`- ${t}`)
        })
      } else if (tag === 'blockquote') {
        if (txt) out.push(`> ${txt}`)
      } else if (tag === 'p') {
        if (!txt) return
        const onlyBold =
          el.children.length > 0 &&
          Array.from(el.children).every((c) => ['strong', 'b'].includes(c.tagName.toLowerCase())) &&
          clean(Array.from(el.children).map((c) => c.textContent || '').join(' ')) === txt
        if (onlyBold || /:\s*$/.test(txt)) {
          // Qalin yoki ":" bilan tugaydigan qator — bo'lim sarlavhasi
          out.push('', `# ${txt}`)
        } else {
          // Oddiy matn (sarlavha majburan qo'yilmaydi — sarlavha bo'lmasligi ham mumkin)
          out.push(txt)
        }
      } else if (tag === 'table') {
        el.querySelectorAll('tr').forEach((tr) => {
          const t = clean(tr.textContent || '')
          if (t) out.push(t)
        })
      } else {
        // div va boshqa konteynerlar ichiga kiramiz
        walk(el.childNodes)
      }
    })
  }

  walk(doc.body.childNodes)
  // ketma-ket bo'sh qatorlarni bittaga tushiramiz
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

/** ArrayBuffer → base64 (katta fayllar uchun bo'lakma-bo'lak). */
function arrayBufferToBase64(buf: ArrayBuffer): string {
  let binary = ''
  const bytes = new Uint8Array(buf)
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)))
  }
  return btoa(binary)
}

/**
 * Tanlangan shrift uchun @font-face CSS'ni base64 bilan tayyorlaydi.
 * html-to-image'ga fontEmbedCSS sifatida beriladi — shunda u cross-origin
 * stylesheet'larni o'qimaydi (SecurityError bo'lmaydi) va shrift eksportga to'g'ri kiradi.
 */
async function buildFontEmbedCSS(query: string): Promise<string> {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${query}&display=swap`
  let css = await (await fetch(cssUrl)).text()
  const urls = Array.from(new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map((m) => m[1])))
  for (const u of urls) {
    try {
      const buf = await (await fetch(u)).arrayBuffer()
      const b64 = arrayBufferToBase64(buf)
      const mime = u.includes('.woff2') ? 'font/woff2' : u.includes('.woff') ? 'font/woff' : 'font/ttf'
      css = css.split(u).join(`data:${mime};base64,${b64}`)
    } catch { /* bitta fayl yuklanmasa, o'tkazib yuboramiz */ }
  }
  return css
}

/** Deterministik "tasodifiy" son [0,1) — matn + kalitdan (har renderда bir xil). */
function seededRand(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967295
}

// Foto donadorlik (grain) — SVG feTurbulence data-URI (offline, eksportda ham chiqadi)
const GRAIN_URI =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

/** Matndagi ♥ / ♡ belgilarini qizil rangda ko'rsatadi. */
function renderWithHearts(text: string) {
  const parts = text.split(/([♥♡❤])/)
  return parts.map((part, i) =>
    /[♥♡❤]/.test(part) ? (
      <span key={i} style={{ color: COLORS.heart }}>
        {part}
      </span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  )
}

export default function KonspektPage({ onBack }: KonspektPageProps) {
  const { t } = useTranslation()
  const [text, setText] = useState(DEFAULT_TEXT)
  const [fontMm, setFontMm] = useState(5.7)
  const [cellMm, setCellMm] = useState(3.75)
  const [ink, setInk] = useState<'blue' | 'black'>('blue')
  const [rightMm, setRightMm] = useState(5)
  const [leftMm, setLeftMm] = useState(1.4)
  const [bookMode, setBookMode] = useState(false)
  const [realistic, setRealistic] = useState(true) // tabiiy qo'lyozma + foto realizm
  const [paper, setPaper] = useState<'grid' | 'lined'>('grid') // qog'oz turi: 'grid' — katakli daftar (A5), 'lined' — A4 oddiy (chiziqsiz)
  const [lineSpacingMm, setLineSpacingMm] = useState(8.5) // A4'da qatorlar orasidagi masofa
  // A4 (referat) qirralari — foydalanuvchi qo'lda kiritadi (sm). Standart: chap 3, o'ng 1.5, yuqori/past 2.
  const [a4LeftMm, setA4LeftMm] = useState(30)
  const [a4RightMm, setA4RightMm] = useState(15)
  const [a4TopMm, setA4TopMm] = useState(20)
  const [a4BottomMm, setA4BottomMm] = useState(20)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [curPage, setCurPage] = useState(0)
  const [confirmApplyAll, setConfirmApplyAll] = useState(false)
  const [controlsOpen, setControlsOpen] = useState(true)
  const [exportStatus, setExportStatus] = useState<{ done: number; total: number; phase: string } | null>(null)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [copiedMsg, setCopiedMsg] = useState('')
  const muiTheme = useTheme()
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'))
  const touchStartX = useRef<number | null>(null)
  const [fontIdx, setFontIdx] = useState(0)
  const [bgImage, setBgImage] = useState<string | null>(null)
  // Har bet uchun alohida sozlama: tilt=bet qiyshiqligi, zoom/x/y/bgRot=orqa fon
  type PageAdjust = { tilt: number; zoom: number; x: number; y: number; bgRot: number; pageZoom: number; bright: number; contrast: number; saturate: number }
  const DEFAULT_ADJUST: PageAdjust = { tilt: 0, zoom: 1, x: 0, y: 0, bgRot: 0, pageZoom: 1, bright: 100, contrast: 100, saturate: 100 }
  const [pageAdjust, setPageAdjust] = useState<Record<number, PageAdjust>>({})
  const getAdj = (idx: number): PageAdjust => ({ ...DEFAULT_ADJUST, ...pageAdjust[idx] })
  const setAdj = (idx: number, patch: Partial<PageAdjust>) =>
    setPageAdjust((prev) => ({ ...prev, [idx]: { ...(prev[idx] || DEFAULT_ADJUST), ...patch } }))
  // Joriy bet sozlamalarini barcha betlarga qo'llaydi
  const applyAdjustToAll = (source: PageAdjust, count: number) => {
    const next: Record<number, PageAdjust> = {}
    for (let i = 0; i < count; i++) next[i] = { ...source }
    setPageAdjust(next)
  }
  const bgInputRef = useRef<HTMLInputElement>(null)
  const [exporting, setExporting] = useState(false)
  // Tayyor PDF — Telegram/mobil'da Web Share yangi bosish (gesture) talab qiladi,
  // shuning uchun render tugagach faylni saqlab qo'yamiz va "Saqlash" tugmasi ko'rsatamiz.
  const pendingPdf = useRef<{ file: File; url: string; dataUrl: string; name: string } | null>(null)
  const [pdfReady, setPdfReady] = useState<{ name: string } | null>(null)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [fontReady, setFontReady] = useState(false)
  const pageRefs = useRef<HTMLDivElement[]>([])
  const fontCssCache = useRef<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewBoxRef = useRef<HTMLDivElement>(null)
  const [previewScale, setPreviewScale] = useState(0.72)

  const inkColor = ink === 'blue' ? COLORS.ink : COLORS.inkBlack
  const { title, lines } = useMemo(() => parseMarkup(text), [text])

  const font = FONTS[fontIdx] || FONTS[0]

  // Barcha qo'lyozma shriftlarni Google Fonts'dan yuklaymiz (bir marta).
  useEffect(() => {
    const id = 'konspekt-fonts-link'
    if (!document.getElementById(id)) {
      const link = document.createElement('link')
      link.id = id
      link.rel = 'stylesheet'
      link.href = 'https://fonts.googleapis.com/css2?' + FONTS.map((f) => `family=${f.query}`).join('&') + '&display=swap'
      document.head.appendChild(link)
    }
  }, [])

  // Tanlangan shrift tayyor bo'lguncha kutamiz (eksport to'g'ri chiqishi uchun).
  // MUHIM: shrift yuklanmasa ham (Telegram'da tarmoq bloklansa) 2.5s dan keyin
  // baribir tayyor deb belgilaymiz — PDF tugmasi hech qachon o'chiq qolib ketmasin.
  useEffect(() => {
    setFontReady(false)
    let done = false
    const finish = () => { if (!done) { done = true; setFontReady(true) } }
    const fonts = (document as any).fonts
    if (fonts?.load) {
      Promise.all([
        fonts.load(`600 20px "${font.family}"`),
        fonts.load(`700 20px "${font.family}"`),
      ]).then(finish).catch(finish)
    } else {
      finish()
    }
    const timer = setTimeout(finish, 2500) // fallback
    return () => clearTimeout(timer)
  }, [font.family])

  // Qog'oz o'lchami: 'grid' → A5 katakli daftar (145×210), 'lined' → A4 chiziqli (210×297)
  const paperWmm = paper === 'lined' ? 210 : 145
  const paperHmm = paper === 'lined' ? 297 : 210

  // Orqa fon (stol rasmi) bo'lsa, sahifa atrofida bo'shliq qoladi — eksport shu "sahna".
  const sceneMargin = bgImage ? 28 : 0 // mm — qiyshaytirilganda burchaklar kesilmasligi uchun
  const exportWmm = paperWmm + sceneMargin * 2
  const exportHmm = paperHmm + sceneMargin * 2

  // Preview'ni konteyner O'LCHAMIGA (kenglik + balandlik) qarab masshtablaymiz —
  // shunda bet hech qachon ekrandan chiqib kesilmaydi (mobile/tablet/desktop).
  useEffect(() => {
    const el = previewBoxRef.current
    if (!el) return
    const EXPORT_WIDTH_PX = (exportWmm * 96) / 25.4
    const EXPORT_HEIGHT_PX = (exportHmm * 96) / 25.4
    const update = () => {
      const cs = getComputedStyle(el)
      const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)
      const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
      const availW = el.clientWidth - padX
      const availH = el.clientHeight - padY
      const fit = Math.min(availW / EXPORT_WIDTH_PX, availH / EXPORT_HEIGHT_PX)
      setPreviewScale(Math.max(0.12, Math.min(0.9, fit)))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [previewOpen, exportWmm, exportHmm])

  // Dialog ochilganda 1-betdan boshlaymiz; bet soni kamaysa chegaraga qaytaramiz.
  useEffect(() => {
    if (previewOpen) setCurPage(0)
  }, [previewOpen])

  // —— Hisoblangan o'lchamlar (mm) ——
  const cell = cellMm
  const isA4 = paper === 'lined' // 'lined' = A4 oddiy (chiziqsiz, qizil chiziqsiz) referat varaq
  const redLineLeft = 3 * cell // 11.25mm (faqat A5)
  // Kontent qirralari — A4'da foydalanuvchi kiritgan margin, A5'da qizil chiziq + slayder.
  const contentLeft = isA4 ? a4LeftMm : redLineLeft + leftMm
  const contentRight = isA4 ? a4RightMm : rightMm
  // Yozuv qatori balandligi: A5'da 2 katak, A4'da foydalanuvchi tanlagan qator oralig'i.
  const writingLineMm = isA4 ? lineSpacingMm : 2 * cell
  const gapMm = writingLineMm / 2 // bo'sh satr uchun
  const topOffsetMm = isA4 ? a4TopMm : 2 * cell // yuqoridan bo'shliq
  const bottomReserveMm = isA4 ? a4BottomMm : 8 // pastdan bo'shliq
  const lineHeight = writingLineMm

  const fontFamily = `'${font.family}', cursive`
  // Har bir shriftning x-balandligi turlicha — effektiv o'lcham koeffitsient bilan moslanadi.
  const effFontMm = fontMm * font.scale

  // —— Ko'p sahifali bo'lish (pagination) ——
  // Matn bir A5 betga sig'masa, avtomatik yangi betlarga bo'linadi.
  const pages = useMemo(() => {
    const topMm = topOffsetMm
    const usableMm = paperHmm - topMm - bottomReserveMm
    // Sarlavha bloki (faqat 1-betda) taxminiy balandligi
    const titleBlockMm = title ? fontMm * 1.98 + 1.6 + gapMm : 0

    // Kontent kengligi (mm) va bitta qatorga sig'adigan taxminiy belgi soni —
    // uzun matn bir necha vizual qatorga o'ralishini hisobga olamiz.
    const contentWidthMm = paperWmm - contentLeft - contentRight
    const avgCharMm = fontMm * 0.34 // Caveat o'rtacha belgi kengligi
    const charsPerLine = Math.max(8, Math.floor(contentWidthMm / avgCharMm))
    const lineMm = (l: ParsedLine) => {
      if (l.kind === 'gap') return gapMm
      const rows = Math.max(1, Math.ceil((l.text.length || 1) / charsPerLine))
      return rows * writingLineMm
    }

    const result: ParsedLine[][] = []
    let current: ParsedLine[] = []
    let used = titleBlockMm // 1-bet sarlavha bilan boshlanadi

    for (const line of lines) {
      const lh = lineMm(line)
      if (used + lh > usableMm && current.length > 0) {
        result.push(current)
        current = []
        used = 0
        if (line.kind === 'gap') continue // yangi bet boshida bo'shliq keraksiz
      }
      current.push(line)
      used += lh
    }
    if (current.length > 0 || result.length === 0) result.push(current)
    return result
  }, [lines, cell, fontMm, title, paperHmm, paperWmm, contentLeft, contentRight, writingLineMm, gapMm, topOffsetMm, bottomReserveMm])

  const pageStyle: React.CSSProperties = {
    width: `${paperWmm}mm`,
    height: `${paperHmm}mm`,
    background: COLORS.bg,
    position: 'relative',
    overflow: 'hidden',
    boxSizing: 'border-box',
    // A4 (lined) — chiziqsiz oddiy oq qog'oz; A5 (grid) — katak chiziqlari.
    ...(paper === 'grid'
      ? {
          backgroundImage: `linear-gradient(${COLORS.grid} 0.18mm, transparent 0.18mm), linear-gradient(90deg, ${COLORS.grid} 0.18mm, transparent 0.18mm)`,
          backgroundSize: `${cell}mm ${cell}mm`,
        }
      : {}),
  }

  const contentStyle: React.CSSProperties = {
    position: 'absolute',
    top: `${topOffsetMm}mm`, // yuqoridan bo'shliq
    left: `${contentLeft}mm`,
    right: `${contentRight}mm`,
  }

  const baseLineStyle: React.CSSProperties = {
    // Qat'iy balandlik emas — uzun matn keyingi qatorlarga o'tib, ustma-ust tushmaydi.
    // Har bir vizual qator ~2 katak (lineHeight) egallaydi, grid ritmi saqlanadi.
    minHeight: `${lineHeight}mm`,
    display: 'flex',
    alignItems: 'flex-end',
    paddingBottom: '0.9mm',
    fontFamily,
    fontWeight: 600,
    fontSize: `${effFontMm}mm`,
    lineHeight: `${lineHeight}mm`,
    color: inkColor,
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) e.target.value = '' // bir xil faylni qayta tanlash uchun
    if (!file) return
    setImportError('')
    setImporting(true)
    try {
      const name = file.name.toLowerCase()
      if (name.endsWith('.docx')) {
        const mammoth = await import('mammoth')
        const buf = await file.arrayBuffer()
        const { value: html } = await mammoth.convertToHtml({ arrayBuffer: buf })
        const markup = htmlToMarkup(html)
        if (!markup) throw new Error('empty')
        setText(markup)
      } else if (name.endsWith('.txt') || name.endsWith('.md')) {
        const raw = await file.text()
        setText(raw.trim())
      } else {
        throw new Error('unsupported')
      }
    } catch (err) {
      console.error('Word import xatosi:', err)
      setImportError(
        t('konspekt.importError', "Faylni o'qib bo'lmadi. Faqat .docx, .txt yoki .md fayllar qo'llab-quvvatlanadi.")
      )
    } finally {
      setImporting(false)
    }
  }

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) e.target.value = ''
    if (!file) return
    // Faqat rasm fayllari qabul qilinadi (jpg, jpeg, png, heic, heif, webp, gif, bmp ...)
    const isImage =
      file.type.startsWith('image/') ||
      /\.(jpe?g|png|heic|heif|webp|gif|bmp|avif|tiff?)$/i.test(file.name)
    if (!isImage) {
      setImportError(t('konspekt.bgOnlyImage', "Orqa fon uchun faqat rasm fayli (jpg, png, heic ...) yuklang."))
      return
    }
    setImportError('')
    const reader = new FileReader()
    reader.onload = () => setBgImage(typeof reader.result === 'string' ? reader.result : null)
    reader.readAsDataURL(file)
  }

  const copyText = async (text: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // clipboard API bloklangan bo'lsa — zaxira usul
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy') } catch { /* jim */ }
      ta.remove()
    }
    setCopiedMsg(msg)
  }

  const baseName = title || 'konspekt'

  // Barcha betlarni (yoki orqa fonli sahnalarni) 4× sifatli PNG data-url ga o'giradi.
  const renderAllPages = async (): Promise<string[]> => {
    const els = pageRefs.current.filter(Boolean)
    // Tanlangan shriftni base64 bilan tayyorlaymiz (bir marta, keshlanadi).
    // Bu html-to-image'ning cross-origin CSS o'qib SecurityError berishini oldini oladi.
    let fontEmbedCSS = fontCssCache.current[font.family]
    if (fontEmbedCSS === undefined) {
      try {
        fontEmbedCSS = await buildFontEmbedCSS(font.query)
      } catch {
        fontEmbedCSS = ''
      }
      fontCssCache.current[font.family] = fontEmbedCSS
    }
    const opts = {
      pixelRatio: 3,
      quality: 0.94,
      cacheBust: true,
      // JPEG shaffoflikni qo'llamaydi — fon doim oq bo'lsin (qora fon chiqmasligi uchun).
      backgroundColor: COLORS.bg,
      // fontEmbedCSS bo'lsa — o'shani ishlatamiz (stylesheet skanerlanmaydi).
      // bo'lmasa — skipFonts bilan cross-origin CSS o'qishdan qochamiz.
      ...(fontEmbedCSS ? { fontEmbedCSS } : { skipFonts: true }),
    }
    const urls: string[] = []
    for (let i = 0; i < els.length; i++) {
      setExportStatus({ done: i, total: els.length, phase: 'render' })
      // Brauzerga UI'ni yangilashga imkon beramiz (loading ko'rinsin)
      await new Promise((r) => requestAnimationFrame(() => r(null)))
      // JPEG — ko'p betli konspekt uchun fayl ancha kichik va tez yuklanadi.
      urls.push(await toJpeg(els[i], opts))
    }
    return urls
  }

  // Tayyor PDF faylni yetkazadi. Foydalanuvchi bosishi (gesture) ostida chaqirilsa —
  // Telegram/mobil'da Web Share (native ulashish/saqlash) ishlaydi.
  // 'needGesture' — Web Share yangi bosish talab qilyapti (render uzoq bo'lgani uchun).
  const deliverPdf = async (): Promise<'shared' | 'downloaded' | 'needGesture'> => {
    const item = pendingPdf.current
    if (!item) return 'needGesture'
    const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean; share?: (d: unknown) => Promise<void> }
    // 1) Telegram/mobil uchun eng ishonchli yo'l — Web Share (fayl bilan).
    //    canShare ba'zi Telegram (iOS) versiyalarida noto'g'ri false qaytaradi —
    //    shuning uchun share bor bo'lsa baribir urinib ko'ramiz.
    if (nav.share) {
      try {
        await nav.share({ files: [item.file], title: item.name })
        return 'shared'
      } catch (shareErr) {
        const name = (shareErr as DOMException)?.name
        if (name === 'AbortError') return 'shared' // foydalanuvchi bekor qildi — bu ham "tayyor"
        // Gesture yo'qolgan bo'lsa — keyingi bosishga qoldiramiz
        if (name === 'NotAllowedError') return 'needGesture'
        // boshqa xato (fayl qo'llab-quvvatlanmasa) — yuklab olishga o'tamiz
      }
    }
    // 2) Aks holda — yuklab olish. Telegram WebView blob: ni bloklaydi, data: ishlaydi.
    const a = document.createElement('a')
    a.href = item.dataUrl
    a.download = item.name
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    // 3) Ba'zi WebView'lar download atributini e'tiborsiz qoldiradi —
    //    PDF'ni yangi oynada ochib beramiz (ko'ruvchidan saqlash mumkin).
    try { window.open(item.dataUrl, '_blank') } catch { /* e'tibor bermaymiz */ }
    return 'downloaded'
  }

  // "Saqlash" tugmasi — yangi bosish ostida faylni yetkazadi (Web Share gesture bilan).
  const handleSavePdf = async () => {
    const res = await deliverPdf()
    if (res !== 'needGesture') setPdfReady(null)
  }

  const handlePrint = async () => {
    setPdfReady(null)
    if (pageRefs.current.filter(Boolean).length === 0) return
    setExporting(true)
    setExportStatus({ done: 0, total: pageRefs.current.filter(Boolean).length, phase: 'render' })
    try {
      // Shrift hali tayyor bo'lmasa, biroz kutamiz (lekin cheksiz emas).
      if (!fontReady) {
        try {
          await Promise.race([
            (document as any).fonts?.ready,
            new Promise((r) => setTimeout(r, 1500)),
          ])
        } catch { /* e'tibor bermaymiz */ }
      }
      // Betlarni rasmga o'giramiz, so'ng haqiqiy PDF fayl yasaymiz (jsPDF).
      const urls = await renderAllPages()
      setExportStatus({ done: urls.length, total: urls.length, phase: 'pdf' })
      await new Promise((r) => requestAnimationFrame(() => r(null)))
      const { jsPDF } = await import('jspdf')
      const orientation = exportWmm >= exportHmm ? 'landscape' : 'portrait'
      const pdf = new jsPDF({ unit: 'mm', format: [exportWmm, exportHmm], orientation, compress: true })
      urls.forEach((u, i) => {
        if (i > 0) pdf.addPage([exportWmm, exportHmm], orientation)
        pdf.addImage(u, 'JPEG', 0, 0, exportWmm, exportHmm, undefined, 'FAST')
      })
      const blob = pdf.output('blob')
      const safeName = (baseName || 'konspekt').replace(/[\\/:*?"<>|]+/g, '_').trim() || 'konspekt'
      const fileName = `${safeName}.pdf`
      const file = new File([blob], fileName, { type: 'application/pdf' })

      // Eski faylni tozalab, yangisini eslab qolamiz.
      if (pendingPdf.current) URL.revokeObjectURL(pendingPdf.current.url)
      // data: URL — Telegram WebView blob: yuklashni ko'pincha bloklaydi, data: esa ishlaydi.
      const dataUrl = pdf.output('datauristring')
      pendingPdf.current = { file, url: URL.createObjectURL(blob), dataUrl, name: fileName }

      // MUHIM: render bir necha soniya davom etadi, shu sabab dastlabki bosishning
      // "user activation"i tugaydi. Web Share (ayniqsa iOS Telegram) esa YANGI bosish
      // talab qiladi. Shuning uchun render tugagach avtomatik yubormaymiz —
      // yashil "Saqlash" tugmasini ko'rsatamiz. Foydalanuvchi bosganda (yangi gesture)
      // deliverPdf ishlaydi. navigator.share bo'lmasa (desktop) — darrov yuklab olamiz.
      const canWebShare = typeof (navigator as Navigator & { share?: unknown }).share === 'function'
      if (canWebShare) {
        setPdfReady({ name: fileName })
        setCopiedMsg(t('konspekt.pdfReadyHint', 'PDF tayyor — "Saqlash" tugmasini bosing'))
      } else {
        await deliverPdf()
        setPdfReady(null)
      }
    } catch (e) {
      console.error('PDF eksport xatosi:', e)
      setImportError(t('konspekt.pdfError', "PDF yasashda xatolik yuz berdi. Qaytadan urinib ko'ring."))
    } finally {
      setExporting(false)
      setExportStatus(null)
    }
  }

  const renderLine = (line: ParsedLine, i: number) => {
    // Tabiiy qo'lyozma tebranishi (realizm) — deterministik, har renderда bir xil
    const bls: React.CSSProperties = realistic
      ? {
          ...baseLineStyle,
          fontSize: `${effFontMm * (1 + (seededRand(line.text + '|s' + i) - 0.5) * 0.07)}mm`,
          marginLeft: `${(seededRand(line.text + '|x' + i) - 0.5) * 1.6}mm`,
          transform: `rotate(${(seededRand(line.text + '|r' + i) - 0.5) * 1.2}deg) translateY(${(seededRand(line.text + '|y' + i) - 0.5) * 0.7}mm)`,
          transformOrigin: 'left bottom',
        }
      : baseLineStyle
    switch (line.kind) {
      case 'gap':
        return <div key={i} style={{ height: `${gapMm}mm` }} />
      case 'heading':
        return (
          <div key={i} style={bls}>
            <span style={{ color: COLORS.heading, textDecoration: 'underline', fontWeight: 700 }}>
              {line.text}
            </span>
          </div>
        )
      case 'star':
        return (
          <div key={i} style={bls}>
            <span style={{ color: COLORS.star, marginRight: '1.5mm' }}>★</span>
            <span style={{ color: COLORS.heading, textDecoration: 'underline', fontWeight: 700 }}>
              {line.text}
            </span>
          </div>
        )
      case 'bullet':
        return (
          <div key={i} style={{ ...bls, paddingLeft: `${1.3 * cell}mm` }}>
            <span style={{ marginRight: '1.5mm' }}>—</span>
            <span>{renderWithHearts(line.text)}</span>
          </div>
        )
      case 'quote':
        return (
          <div key={i} style={{ ...bls, color: COLORS.quote, fontStyle: 'italic' }}>
            {line.text}
          </div>
        )
      case 'summary': {
        // "Xulosa: ..." — belgidan oldingi qism qizil, qolgani siyoh, ♥ qizil
        const colonIdx = line.text.indexOf(':')
        const label = colonIdx >= 0 ? line.text.slice(0, colonIdx + 1) : ''
        const rest = colonIdx >= 0 ? line.text.slice(colonIdx + 1) : line.text
        return (
          <div key={i} style={bls}>
            {label && <span style={{ color: COLORS.heading, fontWeight: 700, marginRight: '1mm' }}>{label}</span>}
            <span>{renderWithHearts(rest)}</span>
          </div>
        )
      }
      default:
        return (
          <div key={i} style={bls}>
            {renderWithHearts(line.text)}
          </div>
        )
    }
  }

  const buildPage = (pageLines: ParsedLine[], idx: number, registerRef = true) => {
    // Kitob ko'rinishi: qizil chiziq betma-bet almashadi (faqat A5). A4'da qizil chiziq yo'q.
    // 1-bet (idx 0) → o'ng, 2-bet → chap, 3-bet → o'ng ...
    const redOnRight = !isA4 && bookMode && idx % 2 === 0
    const redLineStyle: React.CSSProperties = redOnRight
      ? { position: 'absolute', top: 0, bottom: 0, right: `${redLineLeft}mm`, width: '0.6mm', background: COLORS.redBorder }
      : { position: 'absolute', top: 0, bottom: 0, left: `${redLineLeft}mm`, width: '0.6mm', background: COLORS.redBorder }
    // Qizil chiziq o'ngda bo'lsa, kontent chapga suriladi (chegaralar teskari)
    const pageContentStyle: React.CSSProperties = redOnRight
      ? { position: 'absolute', top: `${topOffsetMm}mm`, left: `${contentRight}mm`, right: `${contentLeft}mm` }
      : { ...contentStyle }
    const adj = getAdj(idx) // shu bet uchun alohida sozlama
    // Sahna ildizi (eksport uchun ref shu yerda) — o'lcham + kesish.
    const sceneStyle: React.CSSProperties = {
      width: `${exportWmm}mm`,
      height: `${exportHmm}mm`,
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box',
    }
    // Ichki qatlam: yorug'lik/kontrast/rang butun sahnaga (bet + fon) qo'llanadi — foto filtridek.
    const sceneInnerStyle: React.CSSProperties = {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      filter: `brightness(${adj.bright}%) contrast(${adj.contrast}%) saturate(${adj.saturate}%)`,
    }
    const pageWithShadow: React.CSSProperties = bgImage
      ? {
          ...pageStyle,
          position: 'relative',
          zIndex: 1,
          boxShadow: '0 6mm 12mm rgba(0,0,0,0.35)',
          borderRadius: '1mm',
          transform: `rotate(${adj.tilt}deg) scale(${adj.pageZoom})`,
        }
      : pageStyle
    return (
    <div
      key={idx}
      ref={(el) => { if (!registerRef) return; if (el) pageRefs.current[idx] = el; else delete pageRefs.current[idx] }}
      style={sceneStyle}
    >
    <div style={sceneInnerStyle}>
    {bgImage && (
      <img
        src={bgImage}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${adj.zoom}) translate(${adj.x}%, ${adj.y}%) rotate(${adj.bgRot}deg)`,
          transformOrigin: 'center',
          zIndex: 0,
        }}
      />
    )}
    <div style={pageWithShadow}>
      {/* Qizil chegara chizig'i — faqat A5 (A4 referatда qizil chiziq bo'lmaydi) */}
      {!isA4 && <div style={redLineStyle} />}
      {/* Kontent */}
      <div style={pageContentStyle}>
        {idx === 0 && title && (
          <div style={{ marginBottom: `${cell}mm`, textAlign: 'center' }}>
            <div
              style={{
                fontFamily,
                fontWeight: 700,
                fontSize: `${effFontMm * 1.8}mm`,
                color: COLORS.title,
                lineHeight: 1.1,
              }}
            >
              {title}
            </div>
            <div
              style={{
                height: '0.6mm',
                width: '48mm',
                background: COLORS.titleTag,
                margin: '1mm auto 0',
                borderRadius: '0.3mm',
              }}
            />
          </div>
        )}
        {pageLines.map(renderLine)}
      </div>
    </div>
    {/* Foto realizm: donadorlik (grain) + chekka qorayishi (vinetka) */}
    {realistic && (
      <>
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
            backgroundImage: GRAIN_URI, backgroundSize: '140px 140px', opacity: 0.05,
          }}
        />
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.16) 100%)',
          }}
        />
      </>
    )}
    </div>
    </div>
    )
  }

  const labelSx = { fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', mb: 0.5, display: 'block' } as const

  // Joriy bet (carousel) — chegaraga bog'langan
  const curIdx = Math.min(curPage, Math.max(0, pages.length - 1))
  const cur = getAdj(curIdx)

  // Joriy bet sozlamalari (inline panel va mobil dialogda qayta ishlatiladi)
  const pageSettingsContent = (
    <>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' },
          columnGap: 2,
          rowGap: 1,
          alignItems: 'end',
        }}
      >
        <Box>
          <Typography sx={labelSx}>{t('konspekt.pageZoom', 'Bet kattaligi')}: {cur.pageZoom.toFixed(2)}×</Typography>
          <Slider value={cur.pageZoom} min={0.5} max={2} step={0.02} size="small" onChange={(_, v) => setAdj(curIdx, { pageZoom: v as number })} />
        </Box>
        <Box>
          <Typography sx={labelSx}>{t('konspekt.pageTilt', 'Qiyshiqlik')}: {cur.tilt}°</Typography>
          <Slider value={cur.tilt} min={-12} max={12} step={0.5} size="small" onChange={(_, v) => setAdj(curIdx, { tilt: v as number })} />
        </Box>
        <Box>
          <Typography sx={labelSx}>{t('konspekt.bgZoom', 'Yaqinlashtirish')}: {cur.zoom.toFixed(2)}×</Typography>
          <Slider value={cur.zoom} min={1} max={4} step={0.05} size="small" onChange={(_, v) => setAdj(curIdx, { zoom: v as number })} />
        </Box>
        <Box>
          <Typography sx={labelSx}>{t('konspekt.bgPosX', 'Gorizontal')}: {cur.x}%</Typography>
          <Slider value={cur.x} min={-50} max={50} step={1} size="small" onChange={(_, v) => setAdj(curIdx, { x: v as number })} />
        </Box>
        <Box>
          <Typography sx={labelSx}>{t('konspekt.bgPosY', 'Vertikal')}: {cur.y}%</Typography>
          <Slider value={cur.y} min={-50} max={50} step={1} size="small" onChange={(_, v) => setAdj(curIdx, { y: v as number })} />
        </Box>
        <Box>
          <Typography sx={labelSx}>{t('konspekt.bgRotate', 'Fon burish')}: {cur.bgRot}°</Typography>
          <Slider value={cur.bgRot} min={-180} max={180} step={1} size="small" onChange={(_, v) => setAdj(curIdx, { bgRot: v as number })} />
        </Box>
        <Box>
          <Typography sx={labelSx}>{t('konspekt.bright', "Yorug'lik")}: {cur.bright}%</Typography>
          <Slider value={cur.bright} min={30} max={200} step={1} size="small" onChange={(_, v) => setAdj(curIdx, { bright: v as number })} />
        </Box>
        <Box>
          <Typography sx={labelSx}>{t('konspekt.contrast', 'Kontrast')}: {cur.contrast}%</Typography>
          <Slider value={cur.contrast} min={30} max={200} step={1} size="small" onChange={(_, v) => setAdj(curIdx, { contrast: v as number })} />
        </Box>
        <Box>
          <Typography sx={labelSx}>{t('konspekt.saturate', 'Rang to\'yinganligi')}: {cur.saturate}%</Typography>
          <Slider value={cur.saturate} min={0} max={200} step={1} size="small" onChange={(_, v) => setAdj(curIdx, { saturate: v as number })} />
        </Box>
      </Box>
      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
        <Button size="small" color="inherit" startIcon={<RestartAlt />} onClick={() => setAdj(curIdx, DEFAULT_ADJUST)}>
          {t('konspekt.bgReset', "Shu betni asliga qaytarish")}
        </Button>
        {pages.length > 1 && (
          <Button size="small" startIcon={<Layers />} onClick={() => setConfirmApplyAll(true)}>
            {t('konspekt.applyAll', "Barcha betlarga qo'llash")}
          </Button>
        )}
      </Stack>
    </>
  )

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 1.5, sm: 3 }, px: { xs: 1.5, sm: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 1.5, sm: 2 } }}>
        <IconButton onClick={onBack} size="small" edge="start">
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {t('konspekt.title', 'Konspekt generatori')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('konspekt.subtitle', "Katakli daftar uslubidagi A5 konspekt")}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        {/* ——— Tahrirlash + sozlamalar ——— */}
        <Stack spacing={2} sx={{ minWidth: 0 }}>
          <Card variant="outlined">
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.txt,.md"
                hidden
                onChange={handleFileUpload}
              />
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={importing ? <CircularProgress size={16} color="inherit" /> : <UploadFile />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                >
                  {t('konspekt.uploadWord', 'Word / matn yuklash')}
                </Button>
                {text.trim() && (
                  <Button size="small" color="inherit" onClick={() => setText('')}>
                    {t('konspekt.clear', 'Tozalash')}
                  </Button>
                )}
              </Stack>
              {importError && (
                <Typography variant="caption" color="error" display="block" sx={{ mb: 1 }}>
                  {importError}
                </Typography>
              )}

              <TextField
                multiline
                minRows={8}
                maxRows={20}
                fullWidth
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={DEFAULT_TEXT}
                sx={{ '& textarea': { fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.5 } }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', lineHeight: 1.6 }}>
                {t('konspekt.syntax', "@title: sarlavha · * ★sarlavha · # qizil sarlavha · - bullet · > iqtibos · = xulosa · bo'sh satr = bo'shliq")}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AutoAwesome />}
                  onClick={() => copyText(PROMPT_TEXT, t('konspekt.promptCopied', 'Prompt nusxalandi — AI\'ga qo\'ying'))}
                >
                  {t('konspekt.copyPrompt', 'AI prompt nusxalash')}
                </Button>
                <Button
                  size="small"
                  variant="text"
                  startIcon={<ContentCopy />}
                  onClick={() => copyText(DEFAULT_TEXT, t('konspekt.exampleCopied', 'Namuna nusxalandi'))}
                >
                  {t('konspekt.copyExample', 'Namuna nusxalash')}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                {t('konspekt.settings', 'Sozlamalar')}
              </Typography>

              {/* Shrift tanlash */}
              <TextField
                select
                fullWidth
                size="small"
                label={t('konspekt.font', 'Qo\'lyozma shrifti')}
                value={fontIdx}
                onChange={(e) => setFontIdx(Number(e.target.value))}
                sx={{ mb: 2 }}
              >
                <ListSubheader>{t('konspekt.fontCursive', "Cursive — harflar ulangan")}</ListSubheader>
                {FONTS.map((f, i) => f.group === 'cursive' && (
                  <MenuItem key={f.family} value={i} sx={{ fontFamily: `'${f.family}', cursive`, fontSize: '1.15rem' }}>
                    {f.label}
                  </MenuItem>
                ))}
                <ListSubheader>{t('konspekt.fontPrint', "Bosma qo'lyozma — ajralgan")}</ListSubheader>
                {FONTS.map((f, i) => f.group === 'print' && (
                  <MenuItem key={f.family} value={i} sx={{ fontFamily: `'${f.family}', cursive`, fontSize: '1.15rem' }}>
                    {f.label}
                  </MenuItem>
                ))}
              </TextField>

              {/* Orqa fon (stol rasmi) */}
              <input
                ref={bgInputRef}
                type="file"
                accept="image/*,.jpg,.jpeg,.png,.heic,.heif,.webp,.gif,.bmp,.avif,.tif,.tiff"
                hidden
                onChange={handleBgUpload}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Wallpaper />}
                  onClick={() => bgInputRef.current?.click()}
                >
                  {bgImage
                    ? t('konspekt.changeBg', "Orqa fonni almashtirish")
                    : t('konspekt.addBg', "Orqa fon (stol rasmi)")}
                </Button>
                {bgImage && (
                  <>
                    <Box
                      component="img"
                      src={bgImage}
                      sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
                    />
                    <Button size="small" color="inherit" onClick={() => setBgImage(null)}>
                      {t('konspekt.removeBg', "Olib tashlash")}
                    </Button>
                  </>
                )}
              </Box>

              {bgImage && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  {t('konspekt.bgPerPageHint', "Fon yaqinlashtirish, joyi, burish va bet qiyshiqligi — har bet uchun alohida “Natijani ko'rish” oynasida sozlanadi.")}
                </Typography>
              )}

              {/* Slayderlar */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  columnGap: 3,
                  rowGap: 1,
                }}
              >
                <Box>
                  <Typography component="label" sx={labelSx}>
                    {t('konspekt.fontSize', "Yozuv o'lchami")}: {fontMm.toFixed(1)}mm
                  </Typography>
                  <Slider value={fontMm} min={5} max={7} step={0.1} onChange={(_, v) => setFontMm(v as number)} size="small" />
                </Box>
                {!isA4 && (
                  <>
                    <Box>
                      <Typography component="label" sx={labelSx}>
                        {t('konspekt.leftMargin', "Chap bo'shliq")}: {leftMm}mm
                      </Typography>
                      <Slider value={leftMm} min={0.5} max={20} step={0.5} onChange={(_, v) => setLeftMm(v as number)} size="small" />
                    </Box>
                    <Box>
                      <Typography component="label" sx={labelSx}>
                        {t('konspekt.rightMargin', "O'ng bo'shliq")}: {rightMm}mm
                      </Typography>
                      <Slider value={rightMm} min={0.5} max={20} step={0.5} onChange={(_, v) => setRightMm(v as number)} size="small" />
                    </Box>
                  </>
                )}
                {isA4 && (
                  <Box>
                    <Typography component="label" sx={labelSx}>
                      {t('konspekt.lineSpacing', 'Qatorlar oralig\'i')}: {lineSpacingMm}mm
                    </Typography>
                    <Slider value={lineSpacingMm} min={5} max={16} step={0.5} onChange={(_, v) => setLineSpacingMm(v as number)} size="small" />
                  </Box>
                )}
              </Box>

              {/* A4 (referat) qirralari — qo'lda kiritiladi (sm) */}
              {isA4 && (
                <Box sx={{ mt: 1.5 }}>
                  <Typography sx={labelSx}>{t('konspekt.a4Margins', "Qirralar (sm)")}</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
                    {([
                      ['a4Left', "Chap", a4LeftMm, setA4LeftMm],
                      ['a4Right', "O'ng", a4RightMm, setA4RightMm],
                      ['a4Top', "Yuqori", a4TopMm, setA4TopMm],
                      ['a4Bottom', "Past", a4BottomMm, setA4BottomMm],
                    ] as const).map(([key, def, valMm, setter]) => (
                      <TextField
                        key={key}
                        label={t(`konspekt.${key}`, def)}
                        type="number"
                        size="small"
                        value={+(valMm / 10).toFixed(2)}
                        onChange={(e) => {
                          const cm = parseFloat(e.target.value)
                          if (!isNaN(cm) && cm >= 0 && cm <= 10) setter(cm * 10)
                        }}
                        inputProps={{ step: 0.5, min: 0, max: 10 }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              <Divider sx={{ my: 1.5 }} />

              {/* Tugma-tanlovlar */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1.5, sm: 2.5 } }}>
                <Box>
                  <Typography component="label" sx={labelSx}>{t('konspekt.format', 'Format')}</Typography>
                  <ToggleButtonGroup size="small" exclusive value={paper} onChange={(_, v) => v && setPaper(v)}>
                    <ToggleButton value="grid">{t('konspekt.formatGrid', "Katakli (A5)")}</ToggleButton>
                    <ToggleButton value="lined">{t('konspekt.formatA4', 'A4')}</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                {!isA4 && (
                  <Box>
                    <Typography component="label" sx={labelSx}>{t('konspekt.cellSize', "Katak")}</Typography>
                    <ToggleButtonGroup size="small" exclusive value={cellMm} onChange={(_, v) => v && setCellMm(v)}>
                      <ToggleButton value={3.75}>3.75</ToggleButton>
                      <ToggleButton value={4}>4.0</ToggleButton>
                      <ToggleButton value={5}>5.0</ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                )}
                <Box>
                  <Typography component="label" sx={labelSx}>{t('konspekt.ink', 'Siyoh')}</Typography>
                  <ToggleButtonGroup size="small" exclusive value={ink} onChange={(_, v) => v && setInk(v)}>
                    <ToggleButton value="blue">{t('konspekt.blue', "Ko'k")}</ToggleButton>
                    <ToggleButton value="black">{t('konspekt.black', 'Qora')}</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                {!isA4 && (
                  <Box>
                    <Typography component="label" sx={labelSx}>{t('konspekt.book', "Kitob ko'rinishi")}</Typography>
                    <ToggleButtonGroup size="small" exclusive value={bookMode} onChange={(_, v) => v !== null && setBookMode(v)}>
                      <ToggleButton value={false}>{t('konspekt.off', "O'chiq")}</ToggleButton>
                      <ToggleButton value={true}>{t('konspekt.on', 'Yoniq')}</ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                )}
                <Box>
                  <Typography component="label" sx={labelSx}>{t('konspekt.realistic', "Tabiiylik (realizm)")}</Typography>
                  <ToggleButtonGroup size="small" exclusive value={realistic} onChange={(_, v) => v !== null && setRealistic(v)}>
                    <ToggleButton value={false}>{t('konspekt.off', "O'chiq")}</ToggleButton>
                    <ToggleButton value={true}>{t('konspekt.on', 'Yoniq')}</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Natijani ko'rish — dialogda A5 ko'rinishini ochadi */}
          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={<Visibility />}
            onClick={() => setPreviewOpen(true)}
            disabled={!text.trim()}
          >
            {t('konspekt.viewResult', 'Natijani ko\'rish')}
            {pages.length > 0 && ` (${pages.length} ${t('konspekt.pages', 'bet')})`}
          </Button>
        </Stack>
      </Box>

      {/* ——— Natija dialogi: A5 ko'rinish + PDF yuklab olish ——— */}
      <Dialog
        fullScreen
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      >
        <AppBar position="sticky" color="default" elevation={1}>
          <Toolbar sx={{ gap: 1 }}>
            <IconButton edge="start" onClick={() => setPreviewOpen(false)}>
              <Close />
            </IconButton>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, flexGrow: 1, fontSize: { xs: '0.95rem', sm: '1rem' }, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {t('konspekt.preview', "Ko'rinish")} · {pages.length} {t('konspekt.pages', 'bet')}
            </Typography>
            {/* Mobilda sozlamalar — alohida tugma → dialog */}
            {bgImage && isMobile && (
              <IconButton onClick={() => setSettingsDialogOpen(true)} sx={{ flexShrink: 0 }}>
                <Tune />
              </IconButton>
            )}
            <Button
              variant="contained"
              color={pdfReady ? 'success' : 'primary'}
              startIcon={exporting ? <CircularProgress size={18} color="inherit" /> : pdfReady ? <Download /> : <PictureAsPdf />}
              onClick={pdfReady ? handleSavePdf : handlePrint}
              disabled={exporting}
              sx={{ flexShrink: 0, px: { xs: 1.25, sm: 2 } }}
            >
              {exporting
                ? t('konspekt.preparing', 'Tayyorlanmoqda...')
                : pdfReady
                ? t('konspekt.savePdf', 'Saqlash')
                : (
                  <>
                    <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{t('konspekt.downloadPdf', 'PDF yuklab olish')}</Box>
                    <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>PDF</Box>
                  </>
                )}
            </Button>
          </Toolbar>
        </AppBar>

        {/* Joriy bet sozlamalari — INLINE (faqat tablet/desktop, orqa fon bo'lsa) */}
        {bgImage && !isMobile && (
          <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Box
              onClick={() => setControlsOpen((o) => !o)}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', mb: controlsOpen ? 0.5 : 0 }}
            >
              <Tune sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, flexGrow: 1 }}>
                {curIdx + 1}-{t('konspekt.pageSettings', 'bet sozlamalari')}
              </Typography>
              {controlsOpen ? <ExpandLess sx={{ color: 'text.secondary' }} /> : <ExpandMore sx={{ color: 'text.secondary' }} />}
            </Box>
            <Collapse in={controlsOpen}>{pageSettingsContent}</Collapse>
          </Box>
        )}

        {/* Bir bet — tugma/swipe bilan o'tiladi */}
        <Box
          sx={{
            position: 'relative',
            flexGrow: 1,
            minHeight: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'action.hover',
            overflow: 'hidden',
          }}
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return
            const dx = e.changedTouches[0].clientX - touchStartX.current
            if (dx > 45 && curIdx > 0) setCurPage(curIdx - 1)
            else if (dx < -45 && curIdx < pages.length - 1) setCurPage(curIdx + 1)
            touchStartX.current = null
          }}
        >
          {/* Chap tugma */}
          {pages.length > 1 && (
            <IconButton
              onClick={() => setCurPage((p) => Math.max(0, p - 1))}
              disabled={curIdx === 0}
              sx={{ position: 'absolute', left: 4, zIndex: 2, bgcolor: 'background.paper', boxShadow: 2, '&:hover': { bgcolor: 'background.paper' } }}
            >
              <ChevronLeft />
            </IconButton>
          )}

          {/* Faqat joriy bet — qat'iy o'lchamli konteyner, doim aniq o'rtada turadi */}
          <Box ref={previewBoxRef} sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 1.5, sm: 3 }, overflow: 'hidden' }}>
            <Box
              sx={{
                width: `calc(${exportWmm}mm * ${previewScale})`,
                height: `calc(${exportHmm}mm * ${previewScale})`,
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              <Box sx={{ transform: `scale(${previewScale})`, transformOrigin: 'top left', boxShadow: bgImage ? 0 : 3 }}>
                {pages[curIdx] && buildPage(pages[curIdx], curIdx, false)}
              </Box>
            </Box>
          </Box>

          {/* O'ng tugma */}
          {pages.length > 1 && (
            <IconButton
              onClick={() => setCurPage((p) => Math.min(pages.length - 1, p + 1))}
              disabled={curIdx === pages.length - 1}
              sx={{ position: 'absolute', right: 4, zIndex: 2, bgcolor: 'background.paper', boxShadow: 2, '&:hover': { bgcolor: 'background.paper' } }}
            >
              <ChevronRight />
            </IconButton>
          )}

          {/* Bet indikatori */}
          <Typography
            variant="caption"
            sx={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', px: 1.25, py: 0.25, borderRadius: 10 }}
          >
            {curIdx + 1} / {pages.length}
          </Typography>
        </Box>

        {/* Eksport uchun barcha betlar (ko'rinmas, off-screen) */}
        <Box aria-hidden sx={{ position: 'fixed', left: -99999, top: 0, pointerEvents: 'none', opacity: 0 }}>
          {pages.map((pageLines, idx) => (
            <div key={idx}>{buildPage(pageLines, idx, true)}</div>
          ))}
        </Box>
      </Dialog>

      {/* Mobil sozlamalar dialogi (pastdan chiqadigan panel) */}
      <Dialog
        open={settingsDialogOpen && isMobile}
        onClose={() => setSettingsDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        sx={{ '& .MuiDialog-container': { alignItems: 'flex-end' }, '& .MuiPaper-root': { m: 0, width: '100%', maxWidth: '100%', borderRadius: '16px 16px 0 0' } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <Tune sx={{ fontSize: 20, color: 'text.secondary', mr: 1 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, flexGrow: 1 }}>
            {curIdx + 1}-{t('konspekt.pageSettings', 'bet sozlamalari')}
          </Typography>
          <IconButton edge="end" onClick={() => setSettingsDialogOpen(false)}>
            <Close />
          </IconButton>
        </Box>
        <Box sx={{ p: 2 }}>{pageSettingsContent}</Box>
      </Dialog>

      {/* Tasdiqlash: joriy bet sozlamalarini barcha betlarga qo'llash */}
      <Dialog open={confirmApplyAll} onClose={() => setConfirmApplyAll(false)}>
        <DialogTitle>{t('konspekt.applyAllTitle', 'Barcha betlarga qo\'llansinmi?')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('konspekt.applyAllText', "Shu betning barcha sozlamalari (bet kattaligi, qiyshiqlik, fon yaqinlashtirish, joyi va burishi) qolgan barcha betlarga bir xil qo'llanadi. Har bir betning avvalgi sozlamalari o'chadi.")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmApplyAll(false)}>
            {t('common.cancel', 'Bekor qilish')}
          </Button>
          <Button
            variant="contained"
            startIcon={<Layers />}
            onClick={() => { applyAdjustToAll(cur, pages.length); setConfirmApplyAll(false) }}
          >
            {t('konspekt.applyAllConfirm', "Ha, barchasiga qo'llash")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* PDF tayyorlanayotganda — to'liq ekranli loading (foydalanuvchi kutishi uchun) */}
      <Backdrop
        open={!!exportStatus}
        sx={{ zIndex: (theme) => theme.zIndex.modal + 10, color: '#fff', backdropFilter: 'blur(2px)', bgcolor: 'rgba(0,0,0,0.72)' }}
      >
        <Box sx={{ width: 300, maxWidth: '82vw', textAlign: 'center', px: 3 }}>
          <CircularProgress color="inherit" size={52} thickness={4} sx={{ mb: 2.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
            {t('konspekt.pdfPreparing', 'PDF tayyorlanmoqda...')}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85, mb: 2 }}>
            {exportStatus?.phase === 'pdf'
              ? t('konspekt.pdfAssembling', "Fayl yig'ilmoqda, biroz kuting")
              : t('konspekt.pdfRendering', 'Betlar chizilmoqda') +
                (exportStatus ? ` — ${Math.min(exportStatus.done + 1, exportStatus.total)} / ${exportStatus.total} ${t('konspekt.pages', 'bet')}` : '')}
          </Typography>
          <LinearProgress
            variant={exportStatus?.phase === 'pdf' ? 'indeterminate' : 'determinate'}
            value={exportStatus ? (exportStatus.done / Math.max(1, exportStatus.total)) * 100 : 0}
            sx={{ height: 8, borderRadius: 5, bgcolor: 'rgba(255,255,255,0.25)', '& .MuiLinearProgress-bar': { borderRadius: 5 } }}
          />
          <Typography variant="caption" sx={{ display: 'block', mt: 1.5, opacity: 0.7 }}>
            {t('konspekt.pdfWait', "Iltimos, oynani yopmang")}
          </Typography>
        </Box>
      </Backdrop>

      {/* Nusxalash tasdiqi */}
      <Snackbar
        open={!!copiedMsg}
        autoHideDuration={2500}
        onClose={() => setCopiedMsg('')}
        message={copiedMsg}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  )
}
