# Quiz Veb-Sayti

Quiz veb-sayti - TXT va Word fayllardan savollar yuklab, testlar ishlatish imkoniyatini beruvchi ilova.

## Xususiyatlar

- ✅ React TypeScript
- ✅ TXT va Word (.docx) fayllardan savollar yuklash
- ✅ Test katalogidan testlarni tanlash
- ✅ Single-select va multi-select testlar
- ✅ LaTeX formulalarini ko'rsatish (KaTeX)
- ✅ Testni davom ettirish (Resume)
- ✅ Ketma-ket yoki tasodifiy savollar tanlash
- ✅ Material UI dizayn
- ✅ Dark/Light mode
- ✅ Ikki til: O'zbek/Rus
- ✅ Mobil va desktop mosligi
- ✅ 10,000+ savol bilan ishlashga mos
- ✅ **Telegram Mini App qo'llab-quvvatlash**
- ✅ **GitHub Pages bilan ishlash**

## Test katalogini qo'shish

1. DOCX fayllarni `public/assets/` papkasiga qo'ying
2. Katalogni avtomatik generate qiling:

```bash
npm run generate-catalog
```

Bu komanda `public/assets/` papkasidagi barcha DOCX fayllarni topadi va `test-catalog.json` faylini avtomatik yaratadi. Har bir fayl uchun:
- **id**: Fayl nomidan avtomatik generate qilinadi (masalan: `tibbiy_kimyo_1_1.docx` → `tibbiy-kimyo-1-1`)
- **name**: Fayl nomidan avtomatik generate qilinadi (masalan: `tibbiy_kimyo_1_1.docx` → `Tibbiy Kimyo 1 1`)
- **fileName**: Fayl nomi
- **questionCount**: 0 (qo'lda yangilash mumkin)
- **description**: Bo'sh (qo'lda qo'shish mumkin)

3. Agar kerak bo'lsa, `public/assets/test-catalog.json` faylini ochib, `questionCount` va `description` ni qo'lda yangilang.

## O'rnatish

```bash
npm install
```

## Ishga tushirish

```bash
npm run dev
```

Ilova `http://localhost:3000` manzilida ochiladi.

## Fayl formati

### TXT fayl

```
# Savol matni (formula bilan bo'lishi mumkin)
+ To'g'ri javob 1
- Noto'g'ri javob 1
- Noto'g'ri javob 2
+ To'g'ri javob 2 (multi-select uchun)
```

### Word (.docx) fayl

Xuddi shu format, lekin Word hujjatida.

## Formulalar

Formulalarni LaTeX formatida yozing:
- Inline: `$x^2 + y^2 = z^2$`
- Block: `$$\int_0^\infty e^{-x} dx = 1$$`

## Telegram Mini App sifatida ishlatish

Ilova Telegram Mini App sifatida ham ishlaydi. Telegram Web App SDK integratsiya qilingan.

### Telegram Mini App sozlash

1. **BotFather** orqali yangi bot yarating yoki mavjud botni tanlang
2. Bot sozlamalarida **Menu Button** yoki **Web App** qo'shing
3. Web App URL ni kiriting (masalan: `https://username.github.io/quiz/`)
4. Ilova avtomatik ravishda Telegram muhitini aniqlaydi va:
   - Telegram temasi bilan sinxronlashadi
   - Telegram back button ishlaydi
   - Haptic feedback qo'llab-quvvatlaydi
   - Telegram header va background ranglarini sozlaydi

## GitHub Pages ga deploy qilish

### Avtomatik deploy (GitHub Actions)

1. Repository sozlamalarida **Actions** ni yoqing
2. `main` yoki `master` branch ga push qiling
3. GitHub Actions avtomatik ravishda build qiladi va deploy qiladi

### Qo'lda deploy

```bash
# Build qilish
npm run build

# GitHub Pages uchun base path ni sozlash
# Agar repository nomi 'quiz' bo'lsa:
export VITE_BASE_PATH=/quiz/
npm run build

# Agar username.github.io bo'lsa:
export VITE_BASE_PATH=/
npm run build

# dist/ papkasini GitHub Pages ga deploy qiling
```

### Base path sozlash

`vite.config.ts` da base path o'zgartiriladi:

```typescript
const base = process.env.VITE_BASE_PATH || '/'
```

Yoki `.env` faylida:
```
VITE_BASE_PATH=/quiz/
```

## Texnik stack

- React 18 + TypeScript
- Vite
- Material UI
- KaTeX (formula render qilish)
- Mammoth (Word fayllarni o'qish)
- i18next (ko'p tillilik)
- Telegram Web App SDK