/**
 * Particles Visualization Mode
 * Cozy, fluid-like particle system with soft light effects
 */

import { BaseVisualizer, AudioFeatures, RenderFrame, VisualizationMode, VisualParams } from '../core/types'
import { PaletteGenerator } from '../core/palettes'
import { AudioMapper } from '../core/mapping'
import { SeededRNG } from '../core/rng'

interface ParticlesParams extends VisualParams {
  // Particle system
  particleCount: number
  particleSize: number
  particleLifespan: number
  flowSpeed: number
  turbulence: number

  // Fluid dynamics
  fluidViscosity: number
  flowDirection: number
  swirl: number
  gravity: number

  // Visual effects
  trailLength: number
  glowIntensity: number
  softBlending: boolean
  colorShift: number

  // Audio reactivity
  sizeReactivity: number
  speedReactivity: number
  colorReactivity: number
  emissionReactivity: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  life: number
  maxLife: number
  hue: number
  brightness: number
  opacity: number
  trail: Array<{ x: number; y: number; opacity: number }>
}

export class ParticlesVisualizer extends BaseVisualizer {
  readonly id = 'particles'
  readonly label = 'Fluid Particles'
  readonly mode: VisualizationMode = {
    id: this.id,
    label: this.label,
    description: 'Cozy fluid particle system with soft lighting and organic flow',
    category: 'artistic',
    tags: ['particles', 'fluid', 'cozy', 'organic', 'realtime'],
    previewImage: '/previews/particles.png',
    supportsRealtime: true,
    supportsOffline: true,
    supportsVideo: true,
    supports3D: false,
    defaultParams: {
      palette: {
        id: 'sunset',
        name: 'Sunset Dreams',
        colors: ['#FF6B6B', '#FFE66D', '#FF8E53', '#C44569', '#F8B500'],
        temperature: 'warm',
        mood: 'energetic'
      },
      gradients: {} as any,
      opacity: 0.7,
      brightness: 1.2,
      contrast: 1.0,
      saturation: 1.3,
      motionIntensity: 0.8,
      smoothing: 0.9,
      responsiveness: 0.7,

      // Particles specific
      particleCount: 2000,
      particleSize: 3.0,
      particleLifespan: 5.0,
      flowSpeed: 0.5,
      turbulence: 0.3,
      fluidViscosity: 0.98,
      flowDirection: 0,
      swirl: 0.1,
      gravity: 0.02,
      trailLength: 8,
      glowIntensity: 1.5,
      softBlending: true,
      colorShift: 0.2,
      sizeReactivity: 2.0,
      speedReactivity: 1.5,
      colorReactivity: 1.0,
      emissionReactivity: 1.2
    } as ParticlesParams,
    parameterSchema: [
      {
        key: 'particleCount',
        label: 'Particle Count',
        type: 'range',
        default: 2000,
        min: 500,
        max: 5000,
        step: 100,
        category: 'Particles'
      },
      {
        key: 'flowSpeed',
        label: 'Flow Speed',
        type: 'range',
        default: 0.5,
        min: 0.1,
        max: 2.0,
        step: 0.1,
        category: 'Motion'
      },
      {
        key: 'turbulence',
        label: 'Turbulence',
        type: 'range',
        default: 0.3,
        min: 0,
        max: 1.0,
        step: 0.05,
        category: 'Motion'
      },
      {
        key: 'softBlending',
        label: 'Soft Blending',
        type: 'boolean',
        default: true,
        category: 'Visual'
      }
    ],
    audioMapping: {
      energy: [
        { target: 'flowSpeed', range: [0.2, 1.5], curve: 'exponential', smoothing: 0.8 },
        { target: 'glowIntensity', range: [0.8, 2.5], curve: 'linear', smoothing: 0.7 }
      ],
      brightness: [
        { target: 'brightness', range: [0.8, 1.8], curve: 'linear', smoothing: 0.85 }
      ],
      onset: [
        { trigger: 'particleBurst', threshold: 0.6, cooldown: 0.4 },
        { trigger: 'colorFlash', threshold: 0.8, cooldown: 0.2 }
      ],
      pitch: [
        { target: 'swirl', range: [0, 0.5], freqRange: [200, 2000] }
      ]
    }
  }

  // Particle system
  private particles: Particle[] = []
  private emitters: Array<{ x: number; y: number; strength: number }> = []
  private flowField: Array<Array<{ x: number; y: number; strength: number }>> = []

  // Audio processing
  private audioMapper: AudioMapper
  private paletteGenerator: PaletteGenerator
  private rng: SeededRNG

  // Visual state
  private time = 0
  private audioEnergy = 0
  private audioBrightness = 0
  private lastOnsetTime = 0

  // Canvas buffers for trail effects
  private trailCanvas: HTMLCanvasElement | OffscreenCanvas
  private trailCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

  constructor() {
    super()
    this.rng = new SeededRNG(Date.now())
    this.paletteGenerator = new PaletteGenerator(this.rng.getSeed())
    this.audioMapper = new AudioMapper(this.mode.audioMapping)
  }

  protected async initializeMode(): Promise<void> {
    await this.initializeParticleSystem()
    await this.initializeFlowField()
    await this.setupTrailBuffer()
    await this.setupEmitters()
  }

  private async initializeParticleSystem(): Promise<void> {
    const params = this.params as ParticlesParams
    this.particles = []

    for (let i = 0; i < params.particleCount; i++) {
      this.particles.push(this.createParticle())
    }
  }

  private createParticle(): Particle {
    const params = this.params as ParticlesParams

    return {
      x: this.rng.random() * this.config.width,
      y: this.rng.random() * this.config.height,
      vx: (this.rng.random() - 0.5) * 2 * params.flowSpeed,
      vy: (this.rng.random() - 0.5) * 2 * params.flowSpeed,
      size: this.rng.randomFloat(0.5, 1.5) * params.particleSize,
      life: this.rng.random() * params.particleLifespan,
      maxLife: params.particleLifespan,
      hue: this.rng.random() * 360,
      brightness: this.rng.randomFloat(0.7, 1.0),
      opacity: this.rng.randomFloat(0.3, 0.8),
      trail: []
    }
  }

  private async initializeFlowField(): Promise<void> {
    const resolution = 20
    const cols = Math.ceil(this.config.width / resolution)
    const rows = Math.ceil(this.config.height / resolution)

    this.flowField = []
    for (let x = 0; x < cols; x++) {
      this.flowField[x] = []
      for (let y = 0; y < rows; y++) {
        const angle = this.rng.noise2D(x * 0.1, y * 0.1) * Math.PI * 2
        this.flowField[x][y] = {
          x: Math.cos(angle),
          y: Math.sin(angle),
          strength: this.rng.randomFloat(0.5, 1.0)
        }
      }
    }
  }

  private async setupTrailBuffer(): Promise<void> {
    if (typeof OffscreenCanvas !== 'undefined') {
      this.trailCanvas = new OffscreenCanvas(this.config.width, this.config.height)
    } else {
      this.trailCanvas = document.createElement('canvas')
      this.trailCanvas.width = this.config.width
      this.trailCanvas.height = this.config.height
    }

    const ctx = this.trailCanvas.getContext('2d')
    if (!ctx) {
      throw new Error('Failed to get trail canvas context')
    }
    this.trailCtx = ctx
  }

  private async setupEmitters(): Promise<void> {
    // Create audio-reactive emitters
    this.emitters = [
      { x: this.config.width * 0.2, y: this.config.height * 0.5, strength: 1.0 },
      { x: this.config.width * 0.8, y: this.config.height * 0.5, strength: 1.0 },
      { x: this.config.width * 0.5, y: this.config.height * 0.2, strength: 0.8 },
      { x: this.config.width * 0.5, y: this.config.height * 0.8, strength: 0.8 }
    ]
  }

  public update(features: AudioFeatures): void {
    // Map audio features to visual parameters
    const mappedParams = this.audioMapper.mapFeatures(features, this.params)
    this.updateParams(mappedParams)

    // Store audio values for particle updates
    this.audioEnergy = features.energy
    this.audioBrightness = features.brightness

    // Handle onset events
    if ((mappedParams as any)._onset_particleBurst) {
      this.triggerParticleBurst()
    }
    if ((mappedParams as any)._onset_colorFlash) {
      this.triggerColorFlash()
    }
  }

  public renderFrame(frame: RenderFrame): void {
    this.time += 1 / 60
    const params = this.params as ParticlesParams

    // Update flow field based on audio
    this.updateFlowField(params)

    // Update particles
    this.updateParticles(params)

    // Render trails
    this.renderTrails(params)

    // Render particles
    this.renderParticles(params)

    // Apply post-processing effects
    this.applyPostEffects(params)
  }

  private updateFlowField(params: ParticlesParams): void {
    const time = this.time
    const audioInfluence = this.audioEnergy * params.speedReactivity

    for (let x = 0; x < this.flowField.length; x++) {
      for (let y = 0; y < this.flowField[x].length; y++) {
        // Base flow pattern
        const baseAngle = params.flowDirection +
          Math.sin(x * 0.05 + time * 0.5) * params.swirl +
          Math.cos(y * 0.05 + time * 0.3) * params.swirl

        // Add turbulence
        const turbulentAngle = this.rng.noise2D(
          x * 0.1 + time * 0.2,
          y * 0.1 + time * 0.15
        ) * params.turbulence * Math.PI

        const finalAngle = baseAngle + turbulentAngle

        this.flowField[x][y].x = Math.cos(finalAngle)
        this.flowField[x][y].y = Math.sin(finalAngle)
        this.flowField[x][y].strength = 0.5 + audioInfluence * 0.5
      }
    }
  }

  private updateParticles(params: ParticlesParams): void {
    const resolution = 20

    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i]

      // Age particle
      particle.life += 1 / 60
      if (particle.life > particle.maxLife) {
        // Respawn particle
        this.particles[i] = this.createParticle()
        continue
      }

      // Apply flow field
      const flowX = Math.floor(particle.x / resolution)
      const flowY = Math.floor(particle.y / resolution)

      if (flowX >= 0 && flowX < this.flowField.length &&
          flowY >= 0 && flowY < this.flowField[flowX].length) {

        const flow = this.flowField[flowX][flowY]
        const force = params.flowSpeed * flow.strength

        particle.vx += flow.x * force * 0.1
        particle.vy += flow.y * force * 0.1
      }

      // Apply gravity
      particle.vy += params.gravity

      // Audio reactivity
      const audioScale = 1 + this.audioEnergy * params.speedReactivity
      particle.vx *= audioScale
      particle.vy *= audioScale

      // Apply viscosity (damping)
      particle.vx *= params.fluidViscosity
      particle.vy *= params.fluidViscosity

      // Update position
      particle.x += particle.vx
      particle.y += particle.vy

      // Wrap around screen
      if (particle.x < 0) particle.x = this.config.width
      if (particle.x > this.config.width) particle.x = 0
      if (particle.y < 0) particle.y = this.config.height
      if (particle.y > this.config.height) particle.y = 0

      // Update visual properties
      const lifeRatio = 1 - (particle.life / particle.maxLife)
      particle.opacity = lifeRatio * 0.8
      particle.size = params.particleSize * (0.5 + lifeRatio * 0.5) *
        (1 + this.audioEnergy * params.sizeReactivity)

      // Update color based on audio
      particle.hue += params.colorShift * this.audioBrightness * params.colorReactivity
      particle.brightness = 0.8 + this.audioBrightness * 0.4

      // Update trail
      particle.trail.push({
        x: particle.x,
        y: particle.y,
        opacity: particle.opacity
      })

      if (particle.trail.length > params.trailLength) {
        particle.trail.shift()
      }
    }
  }

  private renderTrails(params: ParticlesParams): void {
    // Fade previous trails
    this.trailCtx.globalCompositeOperation = 'source-over'
    this.trailCtx.fillStyle = `rgba(0, 0, 0, ${0.02})`
    this.trailCtx.fillRect(0, 0, this.config.width, this.config.height)

    // Draw particle trails
    this.trailCtx.globalCompositeOperation = params.softBlending ? 'screen' : 'source-over'

    this.particles.forEach(particle => {
      if (particle.trail.length < 2) return

      this.trailCtx.beginPath()
      this.trailCtx.moveTo(particle.trail[0].x, particle.trail[0].y)

      for (let i = 1; i < particle.trail.length; i++) {
        this.trailCtx.lineTo(particle.trail[i].x, particle.trail[i].y)
      }

      const gradient = this.trailCtx.createLinearGradient(
        particle.trail[0].x, particle.trail[0].y,
        particle.trail[particle.trail.length - 1].x,
        particle.trail[particle.trail.length - 1].y
      )

      const color = this.paletteGenerator.getColorAtPosition(params.palette, particle.hue / 360)
      gradient.addColorStop(0, `hsla(${particle.hue}, 70%, 50%, 0)`)
      gradient.addColorStop(1, `hsla(${particle.hue}, 80%, 60%, ${particle.opacity * 0.3})`)

      this.trailCtx.strokeStyle = gradient
      this.trailCtx.lineWidth = particle.size * 0.5
      this.trailCtx.lineCap = 'round'
      this.trailCtx.stroke()
    })
  }

  private renderParticles(params: ParticlesParams): void {
    // Draw trail buffer to main canvas
    this.ctx.drawImage(this.trailCanvas, 0, 0)

    // Set blend mode for particles
    this.ctx.globalCompositeOperation = params.softBlending ? 'screen' : 'source-over'

    // Draw particles with glow effect
    this.particles.forEach(particle => {
      const color = this.paletteGenerator.getColorAtPosition(params.palette, particle.hue / 360)

      // Create glow effect
      if (params.glowIntensity > 0) {
        const glowSize = particle.size * params.glowIntensity * 3
        const glowGradient = this.ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, glowSize
        )

        glowGradient.addColorStop(0, `hsla(${particle.hue}, 80%, 70%, ${particle.opacity * 0.8})`)
        glowGradient.addColorStop(0.3, `hsla(${particle.hue}, 70%, 60%, ${particle.opacity * 0.4})`)
        glowGradient.addColorStop(1, `hsla(${particle.hue}, 60%, 50%, 0)`)

        this.ctx.fillStyle = glowGradient
        this.ctx.beginPath()
        this.ctx.arc(particle.x, particle.y, glowSize, 0, Math.PI * 2)
        this.ctx.fill()
      }

      // Draw main particle
      const mainGradient = this.ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.size
      )

      mainGradient.addColorStop(0, `hsla(${particle.hue}, 90%, 80%, ${particle.opacity})`)
      mainGradient.addColorStop(0.7, `hsla(${particle.hue}, 80%, 60%, ${particle.opacity * 0.7})`)
      mainGradient.addColorStop(1, `hsla(${particle.hue}, 70%, 40%, 0)`)

      this.ctx.fillStyle = mainGradient
      this.ctx.beginPath()
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      this.ctx.fill()
    })

    this.ctx.globalCompositeOperation = 'source-over'
  }

  private applyPostEffects(params: ParticlesParams): void {
    // Apply subtle blur for softness
    if (params.softBlending) {
      this.ctx.filter = 'blur(0.5px)'
      this.ctx.drawImage(this.canvas, 0, 0)
      this.ctx.filter = 'none'
    }
  }

  private triggerParticleBurst(): void {
    const burstCount = 50
    const centerX = this.config.width / 2
    const centerY = this.config.height / 2

    for (let i = 0; i < burstCount; i++) {
      const angle = (i / burstCount) * Math.PI * 2
      const speed = this.rng.randomFloat(2, 8)
      const particle = this.createParticle()

      particle.x = centerX
      particle.y = centerY
      particle.vx = Math.cos(angle) * speed
      particle.vy = Math.sin(angle) * speed
      particle.size *= 1.5
      particle.brightness = 1.2

      // Replace a random existing particle
      const replaceIndex = this.rng.randomInt(0, this.particles.length - 1)
      this.particles[replaceIndex] = particle
    }
  }

  private triggerColorFlash(): void {
    // Temporarily boost all particle colors
    this.particles.forEach(particle => {
      particle.brightness = Math.min(1.5, particle.brightness * 1.3)
      particle.hue = (particle.hue + this.rng.randomFloat(-30, 30)) % 360
    })
  }

  public dispose(): void {
    super.dispose()
  }
}