import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' keeps asset URLs relative so the built app can be served from any
// sub-path (static host, preview environment, or a plain file server).
export default defineConfig({
  base: './',
  plugins: [react()],
})
