import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

/**
 * Vector-Z Pro v3.0 - Production Vite Configuration
 * Bulletproof WASM, chunk splitting, and memory management
 * GitHub Ready - Production Grade
 */

export default defineConfig({
  plugins: [
    topLevelAwait(),
    wasm(),
    react({
      babel: {
        presets: ['@babel/preset-typescript'],
      },
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

  /**
   * Web Worker Configuration - ES Module Format
   * Required for proper Worker instantiation
   */
  worker: {
    format: 'es',
    plugins: [
      topLevelAwait(),
      wasm(),
    ],
  },

  /**
   * Server Configuration with CORS headers for Worker
   */
  server: {
    port: 5173,
    host: true,
    cors: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    fs: {
      strict: false, // Allow Worker and WASM files
    },
  },

  preview: {
    port: 4173,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },

  /**
   * Build Configuration - Production Optimized
   */
  build: {
    target: 'ES2020',
    outDir: 'dist',
    assetsDir: 'assets',
    
    /**
     * Minification with aggressive console removal
     */
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      mangle: true,
      format: {
        comments: false,
      },
    },

    /**
     * Rollup Configuration - Critical for large bundle handling
     */
    rollupOptions: {
      output: {
        /**
         * Manual chunk splitting - Prevents Vercel 413 errors
         * Separates heavy AI libraries into individual chunks
         */
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // AI/ML libraries - MUST be in separate chunks
            if (id.includes('transformers') || id.includes('@xenova')) {
              return 'vendor-transformers'
            }
            if (id.includes('mediapipe') || id.includes('@mediapipe')) {
              return 'vendor-mediapipe'
            }
            if (id.includes('opencv') || id.includes('cv')) {
              return 'vendor-opencv'
            }
            if (id.includes('tesseract')) {
              return 'vendor-tesseract'
            }
            if (id.includes('imgly')) {
              return 'vendor-imgly'
            }

            // Image processing libraries
            if (id.includes('sharp') || id.includes('jimp')) {
              return 'vendor-image-processors'
            }
            if (id.includes('imagemin') || id.includes('pngquant')) {
              return 'vendor-image-optimization'
            }

            // Vectorization & graphics
            if (id.includes('fabric') || id.includes('svgo') || id.includes('chroma')) {
              return 'vendor-graphics'
            }

            // Backend & services
            if (id.includes('stripe') || id.includes('@supabase') || id.includes('fastify')) {
              return 'vendor-services'
            }

            // Core React & state
            if (id.includes('react') || id.includes('zustand')) {
              return 'vendor-core'
            }
          }

          // App code chunks
          if (id.includes('src/utils')) {
            return 'app-utils'
          }
          if (id.includes('src/components')) {
            return 'app-components'
          }
          if (id.includes('src/store')) {
            return 'app-store'
          }
          if (id.includes('src/api')) {
            return 'app-api'
          }
          if (id.includes('src/workers')) {
            return 'app-workers'
          }
        },

        /**
         * Asset file naming strategy
         */
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: ({ name }) => {
          if (/\.(gif|jpe?g|png|svg|webp)$/.test(name ?? '')) {
            return 'images/[name]-[hash][extname]'
          } else if (/\.css$/.test(name ?? '')) {
            return 'css/[name]-[hash][extname]'
          } else if (/\.wasm$/.test(name ?? '')) {
            return 'wasm/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },

        /**
         * Don't inline dynamic imports - keep them separate
         */
        inlineDynamicImports: false,
      },

      /**
       * Warning suppression for WASM and circular deps
       */
      onwarn(warning, warn) {
        if (warning.code === 'CIRCULAR_DEPENDENCY') return
        if (warning.message?.includes('WASM')) return
        if (warning.message?.includes('top-level-await')) return
        warn(warning)
      },
    },

    /**
     * Chunk size warning threshold
     */
    chunkSizeWarningLimit: 1000, // 1MB per chunk

    /**
     * Production optimizations
     */
    cssCodeSplit: true,
    sourcemap: false,
    reportCompressedSize: true,
    emptyOutDir: true,

    /**
     * Rollup input - application only
     */
    lib: undefined,
  },

  /**
   * Dependency Pre-bundling
   */
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'zustand',
      '@supabase/supabase-js',
      'stripe',
    ],
    /**
     * Exclude large WASM-dependent packages
     */
    exclude: [
      '@xenova/transformers',
      '@mediapipe/tasks-vision',
      'sharp',
      'jimp',
      'tesseract.js',
      '@imgly/background-removal',
    ],
    esbuildOptions: {
      supported: {
        bigint: true,
        top_level_await: true,
      },
    },
  },

  /**
   * Environment variables
   */
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
    __VERSION__: JSON.stringify(process.env.npm_package_version || '3.0.0'),
    __PRODUCTION__: JSON.stringify(process.env.NODE_ENV === 'production'),
  },
})
