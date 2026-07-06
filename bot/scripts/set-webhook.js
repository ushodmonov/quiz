// Deploy'dan keyin Telegram'ga webhook manzilini o'rnatadi.
// Ishlatish:
//   BOT_TOKEN=123:abc WORKER_URL=https://quiz-bot.<account>.workers.dev WEBHOOK_SECRET=sirli node scripts/set-webhook.js

const { BOT_TOKEN, WORKER_URL, WEBHOOK_SECRET } = process.env

if (!BOT_TOKEN || !WORKER_URL) {
  console.error('BOT_TOKEN va WORKER_URL environment o\'zgaruvchilari kerak')
  process.exit(1)
}

const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: `${WORKER_URL.replace(/\/$/, '')}/webhook`,
    secret_token: WEBHOOK_SECRET || undefined,
    allowed_updates: ['message', 'callback_query']
  })
})

console.log(await res.json())
