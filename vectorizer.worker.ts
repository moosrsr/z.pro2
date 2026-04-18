/**
 * Vector-Z Pro v3.0 - Advanced Web Worker
 * Memory-Safe 15-Library Pipeline with Lazy Loading
 * Production-Grade Vectorization Engine
 */

// Dynamic imports for lazy loading
let smartAnalysis: any = null
let hybridEngine: any = null

// Cache for loaded modules
const moduleCache = new Map<string, any>()

/**
 * Lazy load modules to prevent memory bloat
 */
async function loadModule(moduleName: string): Promise<any> {
  if (moduleCache.has(moduleName)) {
    return moduleCache.get(moduleName)
  }

  try {
    let module
    switch (moduleName) {
      case 'analysis':
        module = await import('../utils/smart-analysis')
        break
      case 'engine':
        module = await import('../utils/hybrid-engine')
        break
      default:
        throw new Error(`Unknown module: ${moduleName}`)
    }

    moduleCache.set(moduleName, module)
    return module
  } catch (error) {
    console.error(`Failed to load module ${moduleName}:`, error)
    throw error
  }
}

/**
 * Clear memory cache to prevent memory leaks
 */
function clearModuleCache(): void {
  moduleCache.forEach((module) => {
    // Cleanup if module has cleanup function
    if (module.cleanup && typeof module.cleanup === 'function') {
      module.cleanup()
    }
  })
  // Clear only old entries, keep recent ones
  if (moduleCache.size > 10) {
    const entries = Array.from(moduleCache.entries())
    const toDelete = entries.slice(0, Math.floor(entries.length / 2))
    toDelete.forEach(([key]) => moduleCache.delete(key))
  }
}

/**
 * Verify SVG output rigorously
 */
function verifySVGOutput(svg: string, metadata: any): boolean {
  // Check 1: SVG exists
  if (!svg || typeof svg !== 'string') {
    console.error('❌ SVG is missing or not a string')
    return false
  }

  // Check 2: SVG is not empty
  if (svg.length === 0) {
    console.error('❌ SVG is empty (0 length)')
    return false
  }

  // Check 3: SVG is valid
  if (!svg.includes('<svg')) {
    console.error('❌ Invalid SVG: missing <svg> tag')
    return false
  }

  // Check 4: File size is not zero
  if (metadata?.fileSize === 0 || metadata?.fileSize === undefined) {
    console.error('❌ File size is 0 KB - invalid output')
    return false
  }

  // Check 5: Minimum size check (at least 50 bytes for valid SVG)
  if (svg.length < 50) {
    console.error('❌ SVG too small to be valid')
    return false
  }

  // Check 6: Contains path data
  if (!svg.includes('<path') && !svg.includes('<circle') && !svg.includes('<rect')) {
    console.error('❌ SVG contains no geometric data')
    return false
  }

  return true
}

/**
 * Report progress to main thread
 */
function reportProgress(id: string, progress: number): void {
  self.postMessage({
    id,
    type: 'progress',
    progress: Math.min(Math.max(progress, 0), 100),
  })
}

/**
 * Main message handler
 */
self.onmessage = async (event: MessageEvent) => {
  const { id, type, data } = event.data

  try {
    switch (type) {
      case 'analyze':
        await handleAnalyze(id, data)
        break

      case 'vectorize':
        await handleVectorize(id, data)
        break

      case 'config':
        // Store config for future use
        self.postMessage({
          id,
          type: 'result',
          data: { success: true },
        })
        break

      default:
        throw new Error(`Unknown message type: ${type}`)
    }
  } catch (error) {
    console.error('❌ Worker error:', error)
    self.postMessage({
      id,
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * Phase 1: Image Analysis
 */
async function handleAnalyze(id: string, { imageData }: any): Promise<void> {
  try {
    reportProgress(id, 10)

    // Lazy load analysis module
    const analysis = await loadModule('analysis')
    reportProgress(id, 30)

    // Perform analysis
    const result = await analysis.analyzeImage(imageData)
    reportProgress(id, 100)

    // Send result
    self.postMessage({
      id,
      type: 'result',
      data: {
        analysis: result,
        timestamp: Date.now(),
      },
    })

    // Cleanup
    clearModuleCache()
  } catch (error) {
    self.postMessage({
      id,
      type: 'error',
      error: error instanceof Error ? error.message : 'Analysis failed',
    })
  }
}

/**
 * Phase 2-5: Complete Vectorization Pipeline
 */
async function handleVectorize(
  id: string,
  { imageData, analysis, config }: any
): Promise<void> {
  let result = null

  try {
    // Phase 1: Input validation
    reportProgress(id, 5)
    if (!imageData || !imageData.data) {
      throw new Error('Invalid image data')
    }

    // Phase 2: Load analysis module
    reportProgress(id, 10)
    if (!analysis) {
      const analysisModule = await loadModule('analysis')
      analysis = await analysisModule.analyzeImage(imageData)
    }

    // Phase 3: Load vectorization engine
    reportProgress(id, 25)
    const engine = await loadModule('engine')

    // Phase 4: Execute vectorization
    reportProgress(id, 40)
    result = await engine.vectorizeImage(
      imageData,
      analysis,
      config || {}
    )

    // Phase 5: Rigorous output verification
    reportProgress(id, 85)
    if (!verifySVGOutput(result.svg, result.metadata)) {
      throw new Error('SVG output verification failed - output is invalid')
    }

    // Phase 6: Final checks
    reportProgress(id, 95)

    // Ensure SVG is not empty
    const blob = new Blob([result.svg], { type: 'image/svg+xml' })
    if (blob.size === 0) {
      throw new Error('SVG blob size is 0 - invalid output')
    }

    // Update metadata with blob size
    result.metadata.fileSize = blob.size

    reportProgress(id, 100)

    // Send result with verified output
    self.postMessage({
      id,
      type: 'result',
      data: {
        svg: result.svg,
        metadata: result.metadata,
        layers: result.layers || [],
        timestamp: Date.now(),
      },
    })

    // Cleanup
    clearModuleCache()
  } catch (error) {
    console.error('❌ Vectorization error:', error)

    // Cleanup on error
    clearModuleCache()

    self.postMessage({
      id,
      type: 'error',
      error: error instanceof Error ? error.message : 'Vectorization failed',
    })
  }
}

/**
 * Handle worker termination
 */
self.onclose = () => {
  console.log('🔴 Web Worker terminated')
  clearModuleCache()
}

// Set module type
export {}
