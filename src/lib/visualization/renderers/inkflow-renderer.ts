import type { InkFlowConfig, Particle, Vector2, Color, ParticleSystem } from '../types'
import type { VisualizationData } from '../../audio/types'
import { BaseVisualizationRenderer } from '../base-renderer'
import { MathUtils, ColorUtils, CanvasUtils } from '../utils'

interface InkDrop {
  position: Vector2
  velocity: Vector2
  size: number
  color: Color
  age: number
  maxAge: number
  intensity: number
  flowField: Vector2[]
}

interface FlowField {
  width: number
  height: number
  resolution: number
  vectors: Vector2[]
  noiseOffset: number
}

export class InkFlowRenderer extends BaseVisualizationRenderer {
  private inkFlowConfig: InkFlowConfig = {
    style: 'inkflow',
    width: 800,
    height: 800,
    backgroundColor: '#000000',
    primaryColor: '#00F5FF',
    secondaryColor: '#9D4EDD',
    accentColor: '#FF6EC7',
    sensitivity: 1,
    smoothing: 0.8,
    scale: 1,
    viscosity: 0.8,
    dispersion: 1.2,
    fadeRate: 0.95,
    particleCount: 200,
    flowSpeed: 1,
    turbulence: 0.5
  }

  private particleSystem: ParticleSystem = {
    particles: [],
    maxParticles: 200,
    emissionRate: 5,
    gravity: { x: 0, y: 0 },
    wind: { x: 0, y: 0 }
  }

  private inkDrops: InkDrop[] = []
  private flowField: FlowField = {
    width: 0,
    height: 0,
    resolution: 20,
    vectors: [],
    noiseOffset: 0
  }

  private trailCanvas: HTMLCanvasElement | null = null
  private trailCtx: CanvasRenderingContext2D | null = null
  private colorPalette: Color[] = []
  private time: number = 0

  constructor(config?: Partial<InkFlowConfig>) {
    super(config)
    if (config) {
      this.inkFlowConfig = { ...this.inkFlowConfig, ...config }
    }
  }

  protected onInitialize(): void {
    this.initializeTrailCanvas()
    this.initializeFlowField()
    this.initializeColorPalette()
    this.initializeParticleSystem()
  }

  protected onRender(audioData: VisualizationData, deltaTime: number): void {
    this.time += deltaTime * 0.001

    // Update flow field based on audio data
    this.updateFlowField(audioData)

    // Update particle system
    this.updateParticleSystem(audioData, deltaTime)

    // Update ink drops
    this.updateInkDrops(audioData, deltaTime)

    // Render everything
    this.renderInkFlow(audioData)
  }

  protected onResize(width: number, height: number): void {
    this.inkFlowConfig.width = width
    this.inkFlowConfig.height = height
    this.initializeTrailCanvas()
    this.initializeFlowField()
  }

  protected onConfigUpdate(config: Partial<InkFlowConfig>): void {
    this.inkFlowConfig = { ...this.inkFlowConfig, ...config }
    this.initializeColorPalette()
    this.initializeParticleSystem()
  }

  protected onDispose(): void {
    this.particleSystem.particles = []
    this.inkDrops = []
    this.trailCanvas = null
    this.trailCtx = null
  }

  private initializeTrailCanvas(): void {
    this.trailCanvas = document.createElement('canvas')
    this.trailCanvas.width = this.inkFlowConfig.width
    this.trailCanvas.height = this.inkFlowConfig.height
    this.trailCtx = this.trailCanvas.getContext('2d')!

    // Set initial background
    this.trailCtx.fillStyle = this.inkFlowConfig.backgroundColor
    this.trailCtx.fillRect(0, 0, this.inkFlowConfig.width, this.inkFlowConfig.height)
  }

  private initializeFlowField(): void {
    const cols = Math.ceil(this.inkFlowConfig.width / this.flowField.resolution)
    const rows = Math.ceil(this.inkFlowConfig.height / this.flowField.resolution)

    this.flowField.width = cols
    this.flowField.height = rows
    this.flowField.vectors = new Array(cols * rows).fill(null).map(() => ({ x: 0, y: 0 }))
  }

  private initializeColorPalette(): void {
    const primary = ColorUtils.parseColor(this.inkFlowConfig.primaryColor)
    const secondary = ColorUtils.parseColor(this.inkFlowConfig.secondaryColor)
    const accent = ColorUtils.parseColor(this.inkFlowConfig.accentColor)

    this.colorPalette = [
      primary,
      secondary,
      accent,
      ColorUtils.lerp(primary, secondary, 0.3),
      ColorUtils.lerp(primary, secondary, 0.7),
      ColorUtils.lerp(secondary, accent, 0.3),
      ColorUtils.lerp(secondary, accent, 0.7),
      ColorUtils.lerp(accent, primary, 0.5)
    ]
  }

  private initializeParticleSystem(): void {
    this.particleSystem.maxParticles = this.inkFlowConfig.particleCount
    this.particleSystem.particles = []

    // Initialize particles at random positions
    for (let i = 0; i < Math.floor(this.particleSystem.maxParticles * 0.3); i++) {
      this.createParticle()
    }
  }

  private updateFlowField(audioData: VisualizationData): void {
    const frequencyData = audioData.frequencyData
    const bassEnergy = audioData.bassEnergy
    const midEnergy = audioData.midEnergy
    const trebleEnergy = audioData.trebleEnergy

    // Update noise offset for animation
    this.flowField.noiseOffset += 0.01

    for (let y = 0; y < this.flowField.height; y++) {
      for (let x = 0; x < this.flowField.width; x++) {
        const index = x + y * this.flowField.width

        // Base flow using Perlin noise-like calculation
        const noiseX = (x * 0.01) + this.flowField.noiseOffset
        const noiseY = (y * 0.01) + this.flowField.noiseOffset

        let angle = (Math.sin(noiseX) + Math.cos(noiseY)) * Math.PI

        // Modify flow based on audio data
        const frequencyIndex = Math.floor((index / this.flowField.vectors.length) * frequencyData.length)
        const frequencyValue = frequencyData[frequencyIndex] || 0

        // Apply audio influence
        angle += frequencyValue * this.inkFlowConfig.turbulence * Math.PI
        angle += bassEnergy * 0.5
        angle += Math.sin(this.time + x * 0.1) * midEnergy * 0.3
        angle += Math.cos(this.time + y * 0.1) * trebleEnergy * 0.2

        const magnitude = (0.5 + frequencyValue * 0.5) * this.inkFlowConfig.sensitivity

        this.flowField.vectors[index] = {
          x: Math.cos(angle) * magnitude,
          y: Math.sin(angle) * magnitude
        }
      }
    }
  }

  private updateParticleSystem(audioData: VisualizationData, deltaTime: number): void {
    // Emit new particles based on audio energy
    const emissionRate = this.particleSystem.emissionRate * (1 + audioData.volume * 2)
    const deltaSeconds = deltaTime * 0.001

    for (let i = 0; i < emissionRate * deltaSeconds; i++) {
      if (this.particleSystem.particles.length < this.particleSystem.maxParticles) {
        this.createParticle(audioData)
      }
    }

    // Update existing particles
    this.particleSystem.particles = this.particleSystem.particles.filter(particle => {
      this.updateParticle(particle, deltaTime)
      return particle.life > 0
    })
  }

  private createParticle(audioData?: VisualizationData): void {
    const centerX = this.renderingContext.centerX
    const centerY = this.renderingContext.centerY

    // Create particles near center with some spread
    const spread = 100 + (audioData?.volume || 0) * 200
    const angle = Math.random() * Math.PI * 2
    const distance = Math.random() * spread

    const particle: Particle = {
      position: {
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance
      },
      velocity: {
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2
      },
      acceleration: { x: 0, y: 0 },
      life: 1,
      maxLife: 3000 + Math.random() * 2000, // 3-5 seconds
      size: 2 + Math.random() * 4,
      color: this.colorPalette[Math.floor(Math.random() * this.colorPalette.length)],
      alpha: 0.8 + Math.random() * 0.2,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02
    }

    this.particleSystem.particles.push(particle)
  }

  private updateParticle(particle: Particle, deltaTime: number): void {
    const deltaSeconds = deltaTime * 0.001

    // Get flow field influence
    const flowInfluence = this.getFlowFieldInfluence(particle.position)

    // Apply flow field
    particle.acceleration.x = flowInfluence.x * this.inkFlowConfig.flowSpeed
    particle.acceleration.y = flowInfluence.y * this.inkFlowConfig.flowSpeed

    // Apply viscosity (drag)
    particle.velocity.x *= this.inkFlowConfig.viscosity
    particle.velocity.y *= this.inkFlowConfig.viscosity

    // Update physics
    particle.velocity.x += particle.acceleration.x * deltaSeconds
    particle.velocity.y += particle.acceleration.y * deltaSeconds

    particle.position.x += particle.velocity.x * deltaSeconds * 60 // Scale for 60fps
    particle.position.y += particle.velocity.y * deltaSeconds * 60

    // Update life
    particle.life -= deltaSeconds / (particle.maxLife * 0.001)
    particle.alpha = particle.life * 0.8

    // Update rotation
    particle.rotation += particle.rotationSpeed * deltaSeconds * 60

    // Wrap around screen edges with dispersion
    if (particle.position.x > this.renderingContext.width + 50) {
      particle.position.x = -50
      this.applyDispersion(particle)
    } else if (particle.position.x < -50) {
      particle.position.x = this.renderingContext.width + 50
      this.applyDispersion(particle)
    }

    if (particle.position.y > this.renderingContext.height + 50) {
      particle.position.y = -50
      this.applyDispersion(particle)
    } else if (particle.position.y < -50) {
      particle.position.y = this.renderingContext.height + 50
      this.applyDispersion(particle)
    }
  }

  private getFlowFieldInfluence(position: Vector2): Vector2 {
    const x = Math.floor(position.x / this.flowField.resolution)
    const y = Math.floor(position.y / this.flowField.resolution)

    if (x >= 0 && x < this.flowField.width && y >= 0 && y < this.flowField.height) {
      const index = x + y * this.flowField.width
      return this.flowField.vectors[index] || { x: 0, y: 0 }
    }

    return { x: 0, y: 0 }
  }

  private applyDispersion(particle: Particle): void {
    const dispersionForce = this.inkFlowConfig.dispersion
    particle.velocity.x += (Math.random() - 0.5) * dispersionForce * 2
    particle.velocity.y += (Math.random() - 0.5) * dispersionForce * 2
  }

  private updateInkDrops(audioData: VisualizationData, deltaTime: number): void {
    // Create new ink drops based on audio peaks
    if (audioData.volume > 0.3 && Math.random() < 0.1) {
      this.createInkDrop(audioData)
    }

    // Update existing ink drops
    this.inkDrops = this.inkDrops.filter(drop => {
      this.updateInkDrop(drop, deltaTime)
      return drop.age < drop.maxAge
    })
  }

  private createInkDrop(audioData: VisualizationData): void {
    const drop: InkDrop = {
      position: {
        x: Math.random() * this.renderingContext.width,
        y: Math.random() * this.renderingContext.height
      },
      velocity: { x: 0, y: 0 },
      size: 10 + audioData.volume * 30,
      color: this.colorPalette[Math.floor(Math.random() * this.colorPalette.length)],
      age: 0,
      maxAge: 2000 + Math.random() * 3000,
      intensity: 0.5 + audioData.volume * 0.5,
      flowField: []
    }

    this.inkDrops.push(drop)
  }

  private updateInkDrop(drop: InkDrop, deltaTime: number): void {
    drop.age += deltaTime

    // Expand size over time
    drop.size += 0.1
    drop.intensity *= 0.999 // Fade over time
  }

  private renderInkFlow(audioData: VisualizationData): void {
    if (!this.ctx || !this.trailCtx) return

    // Apply fade to trail canvas
    this.applyTrailFade()

    // Draw particles to trail canvas
    this.drawParticlesToTrail()

    // Draw ink drops to trail canvas
    this.drawInkDropsToTrail()

    // Draw trail canvas to main canvas
    this.ctx.drawImage(this.trailCanvas!, 0, 0)

    // Draw real-time elements on main canvas
    this.drawFlowFieldVisualization(audioData)
    this.drawActiveParticles()
  }

  private applyTrailFade(): void {
    if (!this.trailCtx) return

    this.trailCtx.globalCompositeOperation = 'destination-out'
    this.trailCtx.fillStyle = `rgba(0, 0, 0, ${1 - this.inkFlowConfig.fadeRate})`
    this.trailCtx.fillRect(0, 0, this.inkFlowConfig.width, this.inkFlowConfig.height)
    this.trailCtx.globalCompositeOperation = 'source-over'
  }

  private drawParticlesToTrail(): void {
    if (!this.trailCtx) return

    this.trailCtx.globalCompositeOperation = 'lighter'

    this.particleSystem.particles.forEach(particle => {
      const color = ColorUtils.adjustAlpha(particle.color, particle.alpha * 0.6)
      const colorString = ColorUtils.colorToString(color)

      // Draw particle trail
      this.trailCtx!.fillStyle = colorString
      this.trailCtx!.beginPath()
      this.trailCtx!.arc(particle.position.x, particle.position.y, particle.size * 0.5, 0, Math.PI * 2)
      this.trailCtx!.fill()

      // Draw particle with glow
      const glowSize = particle.size * 2
      const gradient = this.trailCtx!.createRadialGradient(
        particle.position.x, particle.position.y, 0,
        particle.position.x, particle.position.y, glowSize
      )
      gradient.addColorStop(0, colorString)
      gradient.addColorStop(1, 'transparent')

      this.trailCtx!.fillStyle = gradient
      this.trailCtx!.beginPath()
      this.trailCtx!.arc(particle.position.x, particle.position.y, glowSize, 0, Math.PI * 2)
      this.trailCtx!.fill()
    })

    this.trailCtx.globalCompositeOperation = 'source-over'
  }

  private drawInkDropsToTrail(): void {
    if (!this.trailCtx) return

    this.trailCtx.globalCompositeOperation = 'multiply'

    this.inkDrops.forEach(drop => {
      const alpha = (1 - drop.age / drop.maxAge) * drop.intensity
      const color = ColorUtils.adjustAlpha(drop.color, alpha)

      // Create ink splatter effect
      const gradient = this.trailCtx!.createRadialGradient(
        drop.position.x, drop.position.y, 0,
        drop.position.x, drop.position.y, drop.size
      )

      gradient.addColorStop(0, ColorUtils.colorToString(color))
      gradient.addColorStop(0.7, ColorUtils.colorToString(ColorUtils.adjustAlpha(color, alpha * 0.5)))
      gradient.addColorStop(1, 'transparent')

      this.trailCtx!.fillStyle = gradient
      this.trailCtx!.beginPath()
      this.trailCtx!.arc(drop.position.x, drop.position.y, drop.size, 0, Math.PI * 2)
      this.trailCtx!.fill()

      // Add organic splatter shapes
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2
        const distance = drop.size * 0.5 + Math.random() * drop.size * 0.3
        const splatterX = drop.position.x + Math.cos(angle) * distance
        const splatterY = drop.position.y + Math.sin(angle) * distance
        const splatterSize = drop.size * 0.2 * Math.random()

        this.trailCtx!.fillStyle = ColorUtils.colorToString(ColorUtils.adjustAlpha(color, alpha * 0.3))
        this.trailCtx!.beginPath()
        this.trailCtx!.arc(splatterX, splatterY, splatterSize, 0, Math.PI * 2)
        this.trailCtx!.fill()
      }
    })

    this.trailCtx.globalCompositeOperation = 'source-over'
  }

  private drawFlowFieldVisualization(audioData: VisualizationData): void {
    if (!this.ctx || audioData.volume < 0.1) return

    this.ctx.strokeStyle = `rgba(255, 255, 255, ${audioData.volume * 0.1})`
    this.ctx.lineWidth = 1

    const step = this.flowField.resolution * 2

    for (let y = 0; y < this.renderingContext.height; y += step) {
      for (let x = 0; x < this.renderingContext.width; x += step) {
        const fieldX = Math.floor(x / this.flowField.resolution)
        const fieldY = Math.floor(y / this.flowField.resolution)

        if (fieldX < this.flowField.width && fieldY < this.flowField.height) {
          const index = fieldX + fieldY * this.flowField.width
          const vector = this.flowField.vectors[index]

          if (vector) {
            const endX = x + vector.x * 20
            const endY = y + vector.y * 20

            this.ctx.beginPath()
            this.ctx.moveTo(x, y)
            this.ctx.lineTo(endX, endY)
            this.ctx.stroke()
          }
        }
      }
    }
  }

  private drawActiveParticles(): void {
    if (!this.ctx) return

    this.ctx.globalCompositeOperation = 'lighter'

    this.particleSystem.particles.forEach(particle => {
      if (particle.life > 0.8) { // Only draw very fresh particles actively
        const color = ColorUtils.adjustAlpha(particle.color, particle.alpha)
        CanvasUtils.drawCircle(
          this.ctx!,
          particle.position.x,
          particle.position.y,
          particle.size,
          ColorUtils.colorToString(color)
        )
      }
    })

    this.ctx.globalCompositeOperation = 'source-over'
  }
}