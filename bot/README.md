# quiz-bot — Cloudflare Workers'dagi Telegram bot

Doimiy tekin (Cloudflare free tier: kuniga 100 000 so'rov), webhook rejimida ishlaydi,
mini app bilan bitta Firestore loyihasini (`quiz-277a6`) ishlatadi.

## Buyruqlar

- `/start` — salomlashish + mini app tugmasi
- `/status` — `jwt_tokens` kolleksiyasidan foydalanuvchining faol obunasini tekshiradi

## Deploy qilish (bir marta)

```bash
cd bot
npm install

# 1. Cloudflare hisobiga kirish (tekin hisob yetarli)
npx wrangler login

# 2. Bot tokenini maxfiy sifatida saqlash (@BotFather dan olinadi)
npx wrangler secret put BOT_TOKEN

# 3. (ixtiyoriy, tavsiya etiladi) webhook secret
npx wrangler secret put WEBHOOK_SECRET

# 4. Deploy — natijada https://quiz-bot.<account>.workers.dev manzili chiqadi
npm run deploy

# 5. Telegram'ga webhook'ni o'rnatish
BOT_TOKEN=... WORKER_URL=https://quiz-bot.<account>.workers.dev WEBHOOK_SECRET=... npm run set-webhook
```

Keyingi o'zgarishlarda faqat `npm run deploy` yetarli.

## Sozlash

- `wrangler.toml` → `MINI_APP_URL` ni o'z botingizning mini app havolasiga almashtiring
  (masalan `https://t.me/mybot/quiz`).
- Lokal test: `npm run dev` + [cloudflared tunnel yoki wrangler dev --remote] bilan.

## Eslatma

Firestore'ga mini app'dagi kabi ochiq `apiKey` bilan REST orqali ulanadi —
xavfsizlik chegarasi Firestore security rules'da (CLAUDE.md'dagi eslatma botga ham tegishli).
