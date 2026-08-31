import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      // alias lucide-react to local shim to avoid corrupted package files
      'lucide-react': path.resolve(__dirname, 'src/shims/lucide-react-shim.jsx'),
      'warning': path.resolve(__dirname, 'src/shims/warning-shim.js')
    }
  },
  optimizeDeps: {
    // let Vite discover and pre-bundle dependencies normally
  },
  server: {
    proxy: {
      '/api/archive': {
        target: 'https://archive.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/archive/, ''),
        followRedirects: true,
        secure: false
      }
    }
    ,
    fs: {
      allow: ['.']
    }
  }
})
