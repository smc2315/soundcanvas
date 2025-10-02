/**
 * ML Emotion Visualization Mode
 * Uses emotion detection patterns to create adaptive visual representations
 */

import { BaseVisualizer, AudioFeatures, RenderFrame, VisualizationMode, VisualParams } from '../core/types'
import { PaletteGenerator } from '../core/palettes'
import { AudioMapper } from '../core/mapping'
import { SeededRNG } from '../core/rng'

interface MLEmotionParams extends VisualParams {
  // Emotion detection
  emotionSensitivity: number
  moodStability: number
  emotionSmoothing: number
  adaptiveColoring: boolean

  // Visual representation
  morphingIntensity: number
  emotionShapes: 'organic' | 'geometric' | 'fluid' | 'neural'
  complexityLevels: number
  symmetryBalance: number

  // ML-inspired effects
  neuralConnections: boolean
  dataVisualization: boolean
  patternRecognition: number
  emergentBehavior: number

  // Emotional responses
  joyExpansion: number
  sadnessFlow: number
  angerIntensity: number
  calmStability: number
}

interface EmotionState {
  joy: number
  sadness: number
  anger: number
  fear: number
  calm: number
  energy: number
  valence: number // positive/negative
  arousal: number // intensity
}

interface NeuralNode {
  x: number
  y: number
  activation: number
  connections: number[]
  emotion: keyof EmotionState
  size: number
  pulsePhase: number
}

export class MLEmotionVisualizer extends BaseVisualizer {
  readonly id = 'ml-emotion'
  readonly label = 'ML Emotion'
  readonly mode: VisualizationMode = {
    id: this.id,
    label: this.label,
    description: 'AI-inspired emotion detection visualization with adaptive neural network patterns',
    category: 'data',
    tags: ['ml', 'emotion', 'neural', 'adaptive', 'ai', 'realtime'],
    previewImage: '/previews/ml-emotion.png',
    supportsRealtime: true,
    supportsOffline: true,
    supportsVideo: true,
    supports3D: false,
    defaultParams: {
      palette: {
        id: 'neural',
        name: 'Neural Network',
        colors: ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#7209b7'],
        temperature: 'cool',
        mood: 'dynamic'
      },
      gradients: {} as any,
      opacity: 0.85,
      brightness: 1.0,
      contrast: 1.4,
      saturation: 1.1,
      motionIntensity: 0.8,
      smoothing: 0.85,
      responsiveness: 0.9,

      // ML Emotion specific
      emotionSensitivity: 0.7,
      moodStability: 0.6,
      emotionSmoothing: 0.8,
      adaptiveColoring: true,
      morphingIntensity: 1.0,
      emotionShapes: 'neural' as const,
      complexityLevels: 5,
      symmetryBalance: 0.5,
      neuralConnections: true,
      dataVisualization: true,
      patternRecognition: 0.8,
      emergentBehavior: 0.6,
      joyExpansion: 1.5,
      sadnessFlow: 0.8,
      angerIntensity: 2.0,
      calmStability: 0.9
    } as MLEmotionParams,
    parameterSchema: [
      {
        key: 'emotionSensitivity',
        label: 'Emotion Sensitivity',
        type: 'range',
        default: 0.7,
        min: 0.1,
        max: 1.0,
        step: 0.1,
        category: 'Emotion'
      },
      {
        key: 'emotionShapes',
        label: 'Shape Style',
        type: 'select',
        default: 'neural',
        options: [
          { value: 'organic', label: 'Organic' },
          { value: 'geometric', label: 'Geometric' },
          { value: 'fluid', label: 'Fluid' },
          { value: 'neural', label: 'Neural' }
        ],
        category: 'Visual'
      },
      {
        key: 'neuralConnections',
        label: 'Neural Connections',
        type: 'boolean',
        default: true,
        category: 'Effects'
      }
    ],
    audioMapping: {
      energy: [
        { target: 'morphingIntensity', range: [0.5, 2.0], curve: 'exponential', smoothing: 0.7 },
        { target: 'emergentBehavior', range: [0.2, 1.0], curve: 'linear', smoothing: 0.8 }
      ],
      brightness: [
        { target: 'brightness', range: [0.7, 1.5], curve: 'linear', smoothing: 0.85 }
      ],
      onset: [
        { trigger: 'emotionSpike', threshold: 0.6, cooldown: 0.4 },
        { trigger: 'neuralBurst', threshold: 0.8, cooldown: 0.6 }
      ],
      pitch: [
        { target: 'patternRecognition', range: [0.4, 1.0], freqRange: [200, 2000] }
      ]
    }
  }

  // Audio processing
  private audioMapper: AudioMapper
  private paletteGenerator: PaletteGenerator
  private rng: SeededRNG

  // Emotion analysis
  private currentEmotion: EmotionState = {
    joy: 0, sadness: 0, anger: 0, fear: 0, calm: 0.5,
    energy: 0, valence: 0, arousal: 0
  }
  private emotionHistory: EmotionState[] = []
  private emotionBuffer: number[] = new Array(60).fill(0)

  // Neural network visualization
  private neuralNodes: NeuralNode[] = []
  private nodeConnections: Array<{ from: number; to: number; strength: number }> = []

  // Visual state
  private time = 0
  private lastEmotionUpdate = 0

  constructor() {
    super()
    this.rng = new SeededRNG(Date.now())
    this.paletteGenerator = new PaletteGenerator(this.rng.getSeed())
    this.audioMapper = new AudioMapper(this.mode.audioMapping)
  }

  protected async initializeMode(): Promise<void> {
    await this.initializeNeuralNetwork()
    await this.setupEmotionDetection()
  }

  private async initializeNeuralNetwork(): Promise<void> {
    const params = this.params as MLEmotionParams
    this.neuralNodes = []
    this.nodeConnections = []

    const nodeCount = params.complexityLevels * 8
    const emotions: Array<keyof EmotionState> = ['joy', 'sadness', 'anger', 'fear', 'calm', 'energy']

    // Create nodes in layers
    for (let layer = 0; layer < params.complexityLevels; layer++) {
      const nodesInLayer = Math.floor(nodeCount / params.complexityLevels)
      const layerY = (layer + 1) * (this.config.height / (params.complexityLevels + 1))

      for (let i = 0; i < nodesInLayer; i++) {
        const nodeX = (i + 1) * (this.config.width / (nodesInLayer + 1))

        const node: NeuralNode = {
          x: nodeX + (this.rng.random() - 0.5) * 50,
          y: layerY + (this.rng.random() - 0.5) * 30,
          activation: this.rng.random(),
          connections: [],
          emotion: emotions[Math.floor(this.rng.random() * emotions.length)],
          size: this.rng.randomFloat(5, 15),
          pulsePhase: this.rng.random() * Math.PI * 2
        }

        this.neuralNodes.push(node)
      }
    }

    // Create connections between layers
    this.createNeuralConnections()
  }

  private createNeuralConnections(): void {
    const params = this.params as MLEmotionParams
    if (!params.neuralConnections) return

    const nodesPerLayer = Math.floor(this.neuralNodes.length / params.complexityLevels)

    for (let layer = 0; layer < params.complexityLevels - 1; layer++) {
      const currentLayerStart = layer * nodesPerLayer
      const nextLayerStart = (layer + 1) * nodesPerLayer

      for (let i = 0; i < nodesPerLayer; i++) {
        const fromNode = currentLayerStart + i

        // Connect to 2-4 nodes in next layer
        const connectionCount = this.rng.randomInt(2, 4)
        for (let j = 0; j < connectionCount; j++) {
          const toNode = nextLayerStart + this.rng.randomInt(0, nodesPerLayer - 1)

          if (fromNode < this.neuralNodes.length && toNode < this.neuralNodes.length) {
            this.nodeConnections.push({
              from: fromNode,
              to: toNode,
              strength: this.rng.randomFloat(0.3, 1.0)
            })

            this.neuralNodes[fromNode].connections.push(toNode)
          }
        }
      }
    }
  }

  private async setupEmotionDetection(): void {
    // Initialize emotion history buffer
    this.emotionHistory = []
    for (let i = 0; i < 30; i++) {
      this.emotionHistory.push({ ...this.currentEmotion })
    }
  }

  public update(features: AudioFeatures): void {
    // Map audio features to visual parameters
    const mappedParams = this.audioMapper.mapFeatures(features, this.params)
    this.updateParams(mappedParams)

    // Analyze emotion from audio features
    this.analyzeEmotion(features)

    // Update neural network
    this.updateNeuralNetwork()

    // Handle onset events
    if ((mappedParams as any)._onset_emotionSpike) {
      this.triggerEmotionSpike()
    }
    if ((mappedParams as any)._onset_neuralBurst) {
      this.triggerNeuralBurst()
    }
  }

  private analyzeEmotion(features: AudioFeatures): void {
    const params = this.params as MLEmotionParams

    // Simple emotion detection based on audio features
    const energy = features.energy
    const brightness = features.brightness
    const spectralCentroid = features.spectralCentroid || 0
    const zeroCrossingRate = features.zeroCrossingRate || 0

    // Calculate basic emotional dimensions
    const valence = (brightness + (1 - zeroCrossingRate)) / 2 // positive/negative
    const arousal = energy // intensity

    // Map to specific emotions using heuristics
    const newEmotion: EmotionState = {
      joy: Math.max(0, valence * arousal * 2 - 0.5),
      sadness: Math.max(0, (1 - valence) * (1 - arousal)),
      anger: Math.max(0, arousal * (spectralCentroid > 0.7 ? 1 : 0.3) - 0.3),
      fear: Math.max(0, arousal * (1 - valence) * (zeroCrossingRate > 0.5 ? 1 : 0.5) - 0.4),
      calm: Math.max(0, 1 - arousal),
      energy: arousal,
      valence,
      arousal
    }

    // Apply smoothing
    const smoothing = params.emotionSmoothing
    Object.keys(this.currentEmotion).forEach(key => {
      const emotionKey = key as keyof EmotionState
      this.currentEmotion[emotionKey] =
        this.currentEmotion[emotionKey] * smoothing +
        newEmotion[emotionKey] * (1 - smoothing)
    })

    // Update history
    this.emotionHistory.push({ ...this.currentEmotion })
    if (this.emotionHistory.length > 60) {
      this.emotionHistory.shift()
    }
  }

  private updateNeuralNetwork(): void {
    const params = this.params as MLEmotionParams

    // Update node activations based on emotions
    this.neuralNodes.forEach(node => {
      const emotionValue = this.currentEmotion[node.emotion]
      const targetActivation = emotionValue * params.emotionSensitivity

      // Smooth activation changes
      node.activation = node.activation * 0.9 + targetActivation * 0.1
      node.pulsePhase += 0.05 + node.activation * 0.1

      // Apply emergent behavior
      if (params.emergentBehavior > 0.5) {
        const neighborInfluence = node.connections.reduce((sum, connectedIndex) => {
          return sum + this.neuralNodes[connectedIndex]?.activation || 0
        }, 0) / Math.max(1, node.connections.length)

        node.activation = node.activation * 0.8 + neighborInfluence * 0.2 * params.emergentBehavior
      }
    })

    // Update connection strengths
    this.nodeConnections.forEach(connection => {
      const fromNode = this.neuralNodes[connection.from]
      const toNode = this.neuralNodes[connection.to]

      if (fromNode && toNode) {
        // Strengthen connections between highly active nodes
        const activityProduct = fromNode.activation * toNode.activation
        connection.strength = connection.strength * 0.95 + activityProduct * 0.05
      }
    })
  }

  public renderFrame(frame: RenderFrame): void {
    this.time += 1 / 60
    const params = this.params as MLEmotionParams

    // Clear canvas with adaptive background
    this.renderAdaptiveBackground(params)

    // Render neural network
    this.renderNeuralNetwork(params)

    // Render emotion visualization
    this.renderEmotionShapes(params)

    // Render data visualization overlay
    if (params.dataVisualization) {
      this.renderDataOverlay(params)
    }
  }

  private renderAdaptiveBackground(params: MLEmotionParams): void {
    if (!params.adaptiveColoring) {
      this.ctx.fillStyle = '#000'
      this.ctx.fillRect(0, 0, this.config.width, this.config.height)
      return
    }

    // Create gradient based on dominant emotion
    const dominantEmotion = this.getDominantEmotion()
    const emotionColor = this.getEmotionColor(dominantEmotion)

    const gradient = this.ctx.createRadialGradient(
      this.config.width / 2, this.config.height / 2, 0,
      this.config.width / 2, this.config.height / 2, Math.max(this.config.width, this.config.height) / 2
    )

    gradient.addColorStop(0, `${emotionColor}10`)
    gradient.addColorStop(1, '#000000')

    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, this.config.width, this.config.height)
  }

  private renderNeuralNetwork(params: MLEmotionParams): void {
    if (!params.neuralConnections) return

    // Render connections
    this.ctx.strokeStyle = 'rgba(100, 150, 255, 0.3)'
    this.ctx.lineWidth = 1

    this.nodeConnections.forEach(connection => {
      const fromNode = this.neuralNodes[connection.from]
      const toNode = this.neuralNodes[connection.to]

      if (fromNode && toNode && connection.strength > 0.1) {
        this.ctx.globalAlpha = connection.strength * 0.8
        this.ctx.beginPath()
        this.ctx.moveTo(fromNode.x, fromNode.y)
        this.ctx.lineTo(toNode.x, toNode.y)
        this.ctx.stroke()
      }
    })

    this.ctx.globalAlpha = 1

    // Render nodes
    this.neuralNodes.forEach(node => {
      if (node.activation < 0.1) return

      const pulseSize = node.size * (1 + Math.sin(node.pulsePhase) * 0.3)
      const emotionColor = this.getEmotionColor(node.emotion)

      // Node glow
      const gradient = this.ctx.createRadialGradient(
        node.x, node.y, 0,
        node.x, node.y, pulseSize * 2
      )

      gradient.addColorStop(0, `${emotionColor}${Math.floor(node.activation * 255).toString(16).padStart(2, '0')}`)
      gradient.addColorStop(1, 'transparent')

      this.ctx.fillStyle = gradient
      this.ctx.beginPath()
      this.ctx.arc(node.x, node.y, pulseSize * 2, 0, Math.PI * 2)
      this.ctx.fill()

      // Node core
      this.ctx.fillStyle = emotionColor
      this.ctx.globalAlpha = node.activation
      this.ctx.beginPath()
      this.ctx.arc(node.x, node.y, pulseSize, 0, Math.PI * 2)
      this.ctx.fill()
      this.ctx.globalAlpha = 1
    })
  }

  private renderEmotionShapes(params: MLEmotionParams): void {
    const centerX = this.config.width / 2
    const centerY = this.config.height / 2

    // Render shapes based on dominant emotions
    Object.entries(this.currentEmotion).forEach(([emotion, intensity]) => {
      if (intensity < 0.1) return

      const emotionKey = emotion as keyof EmotionState
      this.renderEmotionShape(centerX, centerY, emotionKey, intensity, params)
    })
  }

  private renderEmotionShape(
    x: number, y: number,
    emotion: keyof EmotionState,
    intensity: number,
    params: MLEmotionParams
  ): void {
    const color = this.getEmotionColor(emotion)
    const size = intensity * 100 * params.morphingIntensity

    this.ctx.save()
    this.ctx.globalAlpha = intensity * 0.7

    switch (params.emotionShapes) {
      case 'neural':
        this.renderNeuralShape(x, y, size, color, emotion)
        break
      case 'organic':
        this.renderOrganicShape(x, y, size, color, emotion)
        break
      case 'geometric':
        this.renderGeometricShape(x, y, size, color, emotion)
        break
      case 'fluid':
        this.renderFluidShape(x, y, size, color, emotion)
        break
    }

    this.ctx.restore()
  }

  private renderNeuralShape(x: number, y: number, size: number, color: string, emotion: keyof EmotionState): void {
    // Neural network-inspired branching patterns
    const branches = 6
    const angleStep = (Math.PI * 2) / branches

    this.ctx.strokeStyle = color
    this.ctx.lineWidth = 2
    this.ctx.lineCap = 'round'

    for (let i = 0; i < branches; i++) {
      const angle = i * angleStep + this.time * 0.5
      const length = size * (0.5 + Math.sin(this.time + i) * 0.3)

      this.ctx.beginPath()
      this.ctx.moveTo(x, y)
      this.ctx.lineTo(
        x + Math.cos(angle) * length,
        y + Math.sin(angle) * length
      )
      this.ctx.stroke()

      // Add sub-branches
      const branchX = x + Math.cos(angle) * length * 0.7
      const branchY = y + Math.sin(angle) * length * 0.7

      for (let j = 0; j < 3; j++) {
        const subAngle = angle + (j - 1) * 0.5
        const subLength = length * 0.3

        this.ctx.beginPath()
        this.ctx.moveTo(branchX, branchY)
        this.ctx.lineTo(
          branchX + Math.cos(subAngle) * subLength,
          branchY + Math.sin(subAngle) * subLength
        )
        this.ctx.stroke()
      }
    }
  }

  private renderOrganicShape(x: number, y: number, size: number, color: string, emotion: keyof EmotionState): void {
    // Stub implementation
    this.ctx.fillStyle = color
    this.ctx.beginPath()
    this.ctx.arc(x, y, size, 0, Math.PI * 2)
    this.ctx.fill()
  }

  private renderGeometricShape(x: number, y: number, size: number, color: string, emotion: keyof EmotionState): void {
    // Stub implementation
    this.ctx.fillStyle = color
    this.ctx.fillRect(x - size/2, y - size/2, size, size)
  }

  private renderFluidShape(x: number, y: number, size: number, color: string, emotion: keyof EmotionState): void {
    // Stub implementation
    this.ctx.fillStyle = color
    this.ctx.beginPath()
    this.ctx.arc(x, y, size, 0, Math.PI * 2)
    this.ctx.fill()
  }

  private renderDataOverlay(params: MLEmotionParams): void {
    // Render emotion data as overlay
    const barHeight = 20
    const barWidth = 150
    const startY = 30

    Object.entries(this.currentEmotion).forEach(([emotion, intensity], index) => {
      if (emotion === 'valence' || emotion === 'arousal') return

      const y = startY + index * (barHeight + 5)
      const color = this.getEmotionColor(emotion as keyof EmotionState)

      // Background bar
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
      this.ctx.fillRect(20, y, barWidth, barHeight)

      // Value bar
      this.ctx.fillStyle = color
      this.ctx.fillRect(20, y, barWidth * intensity, barHeight)

      // Label
      this.ctx.fillStyle = 'white'
      this.ctx.font = '12px monospace'
      this.ctx.fillText(emotion.toUpperCase(), 25, y + 14)
    })
  }

  private getDominantEmotion(): keyof EmotionState {
    let maxIntensity = 0
    let dominantEmotion: keyof EmotionState = 'calm'

    Object.entries(this.currentEmotion).forEach(([emotion, intensity]) => {
      if (emotion !== 'valence' && emotion !== 'arousal' && intensity > maxIntensity) {
        maxIntensity = intensity
        dominantEmotion = emotion as keyof EmotionState
      }
    })

    return dominantEmotion
  }

  private getEmotionColor(emotion: keyof EmotionState): string {
    switch (emotion) {
      case 'joy': return '#FFD700'
      case 'sadness': return '#4169E1'
      case 'anger': return '#FF4500'
      case 'fear': return '#9370DB'
      case 'calm': return '#20B2AA'
      case 'energy': return '#FF69B4'
      default: return '#FFFFFF'
    }
  }

  private triggerEmotionSpike(): void {
    // Boost all emotion intensities temporarily
    Object.keys(this.currentEmotion).forEach(key => {
      const emotionKey = key as keyof EmotionState
      this.currentEmotion[emotionKey] = Math.min(1, this.currentEmotion[emotionKey] * 1.5)
    })
  }

  private triggerNeuralBurst(): void {
    // Boost neural node activations
    this.neuralNodes.forEach(node => {
      node.activation = Math.min(1, node.activation * 1.3)
    })
  }

  public dispose(): void {
    super.dispose()
  }
}