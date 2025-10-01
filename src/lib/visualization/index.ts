// Main visualization exports
export { VisualizationFactory } from './visualization-factory'
export { BaseVisualizationRenderer } from './base-renderer'

// Renderer exports
export { MandalaRenderer } from './renderers/mandala-renderer'
export { InkFlowRenderer } from './renderers/inkflow-renderer'
export { NeonGridRenderer } from './renderers/neongrid-renderer'

// Utility exports
export * from './utils'

// Type exports
export type {
  VisualizationStyle,
  VisualizationConfig,
  VisualizationRenderer,
  VisualizationExportOptions,
  MandalaConfig,
  InkFlowConfig,
  NeonGridConfig,
  RenderingContext,
  PerformanceMetrics,
  Vector2,
  Color,
  Particle,
  ParticleSystem,
  FrameOverlayConfig,
  AnimationState,
  VisualizationFrame,
  Gradient,
  ColorStop
} from './types'

// Main visualization manager class
import type {
  VisualizationStyle,
  VisualizationConfig,
  VisualizationRenderer,
  VisualizationExportOptions,
  PerformanceMetrics
} from './types'
import type { VisualizationData } from '../audio/types'
import { VisualizationFactory } from './visualization-factory'

export class VisualizationManager {
  private currentRenderer: VisualizationRenderer | null = null
  private canvas: HTMLCanvasElement | null = null
  private animationFrame: number | null = null
  private isRunning: boolean = false
  private lastFrameTime: number = 0

  // Event callbacks
  private onRenderCallback?: (performance: PerformanceMetrics) => void
  private onErrorCallback?: (error: Error) => void

  constructor(
    private onRender?: (performance: PerformanceMetrics) => void,
    private onError?: (error: Error) => void
  ) {
    this.onRenderCallback = onRender
    this.onErrorCallback = onError
  }

  async initialize(
    canvas: HTMLCanvasElement,
    style: VisualizationStyle,
    config?: Partial<VisualizationConfig>
  ): Promise<void> {
    try {
      this.canvas = canvas

      // Create renderer
      this.currentRenderer = VisualizationFactory.createRenderer(style, config)

      // Initialize renderer
      const fullConfig = VisualizationFactory.getDefaultConfig(style)
      if (config) {
        Object.assign(fullConfig, config)
      }

      this.currentRenderer.initialize(canvas, fullConfig)

    } catch (error) {
      this.handleError(error as Error)
      throw error
    }
  }

  start(): void {
    if (!this.currentRenderer || this.isRunning) return

    this.isRunning = true
    this.lastFrameTime = performance.now()
    this.renderLoop()
  }

  stop(): void {
    this.isRunning = false
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }
  }

  render(audioData: VisualizationData): void {
    if (!this.currentRenderer || !this.isRunning) return

    try {
      const currentTime = performance.now()
      const deltaTime = currentTime - this.lastFrameTime
      this.lastFrameTime = currentTime

      this.currentRenderer.render(audioData, deltaTime)

      // Report performance metrics
      if (this.onRenderCallback) {
        const metrics = this.currentRenderer.getPerformanceMetrics()
        this.onRenderCallback(metrics)
      }
    } catch (error) {
      this.handleError(error as Error)
    }
  }

  async switchStyle(
    style: VisualizationStyle,
    config?: Partial<VisualizationConfig>
  ): Promise<void> {
    if (!this.canvas) {
      throw new Error('Canvas not initialized')
    }

    // Stop current rendering
    const wasRunning = this.isRunning
    this.stop()

    // Dispose current renderer
    if (this.currentRenderer) {
      this.currentRenderer.dispose()
    }

    // Initialize new renderer
    await this.initialize(this.canvas, style, config)

    // Resume rendering if it was running
    if (wasRunning) {
      this.start()
    }
  }

  updateConfig(config: Partial<VisualizationConfig>): void {
    if (!this.currentRenderer) return

    try {
      this.currentRenderer.updateConfig(config)
    } catch (error) {
      this.handleError(error as Error)
    }
  }

  resize(width: number, height: number): void {
    if (!this.currentRenderer) return

    try {
      this.currentRenderer.resize(width, height)
    } catch (error) {
      this.handleError(error as Error)
    }
  }

  async exportFrame(options?: Partial<VisualizationExportOptions>): Promise<Blob> {
    if (!this.currentRenderer) {
      throw new Error('No renderer initialized')
    }

    try {
      return await this.currentRenderer.exportFrame(options)
    } catch (error) {
      this.handleError(error as Error)
      throw error
    }
  }

  getConfig(): VisualizationConfig | null {
    return this.currentRenderer?.getConfig() || null
  }

  getPerformanceMetrics(): PerformanceMetrics | null {
    return this.currentRenderer?.getPerformanceMetrics() || null
  }

  getSupportedStyles(): VisualizationStyle[] {
    return VisualizationFactory.getSupportedStyles()
  }

  dispose(): void {
    this.stop()

    if (this.currentRenderer) {
      this.currentRenderer.dispose()
      this.currentRenderer = null
    }

    this.canvas = null
    this.onRenderCallback = undefined
    this.onErrorCallback = undefined
  }

  private renderLoop = (): void => {
    if (!this.isRunning) return

    // Note: This render loop expects external audio data
    // In practice, this would be called from a component that has access to audio data

    this.animationFrame = requestAnimationFrame(this.renderLoop)
  }

  private handleError(error: Error): void {
    console.error('VisualizationManager error:', error)

    if (this.onErrorCallback) {
      this.onErrorCallback(error)
    }
  }
}

// Utility function to detect device capabilities
export function getDeviceCapabilities(): {
  isMobile: boolean
  lowPowerMode: boolean
  memoryLimited: boolean
  maxTextureSize: number
  supportsWebGL: boolean
} {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  // Estimate memory limitation
  const memoryLimited = 'deviceMemory' in navigator
    ? (navigator as any).deviceMemory < 4
    : isMobile

  // Check for low power mode (approximate)
  const lowPowerMode = 'getBattery' in navigator
    ? false // Would need async battery API check
    : isMobile && window.innerWidth < 768

  // Check WebGL support and max texture size
  let maxTextureSize = 2048
  let supportsWebGL = false

  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')

    if (gl) {
      supportsWebGL = true
      maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048
    }
  } catch {
    // WebGL not supported
  }

  return {
    isMobile,
    lowPowerMode,
    memoryLimited,
    maxTextureSize,
    supportsWebGL
  }
}