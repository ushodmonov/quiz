import { generateJwtToken } from './jwt'
import { saveAccessJwt } from './storage'
import {
  createReferralIfAbsent,
  countReferralsByReferrer,
  getJwtTokenRecords,
  saveJwtTokenToFirestore,
} from './firebase'
import {
  JWT_SECRET_KEY,
  REFERRAL_TRIAL_SECONDS,
  REFERRAL_BONUS_SECONDS,
  TELEGRAM_BOT_USERNAME,
} from '../constants/contact'

/** `ref_<id>` start_param'dan chaqiruvchi (referrer) ID'sini ajratadi. */
export function parseReferrerId(startParam?: string | null): number | null {
  if (!startParam) return null
  const match = /^ref_(\d+)$/.exec(startParam)
  if (!match) return null
  const id = Number(match[1])
  return Number.isFinite(id) && id > 0 ? id : null
}

/** Foydalanuvchi uchun shaxsiy chaqirish havolasi. */
export function buildReferralLink(telegramUserId: number): string {
  return `https://t.me/${TELEGRAM_BOT_USERNAME}?startapp=ref_${telegramUserId}`
}

export interface ReferralProcessResult {
  /** Chaqirilgan do'stga 6 soatlik trial berildimi (shu ochilishda). */
  trialGranted: boolean
  /** Foydalanuvchi nechta do'st chaqirgan. */
  referralCount: number
  /** Chaqirishlardan topilgan bonus kunlar (referralCount * 3). */
  bonusDays: number
  /** Hisoblangan amal tugash vaqti (ms) yoki null. */
  accessExpiryMs: number | null
}

const BONUS_KIND = 'referral_bonus'

/**
 * Referralni qayta ishlaydi va mukofotlarni beradi:
 *  - Chaqirilgan do'st (invitee) bazaviy kirishi bo'lmasa — 6 soatlik trial.
 *  - Chaqirgan odam (referrer) — har chaqirish uchun +3 kun (idempotent qayta hisob).
 *
 * Mintlangan tokenlar Firestore'ga va localStorage'ga (saveAccessJwt) saqlanadi,
 * shunda App.tsx'dagi mavjud kirish tekshiruvi ularni topadi.
 * Firestore xatolari (offline) yutiladi — mavjud keshlangan token baribir ishlaydi.
 */
export async function processReferralAndRewards(
  user: { id: number; name?: string },
  startParam?: string | null,
  now: number = Date.now()
): Promise<ReferralProcessResult> {
  let trialGranted = false

  // 1) Invitee tomoni — ref havola orqali kelganmi?
  const referrerId = parseReferrerId(startParam)
  if (referrerId && referrerId !== user.id) {
    try {
      const { created } = await createReferralIfAbsent({
        inviteeTelegramUserId: user.id,
        inviteeName: user.name,
        referrerTelegramUserId: referrerId,
      })
      if (created) {
        const records = await getJwtTokenRecords(user.id)
        const hasBase = records.some((r) => r.kind !== BONUS_KIND && r.expiresAtMs > now)
        if (!hasBase) {
          const token = await generateJwtToken(user.id, REFERRAL_TRIAL_SECONDS, JWT_SECRET_KEY, user.name)
          await saveJwtTokenToFirestore({
            token,
            telegramUserId: user.id,
            name: user.name,
            expirySeconds: REFERRAL_TRIAL_SECONDS,
            kind: 'trial',
          }).catch(() => {})
          saveAccessJwt(user.id, token)
          trialGranted = true
        }
      }
    } catch (error) {
      console.warn('[referral] invitee processing failed:', error)
    }
  }

  // 2) Referrer tomoni — bu foydalanuvchining chaqirishlaridan bonus.
  let referralCount = 0
  let accessExpiryMs: number | null = null
  try {
    referralCount = await countReferralsByReferrer(user.id)
    const records = await getJwtTokenRecords(user.id)
    const baseExp = records
      .filter((r) => r.kind !== BONUS_KIND)
      .reduce((max, r) => Math.max(max, r.expiresAtMs), 0)
    const existingBonusExp = records
      .filter((r) => r.kind === BONUS_KIND)
      .reduce((max, r) => Math.max(max, r.expiresAtMs), 0)

    if (referralCount > 0) {
      const base = baseExp > now ? baseExp : now
      const desiredExp = base + referralCount * REFERRAL_BONUS_SECONDS * 1000
      // Faqat kerak bo'lganda yangi token mintlaymiz (1 daqiqa tolerantlik bilan)
      if (existingBonusExp < desiredExp - 60_000) {
        const secs = Math.ceil((desiredExp - now) / 1000)
        const token = await generateJwtToken(user.id, secs, JWT_SECRET_KEY, user.name)
        await saveJwtTokenToFirestore({
          token,
          telegramUserId: user.id,
          name: user.name,
          expirySeconds: secs,
          kind: BONUS_KIND,
        }).catch(() => {})
        saveAccessJwt(user.id, token)
        accessExpiryMs = desiredExp
      } else {
        accessExpiryMs = Math.max(existingBonusExp, baseExp)
      }
    } else {
      accessExpiryMs = baseExp > now ? baseExp : null
    }
  } catch (error) {
    console.warn('[referral] bonus processing failed:', error)
  }

  return {
    trialGranted,
    referralCount,
    bonusDays: referralCount * Math.round(REFERRAL_BONUS_SECONDS / 86_400),
    accessExpiryMs,
  }
}
