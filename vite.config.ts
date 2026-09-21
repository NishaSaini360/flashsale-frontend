import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/inv': { target: 'http://localhost:8081', changeOrigin: true, rewrite: p => p.replace(/^\/inv/, '') },
      '/res': { target: 'http://localhost:8082', changeOrigin: true, rewrite: p => p.replace(/^\/res/, '') },
      '/ord': { target: 'http://localhost:8083', changeOrigin: true, rewrite: p => p.replace(/^\/ord/, '') },
    },
  },
})
