import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages uchun base path
// Agar repository nomi 'quiz' bo'lsa, base path '/quiz/' bo'ladi
// Agar username.github.io bo'lsa, base path '/' bo'ladi
const base = process.env.VITE_BASE_PATH || '/'

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    host: true, // Listen on all network interfaces
    port: 3000
  }
})
