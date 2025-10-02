/**
 * Main visualization system entry point
 * Comprehensive audio visualization platform with plugin architecture
 */

import { RealtimeAudioAnalyser } from '../audio/analyser'
import { OfflineAudioAnalyser } from '../audio/offline'
import { ImageExporter } from '../export/image'
import { VideoExporter } from '../export/video'
import {
  Visualizer,
  VisualizationMode,
  RenderConfig,
  RenderFrame,
  AudioFeatures,
  ExportOptions
} from './core/types'

// Import available visualization modes
const VISUALIZATION_MODES = [
  () => import('./modes/mode-spectrum-3d'),
  () => import('./modes/mode-particles'),
  () => import('./modes/mode-spectrogram-art'),
  () => import('./modes/mode-cozy-abstract'),
  () => import('./modes/mode-ml-emotion'),
  () => import('./modes/mode-irisgram'),
  () => import('./modes/mode-lissajous'),
  () => import('./modes/mode-particula')
]

export interface VisualizationEngineConfig {
  sampleRate: number
  fftSize: number
  smoothingTimeConstant: number
  minDecibels: number
  maxDecibels: number
  enableOfflineMode: boolean
}

/**
 * Registry for managing visualization modes with dynamic loading
 */
export class VisualizationRegistry {
  private modes: Map<string, VisualizationMode> = new Map()
  private visualizers: Map<string, () => Promise<any>> = new Map()
  private loadedVisualizers: Map<string, new () => Visualizer> = new Map()

  async initialize(): Promise<void> {
    // Load all visualization modes
    const loadPromises = VISUALIZATION_MODES.map(async (importFn, index) => {
      try {
        const module = await importFn()
        const VisualizerClass = Object.values(module)[0] as new () => Visualizer
        const instance = new VisualizerClass()

        this.modes.set(instance.id, instance.mode)
        this.loadedVisualizers.set(instance.id, VisualizerClass)
        this.visualizers.set(instance.id, importFn)

        return instance.mode
      } catch (error) {
        console.warn(`Failed to load visualization mode ${index}:`, error)
        return null
      }
    })

    const loadedModes = await Promise.all(loadPromises)
    console.log(`Loaded ${loadedModes.filter(Boolean).length} visualization modes`)
  }

  getAvailableModes(): VisualizationMode[] {
    return Array.from(this.modes.values())
  }

  getModeById(id: string): VisualizationMode | null {
    return this.modes.get(id) || null
  }

  getModesByCategory(category: string): VisualizationMode[] {
    return Array.from(this.modes.values()).filter(mode => mode.category === category)
  }

  getModesByTag(tag: string): VisualizationMode[] {
    return Array.from(this.modes.values()).filter(mode => mode.tags.includes(tag))
  }

  async createVisualizer(modeId: string): Promise<Visualizer | null> {
    const VisualizerClass = this.loadedVisualizers.get(modeId)
    if (!VisualizerClass) {
      console.error(`Visualizer not found: ${modeId}`)
      return null
    }

    try {
      return new VisualizerClass()
    } catch (error) {
      console.error(`Failed to create visualizer ${modeId}:`, error)
      return null
    }
  }

  getRecommendedModes(preferences: {
    supports3D?: boolean
    supportsRealtime?: boolean
    category?: string
    mood?: 'energetic' | 'calm' | 'dynamic' | 'artistic'
  }): VisualizationMode[] {
    let modes = Array.from(this.modes.values())

    if (preferences.supports3D !== undefined) {
      modes = modes.filter(mode => mode.supports3D === preferences.supports3D)
    }

    if (preferences.supportsRealtime !== undefined) {
      modes = modes.filter(mode => mode.supportsRealtime === preferences.supportsRealtime)
    }

    if (preferences.category) {
      modes = modes.filter(mode => mode.category === preferences.category)
    }

    if (preferences.mood) {
      modes = modes.filter(mode =>
        mode.defaultParams.palette.mood === preferences.mood ||
        mode.tags.includes(preferences.mood)
      )
    }

    return modes
  }
}

/**
 * Main visualization engine coordinating audio analysis, visualization, and export
 */
export class VisualizationEngine {
  private registry: VisualizationRegistry
  private audioAnalyser: RealtimeAudioAnalyser | null = null
  private offlineAnalyser: OfflineAudioAnalyser | null = null
  private currentVisualizer: Visualizer | null = null
  private imageExporter: ImageExporter | null = null
  private videoExporter: VideoExporter | null = null

  // Animation state
  private animationId: number | null = null
  private isPlaying = false
  private startTime = 0
  private lastFrameTime = 0
  private frameCount = 0

  // Configuration
  private config: VisualizationEngineConfig = {
    sampleRate: 44100,
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    minDecibels: -100,
    maxDecibels: -30,
    enableOfflineMode: false
  }

  // Event callbacks
  private onFrameCallback?: (frame: RenderFrame) => void
  private onErrorCallback?: (error: Error) => void

  constructor(config?: Partial<VisualizationEngineConfig>) {
    this.registry = new VisualizationRegistry()
    if (config) {
      this.config = { ...this.config, ...config }
    }
  }

  async initialize(): Promise<void> {
    await this.registry.initialize()

    // Create AudioContext first
    let audioContext: AudioContext
    try {
      // Try standard AudioContext
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch (error) {
      console.error('Failed to create AudioContext:', error)
      throw new Error('Web Audio API not supported in this browser')
    }

    // Initialize audio analysers with AudioContext
    this.audioAnalyser = new RealtimeAudioAnalyser(
      audioContext,
      this.config.fftSize,
      this.config.smoothingTimeConstant
    )

    if (this.config.enableOfflineMode) {
      this.offlineAnalyser = new OfflineAudioAnalyser({
        sampleRate: this.config.sampleRate,
        fftSize: this.config.fftSize
      })
    }
  }

  getRegistry(): VisualizationRegistry {
    return this.registry
  }

  async loadVisualizationMode(
    modeId: string,
    canvas: HTMLCanvasElement | OffscreenCanvas,
    renderConfig: RenderConfig
  ): Promise<boolean> {
    try {
      // Dispose current visualizer
      if (this.currentVisualizer) {
        this.currentVisualizer.dispose()
      }

      // Create new visualizer
      this.currentVisualizer = await this.registry.createVisualizer(modeId)
      if (!this.currentVisualizer) {
        throw new Error(`Failed to create visualizer: ${modeId}`)
      }

      // Initialize visualizer
      await this.currentVisualizer.init(canvas, renderConfig)

      // Initialize exporters
      this.imageExporter = new ImageExporter(this.currentVisualizer)
      this.videoExporter = new VideoExporter(this.currentVisualizer, this.offlineAnalyser!)

      return true
    } catch (error) {
      this.handleError(error as Error)
      return false
    }
  }

  async connectAudioSource(source: MediaStreamAudioSourceNode | MediaElementAudioSourceNode): Promise<void> {
    if (!this.audioAnalyser) {
      throw new Error('Audio analyser not initialized')
    }

    await this.audioAnalyser.connectSource(source)
  }

  async loadAudioFile(file: File): Promise<void> {
    if (!this.audioAnalyser) {
      throw new Error('Audio analyser not initialized')
    }

    await this.audioAnalyser.loadAudioFile(file)
  }

  startRealtimeVisualization(): void {
    if (!this.currentVisualizer || !this.audioAnalyser || this.isPlaying) {
      return
    }

    this.isPlaying = true
    this.startTime = performance.now()
    this.lastFrameTime = this.startTime
    this.frameCount = 0

    this.renderLoop()
  }

  stopVisualization(): void {
    this.isPlaying = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  private renderLoop = (): void => {
    if (!this.isPlaying || !this.currentVisualizer || !this.audioAnalyser) {
      return
    }

    const currentTime = performance.now()
    const deltaTime = currentTime - this.lastFrameTime
    const elapsedTime = currentTime - this.startTime

    // Get audio features
    const audioFeatures = this.audioAnalyser.getFeatures()

    // Update visualizer with audio data
    this.currentVisualizer.update(audioFeatures)

    // Create render frame
    const renderFrame: RenderFrame = {
      frameIndex: this.frameCount,
      timePosition: elapsedTime / 1000,
      canvas: this.currentVisualizer.getCanvas(),
      context: this.currentVisualizer.getContext(),
      features: audioFeatures,
      params: this.currentVisualizer.getParams()
    }

    // Render frame
    this.currentVisualizer.renderFrame(renderFrame)

    // Call frame callback
    if (this.onFrameCallback) {
      this.onFrameCallback(renderFrame)
    }

    this.frameCount++
    this.lastFrameTime = currentTime

    // Schedule next frame
    this.animationId = requestAnimationFrame(this.renderLoop)
  }

  async exportCurrentFrame(options?: Partial<any>): Promise<Blob | null> {
    if (!this.imageExporter) {
      console.error('Image exporter not available')
      return null
    }

    try {
      return await this.imageExporter.exportCurrentFrame(options)
    } catch (error) {
      this.handleError(error as Error)
      return null
    }
  }

  async exportVideo(
    audioFile: File,
    options: any,
    onProgress?: (progress: number) => void
  ): Promise<Blob | null> {
    if (!this.videoExporter) {
      console.error('Video exporter not available')
      return null
    }

    try {
      return await this.videoExporter.exportVideo(audioFile, options, onProgress)
    } catch (error) {
      this.handleError(error as Error)
      return null
    }
  }

  async renderOfflineSequence(
    audioFile: File,
    timeRange: { start: number; end: number; fps: number },
    onProgress?: (progress: number) => void
  ): Promise<Blob[]> {
    if (!this.offlineAnalyser || !this.currentVisualizer || !this.imageExporter) {
      throw new Error('Offline rendering not available')
    }

    try {
      // Load audio file for offline analysis
      await this.offlineAnalyser.loadAudioFile(audioFile)

      // Export frame sequence
      return await this.imageExporter.exportFrameSequence(timeRange)
    } catch (error) {
      this.handleError(error as Error)
      throw error
    }
  }

  getCurrentVisualizer(): Visualizer | null {
    return this.currentVisualizer
  }

  getCurrentMode(): VisualizationMode | null {
    return this.currentVisualizer?.mode || null
  }

  updateVisualizerParams(params: Partial<any>): void {
    if (this.currentVisualizer) {
      this.currentVisualizer.updateParams(params)
    }
  }

  getAudioFeatures(): AudioFeatures | null {
    return this.audioAnalyser?.getFeatures() || null
  }

  isVisualizationPlaying(): boolean {
    return this.isPlaying
  }

  getFrameCount(): number {
    return this.frameCount
  }

  getElapsedTime(): number {
    return this.isPlaying ? (performance.now() - this.startTime) / 1000 : 0
  }

  // Event handlers
  onFrame(callback: (frame: RenderFrame) => void): void {
    this.onFrameCallback = callback
  }

  onError(callback: (error: Error) => void): void {
    this.onErrorCallback = callback
  }

  private handleError(error: Error): void {
    console.error('VisualizationEngine error:', error)
    if (this.onErrorCallback) {
      this.onErrorCallback(error)
    }
  }

  dispose(): void {
    this.stopVisualization()

    if (this.currentVisualizer) {
      this.currentVisualizer.dispose()
      this.currentVisualizer = null
    }

    if (this.audioAnalyser) {
      this.audioAnalyser.dispose()
      this.audioAnalyser = null
    }

    if (this.offlineAnalyser) {
      this.offlineAnalyser.dispose()
      this.offlineAnalyser = null
    }

    this.imageExporter = null
    this.videoExporter = null
    this.onFrameCallback = undefined
    this.onErrorCallback = undefined
  }
}

// Utility functions for device capabilities and performance optimization
export function getOptimalRenderConfig(
  targetCanvas: HTMLCanvasElement | OffscreenCanvas
): RenderConfig {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2) // Cap at 2x for performance

  const canvas = targetCanvas as HTMLCanvasElement
  const width = canvas.width || 800
  const height = canvas.height || 600

  return {
    width,
    height,
    pixelRatio: isMobile ? 1 : pixelRatio,
    fps: isMobile ? 30 : 60,
    backgroundColor: '#000000',
    seed: Date.now()
  }
}

export function detectAudioCapabilities(): {
  supportsWebAudio: boolean
  supportsMediaRecorder: boolean
  supportsOfflineAudioContext: boolean
  maxSampleRate: number
} {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext

  let maxSampleRate = 44100
  let supportsOfflineAudioContext = false

  if (AudioContext) {
    try {
      const ctx = new AudioContext()
      maxSampleRate = ctx.sampleRate
      ctx.close()

      supportsOfflineAudioContext = 'OfflineAudioContext' in window || 'webkitOfflineAudioContext' in window
    } catch (e) {
      // AudioContext not supported
    }
  }

  return {
    supportsWebAudio: !!AudioContext,
    supportsMediaRecorder: 'MediaRecorder' in window,
    supportsOfflineAudioContext,
    maxSampleRate
  }
}

// Re-export core types and classes
export * from './core/types'
export * from './core/palettes'
export * from './core/mapping'
export * from './core/rng'
export { ImageExporter } from '../export/image'
export { VideoExporter } from '../export/video'
export { RealtimeAudioAnalyser } from '../audio/analyser'
export { OfflineAudioAnalyser } from '../audio/offline'