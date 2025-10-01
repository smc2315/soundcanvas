import type { VisualizationData } from '../audio/types'

export type VisualizationStyle = 'mandala' | 'inkflow' | 'neongrid'

export interface VisualizationConfig {
  style: VisualizationStyle
  width: number
  height: number
  backgroundColor: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  sensitivity: number
  smoothing: number
  scale: number
}

export interface MandalaConfig extends VisualizationConfig {
  style: 'mandala'
  symmetry: number
  radiusMultiplier: number
  rotationSpeed: number
  petals: number
  innerRadius: number
  outerRadius: number
}

export interface InkFlowConfig extends VisualizationConfig {
  style: 'inkflow'
  viscosity: number
  dispersion: number
  fadeRate: number
  particleCount: number
  flowSpeed: number
  turbulence: number
}

export interface NeonGridConfig extends VisualizationConfig {
  style: 'neongrid'
  gridSize: number
  glowIntensity: number
  pulsation: number
  lineWidth: number
  nodeSize: number
  connectionDistance: number
}

export interface VisualizationFrame {
  timestamp: number
  frameNumber: number
  audioData: VisualizationData
  visualizationData: any // Style-specific data
}

export interface RenderingContext {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  centerX: number
  centerY: number
  devicePixelRatio: number
  time: number
  deltaTime: number
}

export interface ParticleSystem {
  particles: Particle[]
  maxParticles: number
  emissionRate: number
  gravity: Vector2
  wind: Vector2
}

export interface Particle {
  position: Vector2
  velocity: Vector2
  acceleration: Vector2
  life: number
  maxLife: number
  size: number
  color: string
  alpha: number
  rotation: number
  rotationSpeed: number
}

export interface Vector2 {
  x: number
  y: number
}

export interface Color {
  r: number
  g: number
  b: number
  a?: number
}

export interface VisualizationExportOptions {
  format: 'png' | 'jpeg' | 'webp'
  quality: number
  width: number
  height: number
  transparent: boolean
}

export interface FrameOverlayConfig {
  type: 'simple' | 'wood' | 'metal' | 'neon' | 'antique'
  width: number
  color: string
  texture?: string
  glow?: boolean
  reflection?: boolean
}

// Performance monitoring
export interface PerformanceMetrics {
  fps: number
  frameTime: number
  averageFrameTime: number
  droppedFrames: number
  memoryUsage: number
  renderTime: number
  lastUpdate: number
}

// Visualization renderer interface
export interface VisualizationRenderer {
  initialize(canvas: HTMLCanvasElement, config: VisualizationConfig): void
  render(audioData: VisualizationData, deltaTime: number): void
  resize(width: number, height: number): void
  dispose(): void
  getConfig(): VisualizationConfig
  updateConfig(config: Partial<VisualizationConfig>): void
  exportFrame(options?: Partial<VisualizationExportOptions>): Promise<Blob>
}

// Utility types
export type ColorStop = [number, string] // [position, color]
export type Gradient = ColorStop[]

export interface AnimationState {
  progress: number
  duration: number
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
  startTime: number
  endTime: number
  isComplete: boolean
}