import type { MandalaConfig, Vector2, Color } from '../types'
import type { VisualizationData } from '../../audio/types'
import { BaseVisualizationRenderer } from '../base-renderer'
import { MathUtils, ColorUtils, CanvasUtils } from '../utils'

interface MandalaLayer {
  radius: number
  amplitude: number
  frequency: number
  phase: number
  color: Color
  points: Vector2[]
}

export class MandalaRenderer extends BaseVisualizationRenderer {
  private mandalaConfig: MandalaConfig = {
    style: 'mandala',
    width: 800,
    height: 800,
    backgroundColor: '#000000',
    primaryColor: '#00F5FF',
    secondaryColor: '#9D4EDD',
    accentColor: '#FF6EC7',
    sensitivity: 1,
    smoothing: 0.8,
    scale: 1,
    symmetry: 8,
    radiusMultiplier: 1.5,
    rotationSpeed: 0.02,
    petals: 12,
    innerRadius: 50,
    outerRadius: 300
  }

  private layers: MandalaLayer[] = []
  private rotationAngle: number = 0
  private smoothedFrequencyData: number[] = []
  private colorPalette: Color[] = []

  constructor(config?: Partial<MandalaConfig>) {
    super(config)
    if (config) {
      this.mandalaConfig = { ...this.mandalaConfig, ...config }
    }
  }

  protected onInitialize(): void {
    this.initializeLayers()
    this.initializeColorPalette()
  }

  protected onRender(audioData: VisualizationData, deltaTime: number): void {
    // Smooth frequency data
    this.updateSmoothedData(audioData.frequencyData)

    // Update rotation
    this.rotationAngle += this.mandalaConfig.rotationSpeed * deltaTime * 0.001

    // Update layers based on audio data
    this.updateLayers(audioData)

    // Render mandala
    this.drawMandala(audioData)
  }

  protected onResize(width: number, height: number): void {
    this.mandalaConfig.width = width
    this.mandalaConfig.height = height
    this.updateLayerRadii()
  }

  protected onConfigUpdate(config: Partial<MandalaConfig>): void {
    this.mandalaConfig = { ...this.mandalaConfig, ...config }
    this.initializeLayers()
    this.initializeColorPalette()
  }

  protected onDispose(): void {
    this.layers = []
    this.smoothedFrequencyData = []
    this.colorPalette = []
  }

  private initializeLayers(): void {
    this.layers = []
    const numLayers = 5
    const radiusStep = (this.mandalaConfig.outerRadius - this.mandalaConfig.innerRadius) / numLayers

    for (let i = 0; i < numLayers; i++) {
      const layer: MandalaLayer = {
        radius: this.mandalaConfig.innerRadius + (radiusStep * i),
        amplitude: 0,
        frequency: 1 + i * 0.5,
        phase: (i * Math.PI) / numLayers,
        color: this.getLayerColor(i, numLayers),
        points: []
      }
      this.layers.push(layer)
    }
  }

  private initializeColorPalette(): void {
    const primary = ColorUtils.parseColor(this.mandalaConfig.primaryColor)
    const secondary = ColorUtils.parseColor(this.mandalaConfig.secondaryColor)
    const accent = ColorUtils.parseColor(this.mandalaConfig.accentColor)

    this.colorPalette = [
      primary,
      secondary,
      accent,
      ColorUtils.lerp(primary, secondary, 0.5),
      ColorUtils.lerp(secondary, accent, 0.5),
      ColorUtils.lerp(accent, primary, 0.5)
    ]
  }

  private getLayerColor(layerIndex: number, totalLayers: number): Color {
    const colorIndex = layerIndex % this.colorPalette.length
    return this.colorPalette[colorIndex]
  }

  private updateSmoothedData(frequencyData: number[]): void {
    if (this.smoothedFrequencyData.length !== frequencyData.length) {
      this.smoothedFrequencyData = [...frequencyData]
      return
    }

    const smoothing = this.mandalaConfig.smoothing
    for (let i = 0; i < frequencyData.length; i++) {
      this.smoothedFrequencyData[i] =
        this.smoothedFrequencyData[i] * smoothing +
        frequencyData[i] * (1 - smoothing)
    }
  }

  private updateLayers(audioData: VisualizationData): void {
    const dataLength = this.smoothedFrequencyData.length
    const layerStep = Math.floor(dataLength / this.layers.length)

    this.layers.forEach((layer, index) => {
      const startIndex = index * layerStep
      const endIndex = Math.min(startIndex + layerStep, dataLength)

      // Calculate average amplitude for this layer's frequency range
      let amplitude = 0
      for (let i = startIndex; i < endIndex; i++) {
        amplitude += this.smoothedFrequencyData[i]
      }
      amplitude /= (endIndex - startIndex)

      // Apply sensitivity and scale
      layer.amplitude = amplitude * this.mandalaConfig.sensitivity * this.mandalaConfig.scale

      // Update layer points
      this.updateLayerPoints(layer, audioData)
    })
  }

  private updateLayerPoints(layer: MandalaLayer, audioData: VisualizationData): void {
    const points: Vector2[] = []
    const angleStep = (Math.PI * 2) / this.mandalaConfig.symmetry
    const petalStep = (Math.PI * 2) / this.mandalaConfig.petals

    for (let i = 0; i < this.mandalaConfig.symmetry; i++) {
      const baseAngle = angleStep * i + this.rotationAngle + layer.phase

      for (let j = 0; j < this.mandalaConfig.petals; j++) {
        const petalAngle = baseAngle + (petalStep * j)

        // Calculate radius with audio influence
        const baseRadius = layer.radius * this.mandalaConfig.radiusMultiplier
        const audioInfluence = layer.amplitude * 100
        const radiusVariation = Math.sin(petalAngle * layer.frequency + this.renderingContext.time * 0.001) * audioInfluence
        const finalRadius = baseRadius + radiusVariation

        // Calculate position
        const x = this.renderingContext.centerX + Math.cos(petalAngle) * finalRadius
        const y = this.renderingContext.centerY + Math.sin(petalAngle) * finalRadius

        points.push({ x, y })
      }
    }

    layer.points = points
  }

  private drawMandala(audioData: VisualizationData): void {
    if (!this.ctx) return

    // Save context
    this.ctx.save()

    // Set blend mode for glow effect
    this.ctx.globalCompositeOperation = 'lighter'

    // Draw each layer
    this.layers.forEach((layer, index) => {
      this.drawLayer(layer, index, audioData)
    })

    // Draw center core
    this.drawCenter(audioData)

    // Restore context
    this.ctx.restore()
  }

  private drawLayer(layer: MandalaLayer, layerIndex: number, audioData: VisualizationData): void {
    if (!this.ctx || layer.points.length === 0) return

    // Calculate opacity based on audio energy
    const opacity = MathUtils.clamp(layer.amplitude + 0.3, 0.1, 1)
    const color = ColorUtils.adjustAlpha(layer.color, opacity)

    // Draw connecting lines
    this.drawLayerConnections(layer, color)

    // Draw layer points
    this.drawLayerPoints(layer, color, audioData)

    // Draw petals
    this.drawLayerPetals(layer, color)
  }

  private drawLayerConnections(layer: MandalaLayer, color: Color): void {
    if (!this.ctx || layer.points.length < 3) return

    this.ctx.strokeStyle = ColorUtils.colorToString(ColorUtils.adjustAlpha(color, 0.3))
    this.ctx.lineWidth = 1

    // Connect points in symmetrical patterns
    const pointsPerSymmetry = this.mandalaConfig.petals

    for (let s = 0; s < this.mandalaConfig.symmetry; s++) {
      const startIndex = s * pointsPerSymmetry

      this.ctx.beginPath()
      this.ctx.moveTo(layer.points[startIndex].x, layer.points[startIndex].y)

      for (let i = 1; i < pointsPerSymmetry; i++) {
        const point = layer.points[startIndex + i]
        this.ctx.lineTo(point.x, point.y)
      }

      this.ctx.closePath()
      this.ctx.stroke()
    }
  }

  private drawLayerPoints(layer: MandalaLayer, color: Color, audioData: VisualizationData): void {
    if (!this.ctx) return

    const pointSize = 2 + layer.amplitude * 5

    layer.points.forEach((point, index) => {
      // Vary point size based on audio data
      const frequencyIndex = Math.floor((index / layer.points.length) * audioData.frequencyData.length)
      const frequencyValue = audioData.frequencyData[frequencyIndex] || 0
      const dynamicSize = pointSize * (0.5 + frequencyValue * 0.5)

      // Draw glow effect
      CanvasUtils.drawGlowEffect(
        this.ctx!,
        point.x,
        point.y,
        dynamicSize,
        ColorUtils.colorToString(color),
        layer.amplitude
      )

      // Draw core point
      CanvasUtils.drawCircle(
        this.ctx!,
        point.x,
        point.y,
        dynamicSize * 0.5,
        ColorUtils.colorToString(color)
      )
    })
  }

  private drawLayerPetals(layer: MandalaLayer, color: Color): void {
    if (!this.ctx || layer.points.length === 0) return

    const pointsPerSymmetry = this.mandalaConfig.petals

    for (let s = 0; s < this.mandalaConfig.symmetry; s++) {
      const startIndex = s * pointsPerSymmetry

      for (let i = 0; i < pointsPerSymmetry - 1; i++) {
        const currentPoint = layer.points[startIndex + i]
        const nextPoint = layer.points[startIndex + ((i + 1) % pointsPerSymmetry)]
        const centerX = this.renderingContext.centerX
        const centerY = this.renderingContext.centerY

        // Create petal shape
        this.ctx.strokeStyle = ColorUtils.colorToString(ColorUtils.adjustAlpha(color, 0.6))
        this.ctx.lineWidth = 1 + layer.amplitude * 2

        this.ctx.beginPath()
        this.ctx.moveTo(centerX, centerY)

        // Use quadratic curves for smooth petal shapes
        const controlX = (currentPoint.x + nextPoint.x) / 2
        const controlY = (currentPoint.y + nextPoint.y) / 2

        this.ctx.quadraticCurveTo(controlX, controlY, currentPoint.x, currentPoint.y)
        this.ctx.quadraticCurveTo(controlX, controlY, nextPoint.x, nextPoint.y)
        this.ctx.lineTo(centerX, centerY)

        this.ctx.stroke()
      }
    }
  }

  private drawCenter(audioData: VisualizationData): void {
    if (!this.ctx) return

    const centerX = this.renderingContext.centerX
    const centerY = this.renderingContext.centerY

    // Calculate center size based on overall volume
    const baseSize = 20
    const volumeInfluence = audioData.volume * 30
    const centerRadius = baseSize + volumeInfluence

    // Create center gradient
    const gradient = this.ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, centerRadius
    )

    gradient.addColorStop(0, this.mandalaConfig.primaryColor)
    gradient.addColorStop(0.5, this.mandalaConfig.secondaryColor)
    gradient.addColorStop(1, 'transparent')

    // Draw center core
    CanvasUtils.drawCircle(this.ctx, centerX, centerY, centerRadius, gradient)

    // Draw center glow
    CanvasUtils.drawGlowEffect(
      this.ctx,
      centerX,
      centerY,
      centerRadius * 1.5,
      this.mandalaConfig.accentColor,
      audioData.volume
    )
  }

  private updateLayerRadii(): void {
    const minDimension = Math.min(this.mandalaConfig.width, this.mandalaConfig.height)
    const maxRadius = (minDimension * 0.4) * this.mandalaConfig.scale
    const minRadius = maxRadius * 0.2

    const radiusStep = (maxRadius - minRadius) / this.layers.length

    this.layers.forEach((layer, index) => {
      layer.radius = minRadius + (radiusStep * index)
    })

    this.mandalaConfig.innerRadius = minRadius
    this.mandalaConfig.outerRadius = maxRadius
  }
}