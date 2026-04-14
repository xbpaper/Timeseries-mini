import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000, // 调整警告阈值
    rollupOptions: {
      output: {
        manualChunks: {
          // 将第三方库拆分为独立的chunk
          vendor: ['react', 'react-dom', '@mui/material', '@emotion/react', '@emotion/styled'],
          // 将图表库拆分为独立的chunk
          chart: ['chart.js', 'react-chartjs-2'],
          // 将HTTP客户端拆分为独立的chunk
          api: ['axios'],
        },
      },
    },
  },
})
