import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, limit, orderBy, query, where, writeBatch } from 'firebase/firestore'
import { FIREBASE_CONFIG, FIRESTORE_JWT_TOKENS_COLLECTION, FIRESTORE_REFERRALS_COLLECTION, isAdminTelegramUser } from '../constants/contact'

const isFirebaseConfigured = (): boolean => {
  return Boolean(
    FIREBASE_CONFIG.apiKey &&
    FIREBASE_CONFIG.authDomain &&
    FIREBASE_CONFIG.projectId &&
    FIREBASE_CONFIG.appId
  )
}

const getDb = () => {
  if (!isFirebaseConfigured()) {
    throw new Error('FIREBASE_NOT_CONFIGURED')
  }

  const app = getApps().length > 0 ? getApps()[0] : initializeApp(FIREBASE_CONFIG)
  return getFirestore(app)
}

interface SaveJwtTokenInput {
  token: string
  telegramUserId: number
  name?: string
  expirySeconds: number
  createdByTelegramUserId?: number
  createdByName?: string
  /** Token turi: 'admin' (default) | 'trial' | 'referral_bonus'. */
  kind?: string
}

export const saveJwtTokenToFirestore = async ({
  token,
  telegramUserId,
  name,
  expirySeconds,
  createdByTelegramUserId,
  createdByName,
  kind
}: SaveJwtTokenInput): Promise<void> => {
  const db = getDb()
  await addDoc(collection(db, FIRESTORE_JWT_TOKENS_COLLECTION), {
    token,
    telegramUserId,
    name: name ?? null,
    expirySeconds,
    createdByTelegramUserId: createdByTelegramUserId ?? null,
    createdByName: createdByName ?? null,
    kind: kind ?? 'admin',
    createdAt: serverTimestamp()
  })
}

export interface JwtTokenRecord {
  token: string
  expiresAtMs: number
  kind: string
}

/** Foydalanuvchining barcha tokenlari + amal tugash vaqti + turi. */
export const getJwtTokenRecords = async (telegramUserId: number): Promise<JwtTokenRecord[]> => {
  const db = getDb()
  const tokensQuery = query(
    collection(db, FIRESTORE_JWT_TOKENS_COLLECTION),
    where('telegramUserId', '==', telegramUserId)
  )
  const snapshot = await getDocs(tokensQuery)
  const records: JwtTokenRecord[] = []
  snapshot.docs.forEach((doc) => {
    const data = doc.data()
    if (typeof data?.token !== 'string') return
    const createdAtMs: number = data.createdAt?.toDate ? data.createdAt.toDate().getTime() : 0
    const expirySeconds = Number(data.expirySeconds)
    if (!createdAtMs || !Number.isFinite(expirySeconds)) return
    records.push({
      token: data.token,
      expiresAtMs: createdAtMs + expirySeconds * 1000,
      kind: typeof data.kind === 'string' ? data.kind : 'admin'
    })
  })
  return records
}

export const getLatestJwtTokenByTelegramUserId = async (telegramUserId: number): Promise<string | null> => {
  const db = getDb()
  const tokensQuery = query(
    collection(db, FIRESTORE_JWT_TOKENS_COLLECTION),
    where('telegramUserId', '==', telegramUserId)
  )
  const snapshot = await getDocs(tokensQuery)
  if (snapshot.empty) return null

  const sortedDocs = snapshot.docs.sort((a, b) => {
    const aTime = a.data()?.createdAt?.toDate ? a.data().createdAt.toDate().getTime() : 0
    const bTime = b.data()?.createdAt?.toDate ? b.data().createdAt.toDate().getTime() : 0
    return bTime - aTime
  })
  const docData = sortedDocs[0].data()
  return typeof docData?.token === 'string' ? docData.token : null
}

export const getJwtTokensByTelegramUserId = async (
  telegramUserId: number,
  maxCount: number = 20
): Promise<string[]> => {
  const db = getDb()
  const tokensQuery = query(
    collection(db, FIRESTORE_JWT_TOKENS_COLLECTION),
    where('telegramUserId', '==', telegramUserId)
  )
  const snapshot = await getDocs(tokensQuery)
  if (snapshot.empty) return []

  const sortedDocs = snapshot.docs.sort((a, b) => {
    const aTime = a.data()?.createdAt?.toDate ? a.data().createdAt.toDate().getTime() : 0
    const bTime = b.data()?.createdAt?.toDate ? b.data().createdAt.toDate().getTime() : 0
    return bTime - aTime
  })

  return sortedDocs
    .slice(0, maxCount)
    .map((doc) => doc.data()?.token)
    .filter((token): token is string => typeof token === 'string' && token.length > 0)
}

export interface JwtTokenUserItem {
  telegramUserId: number
  name: string
  createdBy: string
  tokenCount: number
  lastCreatedAt: Date | null
  expiresAt: Date | null
}

export const getJwtTokenUsers = async (): Promise<JwtTokenUserItem[]> => {
  const db = getDb()
  const tokensQuery = query(
    collection(db, FIRESTORE_JWT_TOKENS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(500)
  )
  const snapshot = await getDocs(tokensQuery)

  const usersMap = new Map<number, JwtTokenUserItem>()

  snapshot.docs.forEach((doc) => {
    const data = doc.data()
    const userId = Number(data.telegramUserId)
    if (!Number.isFinite(userId) || userId <= 0) return

    const createdAtDate: Date | null = data.createdAt?.toDate ? data.createdAt.toDate() : null
    const expirySeconds = Number(data.expirySeconds)
    const expiresAtDate: Date | null = createdAtDate && Number.isFinite(expirySeconds)
      ? new Date(createdAtDate.getTime() + expirySeconds * 1000)
      : null
    const existing = usersMap.get(userId)

    if (!existing) {
      usersMap.set(userId, {
        telegramUserId: userId,
        name: typeof data.name === 'string' ? data.name : '-',
        createdBy: typeof data.createdByName === 'string'
          ? data.createdByName
          : (Number.isFinite(Number(data.createdByTelegramUserId)) ? `ID: ${Number(data.createdByTelegramUserId)}` : '-'),
        tokenCount: 1,
        lastCreatedAt: createdAtDate,
        expiresAt: expiresAtDate
      })
      return
    }

    const shouldUpdateLastDate = Boolean(
      createdAtDate &&
      (!existing.lastCreatedAt || createdAtDate.getTime() > existing.lastCreatedAt.getTime())
    )

    usersMap.set(userId, {
      ...existing,
      name: shouldUpdateLastDate && typeof data.name === 'string' ? data.name : existing.name,
      createdBy: shouldUpdateLastDate
        ? (typeof data.createdByName === 'string'
          ? data.createdByName
          : (Number.isFinite(Number(data.createdByTelegramUserId)) ? `ID: ${Number(data.createdByTelegramUserId)}` : existing.createdBy))
        : existing.createdBy,
      tokenCount: existing.tokenCount + 1,
      lastCreatedAt: shouldUpdateLastDate ? createdAtDate : existing.lastCreatedAt,
      expiresAt: shouldUpdateLastDate ? expiresAtDate : existing.expiresAt
    })
  })

  return Array.from(usersMap.values()).sort((a, b) => {
    const aTime = a.lastCreatedAt ? a.lastCreatedAt.getTime() : 0
    const bTime = b.lastCreatedAt ? b.lastCreatedAt.getTime() : 0
    return bTime - aTime
  })
}

export const deleteJwtTokensByTelegramUserId = async (telegramUserId: number): Promise<number> => {
  const db = getDb()
  const tokensQuery = query(
    collection(db, FIRESTORE_JWT_TOKENS_COLLECTION),
    where('telegramUserId', '==', telegramUserId)
  )
  const snapshot = await getDocs(tokensQuery)
  if (snapshot.empty) return 0

  const batch = writeBatch(db)
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref)
  })
  await batch.commit()

  return snapshot.size
}

// ——————————————————————————————————————————————————————————————
// Referral (do'st chaqirish)
// ——————————————————————————————————————————————————————————————

interface CreateReferralInput {
  inviteeTelegramUserId: number
  inviteeName?: string
  referrerTelegramUserId: number
  referrerName?: string
}

/**
 * Referralni yaratadi — agar bu foydalanuvchi (invitee) avval chaqirilmagan bo'lsa.
 * Bir foydalanuvchi faqat bir marta chaqirilishi mumkin (birinchisi g'olib).
 */
export const createReferralIfAbsent = async (
  input: CreateReferralInput
): Promise<{ created: boolean }> => {
  // O'zini-o'zi chaqirish mumkin emas (o'z havolasini o'zi ochgan holat).
  if (input.inviteeTelegramUserId === input.referrerTelegramUserId) {
    return { created: false }
  }

  // Adminlar referral qila olmaydi — faqat oddiy userlar chaqira oladi.
  // (Admin invitee ham bo'la olmaydi.)
  if (
    isAdminTelegramUser(input.referrerTelegramUserId) ||
    isAdminTelegramUser(input.inviteeTelegramUserId)
  ) {
    return { created: false }
  }

  const db = getDb()
  const existingQuery = query(
    collection(db, FIRESTORE_REFERRALS_COLLECTION),
    where('inviteeTelegramUserId', '==', input.inviteeTelegramUserId)
  )
  const existing = await getDocs(existingQuery)
  if (!existing.empty) return { created: false }

  await addDoc(collection(db, FIRESTORE_REFERRALS_COLLECTION), {
    inviteeTelegramUserId: input.inviteeTelegramUserId,
    inviteeName: input.inviteeName ?? null,
    referrerTelegramUserId: input.referrerTelegramUserId,
    referrerName: input.referrerName ?? null,
    createdAt: serverTimestamp()
  })
  return { created: true }
}

/** Foydalanuvchi nechta do'st chaqirgani. */
export const countReferralsByReferrer = async (referrerTelegramUserId: number): Promise<number> => {
  const db = getDb()
  const q = query(
    collection(db, FIRESTORE_REFERRALS_COLLECTION),
    where('referrerTelegramUserId', '==', referrerTelegramUserId)
  )
  const snapshot = await getDocs(q)
  return snapshot.size
}

export interface ReferralLeaderboardItem {
  referrerTelegramUserId: number
  name: string
  count: number
}

/** Eng ko'p do'st chaqirganlar reytingi. */
export const getReferralLeaderboard = async (maxItems = 20): Promise<ReferralLeaderboardItem[]> => {
  const db = getDb()
  const q = query(
    collection(db, FIRESTORE_REFERRALS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(1000)
  )
  const snapshot = await getDocs(q)
  const map = new Map<number, ReferralLeaderboardItem>()
  snapshot.docs.forEach((doc) => {
    const data = doc.data()
    const id = Number(data.referrerTelegramUserId)
    if (!Number.isFinite(id) || id <= 0) return
    const existing = map.get(id)
    if (existing) {
      existing.count += 1
    } else {
      map.set(id, {
        referrerTelegramUserId: id,
        name: typeof data.referrerName === 'string' && data.referrerName ? data.referrerName : `ID: ${id}`,
        count: 1
      })
    }
  })
  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, maxItems)
}

export interface ReferralRecord {
  inviteeTelegramUserId: number
  inviteeName: string
  referrerTelegramUserId: number
  referrerName: string
  createdAt: Date | null
}

/** Barcha referral yozuvlari (admin paneli uchun). */
export const getAllReferrals = async (max = 2000): Promise<ReferralRecord[]> => {
  const db = getDb()
  const q = query(
    collection(db, FIRESTORE_REFERRALS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(max)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs
    .map((doc) => {
      const data = doc.data()
      const inviteeId = Number(data.inviteeTelegramUserId)
      const referrerId = Number(data.referrerTelegramUserId)
      return {
        inviteeTelegramUserId: inviteeId,
        inviteeName:
          typeof data.inviteeName === 'string' && data.inviteeName ? data.inviteeName : `ID: ${inviteeId}`,
        referrerTelegramUserId: referrerId,
        referrerName:
          typeof data.referrerName === 'string' && data.referrerName ? data.referrerName : `ID: ${referrerId}`,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
      }
    })
    .filter((r) => Number.isFinite(r.referrerTelegramUserId) && Number.isFinite(r.inviteeTelegramUserId))
}
