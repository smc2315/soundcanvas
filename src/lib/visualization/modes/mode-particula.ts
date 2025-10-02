/**
 * Particula Visualization Mode
 * Advanced particle-based music visualization with physics simulation
 * Particles react to audio with complex behaviors and emergent patterns
 */

import { BaseVisualizer, AudioFeatures, RenderFrame, VisualizationMode, VisualParams } from '../core/types'
import { PaletteGenerator } from '../core/palettes'
import { AudioMapper } from '../core/mapping'
import { SeededRNG } from '../core/rng'

interface ParticulaParams extends VisualParams {
  // Particle system
  particleCount: number
  particleSize: number
  particleLifetime: number
  emissionRate: number

  // Physics
  gravity: number
  damping: number
  attractorStrength: number
  repulsionForce: number
  turbulence: number

  // Audio interaction
  bassResponse: number
  midResponse: number
  trebleResponse: number
  onsetSensitivity: number

  // Visual effects
  trailLength: number
  glowIntensity: number
  particleBlending: 'normal' | 'additive' | 'multiply' | 'screen'
  colorMode: 'frequency' | 'velocity' | 'age' | 'energy' | 'rainbow'

  // Behavior modes
  behaviorMode: 'swarm' | 'flow' | 'explosion' | 'orbit' | 'chaos'
  flockingStrength: number
  fieldStrength: number
  noiseScale: number

  // Advanced features
  particleConnections: boolean
  connectionDistance: number
  morphing: boolean
  morphingSpeed: number
  quantumEffects: boolean
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  age: number
  lifetime: number
  size: number
  mass: number
  energy: number
  frequency: number
  hue: number
  alpha: number
  trail: Array<{ x: number, y: number, alpha: number }>
}

interface Attractor {
  x: number
  y: number
  strength: number
  frequency: number
  active: boolean
}

export class ParticulaVisualizer extends BaseVisualizer {
  readonly id = 'particula'
  readonly label = 'Particula'
  readonly mode: VisualizationMode = {
    id: this.id,
    label: this.label,
    description: 'Advanced particle-based music visualization with physics simulation and emergent behaviors',
    category: 'experimental',
    tags: ['particles', 'physics', 'emergent', 'swarm', 'realtime'],
    previewImage: '/previews/particula.png',
    supportsRealtime: true,
    supportsOffline: true,
    supportsVideo: true,
    supports3D: false,
    defaultParams: {
      palette: {
        id: 'quantum',
        name: 'Quantum Glow',
        colors: ['#FF006E', '#FB5607', '#FFBE0B', '#8338EC', '#3A86FF', '#06FFA5'],
        temperature: 'cool',
        mood: 'energetic'
      },
      gradients: {} as any,
      opacity: 0.8,
      brightness: 1.3,
      contrast: 1.1,
      saturation: 1.2,
      motionIntensity: 1.0,
      smoothing: 0.8,
      responsiveness: 0.9,

      // Particula specific
      particleCount: 2000,
      particleSize: 2,
      particleLifetime: 300,
      emissionRate: 50,
      gravity: 0.1,
      damping: 0.98,
      attractorStrength: 100,
      repulsionForce: 50,
      turbulence: 0.5,
      bassResponse: 2.0,
      midResponse: 1.5,
      trebleResponse: 1.0,
      onsetSensitivity: 0.8,
      trailLength: 10,
      glowIntensity: 1.5,
      particleBlending: 'additive' as const,
      colorMode: 'frequency' as const,
      behaviorMode: 'swarm' as const,
      flockingStrength: 0.3,
      fieldStrength: 1.0,
      noiseScale: 0.01,
      particleConnections: true,
      connectionDistance: 80,
      morphing: false,
      morphingSpeed: 0.02,
      quantumEffects: true
    } as ParticulaParams,
    parameterSchema: [
      {
        key: 'particleCount',
        label: 'Particle Count',
        type: 'range',
        default: 2000,
        min: 500,
        max: 5000,
        step: 100,
        category: 'System'
      },
      {
        key: 'behaviorMode',
        label: 'Behavior Mode',
        type: 'select',
        default: 'swarm',
        options: [
          { value: 'swarm', label: 'Swarm' },
          { value: 'flow', label: 'Flow Field' },
          { value: 'explosion', label: 'Explosion' },
          { value: 'orbit', label: 'Orbital' },
          { value: 'chaos', label: 'Chaos' }
        ],
        category: 'Behavior'
      },
      {
        key: 'colorMode',
        label: 'Color Mode',
        type: 'select',
        default: 'frequency',
        options: [
          { value: 'frequency', label: 'Frequency' },
          { value: 'velocity', label: 'Velocity' },
          { value: 'age', label: 'Age' },
          { value: 'energy', label: 'Energy' },
          { value: 'rainbow', label: 'Rainbow' }
        ],
        category: 'Visual'
      },
      {
        key: 'particleConnections',
        label: 'Particle Connections',
        type: 'boolean',
        default: true,
        category: 'Visual'
      },
      {
        key: 'quantumEffects',
        label: 'Quantum Effects',
        type: 'boolean',
        default: true,
        category: 'Effects'
      }
    ],
    audioMapping: {
      energy: [
        { target: 'emissionRate', range: [20, 200], curve: 'exponential', smoothing: 0.7 },
        { target: 'attractorStrength', range: [50, 500], curve: 'linear', smoothing: 0.8 }
      ],
      brightness: [
        { target: 'glowIntensity', range: [0.5, 3.0], curve: 'linear', smoothing: 0.85 }
      ],
      onset: [
        { trigger: 'particleBurst', threshold: 0.6, cooldown: 0.2 },
        { trigger: 'attractorPulse', threshold: 0.8, cooldown: 0.5 }
      ],
      pitch: [
        { target: 'turbulence', range: [0.1, 2.0], freqRange: [60, 1000] }
      ]
    }
  }

  // Audio processing
  private audioMapper: AudioMapper
  private paletteGenerator: PaletteGenerator
  private rng: SeededRNG

  // Particle system
  private particles: Particle[] = []
  private attractors: Attractor[] = []
  private flowField: Float32Array[] = []

  // Audio analysis
  private frequencyBands: Float32Array = new Float32Array(64)
  private smoothedBands: Float32Array = new Float32Array(64)
  private bassEnergy = 0
  private midEnergy = 0
  private trebleEnergy = 0
  private lastOnsetTime = 0

  // Visual state
  private time = 0
  private centerX = 0
  private centerY = 0

  // Performance optimization
  private frameSkip = 0
  private connectionLines: Array<{ x1: number, y1: number, x2: number, y2: number, alpha: number }> = []

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

    await this.initializeParticleSystem()
    await this.initializeFlowField()
    await this.initializeAttractors()
  }

  private async initializeParticleSystem(): Promise<void> {
    const params = this.params as ParticulaParams

    // Create initial particles
    for (let i = 0; i < params.particleCount; i++) {
      this.particles.push(this.createParticle())
    }
  }

  private async initializeFlowField(): Promise<void> {
    const resolution = 32
    this.flowField = []

    for (let y = 0; y < resolution; y++) {
      this.flowField[y] = new Float32Array(resolution * 2) // x, y components
    }
  }

  private async initializeAttractors(): Promise<void> {
    // Create default attractors
    this.attractors = [
      {
        x: this.centerX,
        y: this.centerY,
        strength: 100,
        frequency: 0,
        active: true
      },
      {
        x: this.centerX * 0.5,
        y: this.centerY * 0.5,
        strength: 50,
        frequency: 0,
        active: false
      },
      {
        x: this.centerX * 1.5,
        y: this.centerY * 1.5,
        strength: 50,
        frequency: 0,
        active: false
      }
    ]
  }

  private createParticle(): Particle {
    const params = this.params as ParticulaParams

    // Random spawn position with some concentration near center
    const angle = this.rng.random() * Math.PI * 2
    const radius = this.rng.random() * Math.min(this.config.width, this.config.height) * 0.3
    const x = this.centerX + Math.cos(angle) * radius
    const y = this.centerY + Math.sin(angle) * radius

    return {
      x,
      y,
      vx: (this.rng.random() - 0.5) * 2,
      vy: (this.rng.random() - 0.5) * 2,
      age: 0,
      lifetime: params.particleLifetime * (0.5 + this.rng.random() * 0.5),
      size: params.particleSize * (0.5 + this.rng.random() * 0.5),
      mass: 0.5 + this.rng.random() * 0.5,
      energy: this.rng.random(),
      frequency: this.rng.random(),
      hue: this.rng.random() * 360,
      alpha: 1.0,
      trail: []
    }
  }

  public update(features: AudioFeatures): void {
    // Map audio features to visual parameters
    const mappedParams = this.audioMapper.mapFeatures(features, this.params)
    this.updateParams(mappedParams)

    // Analyze audio for particle behavior
    this.analyzeAudioFeatures(features)

    // Handle onset events
    if ((mappedParams as any)._onset_particleBurst) {
      this.triggerParticleBurst()
    }
    if ((mappedParams as any)._onset_attractorPulse) {
      this.triggerAttractorPulse()
    }
  }

  private analyzeAudioFeatures(features: AudioFeatures): void {
    if (features.frequencyData) {
      const freqData = features.frequencyData
      const bands = this.frequencyBands.length
      const binSize = Math.floor(freqData.length / bands)

      // Calculate frequency bands
      for (let i = 0; i < bands; i++) {
        let sum = 0
        for (let j = 0; j < binSize; j++) {
          sum += freqData[i * binSize + j]
        }
        this.frequencyBands[i] = sum / (binSize * 255)
      }

      // Smooth frequency bands
      const smoothing = this.params.smoothing
      for (let i = 0; i < bands; i++) {
        this.smoothedBands[i] =
          this.smoothedBands[i] * smoothing +
          this.frequencyBands[i] * (1 - smoothing)
      }

      // Calculate energy in different frequency ranges
      this.bassEnergy = this.getEnergyInRange(0, 8)
      this.midEnergy = this.getEnergyInRange(8, 32)
      this.trebleEnergy = this.getEnergyInRange(32, 64)
    }
  }

  private getEnergyInRange(start: number, end: number): number {
    let sum = 0
    for (let i = start; i < Math.min(end, this.smoothedBands.length); i++) {
      sum += this.smoothedBands[i]
    }
    return sum / (end - start)
  }

  public renderFrame(frame: RenderFrame): void {
    this.time += 1 / 60
    const params = this.params as ParticulaParams

    // Clear canvas with trail effect
    this.ctx.fillStyle = `rgba(0, 0, 0, ${1 - (params.trailLength / 100)})`
    this.ctx.fillRect(0, 0, this.config.width, this.config.height)

    // Update systems
    this.updateFlowField(params)
    this.updateAttractors(params)
    this.updateParticles(params)
    this.maintainParticleCount(params)

    // Render
    this.renderParticleConnections(params)
    this.renderParticles(params)
    this.renderAttractors(params)

    // Apply post-processing
    this.applyPostProcessing(params)
  }

  private updateFlowField(params: ParticulaParams): void {
    const resolution = this.flowField.length
    const noiseScale = params.noiseScale

    for (let y = 0; y < resolution; y++) {
      for (let x = 0; x < resolution; x++) {
        const noiseValue = this.rng.noise3D(
          x * noiseScale,
          y * noiseScale,
          this.time * 0.1
        )

        const angle = noiseValue * Math.PI * 2 * params.fieldStrength
        this.flowField[y][x * 2] = Math.cos(angle)
        this.flowField[y][x * 2 + 1] = Math.sin(angle)
      }
    }
  }

  private updateAttractors(params: ParticulaParams): void {
    this.attractors.forEach((attractor, index) => {
      // Update position based on audio
      if (index === 0) {
        // Main attractor follows bass
        attractor.strength = params.attractorStrength * (1 + this.bassEnergy * params.bassResponse)
      } else {
        // Secondary attractors respond to mid/treble
        const energy = index === 1 ? this.midEnergy : this.trebleEnergy
        attractor.active = energy > 0.3
        attractor.strength = params.attractorStrength * 0.5 * energy
      }

      // Orbital motion for secondary attractors
      if (index > 0) {
        const angle = this.time * 0.1 * index + index * Math.PI
        const radius = 100 + this.bassEnergy * 50
        attractor.x = this.centerX + Math.cos(angle) * radius
        attractor.y = this.centerY + Math.sin(angle) * radius
      }
    })
  }

  private updateParticles(params: ParticulaParams): void {
    const particles = this.particles

    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i]

      // Age particle
      particle.age++
      particle.alpha = 1.0 - (particle.age / particle.lifetime)

      // Remove dead particles
      if (particle.age >= particle.lifetime || particle.alpha <= 0) {
        particles.splice(i, 1)
        continue
      }

      // Apply behavior
      this.applyParticleBehavior(particle, params)

      // Apply physics
      this.applyParticlePhysics(particle, params)

      // Update position
      particle.x += particle.vx
      particle.y += particle.vy

      // Update trail
      this.updateParticleTrail(particle, params)

      // Wrap around screen edges
      this.wrapParticle(particle)
    }
  }

  private applyParticleBehavior(particle: Particle, params: ParticulaParams): void {
    switch (params.behaviorMode) {
      case 'swarm':
        this.applySwarmBehavior(particle, params)
        break
      case 'flow':
        this.applyFlowBehavior(particle, params)
        break
      case 'explosion':
        this.applyExplosionBehavior(particle, params)
        break
      case 'orbit':
        this.applyOrbitalBehavior(particle, params)
        break
      case 'chaos':
        this.applyChaosBehavior(particle, params)
        break
    }
  }

  private applySwarmBehavior(particle: Particle, params: ParticulaParams): void {
    // Boids-like flocking behavior
    let separationX = 0, separationY = 0
    let alignmentX = 0, alignmentY = 0
    let cohesionX = 0, cohesionY = 0
    let neighborCount = 0

    const neighborRadius = 50

    for (const other of this.particles) {
      if (other === particle) continue

      const dx = other.x - particle.x
      const dy = other.y - particle.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < neighborRadius && distance > 0) {
        neighborCount++

        // Separation
        separationX -= dx / distance
        separationY -= dy / distance

        // Alignment
        alignmentX += other.vx
        alignmentY += other.vy

        // Cohesion
        cohesionX += dx
        cohesionY += dy
      }
    }

    if (neighborCount > 0) {
      const strength = params.flockingStrength * 0.1

      // Apply separation
      particle.vx += separationX * strength
      particle.vy += separationY * strength

      // Apply alignment
      alignmentX = (alignmentX / neighborCount) * strength
      alignmentY = (alignmentY / neighborCount) * strength
      particle.vx += alignmentX
      particle.vy += alignmentY

      // Apply cohesion
      cohesionX = (cohesionX / neighborCount) * strength * 0.5
      cohesionY = (cohesionY / neighborCount) * strength * 0.5
      particle.vx += cohesionX
      particle.vy += cohesionY
    }
  }

  private applyFlowBehavior(particle: Particle, params: ParticulaParams): void {
    const resolution = this.flowField.length
    const x = Math.floor((particle.x / this.config.width) * resolution)
    const y = Math.floor((particle.y / this.config.height) * resolution)

    if (x >= 0 && x < resolution && y >= 0 && y < resolution) {
      const flowX = this.flowField[y][x * 2]
      const flowY = this.flowField[y][x * 2 + 1]

      particle.vx += flowX * params.fieldStrength * 0.5
      particle.vy += flowY * params.fieldStrength * 0.5
    }
  }

  private applyExplosionBehavior(particle: Particle, params: ParticulaParams): void {
    const dx = particle.x - this.centerX
    const dy = particle.y - this.centerY
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > 0) {
      const force = (this.bassEnergy * params.bassResponse) / distance
      particle.vx += (dx / distance) * force
      particle.vy += (dy / distance) * force
    }
  }

  private applyOrbitalBehavior(particle: Particle, params: ParticulaParams): void {
    const dx = particle.x - this.centerX
    const dy = particle.y - this.centerY
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > 0) {
      // Orbital force perpendicular to radius
      const orbitalForce = params.fieldStrength * 0.1
      particle.vx += (-dy / distance) * orbitalForce
      particle.vy += (dx / distance) * orbitalForce

      // Centripetal force
      const centripetalForce = params.attractorStrength * 0.001 / distance
      particle.vx -= (dx / distance) * centripetalForce
      particle.vy -= (dy / distance) * centripetalForce
    }
  }

  private applyChaosBehavior(particle: Particle, params: ParticulaParams): void {
    // Random chaotic forces influenced by audio
    const chaos = params.turbulence * (1 + this.trebleEnergy * 2)
    particle.vx += (this.rng.random() - 0.5) * chaos
    particle.vy += (this.rng.random() - 0.5) * chaos

    // Strange attractor-like behavior
    const x = particle.x / 100
    const y = particle.y / 100
    const strangeForce = 0.01 * params.fieldStrength
    particle.vx += Math.sin(y) * strangeForce
    particle.vy += Math.cos(x) * strangeForce
  }

  private applyParticlePhysics(particle: Particle, params: ParticulaParams): void {
    // Attractor forces
    for (const attractor of this.attractors) {
      if (!attractor.active) continue

      const dx = attractor.x - particle.x
      const dy = attractor.y - particle.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > 0 && distance < 500) {
        const force = (attractor.strength * particle.mass) / (distance * distance + 100)
        particle.vx += (dx / distance) * force * 0.001
        particle.vy += (dy / distance) * force * 0.001
      }
    }

    // Apply gravity
    particle.vy += params.gravity

    // Apply damping
    particle.vx *= params.damping
    particle.vy *= params.damping

    // Limit velocity
    const maxVelocity = 10
    const velocity = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy)
    if (velocity > maxVelocity) {
      particle.vx = (particle.vx / velocity) * maxVelocity
      particle.vy = (particle.vy / velocity) * maxVelocity
    }

    // Update energy based on velocity and audio
    particle.energy = Math.min(1, velocity / 5 + this.bassEnergy * 0.5)
  }

  private updateParticleTrail(particle: Particle, params: ParticulaParams): void {
    // Add current position to trail
    particle.trail.push({
      x: particle.x,
      y: particle.y,
      alpha: particle.alpha
    })

    // Limit trail length
    while (particle.trail.length > params.trailLength) {
      particle.trail.shift()
    }

    // Fade trail
    particle.trail.forEach((trailPoint, index) => {
      trailPoint.alpha *= 0.95
    })
  }

  private wrapParticle(particle: Particle): void {
    const margin = 50
    if (particle.x < -margin) particle.x = this.config.width + margin
    if (particle.x > this.config.width + margin) particle.x = -margin
    if (particle.y < -margin) particle.y = this.config.height + margin
    if (particle.y > this.config.height + margin) particle.y = -margin
  }

  private maintainParticleCount(params: ParticulaParams): void {
    // Add new particles based on emission rate and audio
    const targetEmissions = params.emissionRate * (1 + this.bassEnergy * 2)
    const currentDeficit = params.particleCount - this.particles.length

    if (currentDeficit > 0) {
      const emissionsThisFrame = Math.min(currentDeficit, Math.ceil(targetEmissions / 60))

      for (let i = 0; i < emissionsThisFrame; i++) {
        this.particles.push(this.createParticle())
      }
    }
  }

  private renderParticleConnections(params: ParticulaParams): void {
    if (!params.particleConnections) return

    this.connectionLines = []
    const maxDistance = params.connectionDistance

    // Find connections (optimization: only check nearby particles)
    for (let i = 0; i < this.particles.length; i++) {
      const particle1 = this.particles[i]

      for (let j = i + 1; j < this.particles.length; j++) {
        const particle2 = this.particles[j]

        const dx = particle2.x - particle1.x
        const dy = particle2.y - particle1.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < maxDistance) {
          const alpha = (1 - distance / maxDistance) * Math.min(particle1.alpha, particle2.alpha) * 0.3
          this.connectionLines.push({
            x1: particle1.x,
            y1: particle1.y,
            x2: particle2.x,
            y2: particle2.y,
            alpha
          })
        }
      }
    }

    // Render connections
    this.ctx.save()
    this.ctx.globalCompositeOperation = params.particleBlending

    for (const line of this.connectionLines) {
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${line.alpha})`
      this.ctx.lineWidth = 0.5
      this.ctx.beginPath()
      this.ctx.moveTo(line.x1, line.y1)
      this.ctx.lineTo(line.x2, line.y2)
      this.ctx.stroke()
    }

    this.ctx.restore()
  }

  private renderParticles(params: ParticulaParams): void {
    this.ctx.save()
    this.ctx.globalCompositeOperation = params.particleBlending

    for (const particle of this.particles) {
      // Render trail
      if (particle.trail.length > 1) {
        this.renderParticleTrail(particle, params)
      }

      // Get particle color
      const color = this.getParticleColor(particle, params)

      // Apply quantum effects
      if (params.quantumEffects) {
        this.renderQuantumEffects(particle, params, color)
      }

      // Render main particle
      const size = particle.size * (1 + particle.energy * 0.5)
      this.ctx.fillStyle = color
      this.ctx.globalAlpha = particle.alpha

      if (params.glowIntensity > 1) {
        // Render glow
        const glowSize = size * params.glowIntensity
        const glowGradient = this.ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, glowSize
        )
        glowGradient.addColorStop(0, color)
        glowGradient.addColorStop(1, color.replace(/[\d\.]+\)$/g, '0)'))

        this.ctx.fillStyle = glowGradient
        this.ctx.beginPath()
        this.ctx.arc(particle.x, particle.y, glowSize, 0, Math.PI * 2)
        this.ctx.fill()
      }

      // Main particle
      this.ctx.fillStyle = color
      this.ctx.beginPath()
      this.ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2)
      this.ctx.fill()
    }

    this.ctx.restore()
  }

  private renderParticleTrail(particle: Particle, params: ParticulaParams): void {
    if (particle.trail.length < 2) return

    this.ctx.save()
    this.ctx.lineWidth = particle.size * 0.5
    this.ctx.lineCap = 'round'

    for (let i = 1; i < particle.trail.length; i++) {
      const prev = particle.trail[i - 1]
      const curr = particle.trail[i]

      const color = this.getParticleColor(particle, params)
      this.ctx.strokeStyle = color.replace(/[\d\.]+\)$/g, `${curr.alpha * 0.3})`)
      this.ctx.globalAlpha = curr.alpha * 0.3

      this.ctx.beginPath()
      this.ctx.moveTo(prev.x, prev.y)
      this.ctx.lineTo(curr.x, curr.y)
      this.ctx.stroke()
    }

    this.ctx.restore()
  }

  private renderQuantumEffects(particle: Particle, params: ParticulaParams, color: string): void {
    // Quantum uncertainty visualization
    const uncertainty = particle.energy * 5
    const quantumPositions = 3

    this.ctx.save()
    this.ctx.globalAlpha = particle.alpha * 0.3

    for (let i = 0; i < quantumPositions; i++) {
      const offsetX = (this.rng.random() - 0.5) * uncertainty
      const offsetY = (this.rng.random() - 0.5) * uncertainty

      this.ctx.fillStyle = color
      this.ctx.beginPath()
      this.ctx.arc(
        particle.x + offsetX,
        particle.y + offsetY,
        particle.size * 0.3,
        0, Math.PI * 2
      )
      this.ctx.fill()
    }

    this.ctx.restore()
  }

  private getParticleColor(particle: Particle, params: ParticulaParams): string {
    switch (params.colorMode) {
      case 'frequency': {
        const freq = particle.frequency
        const hue = freq * 360
        return `hsla(${hue}, 80%, 60%, ${particle.alpha})`
      }

      case 'velocity': {
        const velocity = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy)
        const hue = Math.min(velocity * 20, 360)
        return `hsla(${hue}, 90%, 65%, ${particle.alpha})`
      }

      case 'age': {
        const ageRatio = particle.age / particle.lifetime
        const hue = (1 - ageRatio) * 240 // Blue to red
        return `hsla(${hue}, 85%, 55%, ${particle.alpha})`
      }

      case 'energy': {
        const hue = particle.energy * 60 + 300 // Purple to yellow
        return `hsla(${hue}, 95%, 70%, ${particle.alpha})`
      }

      case 'rainbow': {
        const hue = (this.time * 50 + particle.x + particle.y) % 360
        return `hsla(${hue}, 85%, 60%, ${particle.alpha})`
      }

      default:
        return this.paletteGenerator.getColorAtPosition(params.palette, particle.energy)
    }
  }

  private renderAttractors(params: ParticulaParams): void {
    this.ctx.save()

    for (const attractor of this.attractors) {
      if (!attractor.active) continue

      const size = (attractor.strength / 100) * 5
      const alpha = 0.5

      // Render attractor core
      this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
      this.ctx.beginPath()
      this.ctx.arc(attractor.x, attractor.y, size, 0, Math.PI * 2)
      this.ctx.fill()

      // Render influence field
      if (attractor.strength > 0) {
        const fieldSize = Math.sqrt(attractor.strength) * 2
        const gradient = this.ctx.createRadialGradient(
          attractor.x, attractor.y, 0,
          attractor.x, attractor.y, fieldSize
        )
        gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.1})`)
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

        this.ctx.fillStyle = gradient
        this.ctx.beginPath()
        this.ctx.arc(attractor.x, attractor.y, fieldSize, 0, Math.PI * 2)
        this.ctx.fill()
      }
    }

    this.ctx.restore()
  }

  private applyPostProcessing(params: ParticulaParams): void {
    // Apply bloom effect for additive blending
    if (params.particleBlending === 'additive' && params.glowIntensity > 1) {
      this.ctx.globalCompositeOperation = 'screen'
      this.ctx.globalAlpha = 0.1
      this.ctx.filter = `blur(${params.glowIntensity}px)`
      this.ctx.drawImage(this.canvas, 0, 0)
      this.ctx.filter = 'none'
      this.ctx.globalCompositeOperation = 'source-over'
      this.ctx.globalAlpha = 1
    }
  }

  private triggerParticleBurst(): void {
    const burstCount = 100

    for (let i = 0; i < burstCount; i++) {
      const particle = this.createParticle()

      // High energy burst from center
      const angle = this.rng.random() * Math.PI * 2
      const speed = 5 + this.rng.random() * 10

      particle.x = this.centerX
      particle.y = this.centerY
      particle.vx = Math.cos(angle) * speed
      particle.vy = Math.sin(angle) * speed
      particle.energy = 1.0
      particle.size *= 1.5

      this.particles.push(particle)
    }
  }

  private triggerAttractorPulse(): void {
    // Boost all attractor strengths temporarily
    this.attractors.forEach(attractor => {
      if (attractor.active) {
        attractor.strength *= 2

        // Reset after delay
        setTimeout(() => {
          attractor.strength *= 0.5
        }, 200)
      }
    })
  }

  public dispose(): void {
    super.dispose()
    this.particles = []
    this.attractors = []
    this.flowField = []
    this.connectionLines = []
  }
}