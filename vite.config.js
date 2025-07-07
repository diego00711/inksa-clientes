import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Deixando a configuração de atalho como estava quando funcionava
      "@": path.resolve(process.cwd(), "src"),
    },
  },
})