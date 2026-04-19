import React from "react"
import { useCallback, useRef, useEffect } from 'react'

export interface VectorizerConfig {
  engine?: 'potrace' | 'vtracer' | 'hybrid'
  maxNodes?: number
  enableMagicMode?: boolean
  enableColorGrouping?: boolean
  enableSVGOOptimization?: boolean
  enableViewBoxCentering?: boolean
}

interface WorkerMessage {
  id: string
  type: 'vectorize' | 'analyze' | 'config'
  data: any
}

interface WorkerResponse {
  id: string
  type: 'progress' | 'result' | 'error'
  progress?: number
  data?: any
  error?: string
}

/**
 * Bulletproof Web Worker Instantiation
 * Ensures proper path resolution on Vercel and local development
 */
export class VectorizerWorker {
  private worker: Worker | null = null
  private messageHandlers: Map<string, Function> = new Map()
  private isInitialized = false

  constructor() {
    this.initializeWorker()
  }

  /**
   * Initialize Web Worker with strict Vite module syntax
   * Prevents path resolution errors on Vercel
   */
  private initializeWorker(): void {
    try {
      // Use strict Vite module syntax for proper bundling
      this.worker = new Worker(
        new URL('../workers/vectorizer.worker.ts', import.meta.url),
        { type: 'module' }
      )

      // Setup message listener
      this.worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
        const { id, type, data, error, progress } = event.data

        // Handle progress updates
        if (type === 'progress' && this.messageHandlers.has(`${id}_progress`)) {
          const progressHandler = this.messageHandlers.get(`${id}_progress`)
          progressHandler?.(progress)
        }
        // Handle results
        else if (type === 'result') {
          const handler = this.messageHandlers.get(id)
          if (handler) {
            handler({ success: true, data })
            this.messageHandlers.delete(id)
            this.messageHandlers.delete(`${id}_progress`)
          }
        }
        // Handle errors
        else if (type === 'error') {
          const handler = this.messageHandlers.get(id)
          if (handler) {
            handler({ success: false, error })
            this.messageHandlers.delete(id)
            this.messageHandlers.delete(`${id}_progress`)
          }
        }
      })

      // Listen for worker errors
      this.worker.addEventListener('error', (error) => {
        console.error('❌ Web Worker Error:', error)
        this.isInitialized = false
      })

      this.isInitialized = true
      console.log('✅ Web Worker initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Web Worker:', error)
      this.isInitialized = false
    }
  }

  /**
   * Analyze image without processing
   */
  async analyze(imageData: ImageData): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isInitialized || !this.worker) {
        reject(new Error('Worker not initialized'))
        return
      }

      const id = `analyze_${Date.now()}_${Math.random()}`
      
      this.messageHandlers.set(id, (response: any) => {
        if (response.success) {
          resolve(response.data)
        } else {
          reject(new Error(response.error))
        }
      })

      try {
        this.worker.postMessage({
          id,
          type: 'analyze',
          data: { imageData },
        } as WorkerMessage)

        // Timeout protection
        setTimeout(() => {
          if (this.messageHandlers.has(id)) {
            this.messageHandlers.delete(id)
            reject(new Error('Analysis timeout'))
          }
        }, 30000) // 30 second timeout
      } catch (error) {
        this.messageHandlers.delete(id)
        reject(error)
      }
    })
  }

  /**
   * Vectorize image with progress reporting
   */
  async vectorize(
    imageData: ImageData,
    config: VectorizerConfig = {},
    onProgress?: (progress: number) => void
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isInitialized || !this.worker) {
        reject(new Error('Worker not initialized'))
        return
      }

      const id = `vectorize_${Date.now()}_${Math.random()}`

      // Setup progress handler
      if (onProgress) {
        this.messageHandlers.set(`${id}_progress`, onProgress)
      }

      // Setup result handler
      this.messageHandlers.set(id, (response: any) => {
        if (response.success) {
          // Verify SVG output before resolving
          const svg = response.data?.svg
          const metadata = response.data?.metadata

          if (!svg || svg.length === 0) {
            reject(new Error('Invalid SVG output: empty or missing'))
            return
          }

          if (metadata?.fileSize === 0) {
            reject(new Error('Invalid output: 0 KB file size'))
            return
          }

          resolve(response.data)
        } else {
          reject(new Error(response.error || 'Vectorization failed'))
        }
      })

      try {
        // Validate input
        if (!imageData || !imageData.data || imageData.data.length === 0) {
          throw new Error('Invalid image data')
        }

        // Check SVG output validity before sending
        const validateSVGOutput = (svg: string) => {
          if (!svg || typeof svg !== 'string') {
            throw new Error('SVG output is not a string')
          }
          if (svg.length === 0) {
            throw new Error('SVG output is empty (0 bytes)')
          }
          if (!svg.includes('<svg')) {
            throw new Error('SVG output does not contain <svg> tag')
          }
          return true
        }

        this.worker.postMessage(
          {
            id,
            type: 'vectorize',
            data: { 
              imageData, 
              config: {
                ...config,
                validateOutput: true, // Enable strict output validation
              } 
            },
          } as WorkerMessage,
          // Transfer ImageData for better performance & memory management
          [imageData.data.buffer]
        )

        // Timeout protection (5 minutes for large images)
        setTimeout(() => {
          if (this.messageHandlers.has(id)) {
            this.messageHandlers.delete(id)
            this.messageHandlers.delete(`${id}_progress`)
            // Force garbage collection hint
            if (global.gc) global.gc()
            reject(new Error('Vectorization timeout after 5 minutes'))
          }
        }, 300000) // 5 minutes
      } catch (error) {
        this.messageHandlers.delete(id)
        this.messageHandlers.delete(`${id}_progress`)
        reject(error)
      }
    })
  }

  /**
   * Update worker configuration
   */
  updateConfig(config: VectorizerConfig): void {
    if (!this.worker) return

    const id = `config_${Date.now()}`
    this.worker.postMessage({
      id,
      type: 'config',
      data: config,
    } as WorkerMessage)
  }

  /**
   * Terminate worker and cleanup
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    this.messageHandlers.clear()
    this.isInitialized = false
    console.log('✅ Web Worker terminated')
  }

  /**
   * Check if worker is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.worker !== null
  }
}

/**
 * React Hook for Vectorizer
 */
export function useVectorizer() {
  const workerRef = useRef<VectorizerWorker | null>(null)
  const [isReady, setIsReady] = React.useState(false)

  // Initialize worker on mount
  useEffect(() => {
    workerRef.current = new VectorizerWorker()
    setIsReady(workerRef.current.isReady())

    // Cleanup on unmount
    return () => {
      workerRef.current?.terminate()
    }
  }, [])

  const vectorize = useCallback(
    async (imageData: ImageData, config?: VectorizerConfig, onProgress?: (p: number) => void) => {
      if (!workerRef.current?.isReady()) {
        throw new Error('Vectorizer worker not ready')
      }
      return workerRef.current.vectorize(imageData, config, onProgress)
    },
    []
  )

  const analyze = useCallback(async (imageData: ImageData) => {
    if (!workerRef.current?.isReady()) {
      throw new Error('Vectorizer worker not ready')
    }
    return workerRef.current.analyze(imageData)
  }, [])

  return {
    vectorize,
    analyze,
    isReady,
    terminate: () => workerRef.current?.terminate(),
  }
}

// Re-export for convenience
export default useVectorizer
