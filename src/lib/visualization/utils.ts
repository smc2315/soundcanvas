import type { Vector2, Color, Gradient, ColorStop } from './types'

// Math utilities
export const MathUtils = {
  clamp: (value: number, min: number, max: number): number => {
    return Math.max(min, Math.min(max, value))
  },

  lerp: (a: number, b: number, t: number): number => {
    return a + (b - a) * t
  },

  map: (value: number, inMin: number, inMax: number, outMin: number, outMax: number): number => {
    return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin
  },

  smoothstep: (edge0: number, edge1: number, x: number): number => {
    const t = MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1)
    return t * t * (3 - 2 * t)
  },

  distance: (a: Vector2, b: Vector2): number => {
    const dx = b.x - a.x
    const dy = b.y - a.y
    return Math.sqrt(dx * dx + dy * dy)
  },

  normalize: (vector: Vector2): Vector2 => {
    const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y)
    return length > 0 ? { x: vector.x / length, y: vector.y / length } : { x: 0, y: 0 }
  },

  dot: (a: Vector2, b: Vector2): number => {
    return a.x * b.x + a.y * b.y
  },

  rotate: (vector: Vector2, angle: number): Vector2 => {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    return {
      x: vector.x * cos - vector.y * sin,
      y: vector.x * sin + vector.y * cos
    }
  },

  randomBetween: (min: number, max: number): number => {
    return Math.random() * (max - min) + min
  },

  randomNormal: (mean: number = 0, stdDev: number = 1): number => {
    let u = 0, v = 0
    while (u === 0) u = Math.random() // Converting [0,1) to (0,1)
    while (v === 0) v = Math.random()

    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
    return z * stdDev + mean
  },

  easeInOut: (t: number): number => {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  },

  easeIn: (t: number): number => {
    return t * t
  },

  easeOut: (t: number): number => {
    return t * (2 - t)
  }
}

// Color utilities
export const ColorUtils = {
  parseColor: (color: string): Color => {
    if (color.startsWith('#')) {
      const hex = color.slice(1)
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1
      return { r, g, b, a }
    }

    // Handle rgb/rgba strings
    const match = color.match(/rgba?\(([^)]+)\)/)
    if (match) {
      const values = match[1].split(',').map(v => parseFloat(v.trim()))
      return {
        r: values[0],
        g: values[1],
        b: values[2],
        a: values.length > 3 ? values[3] : 1
      }
    }

    // Fallback to white
    return { r: 255, g: 255, b: 255, a: 1 }
  },

  colorToString: (color: Color): string => {
    const { r, g, b, a = 1 } = color
    return a < 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`
  },

  lerp: (colorA: Color, colorB: Color, t: number): Color => {
    return {
      r: Math.round(MathUtils.lerp(colorA.r, colorB.r, t)),
      g: Math.round(MathUtils.lerp(colorA.g, colorB.g, t)),
      b: Math.round(MathUtils.lerp(colorA.b, colorB.b, t)),
      a: MathUtils.lerp(colorA.a || 1, colorB.a || 1, t)
    }
  },

  adjustBrightness: (color: Color, factor: number): Color => {
    return {
      r: Math.round(MathUtils.clamp(color.r * factor, 0, 255)),
      g: Math.round(MathUtils.clamp(color.g * factor, 0, 255)),
      b: Math.round(MathUtils.clamp(color.b * factor, 0, 255)),
      a: color.a
    }
  },

  adjustAlpha: (color: Color, alpha: number): Color => {
    return { ...color, a: MathUtils.clamp(alpha, 0, 1) }
  },

  createGradient: (ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, stops: ColorStop[]): CanvasGradient => {
    const gradient = ctx.createLinearGradient(x0, y0, x1, y1)
    stops.forEach(([position, color]) => {
      gradient.addColorStop(position, color)
    })
    return gradient
  },

  createRadialGradient: (ctx: CanvasRenderingContext2D, x: number, y: number, r0: number, r1: number, stops: ColorStop[]): CanvasGradient => {
    const gradient = ctx.createRadialGradient(x, y, r0, x, y, r1)
    stops.forEach(([position, color]) => {
      gradient.addColorStop(position, color)
    })
    return gradient
  },

  hsvToRgb: (h: number, s: number, v: number): Color => {
    const c = v * s
    const x = c * (1 - Math.abs((h / 60) % 2 - 1))
    const m = v - c

    let r = 0, g = 0, b = 0

    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c
    } else if (h >= 300 && h < 360) {
      r = c; g = 0; b = x
    }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
      a: 1
    }
  },

  rgbToHsv: (color: Color): { h: number, s: number, v: number } => {
    const r = color.r / 255
    const g = color.g / 255
    const b = color.b / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const delta = max - min

    let h = 0
    if (delta !== 0) {
      if (max === r) {
        h = ((g - b) / delta) % 6
      } else if (max === g) {
        h = (b - r) / delta + 2
      } else {
        h = (r - g) / delta + 4
      }
    }
    h = Math.round(h * 60)
    if (h < 0) h += 360

    const s = max === 0 ? 0 : delta / max
    const v = max

    return { h, s, v }
  }
}

// Canvas utilities
export const CanvasUtils = {
  setupHighDPICanvas: (canvas: HTMLCanvasElement): CanvasRenderingContext2D => {
    const ctx = canvas.getContext('2d')!
    const devicePixelRatio = window.devicePixelRatio || 1

    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * devicePixelRatio
    canvas.height = rect.height * devicePixelRatio

    canvas.style.width = rect.width + 'px'
    canvas.style.height = rect.height + 'px'

    ctx.scale(devicePixelRatio, devicePixelRatio)

    return ctx
  },

  clearCanvas: (ctx: CanvasRenderingContext2D, width: number, height: number): void => {
    ctx.clearRect(0, 0, width, height)
  },

  drawCircle: (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, fillStyle?: string | CanvasGradient, strokeStyle?: string): void => {
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)

    if (fillStyle) {
      ctx.fillStyle = fillStyle
      ctx.fill()
    }

    if (strokeStyle) {
      ctx.strokeStyle = strokeStyle
      ctx.stroke()
    }
  },

  drawLine: (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, strokeStyle: string, lineWidth: number = 1): void => {
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.strokeStyle = strokeStyle
    ctx.lineWidth = lineWidth
    ctx.stroke()
  },

  drawPolygon: (ctx: CanvasRenderingContext2D, points: Vector2[], fillStyle?: string | CanvasGradient, strokeStyle?: string): void => {
    if (points.length < 3) return

    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }

    ctx.closePath()

    if (fillStyle) {
      ctx.fillStyle = fillStyle
      ctx.fill()
    }

    if (strokeStyle) {
      ctx.strokeStyle = strokeStyle
      ctx.stroke()
    }
  },

  drawGlowEffect: (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, intensity: number = 1): void => {
    const oldComposite = ctx.globalCompositeOperation
    ctx.globalCompositeOperation = 'lighter'

    const glowRadius = radius * (1 + intensity)
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius)
    gradient.addColorStop(0, color)
    gradient.addColorStop(1, 'transparent')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, glowRadius, 0, Math.PI * 2)
    ctx.fill()

    ctx.globalCompositeOperation = oldComposite
  },

  applyFilter: (ctx: CanvasRenderingContext2D, filter: string): void => {
    ctx.filter = filter
  },

  removeFilter: (ctx: CanvasRenderingContext2D): void => {
    ctx.filter = 'none'
  }
}

// Performance utilities
export const PerformanceUtils = {
  createFrameRateMonitor: () => {
    let frameCount = 0
    let lastTime = performance.now()
    let fps = 0

    return {
      update: (): number => {
        frameCount++
        const currentTime = performance.now()

        if (currentTime - lastTime >= 1000) {
          fps = frameCount
          frameCount = 0
          lastTime = currentTime
        }

        return fps
      },
      getFPS: (): number => fps
    }
  },

  debounce: <T extends (...args: any[]) => any>(func: T, wait: number): T => {
    let timeout: NodeJS.Timeout | null = null

    return ((...args: any[]) => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(null, args), wait)
    }) as T
  },

  throttle: <T extends (...args: any[]) => any>(func: T, limit: number): T => {
    let inThrottle: boolean

    return ((...args: any[]) => {
      if (!inThrottle) {
        func.apply(null, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }) as T
  }
}

// Audio data utilities
export const AudioUtils = {
  normalizeFrequencyData: (data: Uint8Array): number[] => {
    return Array.from(data).map(value => value / 255)
  },

  getAverageFrequency: (data: number[]): number => {
    return data.reduce((sum, value) => sum + value, 0) / data.length
  },

  getPeakFrequency: (data: number[]): number => {
    return Math.max(...data)
  },

  getBandEnergy: (data: number[], startIndex: number, endIndex: number): number => {
    if (startIndex >= endIndex || startIndex < 0 || endIndex > data.length) {
      return 0
    }

    let sum = 0
    for (let i = startIndex; i < endIndex; i++) {
      sum += data[i]
    }

    return sum / (endIndex - startIndex)
  },

  smoothData: (data: number[], factor: number = 0.8): number[] => {
    const smoothed = [...data]

    for (let i = 1; i < smoothed.length - 1; i++) {
      smoothed[i] = data[i] * (1 - factor) +
                   (data[i - 1] + data[i + 1]) * factor * 0.5
    }

    return smoothed
  }
}