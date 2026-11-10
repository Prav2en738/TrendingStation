import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Demo build: the frontend runs on its own (data comes from localStorage), so there is no
// backend proxy. The old /server folder is left in the project but unused.
export default defineConfig({
  plugins: [react()],
  base: '/Trending-station/',
})
