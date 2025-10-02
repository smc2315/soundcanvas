/**
 * Core types and interfaces for the visualization system
 */

import { RealtimeAudioFeatures } from '../../audio/analyser'
import { OfflineAudioFeatures } from '../../audio/offline'

export type AudioFeatures = RealtimeAudioFeatures | OfflineAudioFeatures

export interface RenderConfig {
  width: number
  height: number
  pixelRatio: number
  fps: number
  backgroundColor: string
  seed: number
}

export interface VisualParams {
  // Color and style
  palette: ColorPalette
  gradients: GradientSet
  opacity: number
  brightness: number
  contrast: number
  saturation: number

  // Motion and animation
  motionIntensity: number
  smoothing: number
  responsiveness: number

  // Style-specific parameters
  [key: string]: any
}

export interface ColorPalette {
  id: string
  name: string
  colors: string[]
  temperature: 'warm' | 'cool' | 'neutral'
  mood: 'energetic' | 'calm' | 'mysterious' | 'dramatic'
}

export interface GradientSet {
  primary: CanvasGradient
  secondary: CanvasGradient
  accent: CanvasGradient
  background: CanvasGradient
}

export interface AudioMappingRules {
  // Energy mappings
  energy: {
    target: keyof VisualParams
    range: [number, number]
    curve: 'linear' | 'exponential' | 'logarithmic'
    smoothing: number
  }[]

  // Frequency mappings
  brightness: {
    target: keyof VisualParams
    range: [number, number]
    curve: 'linear' | 'exponential' | 'logarithmic'
    smoothing: number
  }[]

  // Rhythm mappings
  onset: {
    trigger: string // Method name to call on onset
    threshold: number
    cooldown: number // Minimum time between triggers
  }[]

  // Pitch mappings
  pitch: {
    target: keyof VisualParams
    range: [number, number]
    freqRange: [number, number] // Hz range
  }[]
}

export interface VisualizationMode {
  id: string
  label: string
  description: string
  category: 'realtime' | 'artistic' | 'abstract' | 'data' | 'experimental'
  tags: string[]
  previewImage: string

  // Supported features
  supportsRealtime: boolean
  supportsOffline: boolean
  supportsVideo: boolean
  supports3D: boolean

  // Default parameters
  defaultParams: VisualParams
  parameterSchema: ParameterSchema[]

  // Audio mapping configuration
  audioMapping: AudioMappingRules
}

export interface ParameterSchema {
  key: string
  label: string
  type: 'number' | 'boolean' | 'color' | 'select' | 'range'
  default: any
  min?: number
  max?: number
  step?: number
  options?: Array<{value: any, label: string}>
  description?: string
  category?: string
}

export interface ExportOptions {
  // Image export
  format: 'png' | 'jpeg' | 'webp'
  quality: number
  width: number
  height: number

  // Video export
  duration?: number
  fps?: number
  videoFormat?: 'mp4' | 'webm'
  videoBitrate?: number
  audioIncluded?: boolean

  // Rendering options
  antialiasing: boolean
  highQuality: boolean
  useOfflineRendering: boolean
}

export interface RenderFrame {
  frameIndex: number
  timePosition: number
  canvas: HTMLCanvasElement | OffscreenCanvas
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  features: AudioFeatures
  params: VisualParams
}

export interface VisualizationState {
  isPlaying: boolean
  isPaused: boolean
  isRendering: boolean
  isExporting: boolean
  currentTime: number
  duration: number
  fps: number
  frameCount: number
}

/**
 * Main Visualizer interface that all visualization modes must implement
 */
export interface Visualizer {
  // Metadata
  readonly id: string
  readonly label: string
  readonly mode: VisualizationMode

  // Lifecycle
  init(target: HTMLCanvasElement | OffscreenCanvas, config: RenderConfig): Promise<void>
  dispose(): void

  // Parameter management
  updateParams(params: Partial<VisualParams>): void
  getParams(): VisualParams
  resetParams(): void

  // Audio feature processing
  update(features: AudioFeatures): void

  // Rendering
  renderFrame(frame: RenderFrame): void
  clear(): void

  // State management
  getState(): VisualizationState
  play(): void
  pause(): void
  stop(): void
  seek(time: number): void

  // Export capabilities
  snapshot(options?: Partial<ExportOptions>): Promise<Blob>
  startVideoExport(options: ExportOptions): Promise<void>
  stopVideoExport(): Promise<Blob>

  // Real-time preview
  startPreview(): void
  stopPreview(): void

  // Canvas access
  getCanvas(): HTMLCanvasElement | OffscreenCanvas
  getContext(): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

  // Events
  on(event: string, callback: Function): void
  off(event: string, callback: Function): void
  emit(event: string, ...args: any[]): void
}

/**
 * Base class that provides common functionality for visualizers
 */
export abstract class BaseVisualizer implements Visualizer {
  protected canvas: HTMLCanvasElement | OffscreenCanvas
  protected ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  protected config: RenderConfig
  protected params: VisualParams
  protected state: VisualizationState
  protected eventListeners: Map<string, Function[]> = new Map()

  abstract readonly id: string
  abstract readonly label: string
  abstract readonly mode: VisualizationMode

  constructor() {
    this.state = {
      isPlaying: false,
      isPaused: false,
      isRendering: false,
      isExporting: false,
      currentTime: 0,
      duration: 0,
      fps: 0,
      frameCount: 0
    }
  }

  async init(target: HTMLCanvasElement | OffscreenCanvas, config: RenderConfig): Promise<void> {
    this.canvas = target
    this.config = config

    // Set canvas size first
    this.canvas.width = config.width * config.pixelRatio
    this.canvas.height = config.height * config.pixelRatio

    // Create 2D context for output (3D visualizations will render to this)
    const ctx = this.canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Failed to get 2D rendering context')
    }
    this.ctx = ctx
    this.ctx.scale(config.pixelRatio, config.pixelRatio)

    // Initialize with default parameters
    this.params = { ...this.mode.defaultParams }

    await this.initializeMode()
  }

  protected abstract initializeMode(): Promise<void>
  public abstract update(features: AudioFeatures): void
  public abstract renderFrame(frame: RenderFrame): void

  updateParams(params: Partial<VisualParams>): void {
    this.params = { ...this.params, ...params }
    this.emit('paramsChanged', this.params)
  }

  getParams(): VisualParams {
    return { ...this.params }
  }

  resetParams(): void {
    this.params = { ...this.mode.defaultParams }
    this.emit('paramsChanged', this.params)
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.config.width, this.config.height)
    if (this.config.backgroundColor) {
      this.ctx.fillStyle = this.config.backgroundColor
      this.ctx.fillRect(0, 0, this.config.width, this.config.height)
    }
  }

  getState(): VisualizationState {
    return { ...this.state }
  }

  play(): void {
    this.state.isPlaying = true
    this.state.isPaused = false
    this.emit('play')
  }

  pause(): void {
    this.state.isPaused = true
    this.emit('pause')
  }

  stop(): void {
    this.state.isPlaying = false
    this.state.isPaused = false
    this.state.currentTime = 0
    this.emit('stop')
  }

  seek(time: number): void {
    this.state.currentTime = time
    this.emit('seek', time)
  }

  async snapshot(options: Partial<ExportOptions> = {}): Promise<Blob> {
    const opts: ExportOptions = {
      format: 'png',
      quality: 1.0,
      width: this.config.width,
      height: this.config.height,
      antialiasing: true,
      highQuality: true,
      useOfflineRendering: false,
      ...options
    }

    // Create high-resolution canvas for export
    const exportCanvas = new OffscreenCanvas(opts.width, opts.height)
    const exportCtx = exportCanvas.getContext('2d')!

    // Configure high-quality rendering
    if (opts.antialiasing) {
      exportCtx.imageSmoothingEnabled = true
      exportCtx.imageSmoothingQuality = 'high'
    }

    // Render current frame at high resolution
    const originalCanvas = this.canvas
    const originalCtx = this.ctx
    const originalConfig = this.config

    try {
      this.canvas = exportCanvas
      this.ctx = exportCtx
      this.config = { ...originalConfig, width: opts.width, height: opts.height }

      // Re-render current frame
      const currentFrame: RenderFrame = {
        frameIndex: this.state.frameCount,
        timePosition: this.state.currentTime,
        canvas: this.canvas,
        context: this.ctx,
        features: {} as AudioFeatures, // Would be populated with actual features
        params: this.params
      }

      this.renderFrame(currentFrame)

      // Convert to blob
      return await exportCanvas.convertToBlob({
        type: `image/${opts.format}`,
        quality: opts.quality
      })
    } finally {
      // Restore original canvas
      this.canvas = originalCanvas
      this.ctx = originalCtx
      this.config = originalConfig
    }
  }

  async startVideoExport(options: ExportOptions): Promise<void> {
    this.state.isExporting = true
    this.emit('exportStart', options)
    // Implementation would handle video recording setup
  }

  async stopVideoExport(): Promise<Blob> {
    this.state.isExporting = false
    this.emit('exportEnd')
    // Implementation would return final video blob
    return new Blob()
  }

  startPreview(): void {
    this.emit('previewStart')
  }

  stopPreview(): void {
    this.emit('previewStop')
  }

  getCanvas(): HTMLCanvasElement | OffscreenCanvas {
    return this.canvas
  }

  getContext(): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D {
    return this.ctx
  }

  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  emit(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => callback(...args))
    }
  }

  dispose(): void {
    this.eventListeners.clear()
    this.state.isPlaying = false
    this.state.isExporting = false
    this.emit('dispose')
  }
}