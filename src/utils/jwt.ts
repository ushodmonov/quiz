const encoder = new TextEncoder()
const decoder = new TextDecoder()

const toBase64Url = (input: string | Uint8Array): string => {
  const bytes = typeof input === 'string' ? encoder.encode(input) : input
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

const hmacSha256 = async (message: string, secret: string): Promise<Uint8Array> => {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  return new Uint8Array(signature)
}

export interface JwtPayload {
  telegramUserId: number
  name?: string
  createdByTelegramUserId?: number
  createdByName?: string
  iat: number
  exp: number
}

const fromBase64Url = (input: string): string => {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return decoder.decode(bytes)
}

export const generateJwtToken = async (
  telegramUserId: number,
  expiresInSeconds: number,
  secret: string,
  name?: string,
  createdByTelegramUserId?: number,
  createdByName?: string
): Promise<string> => {
  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + expiresInSeconds

  const header = {
    alg: 'HS256',
    typ: 'JWT'
  }

  const payload: JwtPayload = {
    telegramUserId,
    name,
    createdByTelegramUserId,
    createdByName,
    iat,
    exp
  }

  const encodedHeader = toBase64Url(JSON.stringify(header))
  const encodedPayload = toBase64Url(JSON.stringify(payload))
  const signingInput = `${encodedHeader}.${encodedPayload}`

  const signature = await hmacSha256(signingInput, secret)
  const encodedSignature = toBase64Url(signature)

  return `${signingInput}.${encodedSignature}`
}

export const verifyJwtToken = async (
  token: string,
  secret: string,
  expectedTelegramUserId: number
): Promise<boolean> => {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return false

    const [encodedHeader, encodedPayload, encodedSignature] = parts
    const signingInput = `${encodedHeader}.${encodedPayload}`
    const expectedSignature = toBase64Url(await hmacSha256(signingInput, secret))
    if (expectedSignature !== encodedSignature) return false

    const payload = JSON.parse(fromBase64Url(encodedPayload)) as JwtPayload
    const now = Math.floor(Date.now() / 1000)

    if (payload.telegramUserId !== expectedTelegramUserId) return false
    if (!payload.exp || payload.exp <= now) return false

    return true
  } catch {
    return false
  }
}
