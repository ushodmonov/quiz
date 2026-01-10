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

## Texnik stack

- React 18 + TypeScript
- Vite
- Material UI
- KaTeX (formula render qilish)
- Mammoth (Word fayllarni o'qish)
- i18next (ko'p tillilik)
