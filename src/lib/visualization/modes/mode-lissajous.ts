/**
 * Lissajous Visualization Mode
 * Creates beautiful Lissajous curves from audio signals
 * Inspired by oscilloscope art and analog synthesis visualization
 */

import { BaseVisualizer, AudioFeatures, RenderFrame, VisualizationMode, VisualParams } from '../core/types'
import { PaletteGenerator } from '../core/palettes'
import { AudioMapper } from '../core/mapping'
import { SeededRNG } from '../core/rng'

interface LissajousParams extends VisualParams {
  // Oscillator parameters
  frequencyX: number
  frequencyY: number
  phaseX: number
  phaseY: number
  detuning: number

  // Visual appearance
  trailLength: number
  lineWidth: number
  glowIntensity: number
  colorShift: number

  // 3D extension
  enable3D: boolean
  zFrequency: number
  zPhase: number
  perspectiveDepth: number

  // Audio modulation
  freqModDepth: number
  phaseModDepth: number
  amplitudeResponse: number
  stereoSeparation: boolean

  // Effects
  echoEffect: boolean
  echoDelay: number
  echoDecay: number
  quantization: number
  noiseAmount: number

  // Artistic style
  renderMode: 'line' | 'points' | 'glow' | 'plasma'
  symmetryMode: 'none' | 'horizontal' | 'vertical' | 'both'
  colorMode: 'frequency' | 'amplitude' | 'velocity' | 'rainbow'
}

interface LissajousPoint {
  x: number
  y: number
  z: number
  timestamp: number
  velocity: number
  frequency: number
  alpha: number
}

export class LissajousVisualizer extends BaseVisualizer {
  readonly id = 'lissajous'
  readonly label = 'Lissajous'
  readonly mode: VisualizationMode = {
    id: this.id,
    label: this.label,
    description: 'Oscilloscope-inspired Lissajous curves with real-time audio frequency modulation',
    category: 'data',
    tags: ['lissajous', 'oscilloscope', 'curves', 'frequency', 'analog', 'mathematical'],
    previewImage: '/previews/lissajous.png',
    supportsRealtime: true,
    supportsOffline: true,
    supportsVideo: true,
    supports3D: false,
    defaultParams: {
      palette: {
        id: 'oscilloscope',
        name: 'Oscilloscope Green',
        colors: ['#00FF41', '#00CC33', '#009926', '#39FF14', '#32CD32'],
        temperature: 'cool',
        mood: 'energetic'
      },
      gradients: {} as any,
      opacity: 0.9,
      brightness: 1.1,
      contrast: 1.2,
      saturation: 0.8,
      motionIntensity: 1.0,
      smoothing: 0.7,
      responsiveness: 0.9,

      // Lissajous specific
      frequencyX: 3,
      frequencyY: 2,
      phaseX: 0,
      phaseY: Math.PI / 4,
      detuning: 0.01,
      trailLength: 500,
      lineWidth: 2,
      glowIntensity: 1.5,
      colorShift: 0.5,
      enable3D: false,
      zFrequency: 1,
      zPhase: 0,
      perspectiveDepth: 200,
      freqModDepth: 2.0,
      phaseModDepth: 1.0,
      amplitudeResponse: 1.5,
      stereoSeparation: true,
      echoEffect: false,
      echoDelay: 100,
      echoDecay: 0.7,
      quantization: 0,
      noiseAmount: 0.02,
      renderMode: 'glow' as const,
      symmetryMode: 'none' as const,
      colorMode: 'frequency' as const
    } as LissajousParams,
    parameterSchema: [
      {
        key: 'frequencyX',
        label: 'X Frequency',
        type: 'range',
        default: 3,
        min: 1,
        max: 16,
        step: 0.1,
        category: 'Oscillator'
      },
      {
        key: 'frequencyY',
        label: 'Y Frequency',
        type: 'range',
        default: 2,
        min: 1,
        max: 16,
        step: 0.1,
        category: 'Oscillator'
      },
      {
        key: 'detuning',
        label: 'Detuning',
        type: 'range',
        default: 0.01,
        min: 0,
        max: 0.1,
        step: 0.001,
        category: 'Oscillator'
      },
      {
        key: 'trailLength',
        label: 'Trail Length',
        type: 'range',
        default: 500,
        min: 50,
        max: 2000,
        step: 50,
        category: 'Visual'
      },
      {
        key: 'renderMode',
        label: 'Render Mode',
        type: 'select',
        default: 'glow',
        options: [
          { value: 'line', label: 'Line' },
          { value: 'points', label: 'Points' },
          { value: 'glow', label: 'Glow' },
          { value: 'plasma', label: 'Plasma' }
        ],
        category: 'Style'
      },
      {
        key: 'colorMode',
        label: 'Color Mode',
        type: 'select',
        default: 'frequency',
        options: [
          { value: 'frequency', label: 'Frequency' },
          { value: 'amplitude', label: 'Amplitude' },
          { value: 'velocity', label: 'Velocity' },
          { value: 'rainbow', label: 'Rainbow' }
        ],
        category: 'Style'
      }
    ],
    audioMapping: {
      energy: [
        { target: 'amplitudeResponse', range: [0.5, 3.0], curve: 'exponential', smoothing: 0.8 },
        { target: 'glowIntensity', range: [1.0, 3.0], curve: 'linear', smoothing: 0.7 }
      ],
      brightness: [
        { target: 'brightness', range: [0.8, 1.5], curve: 'linear', smoothing: 0.85 }
      ],
      onset: [
        { trigger: 'phaseShift', threshold: 0.7, cooldown: 0.2 },
        { trigger: 'frequencyJump', threshold: 0.85, cooldown: 0.4 }
      ],
      pitch: [
        { target: 'freqModDepth', range: [0.5, 4.0], freqRange: [100, 1000] }
      ]
    }
  }

  // Audio processing
  private audioMapper: AudioMapper
  private paletteGenerator: PaletteGenerator
  private rng: SeededRNG

  // Lissajous data
  private points: LissajousPoint[] = []
  private echoPoints: LissajousPoint[] = []

  // Animation state
  private time = 0
  private phaseAccumX = 0
  private phaseAccumY = 0
  private phaseAccumZ = 0
  private centerX = 0
  private centerY = 0

  // Audio analysis
  private leftChannel: Float32Array = new Float32Array(256)
  private rightChannel: Float32Array = new Float32Array(256)
  private dominantFrequency = 440

  constructor() {
    super()
    this.rng = new SeededRNG(Date.now())
    this.paletteGenerator = new PaletteGenerator(this.rng.getSeed())
    this.audioMapper = new AudioMapper(this.mode.audioMapping)
  }

  protected async initializeMode(): Promise<void> {
    this.centerX = this.config.width / 2
    this.centerY = this.config.height / 2

    // Generate color palette gradients
    this.params.gradients = this.paletteGenerator.createGradientSet(
      this.params.palette,
      this.ctx,
      this.config.width,
      this.config.height
    )
  }

  public update(features: AudioFeatures): void {
    // Map audio features to visual parameters
    const mappedParams = this.audioMapper.mapFeatures(features, this.params)
    this.updateParams(mappedParams)

    // Analyze audio for Lissajous modulation
    this.analyzeAudioChannels(features)

    // Handle onset events
    if ((mappedParams as any)._onset_phaseShift) {
      this.triggerPhaseShift()
    }
    if ((mappedParams as any)._onset_frequencyJump) {
      this.triggerFrequencyJump()
    }
  }

  private analyzeAudioChannels(features: AudioFeatures): void {
    // Extract left/right channel data for stereo Lissajous
    if (features.waveform) {
      const waveform = features.waveform
      const halfLength = Math.floor(waveform.length / 2)

      // Split into left/right channels (simplified)
      for (let i = 0; i < halfLength; i++) {
        this.leftChannel[i] = waveform[i * 2] || 0
        this.rightChannel[i] = waveform[i * 2 + 1] || waveform[i * 2] || 0
      }
    }

    // Estimate dominant frequency
    if (features.spectralCentroid) {
      this.dominantFrequency = features.spectralCentroid
    }
  }

  public renderFrame(frame: RenderFrame): void {
    this.time += 1 / 60
    const params = this.params as LissajousParams

    // Clear canvas with fade effect
    this.ctx.fillStyle = `rgba(0, 0, 0, ${0.1 + (1 - params.trailLength / 2000) * 0.9})`
    this.ctx.fillRect(0, 0, this.config.width, this.config.height)

    // Generate new Lissajous points
    this.generateLissajousPoints(params)

    // Render the curve
    this.renderLissajousCurve(params)

    // Apply post-processing effects
    this.applyPostEffects(params)
  }

  private generateLissajousPoints(params: LissajousParams): void {
    // Calculate frequencies with audio modulation
    const audioModX = this.getAudioModulation('x', params)
    const audioModY = this.getAudioModulation('y', params)

    const freqX = params.frequencyX + audioModX * params.freqModDepth
    const freqY = params.frequencyY + audioModY * params.freqModDepth + params.detuning

    // Update phase accumulators
    this.phaseAccumX += freqX * 0.05
    this.phaseAccumY += freqY * 0.05
    if (params.enable3D) {
      this.phaseAccumZ += params.zFrequency * 0.05
    }

    // Calculate Lissajous coordinates
    const scale = Math.min(this.config.width, this.config.height) * 0.3
    const amplitude = scale * params.amplitudeResponse

    const x = this.centerX + amplitude * Math.sin(this.phaseAccumX + params.phaseX + audioModX * params.phaseModDepth)
    const y = this.centerY + amplitude * Math.sin(this.phaseAccumY + params.phaseY + audioModY * params.phaseModDepth)
    const z = params.enable3D ? amplitude * Math.sin(this.phaseAccumZ + params.zPhase) : 0

    // Calculate velocity for color/effects
    const prevPoint = this.points[this.points.length - 1]
    let velocity = 0
    if (prevPoint) {
      const dx = x - prevPoint.x
      const dy = y - prevPoint.y
      const dz = z - prevPoint.z
      velocity = Math.sqrt(dx * dx + dy * dy + dz * dz)
    }

    // Add noise if enabled
    const noiseX = (this.rng.random() - 0.5) * params.noiseAmount * 10
    const noiseY = (this.rng.random() - 0.5) * params.noiseAmount * 10

    const point: LissajousPoint = {
      x: x + noiseX,
      y: y + noiseY,
      z,
      timestamp: this.time,
      velocity,
      frequency: this.dominantFrequency,
      alpha: 1.0
    }

    this.points.push(point)

    // Apply quantization if enabled
    if (params.quantization > 0) {
      this.quantizePoint(point, params.quantization)
    }

    // Limit trail length
    while (this.points.length > params.trailLength) {
      this.points.shift()
    }

    // Handle echo effect
    if (params.echoEffect) {
      this.addEchoPoint(point, params)
    }
  }

  private getAudioModulation(channel: 'x' | 'y', params: LissajousParams): number {
    if (!params.stereoSeparation) {
      // Use energy for modulation
      return (Math.random() - 0.5) * 0.1 // Fallback random modulation
    }

    // Use actual audio data for modulation
    const channelData = channel === 'x' ? this.leftChannel : this.rightChannel
    const index = Math.floor((this.time * 10) % channelData.length)
    return channelData[index] || 0
  }

  private quantizePoint(point: LissajousPoint, levels: number): void {
    if (levels > 0) {
      const quantStep = this.config.width / levels
      point.x = Math.floor(point.x / quantStep) * quantStep
      point.y = Math.floor(point.y / quantStep) * quantStep
    }
  }

  private addEchoPoint(originalPoint: LissajousPoint, params: LissajousParams): void {
    // Add echo point with delay and decay
    setTimeout(() => {
      const echoPoint: LissajousPoint = {
        ...originalPoint,
        timestamp: this.time,
        alpha: originalPoint.alpha * params.echoDecay
      }
      this.echoPoints.push(echoPoint)

      // Cleanup old echo points
      this.echoPoints = this.echoPoints.filter(p => p.alpha > 0.01)
    }, params.echoDelay)
  }

  private renderLissajousCurve(params: LissajousParams): void {
    if (this.points.length < 2) return

    this.ctx.save()

    switch (params.renderMode) {
      case 'line':
        this.renderAsLine(params)
        break
      case 'points':
        this.renderAsPoints(params)
        break
      case 'glow':
        this.renderAsGlow(params)
        break
      case 'plasma':
        this.renderAsPlasma(params)
        break
    }

    // Render echo points if enabled
    if (params.echoEffect && this.echoPoints.length > 0) {
      this.renderEchoPoints(params)
    }

    // Apply symmetry if enabled
    if (params.symmetryMode !== 'none') {
      this.applySymmetry(params)
    }

    this.ctx.restore()
  }

  private renderAsLine(params: LissajousParams): void {
    this.ctx.lineWidth = params.lineWidth
    this.ctx.lineCap = 'round'
    this.ctx.lineJoin = 'round'

    for (let i = 1; i < this.points.length; i++) {
      const prevPoint = this.points[i - 1]
      const currentPoint = this.points[i]

      // Calculate color based on color mode
      const color = this.getPointColor(currentPoint, params)
      const alpha = this.calculateAlpha(i, this.points.length) * params.opacity

      this.ctx.strokeStyle = color.replace('1)', `${alpha})`)
      this.ctx.globalAlpha = alpha

      this.ctx.beginPath()
      this.ctx.moveTo(prevPoint.x, prevPoint.y)
      this.ctx.lineTo(currentPoint.x, currentPoint.y)
      this.ctx.stroke()
    }
  }

  private renderAsPoints(params: LissajousParams): void {
    this.points.forEach((point, index) => {
      const color = this.getPointColor(point, params)
      const alpha = this.calculateAlpha(index, this.points.length) * params.opacity
      const size = params.lineWidth * (1 + point.velocity * 0.1)

      this.ctx.fillStyle = color.replace('1)', `${alpha})`)
      this.ctx.globalAlpha = alpha

      this.ctx.beginPath()
      this.ctx.arc(point.x, point.y, size, 0, Math.PI * 2)
      this.ctx.fill()
    })
  }

  private renderAsGlow(params: LissajousParams): void {
    // Render multiple layers for glow effect
    const glowLayers = 3

    for (let layer = 0; layer < glowLayers; layer++) {
      const layerAlpha = (1 - layer / glowLayers) * params.glowIntensity * 0.3
      const layerWidth = params.lineWidth * (1 + layer * 2)

      this.ctx.lineWidth = layerWidth
      this.ctx.lineCap = 'round'
      this.ctx.globalCompositeOperation = 'screen'

      for (let i = 1; i < this.points.length; i++) {
        const prevPoint = this.points[i - 1]
        const currentPoint = this.points[i]

        const color = this.getPointColor(currentPoint, params)
        const alpha = this.calculateAlpha(i, this.points.length) * layerAlpha

        this.ctx.strokeStyle = color.replace('1)', `${alpha})`)
        this.ctx.globalAlpha = alpha

        this.ctx.beginPath()
        this.ctx.moveTo(prevPoint.x, prevPoint.y)
        this.ctx.lineTo(currentPoint.x, currentPoint.y)
        this.ctx.stroke()
      }
    }

    this.ctx.globalCompositeOperation = 'source-over'
  }

  private renderAsPlasma(params: LissajousParams): void {
    // Create plasma-like effect using gradients
    for (let i = 1; i < this.points.length; i++) {
      const prevPoint = this.points[i - 1]
      const currentPoint = this.points[i]

      const gradient = this.ctx.createLinearGradient(
        prevPoint.x, prevPoint.y,
        currentPoint.x, currentPoint.y
      )

      const color1 = this.getPointColor(prevPoint, params)
      const color2 = this.getPointColor(currentPoint, params)

      gradient.addColorStop(0, color1)
      gradient.addColorStop(1, color2)

      this.ctx.strokeStyle = gradient
      this.ctx.lineWidth = params.lineWidth * 2
      this.ctx.globalAlpha = this.calculateAlpha(i, this.points.length) * params.opacity

      this.ctx.beginPath()
      this.ctx.moveTo(prevPoint.x, prevPoint.y)
      this.ctx.lineTo(currentPoint.x, currentPoint.y)
      this.ctx.stroke()
    }
  }

  private renderEchoPoints(params: LissajousParams): void {
    this.ctx.globalAlpha *= 0.5

    this.echoPoints.forEach(point => {
      const color = this.getPointColor(point, params)
      this.ctx.fillStyle = color.replace('1)', `${point.alpha})`)

      this.ctx.beginPath()
      this.ctx.arc(point.x, point.y, params.lineWidth, 0, Math.PI * 2)
      this.ctx.fill()
    })
  }

  private getPointColor(point: LissajousPoint, params: LissajousParams): string {
    switch (params.colorMode) {
      case 'frequency':
        const hue = (point.frequency / 2000) * 360
        return `hsla(${hue}, 70%, 60%, 1)`

      case 'amplitude':
        const amp = Math.abs(point.x - this.centerX) + Math.abs(point.y - this.centerY)
        const ampHue = (amp / 300) * 120 + 240 // Blue to purple range
        return `hsla(${ampHue}, 80%, 65%, 1)`

      case 'velocity':
        const velHue = Math.min(point.velocity * 5, 360)
        return `hsla(${velHue}, 90%, 55%, 1)`

      case 'rainbow':
        const rainbowHue = (this.time * 50 + point.x + point.y) % 360
        return `hsla(${rainbowHue}, 85%, 60%, 1)`

      default:
        return this.paletteGenerator.getColorAtPosition(params.palette, 0.5)
    }
  }

  private calculateAlpha(index: number, totalPoints: number): number {
    // Fade trail from newest to oldest
    return Math.pow(index / totalPoints, 0.7)
  }

  private applySymmetry(params: LissajousParams): void {
    this.ctx.save()

    switch (params.symmetryMode) {
      case 'horizontal':
        this.ctx.scale(1, -1)
        this.ctx.translate(0, -this.config.height)
        this.renderLissajousCurve({ ...params, symmetryMode: 'none' })
        break

      case 'vertical':
        this.ctx.scale(-1, 1)
        this.ctx.translate(-this.config.width, 0)
        this.renderLissajousCurve({ ...params, symmetryMode: 'none' })
        break

      case 'both':
        // Render in all four quadrants
        this.ctx.scale(-1, -1)
        this.ctx.translate(-this.config.width, -this.config.height)
        this.renderLissajousCurve({ ...params, symmetryMode: 'none' })
        break
    }

    this.ctx.restore()
  }

  private applyPostEffects(params: LissajousParams): void {
    // Apply glow filter
    if (params.glowIntensity > 1) {
      this.ctx.filter = `blur(${params.glowIntensity}px) brightness(${params.brightness})`
      this.ctx.globalCompositeOperation = 'screen'
      this.ctx.globalAlpha = 0.3
      this.ctx.drawImage(this.canvas, 0, 0)
      this.ctx.filter = 'none'
      this.ctx.globalCompositeOperation = 'source-over'
      this.ctx.globalAlpha = 1
    }
  }

  private triggerPhaseShift(): void {
    const params = this.params as LissajousParams
    // Randomly shift phases for interesting pattern changes
    this.phaseAccumX += (Math.random() - 0.5) * Math.PI
    this.phaseAccumY += (Math.random() - 0.5) * Math.PI
  }

  private triggerFrequencyJump(): void {
    // Temporarily change frequency ratios
    const currentParams = this.params as LissajousParams
    const freqMultiplier = Math.random() * 2 + 0.5

    this.updateParams({
      frequencyX: currentParams.frequencyX * freqMultiplier,
      frequencyY: currentParams.frequencyY * freqMultiplier
    })

    // Reset after a short time
    setTimeout(() => {
      this.updateParams({
        frequencyX: currentParams.frequencyX,
        frequencyY: currentParams.frequencyY
      })
    }, 500)
  }

  public dispose(): void {
    super.dispose()
    this.points = []
    this.echoPoints = []
  }
}