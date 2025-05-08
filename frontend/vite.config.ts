import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001, // Reverted back to original port
    host: '0.0.0.0', // Allow access from other devices on the network
    proxy: {
      '/api': {
        target: 'http://localhost:5002', // Reverted back to original backend port
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
