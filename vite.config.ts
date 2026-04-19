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
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@store': path.resolve(__dirname, './src/store'),
      '@types': path.resolve(__dirname, './src/types'),
      '@workers': path.resolve(__dirname, './src/workers'),
      '@config': path.resolve(__dirname, './src/config'),
    },
  },
  worker: {
    format: 'es',
    plugins: [wasm(), topLevelAwait()],
  },
  build: {
    target: 'ESNext',
    outDir: 'dist',
    minify: 'esbuild', 
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('transformers') || id.includes('mediapipe')) return 'vendor-ai';
            return 'vendor-libs';
          }
        },
      },
    },
    chunkSizeWarningLimit: 3000,
  },
})
