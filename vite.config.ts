// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  server: {
    port: 5173, // Puerto por defecto de Vite
    host: '127.0.0.1', // Usar IPv4 en lugar de IPv6
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // Tu backend en 3001
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  // Optimizaciones para Power Apps
  base: './',
  optimizeDeps: {
    exclude: ['@microsoft/power-apps']
  },
  // Suprimir warnings de sourcemap de Power Apps
  logLevel: 'warn'
})