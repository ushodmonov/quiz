import { Bot, InlineKeyboard, webhookCallback } from 'grammy'
import { getJwtTokensByTelegramUserId, type FirestoreEnv } from './firestore'

interface Env extends FirestoreEnv {
  BOT_TOKEN: string
  WEBHOOK_SECRET?: string
  MINI_APP_URL: string
}

const buildBot = (env: Env) => {
  const bot = new Bot(env.BOT_TOKEN)

  bot.command('start', async (ctx) => {
    const keyboard = new InlineKeyboard().url("📱 Mini App'ni ochish", env.MINI_APP_URL)
    await ctx.reply(
      "Assalomu alaykum! 👋\n\nQuiz mini app'iga xush kelibsiz. Testlarni yechish uchun quyidagi tugmani bosing.\n\nBuyruqlar:\n/status — obuna holatini tekshirish",
      { reply_markup: keyboard }
    )
  })

  bot.command('status', async (ctx) => {
    const userId = ctx.from?.id
    if (!userId) return

    try {
      const tokens = await getJwtTokensByTelegramUserId(env, userId)
      const now = Date.now()
      const active = tokens.filter((t) => {
        if (!t.createdAtMs) return false
        return t.createdAtMs + t.expirySeconds * 1000 > now
      })

      if (active.length === 0) {
        await ctx.reply(
          "❌ Sizda faol obuna topilmadi.\n\nObuna olish uchun admin bilan bog'laning."
        )
        return
      }

      const latest = active.sort(
        (a, b) => (b.createdAtMs ?? 0) + b.expirySeconds * 1000 - ((a.createdAtMs ?? 0) + a.expirySeconds * 1000)
      )[0]
      const expiresAt = new Date((latest.createdAtMs ?? 0) + latest.expirySeconds * 1000)
      await ctx.reply(
        `✅ Obunangiz faol!\n\nTuri: ${latest.kind}\nTugash vaqti: ${expiresAt.toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}`
      )
    } catch (err) {
      console.error('status error', err)
      await ctx.reply("⚠️ Xatolik yuz berdi, birozdan so'ng qayta urinib ko'ring.")
    }
  })

  bot.on('message', async (ctx) => {
    await ctx.reply("Buyruqlardan foydalaning: /start yoki /status")
  })

  return bot
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // Telegram webhook faqat POST /webhook ga keladi.
    if (request.method === 'POST' && url.pathname === '/webhook') {
      const bot = buildBot(env)
      const handler = webhookCallback(bot, 'cloudflare-mod', {
        secretToken: env.WEBHOOK_SECRET || undefined
      })
      return handler(request)
    }

    return new Response('quiz-bot ishlayapti ✅', { status: 200 })
  }
}
