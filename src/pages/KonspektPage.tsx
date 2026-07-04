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
  AppBar,
  Toolbar,
} from '@mui/material'
import { ArrowBack, UploadFile, PictureAsPdf, Visibility, Close } from '@mui/icons-material'
import { toPng } from 'html-to-image'
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

const DEFAULT_TEXT = `@title: Vatan muqaddas

# Reja:
1. Vatan tushunchasi
2. Vatan nima uchun muqaddas?

* Vatan tushunchasi
- Inson tug'ilib o'sgan yurt.
- Ota-bobolar yashagan zamin.

* Nima uchun muqaddas?
- Ona kabi aziz va tabarruk.
> "Vatan ostonadan boshlanadi."

= Xulosa: Vatan bitta, muqaddas! ♥`

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
  const [previewOpen, setPreviewOpen] = useState(false)
  const [fontIdx, setFontIdx] = useState(0)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [fontReady, setFontReady] = useState(false)
  const pageRefs = useRef<HTMLDivElement[]>([])
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
  useEffect(() => {
    setFontReady(false)
    const fonts = (document as any).fonts
    if (fonts?.load) {
      Promise.all([
        fonts.load(`600 20px "${font.family}"`),
        fonts.load(`700 20px "${font.family}"`),
      ])
        .then(() => setFontReady(true))
        .catch(() => setFontReady(true))
    } else {
      setFontReady(true)
    }
  }, [font.family])

  // Preview'ni konteyner kengligiga qarab masshtablaymiz (mobile responsive)
  useEffect(() => {
    const el = previewBoxRef.current
    if (!el) return
    const A5_WIDTH_PX = (145 * 96) / 25.4 // 145mm ≈ 548px @96dpi
    const update = () => {
      const cs = getComputedStyle(el)
      const pad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)
      const avail = el.clientWidth - pad
      // desktop'da 0.85 gacha, mobile'da kenglikka to'liq sig'adi
      setPreviewScale(Math.max(0.2, Math.min(0.85, avail / A5_WIDTH_PX)))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [previewOpen])

  // —— Hisoblangan o'lchamlar (mm) ——
  const cell = cellMm
  const redLineLeft = 3 * cell // 11.25mm
  const contentLeft = redLineLeft + leftMm // qizil chiziqdan matngacha bo'shliq (foydalanuvchi boshqaradi)
  const contentRight = rightMm // o'ng bo'shliq (mm) — foydalanuvchi boshqaradi
  const lineHeight = 2 * cell // yozuv qatori = 2 katak

  const fontFamily = `'${font.family}', cursive`
  // Har bir shriftning x-balandligi turlicha — effektiv o'lcham koeffitsient bilan moslanadi.
  const effFontMm = fontMm * font.scale

  // —— Ko'p sahifali bo'lish (pagination) ——
  // Matn bir A5 betga sig'masa, avtomatik yangi betlarga bo'linadi.
  const pages = useMemo(() => {
    const topMm = 2 * cell
    const bottomReserveMm = 8 // pastda ≥8mm bo'sh joy qoladi (kesilmaydi)
    const usableMm = 210 - topMm - bottomReserveMm
    // Sarlavha bloki (faqat 1-betda) taxminiy balandligi
    const titleBlockMm = title ? fontMm * 1.98 + 1.6 + cell : 0

    // Kontent kengligi (mm) va bitta qatorga sig'adigan taxminiy belgi soni —
    // uzun matn bir necha vizual qatorga o'ralishini hisobga olamiz.
    const contentWidthMm = 145 - contentLeft - contentRight
    const avgCharMm = fontMm * 0.34 // Caveat o'rtacha belgi kengligi
    const charsPerLine = Math.max(8, Math.floor(contentWidthMm / avgCharMm))
    const lineMm = (l: ParsedLine) => {
      if (l.kind === 'gap') return cell
      const rows = Math.max(1, Math.ceil((l.text.length || 1) / charsPerLine))
      return rows * 2 * cell
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
  }, [lines, cell, fontMm, title])

  const pageStyle: React.CSSProperties = {
    width: '145mm',
    height: '210mm',
    background: COLORS.bg,
    position: 'relative',
    overflow: 'hidden',
    boxSizing: 'border-box',
    // Katak (grid): ikki linear-gradient
    backgroundImage: `linear-gradient(${COLORS.grid} 0.18mm, transparent 0.18mm), linear-gradient(90deg, ${COLORS.grid} 0.18mm, transparent 0.18mm)`,
    backgroundSize: `${cell}mm ${cell}mm`,
  }

  const contentStyle: React.CSSProperties = {
    position: 'absolute',
    top: `${2 * cell}mm`, // yuqoridan 2 katak
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

  const baseName = title || 'konspekt'

  // Barcha betlarni 4× sifatli PNG data-url ga o'giradi.
  const renderAllPages = async (): Promise<string[]> => {
    const els = pageRefs.current.filter(Boolean)
    const urls: string[] = []
    for (const el of els) {
      urls.push(
        await toPng(el, { pixelRatio: 4, cacheBust: true, backgroundColor: COLORS.bg })
      )
    }
    return urls
  }

  const handlePrint = async () => {
    if (pageRefs.current.length === 0) return
    setExporting(true)
    try {
      // PDF ni ham aynan shu PNG(lar)dan yasaymiz — rasm va PDF bir xil chiqadi.
      const urls = await renderAllPages()
      const win = window.open('', '_blank', 'width=600,height=800')
      if (!win) return
      const imgs = urls
        .map((u) => `<img class="pg" src="${u}">`)
        .join('')
      win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
        <title>${baseName}</title>
        <style>
          @page { size: 145mm 210mm; margin: 0; }
          html, body { margin: 0; padding: 0; }
          img.pg { display: block; width: 145mm; height: 210mm; page-break-after: always; }
          img.pg:last-child { page-break-after: auto; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        </style></head><body>${imgs}
        <script>
          var imgs = document.images, loaded = 0;
          function done(){ if(++loaded >= imgs.length){ window.focus(); setTimeout(function(){ window.print(); }, 100); } }
          for (var i=0;i<imgs.length;i++){ imgs[i].complete ? done() : imgs[i].onload = done; }
        <\/script></body></html>`)
      win.document.close()
    } catch (e) {
      console.error('PDF eksport xatosi:', e)
    } finally {
      setExporting(false)
    }
  }

  const renderLine = (line: ParsedLine, i: number) => {
    switch (line.kind) {
      case 'gap':
        return <div key={i} style={{ height: `${cell}mm` }} />
      case 'heading':
        return (
          <div key={i} style={baseLineStyle}>
            <span style={{ color: COLORS.heading, textDecoration: 'underline', fontWeight: 700 }}>
              {line.text}
            </span>
          </div>
        )
      case 'star':
        return (
          <div key={i} style={baseLineStyle}>
            <span style={{ color: COLORS.star, marginRight: '1.5mm' }}>★</span>
            <span style={{ color: COLORS.heading, textDecoration: 'underline', fontWeight: 700 }}>
              {line.text}
            </span>
          </div>
        )
      case 'bullet':
        return (
          <div key={i} style={{ ...baseLineStyle, paddingLeft: `${1.3 * cell}mm` }}>
            <span style={{ marginRight: '1.5mm' }}>—</span>
            <span>{renderWithHearts(line.text)}</span>
          </div>
        )
      case 'quote':
        return (
          <div key={i} style={{ ...baseLineStyle, color: COLORS.quote, fontStyle: 'italic' }}>
            {line.text}
          </div>
        )
      case 'summary': {
        // "Xulosa: ..." — belgidan oldingi qism qizil, qolgani siyoh, ♥ qizil
        const colonIdx = line.text.indexOf(':')
        const label = colonIdx >= 0 ? line.text.slice(0, colonIdx + 1) : ''
        const rest = colonIdx >= 0 ? line.text.slice(colonIdx + 1) : line.text
        return (
          <div key={i} style={baseLineStyle}>
            {label && <span style={{ color: COLORS.heading, fontWeight: 700, marginRight: '1mm' }}>{label}</span>}
            <span>{renderWithHearts(rest)}</span>
          </div>
        )
      }
      default:
        return (
          <div key={i} style={baseLineStyle}>
            {renderWithHearts(line.text)}
          </div>
        )
    }
  }

  // Har render'da ref ro'yxatini tozalaymiz
  pageRefs.current = []

  const buildPage = (pageLines: ParsedLine[], idx: number) => {
    // Kitob ko'rinishi: qizil chiziq betma-bet almashadi.
    // 1-bet (idx 0) → o'ng, 2-bet → chap, 3-bet → o'ng ...
    const redOnRight = bookMode && idx % 2 === 0
    const redLineStyle: React.CSSProperties = redOnRight
      ? { position: 'absolute', top: 0, bottom: 0, right: `${redLineLeft}mm`, width: '0.6mm', background: COLORS.redBorder }
      : { position: 'absolute', top: 0, bottom: 0, left: `${redLineLeft}mm`, width: '0.6mm', background: COLORS.redBorder }
    // Qizil chiziq o'ngda bo'lsa, kontent chapga suriladi (chegaralar teskari)
    const pageContentStyle: React.CSSProperties = redOnRight
      ? { position: 'absolute', top: `${2 * cell}mm`, left: `${contentRight}mm`, right: `${contentLeft}mm` }
      : { ...contentStyle }
    return (
    <div
      key={idx}
      ref={(el) => { if (el) pageRefs.current[idx] = el }}
      style={pageStyle}
    >
      {/* Qizil chegara chizig'i (kitob rejimida tomon almashadi) */}
      <div style={redLineStyle} />
      {/* Kontent (hech narsa qizil chiziqdan o'tmaydi) */}
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
    )
  }

  const labelSx = { fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', mb: 0.5, display: 'block' } as const

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
              </Box>

              <Divider sx={{ my: 1.5 }} />

              {/* Tugma-tanlovlar */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1.5, sm: 2.5 } }}>
                <Box>
                  <Typography component="label" sx={labelSx}>{t('konspekt.cellSize', "Katak")}</Typography>
                  <ToggleButtonGroup size="small" exclusive value={cellMm} onChange={(_, v) => v && setCellMm(v)}>
                    <ToggleButton value={3.75}>3.75</ToggleButton>
                    <ToggleButton value={4}>4.0</ToggleButton>
                    <ToggleButton value={5}>5.0</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                <Box>
                  <Typography component="label" sx={labelSx}>{t('konspekt.ink', 'Siyoh')}</Typography>
                  <ToggleButtonGroup size="small" exclusive value={ink} onChange={(_, v) => v && setInk(v)}>
                    <ToggleButton value="blue">{t('konspekt.blue', "Ko'k")}</ToggleButton>
                    <ToggleButton value="black">{t('konspekt.black', 'Qora')}</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                <Box>
                  <Typography component="label" sx={labelSx}>{t('konspekt.book', "Kitob ko'rinishi")}</Typography>
                  <ToggleButtonGroup size="small" exclusive value={bookMode} onChange={(_, v) => v !== null && setBookMode(v)}>
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
            <Typography variant="subtitle1" sx={{ fontWeight: 600, flexGrow: 1 }}>
              {t('konspekt.preview', "Ko'rinish")} · {pages.length} {t('konspekt.pages', 'bet')}
            </Typography>
            <Button
              variant="contained"
              startIcon={exporting ? <CircularProgress size={18} color="inherit" /> : <PictureAsPdf />}
              onClick={handlePrint}
              disabled={exporting || !fontReady}
            >
              {exporting
                ? t('konspekt.preparing', 'Tayyorlanmoqda...')
                : t('konspekt.downloadPdf', 'PDF yuklab olish')}
            </Button>
          </Toolbar>
        </AppBar>

        <Box
          ref={previewBoxRef}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            bgcolor: 'action.hover',
            p: { xs: 1.5, sm: 3 },
            flexGrow: 1,
            minHeight: 0,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {pages.map((pageLines, idx) => (
            <Box
              key={idx}
              sx={{
                width: `calc(145mm * ${previewScale})`,
                height: `calc(210mm * ${previewScale})`,
                flexShrink: 0,
              }}
            >
              <Box sx={{ transform: `scale(${previewScale})`, transformOrigin: 'top left', boxShadow: 3 }}>
                {buildPage(pageLines, idx)}
              </Box>
            </Box>
          ))}
        </Box>
      </Dialog>
    </Container>
  )
}
