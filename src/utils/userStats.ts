import type { Question } from '../types'

/**
 * Foydalanuvchi statistikasi, streak, SRS (xatolar ustida ishlash — Leitner)
 * va bookmark — barchasi localStorage'da, backendsiz.
 *
 * Barcha funksiyalar localStorage xatolariga chidamli (try/catch) — quota
 * to'lsa yoki o'qish imkonsiz bo'lsa, jim defaultga qaytadi.
 */

const STATS_KEY = 'quiz_stats'
const STREAK_KEY = 'quiz_streak'
const SRS_KEY = 'quiz_srs'
const BOOKMARKS_KEY = 'quiz_bookmarks'
const ACTIVITY_KEY = 'quiz_activity'

const ACTIVITY_MAX_DAYS = 180

const DAY_MS = 24 * 60 * 60 * 1000
const MAX_HISTORY = 50
const MAX_SRS_ITEMS = 800

// ——————————————————————————————————————————————————————————————
// Umumiy yordamchilar
// ——————————————————————————————————————————————————————————————

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.warn(`${key} saqlanmadi (localStorage to'la bo'lishi mumkin):`, error)
  }
}

/** djb2 — savol matnidan qisqa, barqaror hash. */
function hashStr(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0
  }
  return (h >>> 0).toString(36)
}

/** Mahalliy sana — `YYYY-MM-DD` (streak hisoblash uchun). */
function localDateStr(ts: number): string {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function daysBetween(aDate: string, bDate: string): number {
  const a = new Date(`${aDate}T00:00:00`).getTime()
  const b = new Date(`${bDate}T00:00:00`).getTime()
  return Math.round((b - a) / DAY_MS)
}

/** Savolning barqaror kaliti — fileId + matn hash. SRS/bookmark identifikatori. */
export function questionKey(fileId: string, question: Question): string {
  return `${fileId}::${hashStr(question.text || '')}`
}

/** localStorage quotasini tejash uchun base64 rasmlarni olib tashlaymiz. */
function stripImages(question: Question): Question {
  return {
    ...question,
    answers: question.answers.map(({ imageData: _imageData, ...rest }) => rest),
  }
}

// ——————————————————————————————————————————————————————————————
// Statistika
// ——————————————————————————————————————————————————————————————

export interface TestHistoryEntry {
  fileId: string
  fileName: string
  correct: number
  incorrect: number
  total: number
  percentage: number
  timestamp: number
}

export interface SubjectStat {
  name: string
  tests: number
  correct: number
  incorrect: number
}

export interface StatsData {
  totalTests: number
  totalCorrect: number
  totalIncorrect: number
  history: TestHistoryEntry[]
  subjects: Record<string, SubjectStat>
}

const EMPTY_STATS: StatsData = {
  totalTests: 0,
  totalCorrect: 0,
  totalIncorrect: 0,
  history: [],
  subjects: {},
}

export function loadStats(): StatsData {
  const s = readJson<StatsData>(STATS_KEY, EMPTY_STATS)
  return {
    totalTests: s.totalTests || 0,
    totalCorrect: s.totalCorrect || 0,
    totalIncorrect: s.totalIncorrect || 0,
    history: Array.isArray(s.history) ? s.history : [],
    subjects: s.subjects || {},
  }
}

export function recordTestResult(entry: {
  fileId: string
  fileName: string
  correct: number
  incorrect: number
  total: number
  percentage: number
  timestamp?: number
}): void {
  const stats = loadStats()
  const ts = entry.timestamp ?? Date.now()

  stats.totalTests += 1
  stats.totalCorrect += entry.correct
  stats.totalIncorrect += entry.incorrect

  const historyEntry: TestHistoryEntry = {
    fileId: entry.fileId,
    fileName: entry.fileName,
    correct: entry.correct,
    incorrect: entry.incorrect,
    total: entry.total,
    percentage: entry.percentage,
    timestamp: ts,
  }
  stats.history.unshift(historyEntry)
  if (stats.history.length > MAX_HISTORY) {
    stats.history = stats.history.slice(0, MAX_HISTORY)
  }

  const subjKey = entry.fileName || entry.fileId
  const subj = stats.subjects[subjKey] || { name: subjKey, tests: 0, correct: 0, incorrect: 0 }
  subj.tests += 1
  subj.correct += entry.correct
  subj.incorrect += entry.incorrect
  stats.subjects[subjKey] = subj

  writeJson(STATS_KEY, stats)
}

export function clearStats(): void {
  try {
    localStorage.removeItem(STATS_KEY)
  } catch {
    /* ignore */
  }
}

// ——————————————————————————————————————————————————————————————
// Streak (ketma-ket faol kunlar)
// ——————————————————————————————————————————————————————————————

export interface StreakData {
  current: number
  longest: number
  lastActiveDate: string // YYYY-MM-DD
  totalDays: number
}

const EMPTY_STREAK: StreakData = { current: 0, longest: 0, lastActiveDate: '', totalDays: 0 }

export function loadStreak(): StreakData {
  const s = readJson<StreakData>(STREAK_KEY, EMPTY_STREAK)
  return {
    current: s.current || 0,
    longest: s.longest || 0,
    lastActiveDate: s.lastActiveDate || '',
    totalDays: s.totalDays || 0,
  }
}

/** Faollikni qayd etadi (test yakunlanganda chaqiriladi) va yangilangan streakni qaytaradi. */
export function recordActivity(now: number = Date.now()): StreakData {
  const streak = loadStreak()
  const today = localDateStr(now)

  if (streak.lastActiveDate === today) {
    return streak // bugun allaqachon qayd etilgan
  }

  if (!streak.lastActiveDate) {
    streak.current = 1
    streak.totalDays = 1
  } else {
    const diff = daysBetween(streak.lastActiveDate, today)
    if (diff === 1) {
      streak.current += 1
    } else {
      streak.current = 1 // uzilish — yangidan boshlanadi
    }
    streak.totalDays += 1
  }

  streak.lastActiveDate = today
  if (streak.current > streak.longest) {
    streak.longest = streak.current
  }

  writeJson(STREAK_KEY, streak)
  return streak
}

// ——————————————————————————————————————————————————————————————
// Kunlik faollik (heatmap kalendari uchun)
// ——————————————————————————————————————————————————————————————

export type ActivityMap = Record<string, number> // 'YYYY-MM-DD' -> savollar soni

export function loadActivityMap(): ActivityMap {
  return readJson<ActivityMap>(ACTIVITY_KEY, {})
}

/** Bugungi kunga yechilgan savollar sonini qo'shadi (heatmap uchun). */
export function recordDailyActivity(questionCount: number, now: number = Date.now()): void {
  if (!questionCount || questionCount <= 0) return
  const map = loadActivityMap()
  const today = localDateStr(now)
  map[today] = (map[today] || 0) + questionCount

  // Eski kunlarni tozalaymiz (180 kundan oshganini)
  const cutoff = now - ACTIVITY_MAX_DAYS * DAY_MS
  for (const date of Object.keys(map)) {
    if (new Date(`${date}T00:00:00`).getTime() < cutoff) {
      delete map[date]
    }
  }

  writeJson(ACTIVITY_KEY, map)
}

export function clearActivity(): void {
  try {
    localStorage.removeItem(ACTIVITY_KEY)
  } catch {
    /* ignore */
  }
}

/** Streak hali bugunga qadar amal qiladimi (uzilmaganmi). */
export function getEffectiveStreak(now: number = Date.now()): number {
  const streak = loadStreak()
  if (!streak.lastActiveDate) return 0
  const diff = daysBetween(streak.lastActiveDate, localDateStr(now))
  if (diff <= 1) return streak.current
  return 0 // bir kundan ortiq uzilgan
}

// ——————————————————————————————————————————————————————————————
// SRS — Leitner quti tizimi (xatolar ustida ishlash)
// ——————————————————————————————————————————————————————————————

export interface SrsItem {
  key: string
  fileId: string
  fileName: string
  question: Question
  box: number // 1..5
  dueDate: number // timestamp
  lapses: number
  addedAt: number
  lastReviewed: number
}

// Quti -> kun (to'g'ri javobdan keyingi keyingi takrorlash oralig'i)
const BOX_INTERVAL_DAYS: Record<number, number> = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 15 }
const WRONG_REVIEW_DELAY_MS = 10 * 60 * 1000 // xato bo'lsa shu sessiyada qayta chiqsin

type SrsStore = Record<string, SrsItem>

export function loadSrsStore(): SrsStore {
  return readJson<SrsStore>(SRS_KEY, {})
}

function saveSrsStore(store: SrsStore): void {
  // Hajmni cheklash — eng eski "due bo'lmagan"larni olib tashlaymiz
  const entries = Object.entries(store)
  if (entries.length > MAX_SRS_ITEMS) {
    entries.sort((a, b) => a[1].dueDate - b[1].dueDate)
    const trimmed = entries.slice(0, MAX_SRS_ITEMS)
    store = Object.fromEntries(trimmed)
  }
  writeJson(SRS_KEY, store)
}

/** Test yakunlangach xato javob berilgan savollarni SRS'ga qo'shadi/yangilaydi. */
export function addWrongAnswersToSrs(
  fileId: string,
  fileName: string,
  questions: Question[],
  answers: Record<number, { selected: number[]; correct: boolean }>,
  now: number = Date.now()
): void {
  const store = loadSrsStore()
  let changed = false

  questions.forEach((question, index) => {
    const answer = answers[index]
    if (!answer || answer.correct) return // faqat xatolar

    const key = question.sourceKey ?? questionKey(fileId, question)
    const existing = store[key]
    if (existing) {
      // mavjud bo'lsa — quti 1 ga tushadi, tez qayta chiqadi
      existing.box = 1
      existing.lapses += 1
      existing.dueDate = now
      existing.lastReviewed = now
    } else {
      store[key] = {
        key,
        fileId,
        fileName,
        question: stripImages(question),
        box: 1,
        dueDate: now,
        lapses: 0,
        addedAt: now,
        lastReviewed: 0,
      }
    }
    changed = true
  })

  if (changed) saveSrsStore(store)
}

/** Takrorlash natijasini qayd etadi (Leitner: to'g'ri → yuqori quti, xato → 1-quti). */
export function recordSrsReview(key: string, correct: boolean, now: number = Date.now()): void {
  const store = loadSrsStore()
  const item = store[key]
  if (!item) return

  item.lastReviewed = now
  if (correct) {
    item.box = Math.min(item.box + 1, 5)
    item.dueDate = now + (BOX_INTERVAL_DAYS[item.box] ?? 15) * DAY_MS
  } else {
    item.box = 1
    item.lapses += 1
    item.dueDate = now + WRONG_REVIEW_DELAY_MS
  }
  store[key] = item
  saveSrsStore(store)
}

/** Takrorlash vaqti kelgan savollar (dueDate <= now), eng kechikkanlari oldinda. */
export function getDueSrsItems(now: number = Date.now()): SrsItem[] {
  const store = loadSrsStore()
  return Object.values(store)
    .filter((item) => item.dueDate <= now)
    .sort((a, b) => a.dueDate - b.dueDate)
}

export function getSrsCounts(now: number = Date.now()): { total: number; due: number } {
  const store = loadSrsStore()
  const all = Object.values(store)
  return {
    total: all.length,
    due: all.filter((item) => item.dueDate <= now).length,
  }
}

export function removeSrsItem(key: string): void {
  const store = loadSrsStore()
  if (store[key]) {
    delete store[key]
    saveSrsStore(store)
  }
}

export function clearSrs(): void {
  try {
    localStorage.removeItem(SRS_KEY)
  } catch {
    /* ignore */
  }
}

// ——————————————————————————————————————————————————————————————
// Bookmark (belgilangan savollar)
// ——————————————————————————————————————————————————————————————

export interface BookmarkItem {
  key: string
  fileId: string
  fileName: string
  question: Question
  addedAt: number
}

type BookmarkStore = Record<string, BookmarkItem>

export function loadBookmarkStore(): BookmarkStore {
  return readJson<BookmarkStore>(BOOKMARKS_KEY, {})
}

function saveBookmarkStore(store: BookmarkStore): void {
  writeJson(BOOKMARKS_KEY, store)
}

export function isBookmarked(key: string): boolean {
  const store = loadBookmarkStore()
  return !!store[key]
}

/** Bookmarkni almashtiradi va yangi holatni (belgilangan = true) qaytaradi. */
export function toggleBookmark(
  key: string,
  fileId: string,
  fileName: string,
  question: Question,
  now: number = Date.now()
): boolean {
  const store = loadBookmarkStore()
  if (store[key]) {
    delete store[key]
    saveBookmarkStore(store)
    return false
  }
  store[key] = {
    key,
    fileId,
    fileName,
    question: stripImages(question),
    addedAt: now,
  }
  saveBookmarkStore(store)
  return true
}

export function getBookmarks(): BookmarkItem[] {
  const store = loadBookmarkStore()
  return Object.values(store).sort((a, b) => b.addedAt - a.addedAt)
}

export function getBookmarkCount(): number {
  return Object.keys(loadBookmarkStore()).length
}

export function removeBookmark(key: string): void {
  const store = loadBookmarkStore()
  if (store[key]) {
    delete store[key]
    saveBookmarkStore(store)
  }
}

export function clearBookmarks(): void {
  try {
    localStorage.removeItem(BOOKMARKS_KEY)
  } catch {
    /* ignore */
  }
}
