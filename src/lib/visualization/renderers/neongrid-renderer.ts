import type { NeonGridConfig, Vector2, Color } from '../types'
import type { VisualizationData } from '../../audio/types'
import { BaseVisualizationRenderer } from '../base-renderer'
import { MathUtils, ColorUtils, CanvasUtils } from '../utils'

interface GridNode {
  position: Vector2
  energy: number
  maxEnergy: number
  connections: GridNode[]
  pulsePhase: number
  size: number
  color: Color
  isActive: boolean
}

interface GridConnection {
  nodeA: GridNode
  nodeB: GridNode
  strength: number
  maxStrength: number
  pulseSpeed: number
  color: Color
}

interface EnergyWave {
  center: Vector2
  radius: number
  maxRadius: number
  intensity: number
  frequency: number
  speed: number
  color: Color
}

export class NeonGridRenderer extends BaseVisualizationRenderer {
  private neonGridConfig: NeonGridConfig = {
    style: 'neongrid',
    width: 800,
    height: 800,
    backgroundColor: '#000000',
    primaryColor: '#00F5FF',
    secondaryColor: '#9D4EDD',
    accentColor: '#FF6EC7',
    sensitivity: 1,
    smoothing: 0.8,
    scale: 1,
    gridSize: 32,
    glowIntensity: 0.7,
    pulsation: 1.1,
    lineWidth: 2,
    nodeSize: 4,
    connectionDistance: 80
  }

  private gridNodes: GridNode[] = []
  private gridConnections: GridConnection[] = []
  private energyWaves: EnergyWave[] = []
  private colorPalette: Color[] = []
  private time: number = 0
  private gridCols: number = 0
  private gridRows: number = 0

  // Audio-reactive parameters
  private bassInfluence: number = 0
  private midInfluence: number = 0
  private trebleInfluence: number = 0
  private overallEnergy: number = 0

  constructor(config?: Partial<NeonGridConfig>) {
    super(config)
    if (config) {
      this.neonGridConfig = { ...this.neonGridConfig, ...config }
    }
  }

  protected onInitialize(): void {
    this.initializeColorPalette()
    this.calculateGridDimensions()
    this.createGridNodes()
    this.createGridConnections()
  }

  protected onRender(audioData: VisualizationData, deltaTime: number): void {
    this.time += deltaTime * 0.001

    // Update audio influences
    this.updateAudioInfluences(audioData)

    // Update grid nodes
    this.updateGridNodes(audioData, deltaTime)

    // Update connections
    this.updateGridConnections(audioData, deltaTime)

    // Update energy waves
    this.updateEnergyWaves(audioData, deltaTime)

    // Create new energy waves based on audio peaks
    this.createEnergyWaves(audioData)

    // Render everything
    this.renderNeonGrid(audioData)
  }

  protected onResize(width: number, height: number): void {
    this.neonGridConfig.width = width
    this.neonGridConfig.height = height
    this.calculateGridDimensions()
    this.createGridNodes()
    this.createGridConnections()
  }

  protected onConfigUpdate(config: Partial<NeonGridConfig>): void {
    this.neonGridConfig = { ...this.neonGridConfig, ...config }
    this.initializeColorPalette()

    if (config.gridSize) {
      this.calculateGridDimensions()
      this.createGridNodes()
      this.createGridConnections()
    }
  }

  protected onDispose(): void {
    this.gridNodes = []
    this.gridConnections = []
    this.energyWaves = []
    this.colorPalette = []
  }

  private initializeColorPalette(): void {
    const primary = ColorUtils.parseColor(this.neonGridConfig.primaryColor)
    const secondary = ColorUtils.parseColor(this.neonGridConfig.secondaryColor)
    const accent = ColorUtils.parseColor(this.neonGridConfig.accentColor)

    this.colorPalette = [
      primary,
      secondary,
      accent,
      ColorUtils.lerp(primary, secondary, 0.5),
      ColorUtils.lerp(secondary, accent, 0.5),
      ColorUtils.lerp(accent, primary, 0.5)
    ]
  }

  private calculateGridDimensions(): void {
    this.gridCols = Math.ceil(this.neonGridConfig.width / this.neonGridConfig.gridSize)
    this.gridRows = Math.ceil(this.neonGridConfig.height / this.neonGridConfig.gridSize)
  }

  private createGridNodes(): void {
    this.gridNodes = []

    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        const x = col * this.neonGridConfig.gridSize + this.neonGridConfig.gridSize / 2
        const y = row * this.neonGridConfig.gridSize + this.neonGridConfig.gridSize / 2

        const node: GridNode = {
          position: { x, y },
          energy: 0,
          maxEnergy: 1,
          connections: [],
          pulsePhase: Math.random() * Math.PI * 2,
          size: this.neonGridConfig.nodeSize,
          color: this.colorPalette[Math.floor(Math.random() * this.colorPalette.length)],
          isActive: false
        }

        this.gridNodes.push(node)
      }
    }
  }

  private createGridConnections(): void {
    this.gridConnections = []

    this.gridNodes.forEach((nodeA, indexA) => {
      this.gridNodes.forEach((nodeB, indexB) => {
        if (indexA >= indexB) return // Avoid duplicate connections

        const distance = MathUtils.distance(nodeA.position, nodeB.position)

        if (distance <= this.neonGridConfig.connectionDistance) {
          const connection: GridConnection = {
            nodeA,
            nodeB,
            strength: 0,
            maxStrength: 1 - (distance / this.neonGridConfig.connectionDistance),
            pulseSpeed: 1 + Math.random() * 2,
            color: ColorUtils.lerp(nodeA.color, nodeB.color, 0.5)
          }

          this.gridConnections.push(connection)

          // Add mutual references
          nodeA.connections.push(nodeB)
          nodeB.connections.push(nodeA)
        }
      })
    })
  }

  private updateAudioInfluences(audioData: VisualizationData): void {
    // Update with smoothing
    const smoothing = this.neonGridConfig.smoothing

    this.bassInfluence = this.bassInfluence * smoothing + audioData.bassEnergy * (1 - smoothing)
    this.midInfluence = this.midInfluence * smoothing + audioData.midEnergy * (1 - smoothing)
    this.trebleInfluence = this.trebleInfluence * smoothing + audioData.trebleEnergy * (1 - smoothing)
    this.overallEnergy = this.overallEnergy * smoothing + audioData.volume * (1 - smoothing)
  }

  private updateGridNodes(audioData: VisualizationData, deltaTime: number): void {
    const frequencyData = audioData.frequencyData
    const deltaSeconds = deltaTime * 0.001

    this.gridNodes.forEach((node, index) => {
      // Map node to frequency data
      const frequencyIndex = Math.floor((index / this.gridNodes.length) * frequencyData.length)
      const frequencyValue = frequencyData[frequencyIndex] || 0

      // Calculate target energy based on frequency and position
      let targetEnergy = frequencyValue * this.neonGridConfig.sensitivity

      // Add position-based influences
      const centerX = this.renderingContext.centerX
      const centerY = this.renderingContext.centerY
      const distanceFromCenter = MathUtils.distance(node.position, { x: centerX, y: centerY })
      const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY)
      const centerInfluence = 1 - (distanceFromCenter / maxDistance)

      // Apply audio band influences based on position
      if (node.position.y > this.renderingContext.height * 0.66) {
        // Bottom third - bass influence
        targetEnergy += this.bassInfluence * centerInfluence
      } else if (node.position.y < this.renderingContext.height * 0.33) {
        // Top third - treble influence
        targetEnergy += this.trebleInfluence * centerInfluence
      } else {
        // Middle third - mid influence
        targetEnergy += this.midInfluence * centerInfluence
      }

      // Update energy with interpolation
      node.energy = MathUtils.lerp(
        node.energy,
        MathUtils.clamp(targetEnergy, 0, node.maxEnergy),
        0.1
      )

      // Update activity state
      node.isActive = node.energy > 0.1

      // Update pulse phase
      node.pulsePhase += (2 + node.energy * 3) * deltaSeconds

      // Update size based on energy and pulsation
      const pulsationAmount = Math.sin(node.pulsePhase) * 0.5 + 0.5
      node.size = this.neonGridConfig.nodeSize * (1 + node.energy * this.neonGridConfig.pulsation * pulsationAmount)

      // Update color intensity based on energy
      const baseColor = this.colorPalette[index % this.colorPalette.length]
      node.color = ColorUtils.adjustBrightness(baseColor, 0.5 + node.energy * 0.5)
    })
  }

  private updateGridConnections(audioData: VisualizationData, deltaTime: number): void {
    const deltaSeconds = deltaTime * 0.001

    this.gridConnections.forEach(connection => {
      // Calculate connection strength based on node energies
      const avgEnergy = (connection.nodeA.energy + connection.nodeB.energy) / 2
      const targetStrength = avgEnergy * connection.maxStrength

      // Update strength with interpolation
      connection.strength = MathUtils.lerp(connection.strength, targetStrength, 0.15)

      // Update pulse speed based on overall energy
      connection.pulseSpeed = 1 + this.overallEnergy * 2

      // Update connection color
      const energyColor = ColorUtils.lerp(
        connection.nodeA.color,
        connection.nodeB.color,
        0.5 + Math.sin(this.time * connection.pulseSpeed) * 0.5
      )

      connection.color = ColorUtils.adjustAlpha(energyColor, connection.strength)
    })
  }

  private updateEnergyWaves(audioData: VisualizationData, deltaTime: number): void {
    const deltaSeconds = deltaTime * 0.001

    this.energyWaves = this.energyWaves.filter(wave => {
      wave.radius += wave.speed * deltaSeconds * 60
      wave.intensity *= 0.98 // Fade over time

      return wave.radius < wave.maxRadius && wave.intensity > 0.01
    })
  }

  private createEnergyWaves(audioData: VisualizationData): void {
    // Create waves on audio peaks
    if (audioData.volume > 0.4 && Math.random() < 0.05) {
      // Create wave at a random active node
      const activeNodes = this.gridNodes.filter(node => node.isActive)

      if (activeNodes.length > 0) {
        const sourceNode = activeNodes[Math.floor(Math.random() * activeNodes.length)]

        const wave: EnergyWave = {
          center: { ...sourceNode.position },
          radius: 0,
          maxRadius: this.neonGridConfig.connectionDistance * 3,
          intensity: audioData.volume,
          frequency: 1 + audioData.volume * 2,
          speed: 50 + audioData.volume * 100,
          color: sourceNode.color
        }

        this.energyWaves.push(wave)
      }
    }

    // Create central waves on strong bass hits
    if (this.bassInfluence > 0.6 && Math.random() < 0.1) {
      const wave: EnergyWave = {
        center: {
          x: this.renderingContext.centerX,
          y: this.renderingContext.centerY
        },
        radius: 0,
        maxRadius: Math.max(this.renderingContext.width, this.renderingContext.height),
        intensity: this.bassInfluence,
        frequency: 0.5,
        speed: 80 + this.bassInfluence * 120,
        color: ColorUtils.parseColor(this.neonGridConfig.primaryColor)
      }

      this.energyWaves.push(wave)
    }
  }

  private renderNeonGrid(audioData: VisualizationData): void {
    if (!this.ctx) return

    // Draw background grid lines
    this.drawBackgroundGrid()

    // Draw energy waves
    this.drawEnergyWaves()

    // Draw connections
    this.drawGridConnections()

    // Draw nodes
    this.drawGridNodes()

    // Draw glow effects
    this.drawGlowEffects(audioData)
  }

  private drawBackgroundGrid(): void {
    if (!this.ctx) return

    this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.05 + this.overallEnergy * 0.05})`
    this.ctx.lineWidth = 1

    // Vertical lines
    for (let x = 0; x <= this.renderingContext.width; x += this.neonGridConfig.gridSize) {
      this.ctx.beginPath()
      this.ctx.moveTo(x, 0)
      this.ctx.lineTo(x, this.renderingContext.height)
      this.ctx.stroke()
    }

    // Horizontal lines
    for (let y = 0; y <= this.renderingContext.height; y += this.neonGridConfig.gridSize) {
      this.ctx.beginPath()
      this.ctx.moveTo(0, y)
      this.ctx.lineTo(this.renderingContext.width, y)
      this.ctx.stroke()
    }
  }

  private drawEnergyWaves(): void {
    if (!this.ctx) return

    this.ctx.globalCompositeOperation = 'lighter'

    this.energyWaves.forEach(wave => {
      const alpha = wave.intensity * 0.3
      const color = ColorUtils.adjustAlpha(wave.color, alpha)

      // Draw wave ring
      this.ctx.strokeStyle = ColorUtils.colorToString(color)
      this.ctx.lineWidth = 2 + wave.intensity * 3
      this.ctx.beginPath()
      this.ctx.arc(wave.center.x, wave.center.y, wave.radius, 0, Math.PI * 2)
      this.ctx.stroke()

      // Draw inner glow
      const gradient = this.ctx.createRadialGradient(
        wave.center.x, wave.center.y, wave.radius - 10,
        wave.center.x, wave.center.y, wave.radius + 10
      )
      gradient.addColorStop(0, 'transparent')
      gradient.addColorStop(0.5, ColorUtils.colorToString(ColorUtils.adjustAlpha(wave.color, alpha * 0.5)))
      gradient.addColorStop(1, 'transparent')

      this.ctx.strokeStyle = gradient
      this.ctx.lineWidth = 20
      this.ctx.beginPath()
      this.ctx.arc(wave.center.x, wave.center.y, wave.radius, 0, Math.PI * 2)
      this.ctx.stroke()
    })

    this.ctx.globalCompositeOperation = 'source-over'
  }

  private drawGridConnections(): void {
    if (!this.ctx) return

    this.gridConnections.forEach(connection => {
      if (connection.strength < 0.05) return

      const alpha = connection.strength * this.neonGridConfig.glowIntensity
      const color = ColorUtils.adjustAlpha(connection.color, alpha)

      // Draw main connection line
      this.ctx.strokeStyle = ColorUtils.colorToString(color)
      this.ctx.lineWidth = this.neonGridConfig.lineWidth * (0.5 + connection.strength * 0.5)

      CanvasUtils.drawLine(
        this.ctx,
        connection.nodeA.position.x,
        connection.nodeA.position.y,
        connection.nodeB.position.x,
        connection.nodeB.position.y,
        ColorUtils.colorToString(color),
        this.ctx.lineWidth
      )

      // Draw glow effect for strong connections
      if (connection.strength > 0.3) {
        this.ctx.globalCompositeOperation = 'lighter'
        this.ctx.strokeStyle = ColorUtils.colorToString(ColorUtils.adjustAlpha(color, alpha * 0.3))
        this.ctx.lineWidth = this.neonGridConfig.lineWidth * 3

        CanvasUtils.drawLine(
          this.ctx,
          connection.nodeA.position.x,
          connection.nodeA.position.y,
          connection.nodeB.position.x,
          connection.nodeB.position.y,
          this.ctx.strokeStyle,
          this.ctx.lineWidth
        )

        this.ctx.globalCompositeOperation = 'source-over'
      }
    })
  }

  private drawGridNodes(): void {
    if (!this.ctx) return

    this.gridNodes.forEach(node => {
      if (!node.isActive && node.energy < 0.05) return

      const alpha = Math.max(0.3, node.energy)
      const color = ColorUtils.adjustAlpha(node.color, alpha)

      // Draw node core
      CanvasUtils.drawCircle(
        this.ctx!,
        node.position.x,
        node.position.y,
        node.size,
        ColorUtils.colorToString(color)
      )

      // Draw node glow
      if (node.energy > 0.2) {
        const glowSize = node.size * (2 + node.energy * 2)
        CanvasUtils.drawGlowEffect(
          this.ctx!,
          node.position.x,
          node.position.y,
          glowSize,
          ColorUtils.colorToString(node.color),
          node.energy * this.neonGridConfig.glowIntensity
        )
      }

      // Draw pulse effect for highly active nodes
      if (node.energy > 0.7) {
        const pulseRadius = node.size * (3 + Math.sin(node.pulsePhase) * 2)
        const pulseAlpha = (1 - (pulseRadius / (node.size * 5))) * node.energy * 0.5

        this.ctx!.strokeStyle = ColorUtils.colorToString(ColorUtils.adjustAlpha(node.color, pulseAlpha))
        this.ctx!.lineWidth = 1
        this.ctx!.beginPath()
        this.ctx!.arc(node.position.x, node.position.y, pulseRadius, 0, Math.PI * 2)
        this.ctx!.stroke()
      }
    })
  }

  private drawGlowEffects(audioData: VisualizationData): void {
    if (!this.ctx || this.overallEnergy < 0.3) return

    // Overall screen glow effect
    this.ctx.globalCompositeOperation = 'lighter'

    const gradient = this.ctx.createRadialGradient(
      this.renderingContext.centerX,
      this.renderingContext.centerY,
      0,
      this.renderingContext.centerX,
      this.renderingContext.centerY,
      Math.max(this.renderingContext.width, this.renderingContext.height) * 0.8
    )

    const glowColor = ColorUtils.adjustAlpha(
      ColorUtils.parseColor(this.neonGridConfig.primaryColor),
      this.overallEnergy * 0.1
    )

    gradient.addColorStop(0, ColorUtils.colorToString(glowColor))
    gradient.addColorStop(1, 'transparent')

    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, this.renderingContext.width, this.renderingContext.height)

    this.ctx.globalCompositeOperation = 'source-over'
  }
}