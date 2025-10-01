import type { VisualizationStyle, VisualizationConfig, VisualizationRenderer } from './types'
import { MandalaRenderer } from './renderers/mandala-renderer'
import { InkFlowRenderer } from './renderers/inkflow-renderer'
import { NeonGridRenderer } from './renderers/neongrid-renderer'

export class VisualizationFactory {
  private static readonly rendererMap = new Map<VisualizationStyle, new (config?: any) => VisualizationRenderer>([
    ['mandala', MandalaRenderer],
    ['inkflow', InkFlowRenderer],
    ['neongrid', NeonGridRenderer]
  ])

  static createRenderer(style: VisualizationStyle, config?: Partial<VisualizationConfig>): VisualizationRenderer {
    const RendererClass = this.rendererMap.get(style)

    if (!RendererClass) {
      throw new Error(`Unknown visualization style: ${style}`)
    }

    return new RendererClass(config)
  }

  static getSupportedStyles(): VisualizationStyle[] {
    return Array.from(this.rendererMap.keys())
  }

  static getDefaultConfig(style: VisualizationStyle): VisualizationConfig {
    const baseConfig: VisualizationConfig = {
      style,
      width: 800,
      height: 800,
      backgroundColor: '#000000',
      primaryColor: '#00F5FF',
      secondaryColor: '#9D4EDD',
      accentColor: '#FF6EC7',
      sensitivity: 1,
      smoothing: 0.8,
      scale: 1
    }

    switch (style) {
      case 'mandala':
        return {
          ...baseConfig,
          style: 'mandala',
          symmetry: 8,
          radiusMultiplier: 1.5,
          rotationSpeed: 0.02,
          petals: 12,
          innerRadius: 50,
          outerRadius: 300
        } as any

      case 'inkflow':
        return {
          ...baseConfig,
          style: 'inkflow',
          viscosity: 0.8,
          dispersion: 1.2,
          fadeRate: 0.95,
          particleCount: 200,
          flowSpeed: 1,
          turbulence: 0.5
        } as any

      case 'neongrid':
        return {
          ...baseConfig,
          style: 'neongrid',
          gridSize: 32,
          glowIntensity: 0.7,
          pulsation: 1.1,
          lineWidth: 2,
          nodeSize: 4,
          connectionDistance: 80
        } as any

      default:
        return baseConfig
    }
  }

  static getStyleDescription(style: VisualizationStyle): string {
    const descriptions = {
      mandala: 'Symmetrical patterns inspired by traditional mandalas, creating beautiful radiating designs that respond to different frequency ranges',
      inkflow: 'Organic, fluid-like particles that flow and disperse based on audio dynamics, creating painterly effects reminiscent of ink in water',
      neongrid: 'Futuristic geometric patterns with glowing nodes and connections that pulse and react to the rhythm and intensity of your audio'
    }

    return descriptions[style] || 'Unknown visualization style'
  }

  static getStylePreview(style: VisualizationStyle): {
    thumbnail: string
    colors: string[]
    features: string[]
  } {
    const previews = {
      mandala: {
        thumbnail: '/previews/mandala-preview.png',
        colors: ['#00F5FF', '#9D4EDD', '#FF6EC7'],
        features: [
          'Symmetrical radial patterns',
          'Frequency-responsive petals',
          'Rotating animations',
          'Multiple concentric layers'
        ]
      },
      inkflow: {
        thumbnail: '/previews/inkflow-preview.png',
        colors: ['#00F5FF', '#9D4EDD', '#FF6EC7'],
        features: [
          'Fluid particle systems',
          'Organic flow patterns',
          'Dynamic color mixing',
          'Viscous liquid effects'
        ]
      },
      neongrid: {
        thumbnail: '/previews/neongrid-preview.png',
        colors: ['#00F5FF', '#9D4EDD', '#FF6EC7'],
        features: [
          'Geometric grid structure',
          'Pulsing neon effects',
          'Energy wave propagation',
          'Interconnected nodes'
        ]
      }
    }

    return previews[style] || {
      thumbnail: '/previews/default-preview.png',
      colors: ['#00F5FF'],
      features: ['Unknown style']
    }
  }

  static validateConfig(style: VisualizationStyle, config: Partial<VisualizationConfig>): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // Common validations
    if (config.width && (config.width < 100 || config.width > 4096)) {
      errors.push('Width must be between 100 and 4096 pixels')
    }

    if (config.height && (config.height < 100 || config.height > 4096)) {
      errors.push('Height must be between 100 and 4096 pixels')
    }

    if (config.sensitivity && (config.sensitivity < 0.1 || config.sensitivity > 5)) {
      warnings.push('Sensitivity should be between 0.1 and 5 for optimal results')
    }

    if (config.smoothing && (config.smoothing < 0 || config.smoothing > 1)) {
      errors.push('Smoothing must be between 0 and 1')
    }

    // Style-specific validations
    switch (style) {
      case 'mandala':
        if ('symmetry' in config && config.symmetry && (config.symmetry < 3 || config.symmetry > 32)) {
          warnings.push('Mandala symmetry should be between 3 and 32 for best visual results')
        }
        if ('petals' in config && config.petals && (config.petals < 4 || config.petals > 50)) {
          warnings.push('Petal count should be between 4 and 50')
        }
        break

      case 'inkflow':
        if ('viscosity' in config && config.viscosity && (config.viscosity < 0.1 || config.viscosity > 1)) {
          errors.push('Viscosity must be between 0.1 and 1')
        }
        if ('particleCount' in config && config.particleCount && (config.particleCount < 10 || config.particleCount > 1000)) {
          warnings.push('Particle count should be between 10 and 1000 for optimal performance')
        }
        break

      case 'neongrid':
        if ('gridSize' in config && config.gridSize && (config.gridSize < 8 || config.gridSize > 128)) {
          warnings.push('Grid size should be between 8 and 128 pixels')
        }
        if ('glowIntensity' in config && config.glowIntensity && (config.glowIntensity < 0 || config.glowIntensity > 2)) {
          warnings.push('Glow intensity should be between 0 and 2')
        }
        break
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  static optimizeConfigForDevice(
    style: VisualizationStyle,
    config: VisualizationConfig,
    deviceInfo: {
      isMobile: boolean
      lowPowerMode: boolean
      memoryLimited: boolean
    }
  ): VisualizationConfig {
    const optimizedConfig = { ...config }

    if (deviceInfo.isMobile || deviceInfo.lowPowerMode) {
      // Reduce particle counts and complexity for mobile
      switch (style) {
        case 'inkflow':
          if ('particleCount' in optimizedConfig) {
            optimizedConfig.particleCount = Math.min(optimizedConfig.particleCount || 200, 100)
          }
          break

        case 'neongrid':
          if ('gridSize' in optimizedConfig) {
            optimizedConfig.gridSize = Math.max(optimizedConfig.gridSize || 32, 40)
          }
          break

        case 'mandala':
          if ('petals' in optimizedConfig) {
            optimizedConfig.petals = Math.min(optimizedConfig.petals || 12, 8)
          }
          break
      }

      // Reduce sensitivity and increase smoothing for better performance
      optimizedConfig.sensitivity = Math.min(optimizedConfig.sensitivity, 0.8)
      optimizedConfig.smoothing = Math.max(optimizedConfig.smoothing, 0.9)
    }

    if (deviceInfo.memoryLimited) {
      // Further reduce complexity for memory-limited devices
      optimizedConfig.scale = Math.min(optimizedConfig.scale, 0.8)
    }

    return optimizedConfig
  }
}