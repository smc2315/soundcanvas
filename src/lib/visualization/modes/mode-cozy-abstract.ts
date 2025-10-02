/**
 * Cozy Abstract Visualization Mode
 * Warm, comforting abstract shapes with organic movement and soft lighting
 */

import { BaseVisualizer, AudioFeatures, RenderFrame, VisualizationMode, VisualParams } from '../core/types'
import { PaletteGenerator } from '../core/palettes'
import { AudioMapper } from '../core/mapping'
import { SeededRNG } from '../core/rng'

interface CozyAbstractParams extends VisualParams {
  // Shape generation
  shapeComplexity: number
  organicMorph: number
  layerCount: number
  shapeScale: number

  // Movement
  driftSpeed: number
  breathingRate: number
  rotationSpeed: number
  waveAmplitude: number

  // Lighting and warmth
  ambientGlow: number
  warmth: number
  softness: number
  shadowDepth: number

  // Textures
  paperTexture: boolean
  brushStrokes: boolean
  colorBlending: number
  noiseAmount: number

  // Audio reactivity
  shapeMorphing: number
  glowPulse: number
  colorShift: number
  rhythmInfluence: number
}

interface CozyShape {
  x: number
  y: number
  size: number
  rotation: number
  hue: number
  warmth: number
  vertices: Array<{ x: number; y: number; baseX: number; baseY: number }>
  breathPhase: number
  driftVelocity: { x: number; y: number }
  layer: number
  opacity: number
}

export class CozyAbstractVisualizer extends BaseVisualizer {
  readonly id = 'cozy-abstract'
  readonly label = 'Cozy Abstract'
  readonly mode: VisualizationMode = {
    id: this.id,
    label: this.label,
    description: 'Warm, comforting abstract visualization with organic shapes and soft lighting',
    category: 'artistic',
    tags: ['abstract', 'cozy', 'warm', 'organic', 'soft', 'realtime'],
    previewImage: '/previews/cozy-abstract.png',
    supportsRealtime: true,
    supportsOffline: true,
    supportsVideo: true,
    supports3D: false,
    defaultParams: {
      palette: {
        id: 'cozy',
        name: 'Cozy Hearth',
        colors: ['#8B4513', '#CD853F', '#DEB887', '#F4A460', '#FFE4B5'],
        temperature: 'warm',
        mood: 'calm'
      },
      gradients: {} as any,
      opacity: 0.9,
      brightness: 1.1,
      contrast: 0.9,
      saturation: 1.2,
      motionIntensity: 0.5,
      smoothing: 0.9,
      responsiveness: 0.6,

      // Cozy Abstract specific
      shapeComplexity: 6,
      organicMorph: 0.3,
      layerCount: 4,
      shapeScale: 1.0,
      driftSpeed: 0.2,
      breathingRate: 0.8,
      rotationSpeed: 0.1,
      waveAmplitude: 0.2,
      ambientGlow: 1.5,
      warmth: 0.8,
      softness: 0.9,
      shadowDepth: 0.4,
      paperTexture: true,
      brushStrokes: true,
      colorBlending: 0.7,
      noiseAmount: 0.15,
      shapeMorphing: 1.2,
      glowPulse: 0.8,
      colorShift: 0.3,
      rhythmInfluence: 0.9
    } as CozyAbstractParams,
    parameterSchema: [
      {
        key: 'shapeComplexity',
        label: 'Shape Complexity',
        type: 'range',
        default: 6,
        min: 3,
        max: 12,
        step: 1,
        category: 'Shapes'
      },
      {
        key: 'layerCount',
        label: 'Layer Count',
        type: 'range',
        default: 4,
        min: 2,
        max: 8,
        step: 1,
        category: 'Composition'
      },
      {
        key: 'warmth',
        label: 'Warmth',
        type: 'range',
        default: 0.8,
        min: 0.0,
        max: 1.0,
        step: 0.1,
        category: 'Mood'
      },
      {
        key: 'paperTexture',
        label: 'Paper Texture',
        type: 'boolean',
        default: true,
        category: 'Texture'
      }
    ],
    audioMapping: {
      energy: [
        { target: 'shapeMorphing', range: [0.5, 2.0], curve: 'exponential', smoothing: 0.8 },
        { target: 'ambientGlow', range: [1.0, 2.5], curve: 'linear', smoothing: 0.7 }
      ],
      brightness: [
        { target: 'brightness', range: [0.8, 1.4], curve: 'linear', smoothing: 0.85 }
      ],
      onset: [
        { trigger: 'shapeRipple', threshold: 0.5, cooldown: 0.6 },
        { trigger: 'warmthPulse', threshold: 0.7, cooldown: 0.4 }
      ],
      pitch: [
        { target: 'colorShift', range: [0.1, 0.6], freqRange: [100, 1000] }
      ]
    }
  }

  // Audio processing
  private audioMapper: AudioMapper
  private paletteGenerator: PaletteGenerator
  private rng: SeededRNG

  // Shape system
  private shapes: CozyShape[] = []
  private backgroundGradient: CanvasGradient | null = null

  // Visual buffers
  private backgroundLayer: HTMLCanvasElement | OffscreenCanvas
  private backgroundCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  private textureLayer: HTMLCanvasElement | OffscreenCanvas
  private textureCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

  // Animation state
  private time = 0
  private audioEnergy = 0
  private lastOnsetTime = 0

  constructor() {
    super()
    this.rng = new SeededRNG(Date.now())
    this.paletteGenerator = new PaletteGenerator(this.rng.getSeed())
    this.audioMapper = new AudioMapper(this.mode.audioMapping)
  }

  protected async initializeMode(): Promise<void> {
    await this.setupCanvas()
    await this.createShapes()
    await this.generateBackground()
    await this.generateTextures()
  }

  private async setupCanvas(): Promise<void> {
    if (typeof OffscreenCanvas !== 'undefined') {
      this.backgroundLayer = new OffscreenCanvas(this.config.width, this.config.height)
      this.textureLayer = new OffscreenCanvas(this.config.width, this.config.height)
    } else {
      this.backgroundLayer = document.createElement('canvas')
      this.backgroundLayer.width = this.config.width
      this.backgroundLayer.height = this.config.height

      this.textureLayer = document.createElement('canvas')
      this.textureLayer.width = this.config.width
      this.textureLayer.height = this.config.height
    }

    const bgCtx = this.backgroundLayer.getContext('2d')
    const texCtx = this.textureLayer.getContext('2d')

    if (!bgCtx || !texCtx) {
      throw new Error('Failed to get canvas contexts')
    }

    this.backgroundCtx = bgCtx
    this.textureCtx = texCtx
  }

  private async createShapes(): Promise<void> {
    const params = this.params as CozyAbstractParams
    this.shapes = []

    const shapeCount = params.layerCount * 3

    for (let i = 0; i < shapeCount; i++) {
      const shape = this.createCozyShape(i)
      this.shapes.push(shape)
    }
  }

  private createCozyShape(index: number): CozyShape {
    const params = this.params as CozyAbstractParams
    const centerX = this.config.width / 2
    const centerY = this.config.height / 2

    // Distribute shapes in organic clusters
    const clusterAngle = (index / this.shapes.length) * Math.PI * 2
    const clusterRadius = Math.min(this.config.width, this.config.height) * 0.3
    const clusterX = centerX + Math.cos(clusterAngle) * clusterRadius * this.rng.random()
    const clusterY = centerY + Math.sin(clusterAngle) * clusterRadius * this.rng.random()

    const shape: CozyShape = {
      x: clusterX,
      y: clusterY,
      size: this.rng.randomFloat(20, 80) * params.shapeScale,
      rotation: this.rng.random() * Math.PI * 2,
      hue: this.rng.random() * 60 + 15, // Warm hues
      warmth: this.rng.randomFloat(0.6, 1.0),
      vertices: [],
      breathPhase: this.rng.random() * Math.PI * 2,
      driftVelocity: {
        x: (this.rng.random() - 0.5) * params.driftSpeed,
        y: (this.rng.random() - 0.5) * params.driftSpeed
      },
      layer: Math.floor(index / 3),
      opacity: this.rng.randomFloat(0.4, 0.8)
    }

    // Generate organic vertices
    this.generateOrganicVertices(shape, params)

    return shape
  }

  private generateOrganicVertices(shape: CozyShape, params: CozyAbstractParams): void {
    shape.vertices = []
    const vertexCount = params.shapeComplexity

    for (let i = 0; i < vertexCount; i++) {
      const angle = (i / vertexCount) * Math.PI * 2
      const baseRadius = shape.size * (0.7 + this.rng.random() * 0.3)

      const baseX = Math.cos(angle) * baseRadius
      const baseY = Math.sin(angle) * baseRadius

      shape.vertices.push({
        x: baseX,
        y: baseY,
        baseX,
        baseY
      })
    }
  }

  private async generateBackground(): Promise<void> {
    const params = this.params as CozyAbstractParams

    // Create warm ambient background
    this.backgroundGradient = this.backgroundCtx.createRadialGradient(
      this.config.width / 2, this.config.height / 2, 0,
      this.config.width / 2, this.config.height / 2, Math.max(this.config.width, this.config.height) / 2
    )

    const warmColor1 = `hsl(${25 + params.warmth * 15}, 40%, ${15 + params.warmth * 10}%)`
    const warmColor2 = `hsl(${35 + params.warmth * 10}, 30%, ${8 + params.warmth * 5}%)`

    this.backgroundGradient.addColorStop(0, warmColor1)
    this.backgroundGradient.addColorStop(1, warmColor2)
  }

  private async generateTextures(): Promise<void> {
    const params = this.params as CozyAbstractParams

    if (!params.paperTexture) return

    // Generate subtle paper texture
    const imageData = this.textureCtx.createImageData(this.config.width, this.config.height)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      const x = (i / 4) % this.config.width
      const y = Math.floor((i / 4) / this.config.width)

      const noise = this.rng.noise2D(x * 0.01, y * 0.01) * params.noiseAmount
      const paperValue = 245 + noise * 20

      data[i] = paperValue     // R
      data[i + 1] = paperValue - 5 // G
      data[i + 2] = paperValue - 10 // B
      data[i + 3] = 15         // A
    }

    this.textureCtx.putImageData(imageData, 0, 0)
  }

  public update(features: AudioFeatures): void {
    // Map audio features to visual parameters
    const mappedParams = this.audioMapper.mapFeatures(features, this.params)
    this.updateParams(mappedParams)

    // Store audio values
    this.audioEnergy = features.energy

    // Handle onset events
    if ((mappedParams as any)._onset_shapeRipple) {
      this.triggerShapeRipple()
    }
    if ((mappedParams as any)._onset_warmthPulse) {
      this.triggerWarmthPulse()
    }
  }

  public renderFrame(frame: RenderFrame): void {
    this.time += 1 / 60
    const params = this.params as CozyAbstractParams

    // Clear canvas
    this.ctx.clearRect(0, 0, this.config.width, this.config.height)

    // Draw background
    this.renderBackground(params)

    // Update and render shapes
    this.updateShapes(params)
    this.renderShapes(params)

    // Apply textures and post-processing
    this.applyPostEffects(params)
  }

  private renderBackground(params: CozyAbstractParams): void {
    if (this.backgroundGradient) {
      this.backgroundCtx.fillStyle = this.backgroundGradient
      this.backgroundCtx.fillRect(0, 0, this.config.width, this.config.height)
    }

    // Add subtle ambient glow
    if (params.ambientGlow > 0) {
      this.backgroundCtx.globalCompositeOperation = 'screen'
      this.backgroundCtx.globalAlpha = params.ambientGlow * 0.1

      const glowGradient = this.backgroundCtx.createRadialGradient(
        this.config.width / 2, this.config.height / 2, 0,
        this.config.width / 2, this.config.height / 2, Math.min(this.config.width, this.config.height) * 0.8
      )

      glowGradient.addColorStop(0, `hsl(45, 80%, 70%)`)
      glowGradient.addColorStop(1, 'transparent')

      this.backgroundCtx.fillStyle = glowGradient
      this.backgroundCtx.fillRect(0, 0, this.config.width, this.config.height)

      this.backgroundCtx.globalAlpha = 1
      this.backgroundCtx.globalCompositeOperation = 'source-over'
    }

    // Draw background to main canvas
    this.ctx.drawImage(this.backgroundLayer, 0, 0)
  }

  private updateShapes(params: CozyAbstractParams): void {
    this.shapes.forEach(shape => {
      // Update breathing animation
      shape.breathPhase += params.breathingRate * 0.02
      const breathScale = 1 + Math.sin(shape.breathPhase) * 0.1

      // Update position drift
      shape.x += shape.driftVelocity.x
      shape.y += shape.driftVelocity.y

      // Wrap around screen
      if (shape.x < -shape.size) shape.x = this.config.width + shape.size
      if (shape.x > this.config.width + shape.size) shape.x = -shape.size
      if (shape.y < -shape.size) shape.y = this.config.height + shape.size
      if (shape.y > this.config.height + shape.size) shape.y = -shape.size

      // Update rotation
      shape.rotation += params.rotationSpeed * 0.01

      // Update organic morphing
      shape.vertices.forEach((vertex, i) => {
        const morphPhase = this.time * 0.5 + i * 0.5
        const morphAmount = params.organicMorph * params.shapeMorphing

        vertex.x = vertex.baseX + Math.sin(morphPhase) * morphAmount * 10
        vertex.y = vertex.baseY + Math.cos(morphPhase * 1.3) * morphAmount * 8
      })

      // Audio reactivity
      shape.size = shape.size * (1 + this.audioEnergy * params.shapeMorphing * 0.1)
      shape.opacity = Math.min(1, shape.opacity + this.audioEnergy * params.glowPulse * 0.1)
    })
  }

  private renderShapes(params: CozyAbstractParams): void {
    // Sort shapes by layer for proper depth
    const sortedShapes = [...this.shapes].sort((a, b) => a.layer - b.layer)

    sortedShapes.forEach(shape => {
      this.ctx.save()

      // Set shadow for depth
      if (params.shadowDepth > 0) {
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
        this.ctx.shadowBlur = shape.layer * 5 + 5
        this.ctx.shadowOffsetX = shape.layer * 2
        this.ctx.shadowOffsetY = shape.layer * 2
      }

      // Move to shape position
      this.ctx.translate(shape.x, shape.y)
      this.ctx.rotate(shape.rotation)

      // Create shape gradient
      const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, shape.size)

      const baseColor = this.paletteGenerator.getColorAtPosition(params.palette, shape.warmth)
      const centerColor = this.adjustColorWarmth(baseColor, params.warmth)
      const edgeColor = this.adjustColorWarmth(baseColor, params.warmth * 0.6)

      gradient.addColorStop(0, centerColor)
      gradient.addColorStop(0.7, edgeColor)
      gradient.addColorStop(1, 'transparent')

      // Draw organic shape
      this.ctx.beginPath()
      this.ctx.moveTo(shape.vertices[0].x, shape.vertices[0].y)

      for (let i = 1; i < shape.vertices.length; i++) {
        const current = shape.vertices[i]
        const next = shape.vertices[(i + 1) % shape.vertices.length]

        const controlX = current.x + (next.x - current.x) * 0.3
        const controlY = current.y + (next.y - current.y) * 0.3

        this.ctx.quadraticCurveTo(controlX, controlY, current.x, current.y)
      }

      this.ctx.closePath()

      // Apply soft blending
      this.ctx.globalCompositeOperation = params.colorBlending > 0.5 ? 'multiply' : 'source-over'
      this.ctx.globalAlpha = shape.opacity * params.opacity

      this.ctx.fillStyle = gradient
      this.ctx.fill()

      // Add glow effect
      if (params.ambientGlow > 1) {
        this.ctx.globalCompositeOperation = 'screen'
        this.ctx.globalAlpha = (params.ambientGlow - 1) * 0.3
        this.ctx.fillStyle = centerColor
        this.ctx.fill()
      }

      this.ctx.restore()
    })
  }

  private adjustColorWarmth(color: string, warmth: number): string {
    // Simple warmth adjustment - shift towards orange/red
    const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
    if (hslMatch) {
      let hue = parseInt(hslMatch[1])
      const sat = parseInt(hslMatch[2])
      const light = parseInt(hslMatch[3])

      // Shift hue towards warm range (0-60)
      hue = Math.max(0, Math.min(60, hue - (1 - warmth) * 30))

      return `hsl(${hue}, ${Math.min(100, sat + warmth * 20)}%, ${light}%)`
    }
    return color
  }

  private applyPostEffects(params: CozyAbstractParams): void {
    // Apply paper texture
    if (params.paperTexture) {
      this.ctx.globalCompositeOperation = 'multiply'
      this.ctx.globalAlpha = 0.8
      this.ctx.drawImage(this.textureLayer, 0, 0)
      this.ctx.globalAlpha = 1
      this.ctx.globalCompositeOperation = 'source-over'
    }

    // Apply soft blur for coziness
    if (params.softness > 0.5) {
      this.ctx.filter = `blur(${(params.softness - 0.5) * 2}px)`
      this.ctx.drawImage(this.canvas, 0, 0)
      this.ctx.filter = 'none'
    }
  }

  private triggerShapeRipple(): void {
    // Create ripple effect through shapes
    this.shapes.forEach((shape, index) => {
      setTimeout(() => {
        shape.size *= 1.2
        shape.opacity = Math.min(1, shape.opacity * 1.3)
      }, index * 50)
    })
  }

  private triggerWarmthPulse(): void {
    // Increase warmth and glow temporarily
    const params = this.params as CozyAbstractParams
    const originalWarmth = params.warmth
    const originalGlow = params.ambientGlow

    this.updateParams({
      warmth: Math.min(1, originalWarmth * 1.4),
      ambientGlow: Math.min(3, originalGlow * 1.6)
    })

    // Restore after pulse
    setTimeout(() => {
      this.updateParams({
        warmth: originalWarmth,
        ambientGlow: originalGlow
      })
    }, 300)
  }

  public dispose(): void {
    super.dispose()
  }
}