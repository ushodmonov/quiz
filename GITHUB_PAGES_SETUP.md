# GitHub Pages ni Yoqish

## Qadam 1: Repository Settings ga kiring

1. GitHub da repository ga kiring
2. **Settings** (Sozlamalar) tab ni bosing
3. Chap menudan **Pages** ni tanlang

## Qadam 2: Pages ni yoqing

1. **Source** bo'limida:
   - **"Deploy from a branch"** ni tanlang
   - Lekin **ASOSIY**: Quyidagi qadamni bajaring

2. Yoki **"GitHub Actions"** ni tanlang (agar mavjud bo'lsa)

## Qadam 3: GitHub Actions orqali deploy qilish

Agar "GitHub Actions" variant mavjud bo'lsa:
- **Source: "GitHub Actions"** ni tanlang
- **Save** ni bosing

Agar "GitHub Actions" variant yo'q bo'lsa:
- **Source: "Deploy from a branch"** ni tanlang
- **Branch: main** ni tanlang
- **Folder: / (root)** ni tanlang
- **Save** ni bosing
- Keyin yana qaytib, **Source: "GitHub Actions"** ga o'zgartiring (agar paydo bo'lsa)

## Qadam 4: Workflow ni ishga tushiring

1. **Actions** tab ga kiring
2. Agar workflow ishlagan bo'lsa va xato bo'lsa, uni qayta ishga tushiring
3. Yoki yangi commit qiling va push qiling

## Muammo bo'lsa:

Agar hali ham xato bo'lsa:
1. Repository Settings → Pages ga kiring
2. Source ni "None" ga o'zgartiring va Save
3. Keyin yana "GitHub Actions" ga o'zgartiring va Save
4. Workflow ni qayta ishga tushiring

## Eslatma:

- Yopiq repository dan ham deploy qilish mumkin
- Birinchi marta deploy qilish 2-5 daqiqa vaqt olishi mumkin
- Deploy bo'lgandan keyin sayt `https://YOUR_USERNAME.github.io/quiz/` da ochiladi
