import type { Question, QuizResults, QuestionDisplayMode } from '../types'

const DB_NAME = 'quiz_app_db'
const DB_VERSION = 1
const STORE_TESTS = 'cached_tests'

export interface ResumeData {
  selectedQuestions: Question[]
  startIndex: number
  currentQuestionIndex: number
  answers: Record<number, { selected: number[]; correct: boolean }>
  score: { correct: number; incorrect: number }
  selectionMethod: 'sequential' | 'random'
  displayMode?: QuestionDisplayMode
  endQuestionIndex?: number | null
}

export interface TestSession {
  lastQuestionIndex: number
  score: { correct: number; incorrect: number }
  results?: Pick<QuizResults, 'correct' | 'incorrect' | 'total' | 'percentage'>
  savedAt: number
  resumeData?: ResumeData
}

export interface CachedTestMeta {
  fileId: string
  fileName: string
  questionCount: number
  savedAt: number
  lastSession?: TestSession
}

interface CachedTestRecord extends CachedTestMeta {
  questions: Question[]
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_TESTS)) {
        db.createObjectStore(STORE_TESTS, { keyPath: 'fileId' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveCachedTest(fileId: string, fileName: string, questions: Question[]): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_TESTS, 'readwrite')
    const store = tx.objectStore(STORE_TESTS)
    const getReq = store.get(fileId)
    getReq.onsuccess = () => {
      const existing = getReq.result as CachedTestRecord | undefined
      const record: CachedTestRecord = {
        fileId,
        fileName,
        questions,
        questionCount: questions.length,
        savedAt: Date.now(),
        lastSession: existing?.lastSession,
      }
      const putReq = store.put(record)
      putReq.onsuccess = () => resolve()
      putReq.onerror = () => reject(putReq.error)
    }
    getReq.onerror = () => reject(getReq.error)
  })
}

export async function loadCachedTest(fileId: string): Promise<CachedTestRecord | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_TESTS, 'readonly')
    const req = tx.objectStore(STORE_TESTS).get(fileId)
    req.onsuccess = () => resolve((req.result as CachedTestRecord) ?? null)
    req.onerror = () => reject(req.error)
  })
}

export async function listCachedTests(): Promise<CachedTestMeta[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_TESTS, 'readonly')
    const req = tx.objectStore(STORE_TESTS).getAll()
    req.onsuccess = () => {
      const records = (req.result as CachedTestRecord[]).map(
        ({ questions: _q, ...meta }) => meta
      )
      records.sort((a, b) => b.savedAt - a.savedAt)
      resolve(records)
    }
    req.onerror = () => reject(req.error)
  })
}

export async function saveTestSession(fileId: string, session: TestSession): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_TESTS, 'readwrite')
    const store = tx.objectStore(STORE_TESTS)
    const getReq = store.get(fileId)
    getReq.onsuccess = () => {
      const existing = getReq.result as CachedTestRecord | undefined
      if (!existing) { resolve(); return }
      const putReq = store.put({ ...existing, lastSession: session })
      putReq.onsuccess = () => resolve()
      putReq.onerror = () => reject(putReq.error)
    }
    getReq.onerror = () => reject(getReq.error)
  })
}

export async function deleteCachedTest(fileId: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_TESTS, 'readwrite')
    const req = tx.objectStore(STORE_TESTS).delete(fileId)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function clearAllCachedTests(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_TESTS, 'readwrite')
    const req = tx.objectStore(STORE_TESTS).clear()
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export function isIndexedDBSupported(): boolean {
  return typeof indexedDB !== 'undefined'
}
