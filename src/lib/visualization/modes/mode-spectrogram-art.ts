/**
 * Spectrogram Art Visualization Mode
 * Creates artistic representations of spectrograms with painterly effects
 */

import { BaseVisualizer, AudioFeatures, RenderFrame, VisualizationMode, VisualParams } from '../core/types'
import { PaletteGenerator } from '../core/palettes'
import { AudioMapper } from '../core/mapping'
import { SeededRNG } from '../core/rng'

interface SpectrogramArtParams extends VisualParams {
  // Spectrogram display
  timeWindow: number
  frequencyRange: [number, number]
  logScale: boolean
  dynamicRange: number

  // Artistic effects
  brushSize: number
  brushOpacity: number
  paintMode: 'watercolor' | 'oil' | 'acrylic' | 'ink'
  textureMix: number

  // Visual style
  showGrid: boolean
  contourLines: boolean
  colorMapping: 'frequency' | 'intensity' | 'velocity'
  backgroundTexture: boolean

  // Animation
  scrollSpeed: number
  fadeRate: number
  pulseIntensity: number
  harmonicHighlight: number
}

export class SpectrogramArtVisualizer extends BaseVisualizer {
  readonly id = 'spectrogram-art'
  readonly label = 'Spectrogram Art'
  readonly mode: VisualizationMode = {
    id: this.id,
    label: this.label,
    description: 'Artistic spectrogram visualization with painterly effects and dynamic color mapping',
    category: 'artistic',
    tags: ['spectrogram', 'artistic', 'paint', 'frequency', 'realtime'],
    previewImage: '/previews/spectrogram-art.png',
    supportsRealtime: true,
    supportsOffline: true,
    supportsVideo: true,
    supports3D: false,
    defaultParams: {
      palette: {
        id: 'artist',
        name: 'Artist Palette',
        colors: ['#2E1065', '#7C3AED', '#A855F7', '#EC4899', '#F97316'],
        temperature: 'cool',
        mood: 'artistic'
      },
      gradients: {} as any,
      opacity: 0.8,
      brightness: 1.1,
      contrast: 1.3,
      saturation: 1.4,
      motionIntensity: 0.6,
      smoothing: 0.7,
      responsiveness: 0.9,

      // Spectrogram Art specific
      timeWindow: 4.0,
      frequencyRange: [20, 20000],
      logScale: true,
      dynamicRange: 60,
      brushSize: 8.0,
      brushOpacity: 0.7,
      paintMode: 'watercolor' as const,
      textureMix: 0.4,
      showGrid: false,
      contourLines: true,
      colorMapping: 'frequency' as const,
      backgroundTexture: true,
      scrollSpeed: 1.0,
      fadeRate: 0.02,
      pulseIntensity: 0.8,
      harmonicHighlight: 1.2
    } as SpectrogramArtParams,
    parameterSchema: [
      {
        key: 'timeWindow',
        label: 'Time Window (s)',
        type: 'range',
        default: 4.0,
        min: 1.0,
        max: 10.0,
        step: 0.5,
        category: 'Display'
      },
      {
        key: 'paintMode',
        label: 'Paint Style',
        type: 'select',
        default: 'watercolor',
        options: [
          { value: 'watercolor', label: 'Watercolor' },
          { value: 'oil', label: 'Oil Paint' },
          { value: 'acrylic', label: 'Acrylic' },
          { value: 'ink', label: 'Ink Wash' }
        ],
        category: 'Style'
      },
      {
        key: 'brushSize',
        label: 'Brush Size',
        type: 'range',
        default: 8.0,
        min: 2.0,
        max: 20.0,
        step: 1.0,
        category: 'Style'
      },
      {
        key: 'contourLines',
        label: 'Contour Lines',
        type: 'boolean',
        default: true,
        category: 'Visual'
      }
    ],
    audioMapping: {
      energy: [
        { target: 'brushSize', range: [4, 16], curve: 'exponential', smoothing: 0.7 },
        { target: 'pulseIntensity', range: [0.3, 1.5], curve: 'linear', smoothing: 0.8 }
      ],
      brightness: [
        { target: 'brightness', range: [0.8, 1.5], curve: 'linear', smoothing: 0.85 }
      ],
      onset: [
        { trigger: 'colorFlash', threshold: 0.6, cooldown: 0.3 },
        { trigger: 'brushBurst', threshold: 0.8, cooldown: 0.5 }
      ],
      pitch: [
        { target: 'harmonicHighlight', range: [0.8, 2.0], freqRange: [100, 2000] }
      ]
    }
  }

  // Audio processing
  private audioMapper: AudioMapper
  private paletteGenerator: PaletteGenerator
  private rng: SeededRNG

  // Spectrogram data
  private spectrogramHistory: Float32Array[] = []
  private frequencyBands: number[] = []
  private timeSlices: number = 256

  // Visual buffers
  private paintLayer: HTMLCanvasElement | OffscreenCanvas
  private paintCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  private textureLayer: HTMLCanvasElement | OffscreenCanvas
  private textureCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

  // State
  private time = 0
  private lastBrushPosition = { x: 0, y: 0 }

  constructor() {
    super()
    this.rng = new SeededRNG(Date.now())
    this.paletteGenerator = new PaletteGenerator(this.rng.getSeed())
    this.audioMapper = new AudioMapper(this.mode.audioMapping)
  }

  protected async initializeMode(): Promise<void> {
    await this.setupCanvas()
    await this.initializeSpectrogramData()
    await this.generateBackgroundTexture()
  }

  private async setupCanvas(): Promise<void> {
    // Create paint layer
    if (typeof OffscreenCanvas !== 'undefined') {
      this.paintLayer = new OffscreenCanvas(this.config.width, this.config.height)
      this.textureLayer = new OffscreenCanvas(this.config.width, this.config.height)
    } else {
      this.paintLayer = document.createElement('canvas')
      this.paintLayer.width = this.config.width
      this.paintLayer.height = this.config.height

      this.textureLayer = document.createElement('canvas')
      this.textureLayer.width = this.config.width
      this.textureLayer.height = this.config.height
    }

    const paintCtx = this.paintLayer.getContext('2d')
    const textureCtx = this.textureLayer.getContext('2d')

    if (!paintCtx || !textureCtx) {
      throw new Error('Failed to get canvas contexts')
    }

    this.paintCtx = paintCtx
    this.textureCtx = textureCtx
  }

  private async initializeSpectrogramData(): Promise<void> {
    const params = this.params as SpectrogramArtParams

    // Initialize frequency bands for logarithmic scale
    this.frequencyBands = []
    const minFreq = Math.log(params.frequencyRange[0])
    const maxFreq = Math.log(params.frequencyRange[1])
    const freqBands = 128

    for (let i = 0; i < freqBands; i++) {
      const logFreq = minFreq + (i / freqBands) * (maxFreq - minFreq)
      this.frequencyBands.push(Math.exp(logFreq))
    }

    // Initialize spectrogram history
    this.spectrogramHistory = []
    for (let i = 0; i < this.timeSlices; i++) {
      this.spectrogramHistory.push(new Float32Array(freqBands))
    }
  }

  private async generateBackgroundTexture(): Promise<void> {
    const params = this.params as SpectrogramArtParams
    if (!params.backgroundTexture) return

    // Generate subtle paper/canvas texture
    const imageData = this.textureCtx.createImageData(this.config.width, this.config.height)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      const noise = this.rng.noise2D(
        (i / 4) % this.config.width * 0.01,
        Math.floor((i / 4) / this.config.width) * 0.01
      ) * 0.1 + 0.95

      data[i] = Math.floor(noise * 255)     // R
      data[i + 1] = Math.floor(noise * 250) // G
      data[i + 2] = Math.floor(noise * 245) // B
      data[i + 3] = Math.floor(noise * 30)  // A
    }

    this.textureCtx.putImageData(imageData, 0, 0)
  }

  public update(features: AudioFeatures): void {
    // Map audio features to visual parameters
    const mappedParams = this.audioMapper.mapFeatures(features, this.params)
    this.updateParams(mappedParams)

    // Update spectrogram data
    this.updateSpectrogramData(features)
  }

  private updateSpectrogramData(features: AudioFeatures): void {
    if (!features.frequencyData) return

    // Shift history
    this.spectrogramHistory.shift()

    // Create new frequency slice
    const newSlice = new Float32Array(this.frequencyBands.length)

    for (let i = 0; i < this.frequencyBands.length; i++) {
      const targetFreq = this.frequencyBands[i]
      const binIndex = Math.floor(targetFreq * features.frequencyData.length / (this.config.fps * 1000 / 2))
      const value = binIndex < features.frequencyData.length ? features.frequencyData[binIndex] / 255 : 0
      newSlice[i] = value
    }

    this.spectrogramHistory.push(newSlice)
  }

  public renderFrame(frame: RenderFrame): void {
    this.time += 1 / 60
    const params = this.params as SpectrogramArtParams

    // Clear main canvas
    this.ctx.clearRect(0, 0, this.config.width, this.config.height)

    // Draw background texture
    if (params.backgroundTexture) {
      this.ctx.drawImage(this.textureLayer, 0, 0)
    }

    // Render spectrogram art
    this.renderSpectrogramArt(params)

    // Draw paint layer
    this.ctx.drawImage(this.paintLayer, 0, 0)

    // Apply post-processing effects
    this.applyPostEffects(params)
  }

  private renderSpectrogramArt(params: SpectrogramArtParams): void {
    // Fade previous paint
    this.paintCtx.globalCompositeOperation = 'source-over'
    this.paintCtx.fillStyle = `rgba(0, 0, 0, ${params.fadeRate})`
    this.paintCtx.fillRect(0, 0, this.config.width, this.config.height)

    // Set paint mode blending
    this.paintCtx.globalCompositeOperation = this.getPaintBlendMode(params.paintMode)

    const timeSliceWidth = this.config.width / this.timeSlices
    const freqBinHeight = this.config.height / this.frequencyBands.length

    // Render each time slice
    for (let t = 0; t < this.spectrogramHistory.length; t++) {
      const slice = this.spectrogramHistory[t]
      const x = t * timeSliceWidth

      for (let f = 0; f < slice.length; f++) {
        const intensity = slice[f]
        if (intensity < 0.01) continue

        const y = this.config.height - (f + 1) * freqBinHeight
        const frequency = this.frequencyBands[f]

        // Get color based on mapping mode
        const color = this.getSpectrogramColor(frequency, intensity, params)

        // Draw paint stroke
        this.drawPaintStroke(x, y, timeSliceWidth, freqBinHeight, color, intensity, params)
      }
    }

    // Draw contour lines if enabled
    if (params.contourLines) {
      this.drawContourLines(params)
    }
  }

  private getSpectrogramColor(frequency: number, intensity: number, params: SpectrogramArtParams): string {
    const palette = params.palette

    switch (params.colorMapping) {
      case 'frequency':
        const freqNorm = Math.log(frequency / params.frequencyRange[0]) /
                        Math.log(params.frequencyRange[1] / params.frequencyRange[0])
        return this.paletteGenerator.getColorAtPosition(palette, freqNorm)

      case 'intensity':
        return this.paletteGenerator.getColorAtPosition(palette, intensity)

      case 'velocity':
        const hue = (frequency * 0.1) % 360
        const saturation = Math.min(100, intensity * 150)
        const lightness = 30 + intensity * 50
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`

      default:
        return this.paletteGenerator.getColorAtPosition(palette, 0.5)
    }
  }

  private drawPaintStroke(
    x: number, y: number,
    width: number, height: number,
    color: string, intensity: number,
    params: SpectrogramArtParams
  ): void {
    const brushSize = params.brushSize * (0.5 + intensity * 0.5)
    const opacity = params.brushOpacity * intensity

    this.paintCtx.save()
    this.paintCtx.globalAlpha = opacity

    switch (params.paintMode) {
      case 'watercolor':
        this.drawWatercolorStroke(x, y, brushSize, color)
        break
      case 'oil':
        this.drawOilStroke(x, y, brushSize, color)
        break
      case 'acrylic':
        this.drawAcrylicStroke(x, y, brushSize, color)
        break
      case 'ink':
        this.drawInkStroke(x, y, brushSize, color)
        break
    }

    this.paintCtx.restore()
  }

  private drawWatercolorStroke(x: number, y: number, size: number, color: string): void {
    // Create soft, bleeding watercolor effect
    const gradient = this.paintCtx.createRadialGradient(x, y, 0, x, y, size)
    gradient.addColorStop(0, color)
    gradient.addColorStop(0.7, color.replace(')', ', 0.3)').replace('rgb', 'rgba'))
    gradient.addColorStop(1, 'transparent')

    this.paintCtx.fillStyle = gradient
    this.paintCtx.beginPath()
    this.paintCtx.arc(x, y, size, 0, Math.PI * 2)
    this.paintCtx.fill()
  }

  private drawOilStroke(x: number, y: number, size: number, color: string): void {
    // Create thick, textured oil paint stroke
    this.paintCtx.fillStyle = color
    this.paintCtx.beginPath()

    // Add some texture variation
    for (let i = 0; i < 5; i++) {
      const offsetX = (this.rng.random() - 0.5) * size * 0.3
      const offsetY = (this.rng.random() - 0.5) * size * 0.3
      this.paintCtx.arc(x + offsetX, y + offsetY, size * 0.7, 0, Math.PI * 2)
    }

    this.paintCtx.fill()
  }

  private drawAcrylicStroke(x: number, y: number, size: number, color: string): void {
    // Sharp, opaque acrylic stroke
    this.paintCtx.fillStyle = color
    this.paintCtx.fillRect(x - size/2, y - size/2, size, size)
  }

  private drawInkStroke(x: number, y: number, size: number, color: string): void {
    // Flowing ink with natural variation
    this.paintCtx.strokeStyle = color
    this.paintCtx.lineWidth = size * 0.3
    this.paintCtx.lineCap = 'round'

    this.paintCtx.beginPath()
    this.paintCtx.moveTo(this.lastBrushPosition.x, this.lastBrushPosition.y)
    this.paintCtx.quadraticCurveTo(
      (this.lastBrushPosition.x + x) / 2,
      (this.lastBrushPosition.y + y) / 2,
      x, y
    )
    this.paintCtx.stroke()

    this.lastBrushPosition = { x, y }
  }

  private drawContourLines(params: SpectrogramArtParams): void {
    this.paintCtx.strokeStyle = `rgba(255, 255, 255, 0.2)`
    this.paintCtx.lineWidth = 1
    this.paintCtx.globalCompositeOperation = 'overlay'

    // Draw frequency contours
    for (let i = 0; i < this.frequencyBands.length; i += 8) {
      const y = this.config.height - (i + 1) * (this.config.height / this.frequencyBands.length)
      this.paintCtx.beginPath()
      this.paintCtx.moveTo(0, y)
      this.paintCtx.lineTo(this.config.width, y)
      this.paintCtx.stroke()
    }
  }

  private getPaintBlendMode(mode: string): string {
    switch (mode) {
      case 'watercolor': return 'multiply'
      case 'oil': return 'source-over'
      case 'acrylic': return 'source-over'
      case 'ink': return 'darken'
      default: return 'source-over'
    }
  }

  private applyPostEffects(params: SpectrogramArtParams): void {
    // Apply texture mixing
    if (params.textureMix > 0) {
      this.ctx.globalCompositeOperation = 'overlay'
      this.ctx.globalAlpha = params.textureMix
      this.ctx.drawImage(this.textureLayer, 0, 0)
      this.ctx.globalAlpha = 1
      this.ctx.globalCompositeOperation = 'source-over'
    }
  }

  public dispose(): void {
    super.dispose()
  }
}