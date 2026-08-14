import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Relative asset paths, so the same build works at a domain root and under a
  // GitHub Pages project path (/<repo>/) without knowing the repo name.
  base: './',
  plugins: [react(), tailwindcss()],
})
