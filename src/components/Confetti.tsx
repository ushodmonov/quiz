import { useEffect, useRef } from 'react'

interface ConfettiProps {
  /** Zarrachalar soni. */
  count?: number
  /** Animatsiya davomiyligi (ms). */
  duration?: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rotation: number
  vr: number
  shape: 'rect' | 'circle'
}

const COLORS = ['#1a73e8', '#34a853', '#fbbc04', '#ea4335', '#ff6d00', '#a142f4', '#00bcd4']

/**
 * Yengil, bog'liqliksiz konfetti — mount bo'lganda bir marta otiladi.
 * Telegram Mini App va brauzerda ishlaydi, `prefers-reduced-motion` hurmat qilinadi.
 */
export default function Confetti({ count = 140, duration = 2600 }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let W = window.innerWidth
    let H = window.innerHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    const handleResize = () => {
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      ctx.scale(dpr, dpr)
    }
    window.addEventListener('resize', handleResize)

    // Ikki manbadan otamiz (chap-past, o'ng-past) — yuqoriga qarab
    const particles: Particle[] = []
    for (let i = 0; i < count; i++) {
      const fromLeft = i < count / 2
      const angle = (fromLeft ? -60 : -120) * (Math.PI / 180) + (Math.random() - 0.5) * 0.9
      const speed = 10 + Math.random() * 12
      particles.push({
        x: fromLeft ? W * 0.1 : W * 0.9,
        y: H * 0.9,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 6 + Math.random() * 8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
      })
    }

    const gravity = 0.32
    const drag = 0.992
    const start = performance.now()
    let raf = 0

    const frame = (now: number) => {
      const elapsed = now - start
      ctx.clearRect(0, 0, W, H)

      const fade = elapsed > duration - 600 ? Math.max(0, (duration - elapsed) / 600) : 1

      for (const p of particles) {
        p.vx *= drag
        p.vy = p.vy * drag + gravity
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.vr

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.globalAlpha = fade
        ctx.fillStyle = p.color
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }

      if (elapsed < duration) {
        raf = requestAnimationFrame(frame)
      } else {
        ctx.clearRect(0, 0, W, H)
      }
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', handleResize)
    }
  }, [count, duration])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1400,
      }}
    />
  )
}
