import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

/** Copie index.html → 404.html pour le fallback SPA (Vercel, GitHub Pages, etc.) */
function spaFallback404() {
  return {
    name: 'spa-fallback-404',
    closeBundle() {
      const dist = path.resolve(rootDir, 'dist')
      const index = path.join(dist, 'index.html')
      const notFound = path.join(dist, '404.html')
      if (fs.existsSync(index)) {
        fs.copyFileSync(index, notFound)
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), spaFallback404()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
