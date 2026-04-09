import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { mercurDashboardPlugin } from '@mercurjs/dashboard-sdk'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    mercurDashboardPlugin({
      medusaConfigPath: '../../packages/api/medusa-config.ts',
      backendUrl: 'http://localhost:7001',
    }),
  ],
  server: {
    proxy: {
      '/admin': 'http://localhost:9001',
      '/auth': 'http://localhost:9001',
      '/store': 'http://localhost:9001',
      '/vendor': 'http://localhost:9001',
      '/health': 'http://localhost:9001',
    },
  },
})
