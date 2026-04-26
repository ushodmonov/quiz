import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, limit, orderBy, query, where, writeBatch } from 'firebase/firestore'
import { FIREBASE_CONFIG, FIRESTORE_JWT_TOKENS_COLLECTION } from '../constants/contact'

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
}

export const saveJwtTokenToFirestore = async ({
  token,
  telegramUserId,
  name,
  expirySeconds,
  createdByTelegramUserId,
  createdByName
}: SaveJwtTokenInput): Promise<void> => {
  const db = getDb()
  await addDoc(collection(db, FIRESTORE_JWT_TOKENS_COLLECTION), {
    token,
    telegramUserId,
    name: name ?? null,
    expirySeconds,
    createdByTelegramUserId: createdByTelegramUserId ?? null,
    createdByName: createdByName ?? null,
    createdAt: serverTimestamp()
  })
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
    const existing = usersMap.get(userId)

    if (!existing) {
      usersMap.set(userId, {
        telegramUserId: userId,
        name: typeof data.name === 'string' ? data.name : '-',
        createdBy: typeof data.createdByName === 'string'
          ? data.createdByName
          : (Number.isFinite(Number(data.createdByTelegramUserId)) ? `ID: ${Number(data.createdByTelegramUserId)}` : '-'),
        tokenCount: 1,
        lastCreatedAt: createdAtDate
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
      lastCreatedAt: shouldUpdateLastDate ? createdAtDate : existing.lastCreatedAt
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
