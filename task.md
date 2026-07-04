# TASK: Qo'lda yozilgan katakli daftar (A5) konspekt generatori

## 1. Maqsad

Berilgan mavzu va matndan **har doim bir xil uslubda** — xuddi qo'lda yozilgan katakli
(matematika) daftar sahifasidek — konspekt rasmini hosil qiladigan kichik dastur yoz.
Chiqish: **A5 formatida PNG (yuqori sifat) va PDF (chop etishga tayyor)**.

Uslub namunasi: ko'k sharikli ruchkada qo'lda (cursive) yozilgan, katak chiziqlariga
tayanadigan matn; qizil chap chegara chizig'i; qizil sarlavhalar; oltin rang yulduzchalar;
yashil iqtiboslar.

---

## 2. Aniq o'lchamlar va dizayn tokenlari (ATA-eng muhim qism — aynan shu qiymatlar)

### Sahifa
- Format: **A5 = 145 × 210 mm** (nisbat 145/210 = 0.6905).
- Fon: deyarli oq `#fefefe`.
- PNG sifatida chiqarishda `device_scale_factor = 4` (≈ 2196 × 3176 px, ~383 DPI).
- PDF: aniq `145mm × 210mm`, chekkalari (margin) `0`, `print_background: true`.

### Katak (grid)
- Katak o'lchami: **3.75 mm** (A5 ga mos, bitta betga sig'adi).
- Chiziq rangi: `#cfe0f4`, qalinligi ~`0.18mm`.
- Ikkala yo'nalishda ham (vertikal + gorizontal), sahifa chetigacha to'liq.

### Vertikal ritm — MUHIM QOIDA
Barcha vertikal o'lchamlar **butun katak** sonida bo'lsin, shunda har bir yozuv qatori
aniq katak chizig'iga "tayanadi" (float bo'lib qolmaydi):
- Yuqoridan bo'shliq (top): **2 katak** (7.5 mm)
- Sarlavha bloki: **3 katak**
- Bo'limlar orasidagi bo'shliq (gap): **1 katak**
- Yozuv qatori (writing line): **2 katak** (7.5 mm)
- Matn qator ichida **pastga tekislanadi** (`align-items: flex-end`), `padding-bottom ≈ 0.9mm`
  → harflar katakning pastki chizig'iga tayanadi.

Butun sahifa taxminan: `top(2) + title(3) + 5×gap(1) + ~21×line(2)` ≈ 52–54 katak,
pastda **≈ 10 mm bo'sh joy qoladi** (hech narsa kesilmasin).

### Chap qizil chegara chizig'i (juda muhim shart)
- Qizil vertikal chiziq: chapdan **3 katak = 11.25 mm** joyda; rang `#e88883`, eni ~`0.45mm`.
- **HECH QANDAY YOZUV (sarlavha ham) shu qizil chiziqdan chapga o'tmasligi kerak.**
- Buni ta'minlash uchun: butun matn "content" konteyneriga joylanadi; konteyner
  `left ≈ 12.65 mm` (qizil chiziqdan ~1.4mm o'ngda) dan boshlanadi, `right ≈ 6 mm`.
  **Sarlavha ham shu konteyner ichida markazlashtiriladi** (butun sahifa bo'yicha emas!)
  — shunda u ham chapga o'tmaydi.

### Shriftlar
- **Body (asosiy matn): Caveat, weight 600** — qo'lda yozilgan (cursive) ko'rinish.
  - O'lcham: **5.7 mm** (bosh harf balandligi ≈ 1.2 katak; katakdan sal kattaroq).
  - Qiyalik (skew) YO'Q — Caveat o'zi tabiiy qo'lyozma ko'rinishga ega.
- **Sarlavha: Caveat, weight 700**, o'lcham ≈ **10.3 mm** (≈ 2.75 katak), markazda.
- Shriftlarni Google Fonts'dan olib **base64 sifatida HTML ichiga joylashtir** (offline ishlashi uchun):
  - Caveat: `https://raw.githubusercontent.com/google/fonts/main/ofl/caveat/Caveat%5Bwght%5D.ttf`
  - (Ixtiyoriy muqobil qo'lyozma: Kalam — `.../ofl/kalam/Kalam-Regular.ttf`)
- Eslatma: o'zbekcha `o'` va `g'` oddiy apostrof `'` bilan yoziladi — Caveat buni qo'llaydi.

### Ranglar
| Element            | Rang       |
|--------------------|------------|
| Asosiy matn (siyoh)| `#22439c`  |
| Sarlavha (title)   | `#1a2c74`  |
| Sarlavha tag chizig'i | `#d23a3a` (eni ~48mm) |
| Bo'lim sarlavhasi (heading) | `#c62f2a`, tagi chizilgan |
| Yulduzcha (★) prefiksi | `#d99a1f` |
| Iqtibos / quote    | `#1f7a3c`  |
| Yurak (♥) / urg'u  | `#c62f2a`  |
| Katak chiziqlari   | `#cfe0f4`  |
| Qizil chegara      | `#e88883`  |

### Elementlar ko'rinishi
- **Bo'lim sarlavhasi**: `★ Sarlavha` — oltin yulduzcha + qizil, tagi chizilgan matn.
- **Oddiy sarlavha** (masalan `Reja:`): qizil, tagi chizilgan, yulduzchasiz.
- **Bullet**: `— matn`, chapdan ~1.3 katak ichkariga surilgan (indent).
- **Iqtibos**: yashil rangda (masalan `"Vatan ostonadan boshlanadi."`).
- **Xulosa qatori**: `Xulosa:` (qizil) + oddiy matn + `♥` (qizil).

---

## 3. Kirish (input) formati

Foydalanuvchi mavzu va matnni oddiy, satr-asosli belgilash (markup) bilan bersin.
Dastur shu matnni yuqoridagi uslubga o'giradi. Taklif qilingan sintaksis:

```
@title: Vatan muqaddas         # sahifa sarlavhasi (bitta bo'ladi)

# Reja:                        # oddiy qizil sarlavha (tagi chizilgan)
1. Vatan tushunchasi           # oddiy ko'k qator (raqamni foydalanuvchi o'zi yozadi)
2. Vatan nima uchun muqaddas?

* Vatan tushunchasi            # ★ + qizil sarlavha (tagi chizilgan)
- Inson tug'ilib o'sgan yurt.  # bullet (— bilan chiqadi)
- Ota-bobolar yashagan zamin.

* Nima uchun muqaddas?
- Ona kabi aziz va tabarruk.
> "Vatan ostonadan boshlanadi." # yashil iqtibos

= Xulosa: Vatan bitta, muqaddas! ♥   # xulosa qatori (ixtiyoriy maxsus)
```

Qoidalar:
- `@title:` → sahifa sarlavhasi.
- `*` bilan boshlangan → yulduzchali qizil sarlavha.
- `#` bilan boshlangan → yulduzchasiz qizil sarlavha.
- `-` bilan boshlangan → bullet (`— ` bilan chiqadi, indent bilan).
- `>` bilan boshlangan → yashil iqtibos.
- `=` bilan boshlangan → xulosa uslubidagi qator.
- Bo'sh satr → 1 katak bo'shliq (gap).
- Boshqa har qanday satr → oddiy ko'k qator.

Muqobil kirishlar (ixtiyoriy): oddiy `.txt`/`.md` fayl yoki JSON.

---

## 4. Texnik yondashuv

**Tavsiya etiladigan usul (aynan shu natijani beradi):**
- HTML + CSS bilan sahifani chiz (mm birliklarida), so'ng **headless Chromium (Playwright)**
  orqali rasm/PDF chiqar. Bu piksel-aniq A5 natija beradi.
- Bitta Python skript: kirish matnini o'qiydi → HTML hosil qiladi → `.png` va `.pdf` yozadi.
- CSS'da `background-image` sifatida ikki `linear-gradient` bilan katak chizilsin;
  `background-size: 3.75mm 3.75mm`.
- Har bir qator uchun `display:flex; align-items:flex-end; padding-bottom:~0.9mm`.

```python
# eskiz (pseudo)
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(device_scale_factor=4)
    pg.set_content(html)           # base64 shriftlar HTML ichida
    pg.query_selector(".page").screenshot(path="out.png")   # aniq A5 PNG
    pg.pdf(path="out.pdf", width="145mm", height="210mm",
           print_background=True, margin={"top":"0","bottom":"0","left":"0","right":"0"})
    b.close()
```

**Muqobil usul (o'rnatishsiz, brauzerda):**
- Bitta o'zi-yetarli (self-contained) `index.html`: matn maydoni + jonli ko'rinish (live preview)
  + "PDF/Chop etish" tugmasi (`window.print()` va `@page { size: A5; margin:0 }`).
- Shriftlar base64 bilan ichida — offline ishlaydi. Telefon/kompyuterda ochib ishlatsa bo'ladi.
- Ixtiyoriy: o'lcham slayderi va rang (ko'k/qora) tanlovi.

---

## 5. Ixtiyoriy sozlamalar (nice-to-have)

- **Yozuv o'lchami** slayderi (masalan 5.0–7.0 mm), lekin qator baribir 2 katak ritmida qolsin.
- **Siyoh rangi**: ko'k `#22439c` yoki qora `#1c1c22`.
- **Katak o'lchami** (3.75 / 4.0 / 5.0 mm) tanlovi.
- Agar matn bir betga sig'masa: avtomatik **2-bet** (yangi A5 sahifa)ga o'tkazish.
- Sarlavhada foydalanuvchi ismi yoki sana qo'shish imkoniyati.

---

## 6. Qabul qilish mezonlari (acceptance criteria)

Chiqqan natija quyidagilarni **avtomatik tekshiruvdan** o'tsin (masalan PIL/numpy bilan):

1. **A5 nisbat**: `width/height ≈ 0.6905` (±0.005).
2. **Chap chegara**: qizil chiziqning chap tomonida **0 ta yozuv piksel** bo'lsin
   (ko'k va yashil siyoh piksellarini qizil chiziq x-koordinatasidan chapda sanaganda 0).
3. **Kesilmasin**: eng pastki matn sahifa tubidan **≥ 8 mm yuqorida** tugasin
   (pastda bo'sh joy qolsin); yuqorida ~6–9 mm bo'shliq bo'lsin.
4. **Katak ko'rinadi**, matn katak chiziqlariga tayanadi (float emas).
5. Sarlavha content sohasi ichida markazlashgan, u ham chap chiziqdan o'tmagan.

Tekshiruv eskizi:
```python
# redx = qizil vertikal chiziq x-koordinatasi (eng ko'p qizil piksel ustuni)
# text = ko'k|yashil siyoh maskasi
assert text[:, :redx-3].sum() == 0          # chapda yozuv yo'q
assert abs(w/h - 0.6905) < 0.005            # A5
# pastki matn kesilmagan (bottom gap >= ~8mm)
```

---

## 7. Yakuniy natija (deliverable)

- Ishlaydigan dastur (Python skript **yoki** self-contained HTML).
- Namuna kirish (Vatan muqaddas) bilan hosil qilingan **A5 PNG + PDF**.
- Qisqa README: qanday ishga tushirish va kirish sintaksisi.

> Eslatma: yuqoridagi barcha aniq qiymatlar (3.75mm katak, 2-katak qator, Caveat 5.7mm/600,
> qizil chiziq 3 katak, ranglar) tayyor namunaga mos — ularni o'zgartirmasdan qo'llasang,
> natija xuddi tasdiqlangan "ikkinchi variant"dek chiqadi.
