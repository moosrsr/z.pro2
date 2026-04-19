import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

export default defineConfig({
  plugins: [
    topLevelAwait(),
    wasm(),
    react({
      babel: { presets: ['@babel/preset-typescript'] },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@workers': path.resolve(__dirname, './src/workers'),
    },
  },
  worker: {
    format: 'es',
    plugins: [wasm(), topLevelAwait()],
  },
  build: {
    target: 'ESNext',
    minify: 'esbuild', // ده الإصلاح الوحيد لضمان الرفع السريع
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
    chunkSizeWarningLimit: 5000,
  },
})
