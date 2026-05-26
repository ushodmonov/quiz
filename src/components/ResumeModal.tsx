import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material'
import { useTranslation } from 'react-i18next'

interface ResumeModalProps {
  open: boolean
  onResume: () => void
  onNew: () => void
}

export default function ResumeModal({ open, onResume, onNew }: ResumeModalProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onClose={onNew} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 500 }}>{t('resume.title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{t('resume.message')}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onNew} color="inherit">
          {t('resume.new')}
        </Button>
        <Button onClick={onResume} variant="contained" color="primary">
          {t('resume.resume')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
