import type {
  VisualizationRenderer,
  VisualizationConfig,
  VisualizationExportOptions,
  RenderingContext,
  PerformanceMetrics
} from './types'
import type { VisualizationData } from '../audio/types'
import { CanvasUtils, PerformanceUtils } from './utils'

export abstract class BaseVisualizationRenderer implements VisualizationRenderer {
  protected canvas: HTMLCanvasElement | null = null
  protected ctx: CanvasRenderingContext2D | null = null
  protected config: VisualizationConfig = {
    style: 'mandala',
    width: 800,
    height: 800,
    backgroundColor: '#000000',
    primaryColor: '#00F5FF',
    secondaryColor: '#9D4EDD',
    accentColor: '#FF6EC7',
    sensitivity: 1,
    smoothing: 0.8,
    scale: 1
  }

  protected renderingContext: RenderingContext = {
    canvas: null as any,
    ctx: null as any,
    width: 0,
    height: 0,
    centerX: 0,
    centerY: 0,
    devicePixelRatio: 1,
    time: 0,
    deltaTime: 0
  }

  protected performanceMetrics: PerformanceMetrics = {
    fps: 0,
    frameTime: 0,
    averageFrameTime: 0,
    droppedFrames: 0,
    memoryUsage: 0,
    renderTime: 0,
    lastUpdate: 0
  }

  protected frameRateMonitor = PerformanceUtils.createFrameRateMonitor()
  protected lastFrameTime: number = 0
  protected frameTimeHistory: number[] = []
  protected isDisposed: boolean = false

  constructor(config?: Partial<VisualizationConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
  }

  initialize(canvas: HTMLCanvasElement, initialConfig?: VisualizationConfig): void {
    if (this.isDisposed) {
      throw new Error('Renderer has been disposed')
    }

    this.canvas = canvas
    this.ctx = CanvasUtils.setupHighDPICanvas(canvas)

    if (initialConfig) {
      this.config = { ...this.config, ...initialConfig }
    }

    this.updateRenderingContext()
    this.setupCanvas()
    this.onInitialize()
  }

  render(audioData: VisualizationData, deltaTime: number): void {
    if (!this.canvas || !this.ctx || this.isDisposed) {
      throw new Error('Renderer not initialized or disposed')
    }

    const startTime = performance.now()

    // Update timing
    this.renderingContext.time += deltaTime
    this.renderingContext.deltaTime = deltaTime

    // Update performance metrics
    this.updatePerformanceMetrics()

    // Clear canvas
    this.clearCanvas()

    // Draw background
    this.drawBackground()

    // Call renderer-specific render method
    this.onRender(audioData, deltaTime)

    // Update frame time
    const endTime = performance.now()
    this.performanceMetrics.renderTime = endTime - startTime
  }

  resize(width: number, height: number): void {
    if (!this.canvas || this.isDisposed) return

    this.config.width = width
    this.config.height = height

    // Update canvas size
    const devicePixelRatio = window.devicePixelRatio || 1
    this.canvas.width = width * devicePixelRatio
    this.canvas.height = height * devicePixelRatio
    this.canvas.style.width = width + 'px'
    this.canvas.style.height = height + 'px'

    if (this.ctx) {
      this.ctx.scale(devicePixelRatio, devicePixelRatio)
    }

    this.updateRenderingContext()
    this.onResize(width, height)
  }

  getConfig(): VisualizationConfig {
    return { ...this.config }
  }

  updateConfig(newConfig: Partial<VisualizationConfig>): void {
    this.config = { ...this.config, ...newConfig }

    if ((newConfig.width || newConfig.height) && this.canvas) {
      this.resize(this.config.width, this.config.height)
    }

    this.onConfigUpdate(newConfig)
  }

  async exportFrame(options: Partial<VisualizationExportOptions> = {}): Promise<Blob> {
    if (!this.canvas) {
      throw new Error('Canvas not initialized')
    }

    const opts: VisualizationExportOptions = {
      format: 'png',
      quality: 0.9,
      width: this.config.width,
      height: this.config.height,
      transparent: false,
      ...options
    }

    return new Promise((resolve, reject) => {
      try {
        // Create export canvas if different size needed
        let exportCanvas = this.canvas!
        let exportCtx = this.ctx!

        if (opts.width !== this.config.width || opts.height !== this.config.height) {
          exportCanvas = document.createElement('canvas')
          exportCanvas.width = opts.width
          exportCanvas.height = opts.height
          exportCtx = exportCanvas.getContext('2d')!

          // Scale and draw current canvas
          exportCtx.drawImage(
            this.canvas!,
            0, 0, this.canvas!.width, this.canvas!.height,
            0, 0, opts.width, opts.height
          )
        }

        // Handle transparency
        if (!opts.transparent && opts.format !== 'png') {
          // Fill with background for non-transparent formats
          const tempCanvas = document.createElement('canvas')
          tempCanvas.width = opts.width
          tempCanvas.height = opts.height
          const tempCtx = tempCanvas.getContext('2d')!

          tempCtx.fillStyle = this.config.backgroundColor
          tempCtx.fillRect(0, 0, opts.width, opts.height)
          tempCtx.drawImage(exportCanvas, 0, 0)

          exportCanvas = tempCanvas
        }

        // Export
        const mimeType = `image/${opts.format}`
        exportCanvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to export canvas'))
          }
        }, mimeType, opts.quality)
      } catch (error) {
        reject(error)
      }
    })
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics }
  }

  dispose(): void {
    this.isDisposed = true
    this.canvas = null
    this.ctx = null
    this.frameTimeHistory = []
    this.onDispose()
  }

  // Protected methods for subclasses
  protected setupCanvas(): void {
    if (!this.ctx) return

    // Set default canvas properties
    this.ctx.imageSmoothingEnabled = true
    this.ctx.imageSmoothingQuality = 'high'
    this.ctx.lineCap = 'round'
    this.ctx.lineJoin = 'round'
  }

  protected updateRenderingContext(): void {
    if (!this.canvas || !this.ctx) return

    const rect = this.canvas.getBoundingClientRect()
    this.renderingContext = {
      canvas: this.canvas,
      ctx: this.ctx,
      width: rect.width,
      height: rect.height,
      centerX: rect.width / 2,
      centerY: rect.height / 2,
      devicePixelRatio: window.devicePixelRatio || 1,
      time: this.renderingContext.time,
      deltaTime: this.renderingContext.deltaTime
    }
  }

  protected clearCanvas(): void {
    if (!this.ctx) return

    CanvasUtils.clearCanvas(
      this.ctx,
      this.renderingContext.width,
      this.renderingContext.height
    )
  }

  protected drawBackground(): void {
    if (!this.ctx) return

    this.ctx.fillStyle = this.config.backgroundColor
    this.ctx.fillRect(
      0, 0,
      this.renderingContext.width,
      this.renderingContext.height
    )
  }

  protected updatePerformanceMetrics(): void {
    const currentTime = performance.now()

    // Update FPS
    this.performanceMetrics.fps = this.frameRateMonitor.update()

    // Update frame time
    if (this.lastFrameTime > 0) {
      this.performanceMetrics.frameTime = currentTime - this.lastFrameTime

      // Track frame time history for average calculation
      this.frameTimeHistory.push(this.performanceMetrics.frameTime)
      if (this.frameTimeHistory.length > 60) { // Keep last 60 frames
        this.frameTimeHistory.shift()
      }

      // Calculate average frame time
      this.performanceMetrics.averageFrameTime =
        this.frameTimeHistory.reduce((sum, time) => sum + time, 0) / this.frameTimeHistory.length

      // Count dropped frames (>16.67ms for 60fps)
      if (this.performanceMetrics.frameTime > 16.67) {
        this.performanceMetrics.droppedFrames++
      }
    }

    this.lastFrameTime = currentTime
    this.performanceMetrics.lastUpdate = currentTime

    // Update memory usage (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory
      this.performanceMetrics.memoryUsage = memory.usedJSHeapSize / (1024 * 1024) // MB
    }
  }

  // Abstract methods for subclasses to implement
  protected abstract onInitialize(): void
  protected abstract onRender(audioData: VisualizationData, deltaTime: number): void
  protected abstract onResize(width: number, height: number): void
  protected abstract onConfigUpdate(config: Partial<VisualizationConfig>): void
  protected abstract onDispose(): void
}