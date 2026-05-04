import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@sim': path.resolve(__dirname, './src/modules/simulation'),
      '@ai': path.resolve(__dirname, './src/modules/ai'),
      '@backend': path.resolve(__dirname, './src/modules/backend'),
      '@ui': path.resolve(__dirname, './src/modules/ui'),
    },
  },
})
