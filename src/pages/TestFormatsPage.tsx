import { Container, Typography, Box, Card, CardContent, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Stack, useTheme } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { ArrowBack, CheckCircle, Description, TableChart, Sort, Link, Numbers } from '@mui/icons-material'
import { Button } from '@mui/material'

interface TestFormatsPageProps {
  onBack: () => void
}

export default function TestFormatsPage({ onBack }: TestFormatsPageProps) {
  const { t } = useTranslation()
  const theme = useTheme()

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 } }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={onBack}
          variant="outlined"
          sx={{ flexShrink: 0 }}
        >
          {t('common.back') || 'Orqaga'}
        </Button>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            fontWeight: 600,
            fontSize: { xs: '1.5rem', sm: '2rem' },
            flexGrow: 1
          }}
        >
          {t('formats.title') || 'Test Formatlari'}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Qo'llab-quvvatlanadigan formatlar */}
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <CheckCircle color="primary" sx={{ fontSize: '2rem' }} />
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {t('formats.supportedFormats') || 'Qo\'llab-quvvatlanadigan formatlar'}
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Chip 
                icon={<Description />} 
                label="TXT fayllar (.txt)" 
                color="primary" 
                variant="outlined"
                sx={{ fontSize: '1rem', py: 2.5 }}
              />
              <Chip 
                icon={<Description />} 
                label="Word fayllar (.docx)" 
                color="primary" 
                variant="outlined"
                sx={{ fontSize: '1rem', py: 2.5 }}
              />
            </Stack>
          </CardContent>
        </Card>

        {/* Format 0: Yangi format (==== va ++++ separatorlar) */}
        <Card elevation={2} sx={{ border: '2px solid', borderColor: 'primary.main' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Description color="primary" sx={{ fontSize: '2rem' }} />
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {t('formats.format0.title') || 'Format 0: Yangi format (==== va ++++ separatorlar)'}
              </Typography>
              <Chip label="YANGI" color="primary" size="small" sx={{ ml: 'auto' }} />
            </Box>
            
            <Typography variant="body1" paragraph>
              {t('formats.format0.description') || 'Bu format eng sodda va qulay formatdir. Savollar ++++ bilan ajratiladi, javoblar esa ==== bilan ajratiladi.'}
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.50', mb: 3 }}>
              <Typography component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.875rem', whiteSpace: 'pre-wrap', color: 'text.primary' }}>
{`Savol matni bu yerda yoziladi====
# To'g'ri javob 1====
Noto'g'ri javob 1====
Noto'g'ri javob 2====
# To'g'ri javob 2 (multi-select uchun)
++++
Ikkinchi savol matni====
# To'g'ri javob====
Noto'g'ri javob 1====
Noto'g'ri javob 2====
Noto'g'ri javob 3
++++`}
              </Typography>
            </Paper>

            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                {t('formats.format0.rules') || 'Qoidalar:'}
              </Typography>
              <Box component="ul" sx={{ pl: 3 }}>
                <li>
                  <Typography variant="body2">
                    <strong>++++</strong> - Savollar orasidagi separator (har bir savol ++++ bilan ajratiladi)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    <strong>====</strong> - Savol matni va javoblar orasidagi separator
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Savol matni birinchi bo'lakda (==== dan oldin) yoziladi
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Har bir javob ==== bilan ajratiladi
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    <strong>#</strong> - To'g'ri javob belgisi (javob boshida # belgisi bo'lishi kerak)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Agar javob boshida <strong>#</strong> bo'lmasa, u noto'g'ri javob hisoblanadi
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Har bir savolda kamida 2 ta javob bo'lishi kerak
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Agar bir nechta javobda <strong>#</strong> belgisi bo'lsa, multi-select savol bo'ladi
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Bu format TXT va DOCX fayllarida ishlaydi
                  </Typography>
                </li>
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                {t('formats.format0.example') || 'Misol:'}
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.50' }}>
                <Typography variant="body2" paragraph sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
{`Quvvati 200 kVt kam bo'lgan konveyerlarda qo'llanadigan dvigatel turi qaysi variantda to'g'ri keltirilgan?====
# Asinxron dvigatel====
Sinxron dvigatel====
Doimiy tok dvigateli====
Universal dvigatel
++++
Ikkinchi savol matni bu yerda yoziladi====
# To'g'ri javob====
Noto'g'ri javob 1====
Noto'g'ri javob 2`}
                </Typography>
              </Paper>
            </Box>

            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText', mt: 2 }}>
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                {t('formats.format0.note') || '💡 Maslahat: Bu format eng qulay va sodda formatdir. Yangi testlar yaratishda bu formatdan foydalanish tavsiya etiladi.'}
              </Typography>
            </Paper>
          </CardContent>
        </Card>

        {/* Format 1: Question mark format */}
        <Card elevation={2} sx={{ border: '2px solid', borderColor: 'primary.main' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Description color="primary" sx={{ fontSize: '2rem' }} />
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {t('formats.format1.title') || 'Format 1: Savol belgisi format (? belgisi)'}
              </Typography>
              <Chip label="YANGI" color="primary" size="small" sx={{ ml: 'auto' }} />
            </Box>
            
            <Typography variant="body1" paragraph>
              {t('formats.format1.description') || 'Bu format savollar ? belgisi bilan boshlanadigan formatdir. TXT va DOCX fayllarida ishlaydi.'}
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.50', mb: 3 }}>
              <Typography component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.875rem', whiteSpace: 'pre-wrap', color: 'text.primary' }}>
{`? Savol matni bu yerda yoziladi
+ To'g'ri javob 1
- Noto'g'ri javob 1
- Noto'g'ri javob 2
+ To'g'ri javob 2 (multi-select uchun)

? Ikkinchi savol
+ To'g'ri javob
- Noto'g'ri javob 1
- Noto'g'ri javob 2
- Noto'g'ri javob 3`}
              </Typography>
            </Paper>

            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                {t('formats.format1.rules') || 'Qoidalar:'}
              </Typography>
              <Box component="ul" sx={{ pl: 3 }}>
                <li>
                  <Typography variant="body2">
                    <strong>?</strong> - Savolni boshlash belgisi
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    <strong>+</strong> - To'g'ri javob belgisi
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    <strong>-</strong> - Noto'g'ri javob belgisi
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Savol matni va javoblar bir nechta qatorda bo'lishi mumkin
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Har bir savolda kamida 2 ta javob bo'lishi kerak
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Agar bir nechta <strong>+</strong> belgisi bo'lsa, multi-select savol bo'ladi
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Bu format TXT va DOCX fayllarida ishlaydi
                  </Typography>
                </li>
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                {t('formats.format1.example') || 'Misol:'}
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.50' }}>
                <Typography variant="body2" paragraph sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
{`? Nafasning organizm uchun asosiy moxiyati:
+ Organizm to'qima va hujayralarini kislorod bilan ta'minlab, CO2 ajratish
- organizm to'qima va hujayralarini vitaminlar bilan ta'minlash
- organizm to'qima va hujayralarini oziq moddalar bilan ta'minlash
- organizm to'qima va hujayralarini suv va mikroelementlar bilan ta'minlash
- Organizm to'qima va hujayralarini karbonat angidrid bilan ta'minlab, kislorodni ajratish`}
                </Typography>
              </Paper>
            </Box>

            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText', mt: 2 }}>
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                {t('formats.format1.note') || '💡 Maslahat: Bu format Format 0 va Format 2 ga o\'xshash, lekin savollar ? belgisi bilan boshlanadi.'}
              </Typography>
            </Paper>
          </CardContent>
        </Card>

        {/* Format 2: Oddiy TXT format */}
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Description color="primary" sx={{ fontSize: '2rem' }} />
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {t('formats.format2.title') || 'Format 2: Oddiy format (# belgisi)'}
              </Typography>
            </Box>
            
            <Typography variant="body1" paragraph>
              {t('formats.format2.description') || 'Bu format oddiy matn fayllari va Word hujjatlari uchun ishlatiladi. Savollar # belgisi bilan boshlanadi.'}
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.50', mb: 3 }}>
              <Typography component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.875rem', whiteSpace: 'pre-wrap', color: 'text.primary' }}>
{`# Savol matni bu yerda yoziladi
+ To'g'ri javob 1
- Noto'g'ri javob 1
- Noto'g'ri javob 2
+ To'g'ri javob 2 (multi-select uchun)

# Ikkinchi savol
+ To'g'ri javob
- Noto'g'ri javob 1
- Noto'g'ri javob 2
- Noto'g'ri javob 3`}
              </Typography>
            </Paper>

            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                {t('formats.format2.rules') || 'Qoidalar:'}
              </Typography>
              <Box component="ul" sx={{ pl: 3 }}>
                <li>
                  <Typography variant="body2">
                    <strong>#</strong> - Savolni boshlash belgisi
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    <strong>+</strong> - To'g'ri javob belgisi
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    <strong>-</strong> - Noto'g'ri javob belgisi
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Savol matni va javoblar bir nechta qatorda bo'lishi mumkin
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Har bir savolda kamida 2 ta javob bo'lishi kerak
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Agar bir nechta <strong>+</strong> belgisi bo'lsa, multi-select savol bo'ladi
                  </Typography>
                </li>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Format 3: DOCX table format */}
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <TableChart color="primary" sx={{ fontSize: '2rem' }} />
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {t('formats.format3.title') || 'Format 3: DOCX Table format'}
              </Typography>
            </Box>
            
            <Typography variant="body1" paragraph>
              {t('formats.format3.description') || 'Bu format Word hujjatlarida jadval (table) ko\'rinishida javoblar bo\'lganda ishlatiladi.'}
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                {t('formats.format3.structure') || 'Struktura:'}
              </Typography>
              <Box component="ol" sx={{ pl: 3 }}>
                <li>
                  <Typography variant="body2">
                    Savol <strong>"Задание №"</strong> bilan boshlanadi (masalan: "Задание №1", "Задание №2")
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Savol matni bir nechta qatorda bo'lishi mumkin
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    <strong>"Выберите ... из ... вариантов ответа:"</strong> qatori o'tkazib yuboriladi
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Javoblar jadval (table) ko'rinishida bo'ladi
                  </Typography>
                </li>
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                {t('formats.format3.tableFormat') || 'Jadval formati:'}
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>1-ustun</strong></TableCell>
                      <TableCell><strong>2-ustun</strong></TableCell>
                      <TableCell><strong>3-ustun</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Javob indeksi</TableCell>
                      <TableCell>To'g'rilik belgisi</TableCell>
                      <TableCell>Javob matni</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>1</TableCell>
                      <TableCell>+</TableCell>
                      <TableCell>To'g'ri javob</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>2</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>Noto'g'ri javob</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>3</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>Noto'g'ri javob</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                {t('formats.format3.rules') || 'Qoidalar:'}
              </Typography>
              <Box component="ul" sx={{ pl: 3 }}>
                <li>
                  <Typography variant="body2">
                    Jadvalda 3 ta ustun bo'lishi kerak
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    1-ustun: Javob indeksi (1, 2, 3, ...)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    2-ustun: To'g'rilik belgisi (<strong>+</strong> to'g'ri, <strong>-</strong> noto'g'ri)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    3-ustun: Javob matni (tili bo'lishi mumkin, masalan: "Вazal/Базальный")
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Agar bir nechta <strong>+</strong> belgisi bo'lsa, multi-select savol bo'ladi
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Javoblar avtomatik random qilinadi
                  </Typography>
                </li>
              </Box>
            </Box>

            <Paper variant="outlined" sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.50', mt: 2 }}>
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.primary' }}>
                {t('formats.format3.note') || 'Eslatma: Agar jadval formatida savollar topilmasa, tizim oddiy formatga o\'tadi.'}
              </Typography>
            </Paper>
          </CardContent>
        </Card>

        {/* Format 4: Ketma ketlik format */}
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Sort color="primary" sx={{ fontSize: '2rem' }} />
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {t('formats.format4.title') || 'Format 4: Ketma ketlik format'}
              </Typography>
            </Box>
            
            <Typography variant="body1" paragraph>
              {t('formats.format4.description') || 'Bu format javoblarni ketma-ketlik bo\'yicha tartibga solish kerak bo\'lganda ishlatiladi.'}
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                {t('formats.format4.structure') || 'Struktura:'}
              </Typography>
              <Box component="ol" sx={{ pl: 3 }}>
                <li>
                  <Typography variant="body2">
                    Savol <strong>"Задание №"</strong> bilan boshlanadi (masalan: "Задание №1", "Задание №2")
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Savol matni bir nechta qatorda bo'lishi mumkin
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    <strong>"Укажите порядок следования всех ... вариантов ответа:"</strong> qatori o'tkazib yuboriladi
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Javoblar jadval (table) ko'rinishida bo'ladi
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Fayl oxirida <strong>"Ответы:"</strong> bilan boshlanadigan jadval bo'ladi
                  </Typography>
                </li>
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                {t('formats.format4.tableFormat') || 'Javoblar jadval formati:'}
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>1-ustun</strong></TableCell>
                      <TableCell><strong>2-ustun</strong></TableCell>
                      <TableCell><strong>3-ustun</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Javob indeksi</TableCell>
                      <TableCell>Ketma ketlik raqami</TableCell>
                      <TableCell>Javob matni</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>1</TableCell>
                      <TableCell>2</TableCell>
                      <TableCell>Ikkinchi javob</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>2</TableCell>
                      <TableCell>1</TableCell>
                      <TableCell>Birinchi javob</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>3</TableCell>
                      <TableCell>3</TableCell>
                      <TableCell>Uchinchi javob</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                {t('formats.format4.answersTable') || 'Javoblar jadvali (fayl oxirida):'}
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>1-ustun</strong></TableCell>
                      <TableCell><strong>2-ustun</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Savol raqami</TableCell>
                      <TableCell>To'g'ri ketma ketlik</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>#1</TableCell>
                      <TableCell>1=2, 2=1, 3=3, 4=4, 5=5</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>#2</TableCell>
                      <TableCell>1=1, 2=3, 3=2, 4=4</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary', fontStyle: 'italic' }}>
                {t('formats.format4.answersNote') || 'Format: "1=2" degani birinchi javob ikkinchi o\'rinda bo\'lishi kerak'}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                {t('formats.format4.rules') || 'Qoidalar:'}
              </Typography>
              <Box component="ul" sx={{ pl: 3 }}>
                <li>
                  <Typography variant="body2">
                    Javoblar jadvalida 3 ta ustun bo'lishi kerak
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    1-ustun: Javob indeksi (1, 2, 3, ...)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    2-ustun: Ketma ketlik raqami (1, 2, 3, ...)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    3-ustun: Javob matni
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Fayl oxirida "Ответы:" bilan boshlanadigan jadval bo'lishi kerak
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Javoblar jadvalida: 1-ustun - savol raqami (#1, #2, ...), 2-ustun - to'g'ri ketma ketlik (masalan: "1=2, 2=1, 3=3")
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Foydalanuvchi har bir javob uchun ketma ketlik raqamini tanlaydi
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Noto'g'ri javob berilganda, to'g'ri tartib ko'rsatiladi
                  </Typography>
                </li>
              </Box>
            </Box>

            <Paper variant="outlined" sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.50', mt: 2 }}>
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.primary' }}>
                {t('formats.format4.note') || 'Eslatma: Bu format faqat "Укажите порядок следования" so\'zi bo\'lsa ishlaydi.'}
              </Typography>
            </Paper>
          </CardContent>
        </Card>

        {/* Format 5: Moslik format */}
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Link color="primary" sx={{ fontSize: '2rem' }} />
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {t('formats.format5.title') || 'Format 5: Moslik format'}
              </Typography>
            </Box>
            
            <Typography variant="body1" paragraph>
              {t('formats.format5.description') || 'Bu format javoblarni moslik bo\'yicha bog\'lash kerak bo\'lganda ishlatiladi.'}
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                {t('formats.format5.structure') || 'Struktura:'}
              </Typography>
              <Box component="ol" sx={{ pl: 3 }}>
                <li>
                  <Typography variant="body2">
                    Savol <strong>"Задание №"</strong> bilan boshlanadi (masalan: "Задание №1", "Задание №2")
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Savol matni bir nechta qatorda bo'lishi mumkin
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    <strong>"Укажите соответствие для всех ... вариантов ответа"</strong> qatori o'tkazib yuboriladi
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Javoblar jadval (table) ko'rinishida bo'ladi
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Fayl oxirida <strong>"Ответы:"</strong> bilan boshlanadigan jadval bo'ladi
                  </Typography>
                </li>
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                {t('formats.format5.tableFormat') || 'Javoblar jadval formati:'}
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>1-ustun</strong></TableCell>
                      <TableCell><strong>2-ustun</strong></TableCell>
                      <TableCell><strong>3-ustun</strong></TableCell>
                      <TableCell><strong>4-ustun</strong></TableCell>
                      <TableCell><strong>5-ustun</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Indeks</TableCell>
                      <TableCell>Moslik indeksi (2-3)</TableCell>
                      <TableCell>Chap javob matni</TableCell>
                      <TableCell>Moslik indeksi (4-5)</TableCell>
                      <TableCell>O'ng javob matni</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>1</TableCell>
                      <TableCell>1</TableCell>
                      <TableCell>Birinchi chap javob</TableCell>
                      <TableCell>4</TableCell>
                      <TableCell>To'rtinchi o'ng javob</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>2</TableCell>
                      <TableCell>2</TableCell>
                      <TableCell>Ikkinchi chap javob</TableCell>
                      <TableCell>3</TableCell>
                      <TableCell>Uchinchi o'ng javob</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>3</TableCell>
                      <TableCell>3</TableCell>
                      <TableCell>Uchinchi chap javob</TableCell>
                      <TableCell>2</TableCell>
                      <TableCell>Ikkinchi o'ng javob</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>4</TableCell>
                      <TableCell>4</TableCell>
                      <TableCell>To'rtinchi chap javob</TableCell>
                      <TableCell>1</TableCell>
                      <TableCell>Birinchi o'ng javob</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                {t('formats.format5.answersTable') || 'Javoblar jadvali (fayl oxirida):'}
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>1-ustun</strong></TableCell>
                      <TableCell><strong>2-ustun</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Savol raqami</TableCell>
                      <TableCell>To'g'ri moslik</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>#1</TableCell>
                      <TableCell>1=4, 2=3, 3=2, 4=1</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>#2</TableCell>
                      <TableCell>1=1, 2=2, 3=3</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary', fontStyle: 'italic' }}>
                {t('formats.format5.answersNote') || 'Format: "1=4" degani birinchi chap javob to\'rtinchi o\'ng javobga mos keladi'}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                {t('formats.format5.rules') || 'Qoidalar:'}
              </Typography>
              <Box component="ul" sx={{ pl: 3 }}>
                <li>
                  <Typography variant="body2">
                    Javoblar jadvalida 5 ta ustun bo'lishi kerak
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    1-ustun: Indeks (faqat ko'rsatish uchun, ishlatilmaydi)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    2-ustun: Chap javoblar uchun moslik indeksi (3-ustundagi javobning indeksi)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    3-ustun: Chap javob matni
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    4-ustun: O'ng javoblar uchun moslik indeksi (5-ustundagi javobning indeksi)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    5-ustun: O'ng javob matni
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Fayl oxirida "Ответы:" bilan boshlanadigan jadval bo'lishi kerak
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Javoblar jadvalida: 1-ustun - savol raqami (#1, #2, ...), 2-ustun - to'g'ri moslik (masalan: "1=4, 2=3, 3=2, 4=1")
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Javoblar random qilinmaydi - ular asl tartibda ko'rsatiladi
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Foydalanuvchi har bir chap javob uchun mos o'ng javobni tanlaydi
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Noto'g'ri javob berilganda, to'g'ri mosliklar ko'rsatiladi
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Kamida 1 ta chap va 1 ta o'ng javob bo'lishi kerak
                  </Typography>
                </li>
              </Box>
            </Box>

            <Paper variant="outlined" sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.50', mt: 2 }}>
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.primary' }}>
                {t('formats.format5.note') || 'Eslatma: Bu format faqat "Укажите соответствие" so\'zi bo\'lsa ishlaydi. Javoblar random qilinmaydi.'}
              </Typography>
            </Paper>
          </CardContent>
        </Card>

        {/* Format 6: Raqamli savollar formati */}
        <Card elevation={2} sx={{ border: '2px solid', borderColor: 'primary.main' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Numbers color="primary" sx={{ fontSize: '2rem' }} />
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {t('formats.format6.title') || 'Format 6: Raqamli savollar formati'}
              </Typography>
              <Chip label="YANGI" color="primary" size="small" sx={{ ml: 'auto' }} />
            </Box>
            
            <Typography variant="body1" paragraph>
              {t('formats.format6.description') || 'Bu format savollar raqam bilan boshlanadigan va javoblar A-D harflari bilan belgilanadigan formatdir.'}
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.50', mb: 3 }}>
              <Typography component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.875rem', whiteSpace: 'pre-wrap', color: 'text.primary' }}>
{`97. Din erkinligi quyidagilarni o'z ichiga oladi:

+A. E'tirofni;

+B. Bolalarning diniy ta'limini;

+C. Amal qilmaslik huquqini;

D. Nafratni targ'ib qilishni;

98. Ikkinchi savol matni:

A. Birinchi javob

+B. Ikkinchi javob (to'g'ri)

C. Uchinchi javob

D. To'rtinchi javob

99. Uchinchi savol:

+A) Birinchi to'g'ri javob

B) Ikkinchi javob

+C) Uchinchi ham to'g'ri javob

D) To'rtinchi javob`}
              </Typography>
            </Paper>

            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                {t('formats.format6.rules') || 'Qoidalar:'}
              </Typography>
              <Box component="ul" sx={{ pl: 3 }}>
                <li>
                  <Typography variant="body2">
                    Savollar <strong>raqam</strong> bilan boshlanadi, keyin nuqta (masalan: <strong>97.</strong>, <strong>98.</strong>)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Savol matni raqam va nuqtadan keyin yoziladi
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Javoblar <strong>A, B, C, D</strong> harflari bilan belgilanadi
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Harfdan keyin <strong>nuqta (.)</strong> yoki <strong>qavs )</strong> bo'lishi mumkin (masalan: <strong>A.</strong> yoki <strong>A)</strong>)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    To'g'ri javoblar <strong>+</strong> belgisi bilan boshlanadi (masalan: <strong>+A.</strong> yoki <strong>+A)</strong>)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Noto'g'ri javoblar <strong>+</strong> belgisiz yoziladi (masalan: <strong>A.</strong> yoki <strong>B)</strong>)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Har bir savolda kamida 2 ta javob bo'lishi kerak
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Agar bir nechta javobda <strong>+</strong> belgisi bo'lsa, multi-select savol bo'ladi
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Savol matni bir nechta qatorda bo'lishi mumkin
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Bu format TXT fayllarida ishlaydi
                  </Typography>
                </li>
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                {t('formats.format6.example') || 'Misol:'}
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.50' }}>
                <Typography variant="body2" paragraph sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
{`97. Din erkinligi quyidagilarni o'z ichiga oladi:

+A. E'tirofni;

+B. Bolalarning diniy ta'limini;

+C. Amal qilmaslik huquqini;

D. Nafratni targ'ib qilishni;

98. Ikkinchi savol matni:

A. Birinchi javob

+B. Ikkinchi javob (to'g'ri)

C. Uchinchi javob

D. To'rtinchi javob`}
                </Typography>
              </Paper>
            </Box>

            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText', mt: 2 }}>
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                {t('formats.format6.note') || '💡 Maslahat: Bu format savollar raqam bilan tartiblangan va javoblar harflar bilan belgilangan testlar uchun qulaydir.'}
              </Typography>
            </Paper>
          </CardContent>
        </Card>

        {/* LaTeX formulalar */}
        <Card elevation={2}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              {t('formats.formulas.title') || 'LaTeX formulalar'}
            </Typography>
            
            <Typography variant="body1" paragraph>
              {t('formats.formulas.description') || 'Savol va javoblarda LaTeX formulalaridan foydalanish mumkin.'}
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                {t('formats.formulas.inline') || 'Inline formulalar:'}
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.50', mb: 2 }}>
                <Typography component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'text.primary' }}>
{`# $x^2 + y^2 = z^2$ formulasi qanday?
+ To'g'ri javob
- Noto'g'ri javob`}
                </Typography>
              </Paper>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                {t('formats.formulas.block') || 'Block formulalar:'}
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.50', mb: 2 }}>
                <Typography component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'text.primary' }}>
{`# Quyidagi formulani hisoblang:
$$\\int_0^\\infty e^{-x} dx = 1$$
+ To'g'ri javob
- Noto'g'ri javob`}
                </Typography>
              </Paper>
            </Box>
          </CardContent>
        </Card>

        {/* Misollar */}
        <Card elevation={2}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              {t('formats.examples.title') || 'Misollar'}
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  {t('formats.examples.singleSelect') || 'Single-select savol:'}
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.50' }}>
                  <Typography component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.875rem', whiteSpace: 'pre-wrap', color: 'text.primary' }}>
{`# Quyidagilardan qaysi biri to'g'ri?
+ To'g'ri javob
- Noto'g'ri javob 1
- Noto'g'ri javob 2
- Noto'g'ri javob 3`}
                  </Typography>
                </Paper>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  {t('formats.examples.multiSelect') || 'Multi-select savol:'}
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.50' }}>
                  <Typography component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.875rem', whiteSpace: 'pre-wrap', color: 'text.primary' }}>
{`# Quyidagilardan qaysilari to'g'ri? (bir nechta tanlash mumkin)
+ To'g'ri javob 1
- Noto'g'ri javob 1
+ To'g'ri javob 2
- Noto'g'ri javob 2`}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}
