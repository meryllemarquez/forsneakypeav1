import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import loveBoardAssets from './vite-plugins/loveBoardAssets.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), loveBoardAssets()],
})
