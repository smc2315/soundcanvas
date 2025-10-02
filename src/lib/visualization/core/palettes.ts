/**
 * Color palettes and gradient generation system
 * Provides seed-based deterministic color schemes for consistent visual output
 */

import { ColorPalette, GradientSet } from './types'
import { SeededRNG } from './rng'

export const PREDEFINED_PALETTES: ColorPalette[] = [
  // Warm palettes
  {
    id: 'sunset',
    name: 'Sunset Dreams',
    colors: ['#FF6B6B', '#FFE66D', '#FF8E53', '#C44569', '#F8B500'],
    temperature: 'warm',
    mood: 'energetic'
  },
  {
    id: 'fire',
    name: 'Fire & Ember',
    colors: ['#D73027', '#F46D43', '#FDAE61', '#FEE08B', '#E6F598'],
    temperature: 'warm',
    mood: 'dramatic'
  },
  {
    id: 'autumn',
    name: 'Autumn Leaves',
    colors: ['#8B4513', '#CD853F', '#DAA520', '#B8860B', '#FFD700'],
    temperature: 'warm',
    mood: 'calm'
  },

  // Cool palettes
  {
    id: 'ocean',
    name: 'Ocean Depths',
    colors: ['#003f5c', '#2f4b7c', '#665191', '#a05195', '#d45087'],
    temperature: 'cool',
    mood: 'calm'
  },
  {
    id: 'aurora',
    name: 'Aurora Borealis',
    colors: ['#0D7377', '#14A085', '#A7E6CC', '#7FD8BE', '#52D1B4'],
    temperature: 'cool',
    mood: 'mysterious'
  },
  {
    id: 'ice',
    name: 'Frozen Crystals',
    colors: ['#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5'],
    temperature: 'cool',
    mood: 'calm'
  },

  // Neutral palettes
  {
    id: 'monochrome',
    name: 'Monochrome',
    colors: ['#000000', '#404040', '#808080', '#C0C0C0', '#FFFFFF'],
    temperature: 'neutral',
    mood: 'calm'
  },
  {
    id: 'earth',
    name: 'Earth Tones',
    colors: ['#8D6E63', '#A1887F', '#BCAAA4', '#D7CCC8', '#EFEBE9'],
    temperature: 'neutral',
    mood: 'calm'
  },

  // Dramatic palettes
  {
    id: 'neon',
    name: 'Neon Lights',
    colors: ['#FF1744', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5'],
    temperature: 'cool',
    mood: 'energetic'
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    colors: ['#0A0A0A', '#FF00FF', '#00FFFF', '#FFD700', '#FF4500'],
    temperature: 'neutral',
    mood: 'dramatic'
  }
]

export class PaletteGenerator {
  private rng: SeededRNG

  constructor(seed: number) {
    this.rng = new SeededRNG(seed)
  }

  /**
   * Get a predefined palette by ID
   */
  getPalette(id: string): ColorPalette | null {
    return PREDEFINED_PALETTES.find(p => p.id === id) || null
  }

  /**
   * Get palettes by criteria
   */
  getPalettesByMood(mood: ColorPalette['mood']): ColorPalette[] {
    return PREDEFINED_PALETTES.filter(p => p.mood === mood)
  }

  getPalettesByTemperature(temperature: ColorPalette['temperature']): ColorPalette[] {
    return PREDEFINED_PALETTES.filter(p => p.temperature === temperature)
  }

  /**
   * Generate a random palette based on audio characteristics
   */
  generatePalette(audioFeatures: {
    energy: number
    brightness: number
    harmonicity: number
  }): ColorPalette {
    const { energy, brightness, harmonicity } = audioFeatures

    // Determine mood based on audio features
    let mood: ColorPalette['mood']
    if (energy > 0.7) {
      mood = 'energetic'
    } else if (energy < 0.3) {
      mood = 'calm'
    } else if (harmonicity < 0.4) {
      mood = 'mysterious'
    } else {
      mood = 'dramatic'
    }

    // Determine temperature based on brightness
    let temperature: ColorPalette['temperature']
    if (brightness > 0.6) {
      temperature = 'warm'
    } else if (brightness < 0.4) {
      temperature = 'cool'
    } else {
      temperature = 'neutral'
    }

    // Generate base hue based on harmonic content
    const baseHue = Math.floor(harmonicity * 360)

    // Generate complementary colors
    const colors = this.generateHarmonicColors(baseHue, energy, 5)

    return {
      id: `generated_${this.rng.getSeed()}`,
      name: `Generated Palette`,
      colors,
      temperature,
      mood
    }
  }

  /**
   * Generate harmonically related colors
   */
  private generateHarmonicColors(baseHue: number, energy: number, count: number): string[] {
    const colors: string[] = []
    const saturationBase = 70 + energy * 30 // Higher energy = more saturated
    const lightnessBase = 50

    for (let i = 0; i < count; i++) {
      // Use harmonic intervals for pleasing color relationships
      const hueOffset = this.getHarmonicInterval(i) * (1 + energy * 0.5)
      const hue = (baseHue + hueOffset) % 360

      // Vary saturation and lightness slightly
      const saturation = Math.max(20, Math.min(100,
        saturationBase + this.rng.random() * 20 - 10
      ))
      const lightness = Math.max(20, Math.min(80,
        lightnessBase + this.rng.random() * 30 - 15
      ))

      colors.push(this.hslToHex(hue, saturation, lightness))
    }

    return colors
  }

  /**
   * Get harmonic intervals for pleasing color relationships
   */
  private getHarmonicInterval(index: number): number {
    const intervals = [0, 60, 120, 180, 240, 300] // Complementary and triadic
    return intervals[index % intervals.length]
  }

  /**
   * Create gradient set from palette
   */
  createGradientSet(
    palette: ColorPalette,
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    width: number,
    height: number
  ): GradientSet {
    const colors = palette.colors

    // Primary gradient (main visualization)
    const primary = ctx.createLinearGradient(0, 0, width, height)
    for (let i = 0; i < colors.length; i++) {
      primary.addColorStop(i / (colors.length - 1), colors[i])
    }

    // Secondary gradient (accents/highlights)
    const secondary = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) / 2
    )
    for (let i = 0; i < colors.length; i++) {
      secondary.addColorStop(i / (colors.length - 1), colors[colors.length - 1 - i])
    }

    // Accent gradient (bright highlights)
    const accent = ctx.createLinearGradient(0, height, width, 0)
    const brightColors = colors.map(color => this.adjustBrightness(color, 1.3))
    for (let i = 0; i < brightColors.length; i++) {
      accent.addColorStop(i / (brightColors.length - 1), brightColors[i])
    }

    // Background gradient (subtle base)
    const background = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height)
    )
    const darkColors = colors.map(color => this.adjustBrightness(color, 0.3))
    for (let i = 0; i < darkColors.length; i++) {
      background.addColorStop(i / (darkColors.length - 1), darkColors[i])
    }

    return { primary, secondary, accent, background }
  }

  /**
   * Adjust color brightness
   */
  private adjustBrightness(hex: string, factor: number): string {
    const { h, s, l } = this.hexToHsl(hex)
    const newLightness = Math.max(0, Math.min(100, l * factor))
    return this.hslToHex(h, s, newLightness)
  }

  /**
   * Color conversion utilities
   */
  private hslToHex(h: number, s: number, l: number): string {
    l /= 100
    const a = s * Math.min(l, 1 - l) / 100
    const f = (n: number) => {
      const k = (n + h / 30) % 12
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
      return Math.round(255 * color).toString(16).padStart(2, '0')
    }
    return `#${f(0)}${f(8)}${f(4)}`
  }

  private hexToHsl(hex: string): { h: number, s: number, l: number } {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0, s = 0, l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }

    return { h: h * 360, s: s * 100, l: l * 100 }
  }

  /**
   * Get color at specific position in palette (with interpolation)
   */
  getColorAtPosition(palette: ColorPalette, position: number): string {
    position = Math.max(0, Math.min(1, position))

    const colors = palette.colors
    if (colors.length === 0) return '#000000'
    if (colors.length === 1) return colors[0]

    const scaledPos = position * (colors.length - 1)
    const index = Math.floor(scaledPos)
    const fraction = scaledPos - index

    if (index >= colors.length - 1) {
      return colors[colors.length - 1]
    }

    // Interpolate between two colors
    return this.interpolateColors(colors[index], colors[index + 1], fraction)
  }

  /**
   * Interpolate between two hex colors
   */
  private interpolateColors(color1: string, color2: string, factor: number): string {
    const c1 = this.hexToRgb(color1)
    const c2 = this.hexToRgb(color2)

    const r = Math.round(c1.r + (c2.r - c1.r) * factor)
    const g = Math.round(c1.g + (c2.g - c1.g) * factor)
    const b = Math.round(c1.b + (c2.b - c1.b) * factor)

    return this.rgbToHex(r, g, b)
  }

  private hexToRgb(hex: string): { r: number, g: number, b: number } {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b }
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  /**
   * Create analogous color variations
   */
  createAnalogousColors(baseColor: string, count: number = 5): string[] {
    const { h, s, l } = this.hexToHsl(baseColor)
    const colors: string[] = []

    const hueStep = 30 // Degrees
    const startHue = h - (hueStep * (count - 1)) / 2

    for (let i = 0; i < count; i++) {
      const newHue = (startHue + i * hueStep + 360) % 360
      colors.push(this.hslToHex(newHue, s, l))
    }

    return colors
  }

  /**
   * Create complementary color scheme
   */
  createComplementaryColors(baseColor: string): { base: string, complement: string, triadic: string[] } {
    const { h, s, l } = this.hexToHsl(baseColor)

    return {
      base: baseColor,
      complement: this.hslToHex((h + 180) % 360, s, l),
      triadic: [
        baseColor,
        this.hslToHex((h + 120) % 360, s, l),
        this.hslToHex((h + 240) % 360, s, l)
      ]
    }
  }
}