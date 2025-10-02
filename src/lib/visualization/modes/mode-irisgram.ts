/**
 * Irisgram Visualization Mode
 * Polar coordinate spectrogram creating iris-like circular patterns
 * Based on research from: https://scientificbulletin.upb.ro/
 */

import { BaseVisualizer, AudioFeatures, RenderFrame, VisualizationMode, VisualParams } from '../core/types'
import { PaletteGenerator } from '../core/palettes'
import { AudioMapper } from '../core/mapping'
import { SeededRNG } from '../core/rng'

interface IrisgramParams extends VisualParams {
  // Polar transformation
  centerRadius: number
  maxRadius: number
  angularResolution: number
  radialBands: number

  // Spectral analysis
  frequencyBins: number
  timeWindow: number
  spectralSmoothing: number
  logFrequencyScale: boolean

  // Visual effects
  ringThickness: number
  irisContrast: number
  colorSaturation: number
  backgroundGlow: number

  // Animation
  rotationSpeed: number
  timeDecay: number
  pulseWithBeat: boolean
  morphingStrength: number

  // Artistic style
  brushStroke: 'smooth' | 'textured' | 'pointillist' | 'watercolor'
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay'
  noiseAmount: number
  organicDeformation: number
}

interface PolarRing {
  radius: number
  angle: number
  frequency: number
  magnitude: number
  hue: number
  saturation: number
  brightness: number
  timestamp: number
  alpha: number
}

export class IrisgramVisualizer extends BaseVisualizer {
  readonly id = 'irisgram'
  readonly label = 'Irisgram'
  readonly mode: VisualizationMode = {
    id: this.id,
    label: this.label,
    description: 'Polar coordinate spectrogram creating beautiful iris-like circular patterns from audio frequency data',
    category: 'artistic',
    tags: ['polar', 'iris', 'spectrogram', 'circular', 'artistic', 'frequency'],
    previewImage: '/previews/irisgram.png',
    supportsRealtime: true,
    supportsOffline: true,
    supportsVideo: true,
    supports3D: false,
    defaultParams: {
      palette: {
        id: 'iris',
        name: 'Iris Rainbow',
        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'],
        temperature: 'neutral',
        mood: 'dynamic'
      },
      gradients: {} as any,
      opacity: 0.85,
      brightness: 1.2,
      contrast: 1.3,
      saturation: 1.4,
      motionIntensity: 0.7,
      smoothing: 0.9,
      responsiveness: 0.8,

      // Irisgram specific
      centerRadius: 50,
      maxRadius: 300,
      angularResolution: 360,
      radialBands: 64,
      frequencyBins: 512,
      timeWindow: 2048,
      spectralSmoothing: 0.85,
      logFrequencyScale: true,
      ringThickness: 3,
      irisContrast: 1.5,
      colorSaturation: 1.2,
      backgroundGlow: 0.3,
      rotationSpeed: 0.2,
      timeDecay: 0.98,
      pulseWithBeat: true,
      morphingStrength: 0.4,
      brushStroke: 'smooth' as const,
      blendMode: 'normal' as const,
      noiseAmount: 0.1,
      organicDeformation: 0.15
    } as IrisgramParams,
    parameterSchema: [
      {
        key: 'centerRadius',
        label: 'Center Radius',
        type: 'range',
        default: 50,
        min: 20,
        max: 150,
        step: 5,
        category: 'Geometry'
      },
      {
        key: 'maxRadius',
        label: 'Max Radius',
        type: 'range',
        default: 300,
        min: 200,
        max: 500,
        step: 10,
        category: 'Geometry'
      },
      {
        key: 'radialBands',
        label: 'Radial Bands',
        type: 'range',
        default: 64,
        min: 32,
        max: 128,
        step: 8,
        category: 'Analysis'
      },
      {
        key: 'brushStroke',
        label: 'Brush Style',
        type: 'select',
        default: 'smooth',
        options: [
          { value: 'smooth', label: 'Smooth' },
          { value: 'textured', label: 'Textured' },
          { value: 'pointillist', label: 'Pointillist' },
          { value: 'watercolor', label: 'Watercolor' }
        ],
        category: 'Style'
      },
      {
        key: 'pulseWithBeat',
        label: 'Pulse with Beat',
        type: 'boolean',
        default: true,
        category: 'Animation'
      }
    ],
    audioMapping: {
      energy: [
        { target: 'irisContrast', range: [1.0, 2.5], curve: 'exponential', smoothing: 0.8 },
        { target: 'morphingStrength', range: [0.2, 1.0], curve: 'linear', smoothing: 0.9 }
      ],
      brightness: [
        { target: 'brightness', range: [0.8, 1.8], curve: 'linear', smoothing: 0.85 }
      ],
      onset: [
        { trigger: 'irisFlash', threshold: 0.6, cooldown: 0.3 },
        { trigger: 'ringExpansion', threshold: 0.8, cooldown: 0.5 }
      ],
      pitch: [
        { target: 'rotationSpeed', range: [0.1, 0.5], freqRange: [80, 800] }
      ]
    }
  }

  // Audio processing
  private audioMapper: AudioMapper
  private paletteGenerator: PaletteGenerator
  private rng: SeededRNG

  // Irisgram data
  private polarRings: PolarRing[] = []
  private spectralHistory: Float32Array[] = []
  private maxHistoryLength = 60 // 1 second at 60fps

  // Visual state
  private time = 0
  private centerX = 0
  private centerY = 0
  private currentRotation = 0

  // Buffers
  private imageBuffer: ImageData | null = null

  constructor() {
    super()
    this.rng = new SeededRNG(Date.now())
    this.paletteGenerator = new PaletteGenerator(this.rng.getSeed())
    this.audioMapper = new AudioMapper(this.mode.audioMapping)
  }

  protected async initializeMode(): Promise<void> {
    this.centerX = this.config.width / 2
    this.centerY = this.config.height / 2

    // Initialize image buffer
    this.imageBuffer = this.ctx.createImageData(this.config.width, this.config.height)

    // Generate color palette gradients
    this.params.gradients = this.paletteGenerator.createGradientSet(
      this.params.palette,
      this.ctx,
      this.config.width,
      this.config.height
    )

    await this.initializeSpectralAnalysis()
  }

  private async initializeSpectralAnalysis(): Promise<void> {
    const params = this.params as IrisgramParams

    // Initialize spectral history buffer
    for (let i = 0; i < this.maxHistoryLength; i++) {
      this.spectralHistory.push(new Float32Array(params.frequencyBins))
    }
  }

  public update(features: AudioFeatures): void {
    // Map audio features to visual parameters
    const mappedParams = this.audioMapper.mapFeatures(features, this.params)
    this.updateParams(mappedParams)

    // Update spectral history
    this.updateSpectralHistory(features)

    // Generate new polar rings from current spectrum
    this.generatePolarRings(features)

    // Handle onset events
    if ((mappedParams as any)._onset_irisFlash) {
      this.triggerIrisFlash()
    }
    if ((mappedParams as any)._onset_ringExpansion) {
      this.triggerRingExpansion()
    }
  }

  private updateSpectralHistory(features: AudioFeatures): void {
    const params = this.params as IrisgramParams

    // Shift history
    this.spectralHistory.shift()

    // Add current spectrum
    const spectrum = new Float32Array(params.frequencyBins)
    const freqData = features.frequencyData || new Uint8Array(params.frequencyBins)

    for (let i = 0; i < spectrum.length; i++) {
      spectrum[i] = freqData[i] / 255.0
    }

    this.spectralHistory.push(spectrum)
  }

  private generatePolarRings(features: AudioFeatures): void {
    const params = this.params as IrisgramParams
    const currentSpectrum = this.spectralHistory[this.spectralHistory.length - 1]

    if (!currentSpectrum) return

    // Decay existing rings
    this.polarRings.forEach(ring => {
      ring.alpha *= params.timeDecay
      ring.radius += params.morphingStrength * 0.5
    })

    // Remove old rings
    this.polarRings = this.polarRings.filter(ring => ring.alpha > 0.01)

    // Generate new rings from current spectrum
    const angleStep = (Math.PI * 2) / params.angularResolution

    for (let angle = 0; angle < Math.PI * 2; angle += angleStep) {
      const normalizedAngle = angle / (Math.PI * 2)
      const freqIndex = Math.floor(normalizedAngle * currentSpectrum.length)
      const magnitude = currentSpectrum[freqIndex] || 0

      if (magnitude > 0.1) { // Threshold for creating rings
        const ring: PolarRing = {
          radius: params.centerRadius + magnitude * (params.maxRadius - params.centerRadius),
          angle: angle + this.currentRotation,
          frequency: freqIndex / currentSpectrum.length,
          magnitude,
          hue: this.frequencyToHue(freqIndex / currentSpectrum.length),
          saturation: params.colorSaturation * magnitude,
          brightness: params.brightness * magnitude,
          timestamp: this.time,
          alpha: magnitude * params.opacity
        }

        this.polarRings.push(ring)
      }
    }
  }

  private frequencyToHue(normalizedFreq: number): number {
    // Map frequency to hue (0-360 degrees)
    return normalizedFreq * 360
  }

  public renderFrame(frame: RenderFrame): void {
    this.time += 1 / 60
    const params = this.params as IrisgramParams

    // Update rotation
    this.currentRotation += params.rotationSpeed * 0.01

    // Clear canvas
    this.ctx.fillStyle = `rgba(0, 0, 0, ${1 - params.backgroundGlow})`
    this.ctx.fillRect(0, 0, this.config.width, this.config.height)

    // Render iris pattern
    this.renderIrisPattern(params)

    // Apply post-processing
    this.applyPostProcessing(params)
  }

  private renderIrisPattern(params: IrisgramParams): void {
    this.ctx.save()

    // Set blend mode
    this.ctx.globalCompositeOperation = params.blendMode

    // Group rings by radius for efficient rendering
    const ringsByRadius = new Map<number, PolarRing[]>()

    this.polarRings.forEach(ring => {
      const radiusKey = Math.floor(ring.radius / params.ringThickness) * params.ringThickness
      if (!ringsByRadius.has(radiusKey)) {
        ringsByRadius.set(radiusKey, [])
      }
      ringsByRadius.get(radiusKey)!.push(ring)
    })

    // Render each radius band
    ringsByRadius.forEach((rings, radius) => {
      this.renderRadiusBand(rings, radius, params)
    })

    this.ctx.restore()
  }

  private renderRadiusBand(rings: PolarRing[], radius: number, params: IrisgramParams): void {
    if (rings.length === 0) return

    // Calculate average properties for this band
    const avgHue = rings.reduce((sum, ring) => sum + ring.hue, 0) / rings.length
    const avgSaturation = rings.reduce((sum, ring) => sum + ring.saturation, 0) / rings.length
    const avgBrightness = rings.reduce((sum, ring) => sum + ring.brightness, 0) / rings.length
    const avgAlpha = rings.reduce((sum, ring) => sum + ring.alpha, 0) / rings.length

    // Create gradient for this band
    const gradient = this.ctx.createConicGradient(0, this.centerX, this.centerY)

    rings.forEach(ring => {
      const normalizedAngle = ring.angle / (Math.PI * 2)
      const color = `hsla(${ring.hue}, ${ring.saturation * 100}%, ${ring.brightness * 50}%, ${ring.alpha})`
      gradient.addColorStop(normalizedAngle, color)
    })

    // Render the band
    this.ctx.strokeStyle = gradient
    this.ctx.lineWidth = params.ringThickness
    this.ctx.globalAlpha = avgAlpha

    // Add organic deformation
    if (params.organicDeformation > 0) {
      this.renderOrganicRing(radius, params)
    } else {
      this.ctx.beginPath()
      this.ctx.arc(this.centerX, this.centerY, radius, 0, Math.PI * 2)
      this.ctx.stroke()
    }

    // Apply brush effects
    this.applyBrushEffect(radius, params)
  }

  private renderOrganicRing(radius: number, params: IrisgramParams): void {
    const points = 64
    const angleStep = (Math.PI * 2) / points

    this.ctx.beginPath()

    for (let i = 0; i <= points; i++) {
      const angle = i * angleStep
      const noise = this.rng.noise2D(
        Math.cos(angle) * 0.01 + this.time * 0.001,
        Math.sin(angle) * 0.01 + this.time * 0.001
      )

      const deformedRadius = radius + noise * params.organicDeformation * 20
      const x = this.centerX + Math.cos(angle) * deformedRadius
      const y = this.centerY + Math.sin(angle) * deformedRadius

      if (i === 0) {
        this.ctx.moveTo(x, y)
      } else {
        this.ctx.lineTo(x, y)
      }
    }

    this.ctx.closePath()
    this.ctx.stroke()
  }

  private applyBrushEffect(radius: number, params: IrisgramParams): void {
    switch (params.brushStroke) {
      case 'textured':
        this.applyTexturedBrush(radius, params)
        break
      case 'pointillist':
        this.applyPointillistBrush(radius, params)
        break
      case 'watercolor':
        this.applyWatercolorBrush(radius, params)
        break
    }
  }

  private applyTexturedBrush(radius: number, params: IrisgramParams): void {
    // Add small random dots for texture
    const dotCount = Math.floor(radius * 0.1)

    for (let i = 0; i < dotCount; i++) {
      const angle = this.rng.random() * Math.PI * 2
      const r = radius + (this.rng.random() - 0.5) * params.ringThickness
      const x = this.centerX + Math.cos(angle) * r
      const y = this.centerY + Math.sin(angle) * r

      this.ctx.fillStyle = this.ctx.strokeStyle as string
      this.ctx.globalAlpha *= 0.3
      this.ctx.beginPath()
      this.ctx.arc(x, y, 1, 0, Math.PI * 2)
      this.ctx.fill()
    }
  }

  private applyPointillistBrush(radius: number, params: IrisgramParams): void {
    // Create pointillist effect with small colored dots
    const dotCount = Math.floor(radius * 0.2)

    for (let i = 0; i < dotCount; i++) {
      const angle = this.rng.random() * Math.PI * 2
      const r = radius + (this.rng.random() - 0.5) * params.ringThickness * 2
      const x = this.centerX + Math.cos(angle) * r
      const y = this.centerY + Math.sin(angle) * r

      const hue = this.rng.random() * 360
      this.ctx.fillStyle = `hsla(${hue}, 70%, 60%, 0.6)`
      this.ctx.beginPath()
      this.ctx.arc(x, y, 2, 0, Math.PI * 2)
      this.ctx.fill()
    }
  }

  private applyWatercolorBrush(radius: number, params: IrisgramParams): void {
    // Simulate watercolor bleeding effect
    this.ctx.filter = `blur(${params.ringThickness * 0.3}px)`
    this.ctx.globalAlpha *= 0.7

    // Draw additional softer layer
    this.ctx.beginPath()
    this.ctx.arc(this.centerX, this.centerY, radius + params.ringThickness, 0, Math.PI * 2)
    this.ctx.stroke()

    this.ctx.filter = 'none'
  }

  private applyPostProcessing(params: IrisgramParams): void {
    // Apply noise if enabled
    if (params.noiseAmount > 0) {
      this.addNoise(params.noiseAmount)
    }

    // Apply glow effect
    if (params.backgroundGlow > 0) {
      this.ctx.globalCompositeOperation = 'screen'
      this.ctx.globalAlpha = params.backgroundGlow * 0.3
      this.ctx.fillStyle = `radial-gradient(circle at ${this.centerX}px ${this.centerY}px, rgba(255,255,255,0.1) 0%, transparent 70%)`
      this.ctx.fillRect(0, 0, this.config.width, this.config.height)
      this.ctx.globalCompositeOperation = 'source-over'
      this.ctx.globalAlpha = 1
    }
  }

  private addNoise(amount: number): void {
    if (!this.imageBuffer) return

    const imageData = this.ctx.getImageData(0, 0, this.config.width, this.config.height)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      const noise = (this.rng.random() - 0.5) * amount * 255
      data[i] = Math.max(0, Math.min(255, data[i] + noise))     // R
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)) // G
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)) // B
    }

    this.ctx.putImageData(imageData, 0, 0)
  }

  private triggerIrisFlash(): void {
    // Temporarily boost all ring brightness
    this.polarRings.forEach(ring => {
      ring.brightness = Math.min(2, ring.brightness * 1.5)
      ring.alpha = Math.min(1, ring.alpha * 1.3)
    })
  }

  private triggerRingExpansion(): void {
    // Create expanding ripple effect
    const params = this.params as IrisgramParams
    const rippleRings = 5

    for (let i = 0; i < rippleRings; i++) {
      const ring: PolarRing = {
        radius: params.centerRadius + i * 20,
        angle: 0,
        frequency: 0.5,
        magnitude: 0.8 - i * 0.15,
        hue: 180 + i * 30,
        saturation: 0.8,
        brightness: 1.2,
        timestamp: this.time,
        alpha: 0.6 - i * 0.1
      }

      this.polarRings.push(ring)
    }
  }

  public dispose(): void {
    super.dispose()
    this.polarRings = []
    this.spectralHistory = []
  }
}