import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/rank-resumes': 'http://127.0.0.1:8000',
      '/candidates': 'http://127.0.0.1:8000'
    }
  }
})
