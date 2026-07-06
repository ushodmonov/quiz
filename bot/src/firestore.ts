// Firestore REST API bilan ishlash (Workers'da firebase SDK ishlamaydi,
// shuning uchun to'g'ridan-to'g'ri REST so'rovlar yuboramiz).
// Mini app'dagi kabi bu ochiq apiKey bilan ishlaydi — Firestore security
// rules qanday bo'lsa, shunga bo'ysunadi.

export interface FirestoreEnv {
  FIREBASE_PROJECT_ID: string
  FIREBASE_API_KEY: string
}

const baseUrl = (env: FirestoreEnv) =>
  `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents`

export interface JwtTokenDoc {
  token: string
  telegramUserId: number
  expirySeconds: number
  kind: string
  createdAtMs: number | null
}

/** jwt_tokens kolleksiyasidan foydalanuvchining tokenlarini oladi. */
export const getJwtTokensByTelegramUserId = async (
  env: FirestoreEnv,
  telegramUserId: number
): Promise<JwtTokenDoc[]> => {
  const body = {
    structuredQuery: {
      from: [{ collectionId: 'jwt_tokens' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'telegramUserId' },
          op: 'EQUAL',
          value: { integerValue: String(telegramUserId) }
        }
      },
      limit: 20
    }
  }

  const res = await fetch(`${baseUrl(env)}:runQuery?key=${env.FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    throw new Error(`Firestore query failed: ${res.status} ${await res.text()}`)
  }

  const rows = (await res.json()) as Array<{ document?: FirestoreDocument }>
  return rows
    .filter((r) => r.document)
    .map((r) => {
      const f = r.document!.fields ?? {}
      return {
        token: str(f.token) ?? '',
        telegramUserId: num(f.telegramUserId) ?? 0,
        expirySeconds: num(f.expirySeconds) ?? 0,
        kind: str(f.kind) ?? 'admin',
        createdAtMs: ts(f.createdAt)
      }
    })
}

/** Yangi hujjat qo'shish (masalan, bot orqali so'rov/log yozish uchun). */
export const addDocument = async (
  env: FirestoreEnv,
  collectionId: string,
  fields: Record<string, string | number | boolean | null>
): Promise<void> => {
  const encoded: Record<string, FirestoreValue> = {}
  for (const [k, v] of Object.entries(fields)) {
    if (v === null) encoded[k] = { nullValue: null }
    else if (typeof v === 'number') encoded[k] = Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }
    else if (typeof v === 'boolean') encoded[k] = { booleanValue: v }
    else encoded[k] = { stringValue: v }
  }

  const res = await fetch(`${baseUrl(env)}/${collectionId}?key=${env.FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: encoded })
  })
  if (!res.ok) {
    throw new Error(`Firestore write failed: ${res.status} ${await res.text()}`)
  }
}

// --- Firestore qiymatlarini o'qish yordamchilari ---

interface FirestoreValue {
  stringValue?: string
  integerValue?: string
  doubleValue?: number
  booleanValue?: boolean
  timestampValue?: string
  nullValue?: null
}

interface FirestoreDocument {
  name: string
  fields?: Record<string, FirestoreValue>
}

const str = (v?: FirestoreValue) => v?.stringValue
const num = (v?: FirestoreValue) =>
  v?.integerValue != null ? Number(v.integerValue) : v?.doubleValue
const ts = (v?: FirestoreValue) =>
  v?.timestampValue ? Date.parse(v.timestampValue) : null
