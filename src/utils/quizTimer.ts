/** Qolgan soniyalar (`timerEndsAt` — ms timestamp). */
export function getRemainingSeconds(timerEndsAt: number | undefined): number | null {
  if (timerEndsAt == null) return null
  return Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000))
}

/** `MM:SS` yoki `H:MM:SS` */
export function formatTimerDisplay(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }
  return `${m}:${String(sec).padStart(2, '0')}`
}
