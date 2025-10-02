/**
 * Advanced Post-Processing Effects System
 * Implements bloom, motion blur, grain, and other cinematic effects
 */

export interface PostProcessingParams {
  // Bloom effect
  bloomEnabled: boolean
  bloomThreshold: number
  bloomIntensity: number
  bloomRadius: number
  bloomTint: [number, number, number]

  // Motion blur
  motionBlurEnabled: boolean
  motionBlurStrength: number
  motionBlurSamples: number

  // Film grain
  grainEnabled: boolean
  grainAmount: number
  grainSize: number
  grainAnimated: boolean

  // Color grading
  colorGradingEnabled: boolean
  exposure: number
  contrast: number
  highlights: number
  shadows: number
  temperature: number
  tint: number

  // Vignette
  vignetteEnabled: boolean
  vignetteIntensity: number
  vignetteRadius: number
  vignetteSoftness: number

  // Chromatic aberration
  chromaticAberrationEnabled: boolean
  chromaticAberrationIntensity: number

  // Distortion
  distortionEnabled: boolean
  barrelDistortion: number
  pincushionDistortion: number
}

export class PostProcessingEngine {
  private canvas: HTMLCanvasElement | OffscreenCanvas
  private ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  private width: number
  private height: number

  // Render targets for multi-pass rendering
  private renderTargets: Map<string, {
    canvas: HTMLCanvasElement | OffscreenCanvas
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  }> = new Map()

  // Shader-like effect implementations
  private time = 0

  constructor(
    canvas: HTMLCanvasElement | OffscreenCanvas,
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  ) {
    this.canvas = canvas
    this.ctx = ctx
    this.width = canvas.width
    this.height = canvas.height

    this.initializeRenderTargets()
  }

  private initializeRenderTargets(): void {
    const targetNames = ['bloom_bright', 'bloom_blur_h', 'bloom_blur_v', 'motion_blur', 'temp']

    for (const name of targetNames) {
      const targetCanvas = new OffscreenCanvas(this.width, this.height)
      const targetCtx = targetCanvas.getContext('2d')!

      this.renderTargets.set(name, {
        canvas: targetCanvas,
        ctx: targetCtx
      })
    }
  }

  public process(
    sourceImageData: ImageData,
    params: PostProcessingParams,
    deltaTime: number
  ): ImageData {
    this.time += deltaTime

    let currentData = sourceImageData

    // Apply effects in order
    if (params.bloomEnabled) {
      currentData = this.applyBloom(currentData, params)
    }

    if (params.motionBlurEnabled) {
      currentData = this.applyMotionBlur(currentData, params)
    }

    if (params.chromaticAberrationEnabled) {
      currentData = this.applyChromaticAberration(currentData, params)
    }

    if (params.distortionEnabled) {
      currentData = this.applyDistortion(currentData, params)
    }

    if (params.colorGradingEnabled) {
      currentData = this.applyColorGrading(currentData, params)
    }

    if (params.vignetteEnabled) {
      currentData = this.applyVignette(currentData, params)
    }

    if (params.grainEnabled) {
      currentData = this.applyGrain(currentData, params)
    }

    return currentData
  }

  private applyBloom(imageData: ImageData, params: PostProcessingParams): ImageData {
    // Extract bright pixels
    const brightData = this.extractBrightPixels(imageData, params.bloomThreshold)

    // Blur the bright pixels
    const blurredData = this.gaussianBlur(brightData, params.bloomRadius)

    // Combine with original
    return this.additiveBlend(imageData, blurredData, params.bloomIntensity, params.bloomTint)
  }

  private extractBrightPixels(imageData: ImageData, threshold: number): ImageData {
    const data = new Uint8ClampedArray(imageData.data)
    const brightData = new ImageData(data, imageData.width, imageData.height)

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255
      const g = data[i + 1] / 255
      const b = data[i + 2] / 255

      // Calculate luminance
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b

      if (luminance > threshold) {
        // Keep bright pixels, scale by how much they exceed threshold
        const scale = Math.min(1, (luminance - threshold) / (1 - threshold))
        brightData.data[i] = data[i] * scale
        brightData.data[i + 1] = data[i + 1] * scale
        brightData.data[i + 2] = data[i + 2] * scale
        brightData.data[i + 3] = data[i + 3]
      } else {
        // Remove dim pixels
        brightData.data[i] = 0
        brightData.data[i + 1] = 0
        brightData.data[i + 2] = 0
        brightData.data[i + 3] = 0
      }
    }

    return brightData
  }

  private gaussianBlur(imageData: ImageData, radius: number): ImageData {
    const data = new Uint8ClampedArray(imageData.data)
    const result = new ImageData(new Uint8ClampedArray(data), imageData.width, imageData.height)

    // Simplified box blur approximation of Gaussian blur
    const boxSize = Math.ceil(radius)

    // Horizontal pass
    this.boxBlurHorizontal(result, boxSize)

    // Vertical pass
    this.boxBlurVertical(result, boxSize)

    return result
  }

  private boxBlurHorizontal(imageData: ImageData, radius: number): void {
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height
    const temp = new Uint8ClampedArray(data)

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0, count = 0

        for (let dx = -radius; dx <= radius; dx++) {
          const nx = Math.max(0, Math.min(width - 1, x + dx))
          const idx = (y * width + nx) * 4

          r += temp[idx]
          g += temp[idx + 1]
          b += temp[idx + 2]
          a += temp[idx + 3]
          count++
        }

        const idx = (y * width + x) * 4
        data[idx] = r / count
        data[idx + 1] = g / count
        data[idx + 2] = b / count
        data[idx + 3] = a / count
      }
    }
  }

  private boxBlurVertical(imageData: ImageData, radius: number): void {
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height
    const temp = new Uint8ClampedArray(data)

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        let r = 0, g = 0, b = 0, a = 0, count = 0

        for (let dy = -radius; dy <= radius; dy++) {
          const ny = Math.max(0, Math.min(height - 1, y + dy))
          const idx = (ny * width + x) * 4

          r += temp[idx]
          g += temp[idx + 1]
          b += temp[idx + 2]
          a += temp[idx + 3]
          count++
        }

        const idx = (y * width + x) * 4
        data[idx] = r / count
        data[idx + 1] = g / count
        data[idx + 2] = b / count
        data[idx + 3] = a / count
      }
    }
  }

  private additiveBlend(
    base: ImageData,
    overlay: ImageData,
    intensity: number,
    tint: [number, number, number]
  ): ImageData {
    const result = new ImageData(
      new Uint8ClampedArray(base.data),
      base.width,
      base.height
    )

    for (let i = 0; i < result.data.length; i += 4) {
      result.data[i] = Math.min(255, result.data[i] + overlay.data[i] * intensity * tint[0])
      result.data[i + 1] = Math.min(255, result.data[i + 1] + overlay.data[i + 1] * intensity * tint[1])
      result.data[i + 2] = Math.min(255, result.data[i + 2] + overlay.data[i + 2] * intensity * tint[2])
    }

    return result
  }

  private applyMotionBlur(imageData: ImageData, params: PostProcessingParams): ImageData {
    // Simplified motion blur using directional blur
    const result = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    )

    const samples = params.motionBlurSamples
    const strength = params.motionBlurStrength

    // Motion vector (could be enhanced to track actual motion)
    const motionX = Math.sin(this.time * 0.01) * strength
    const motionY = Math.cos(this.time * 0.01) * strength * 0.5

    for (let y = 0; y < imageData.height; y++) {
      for (let x = 0; x < imageData.width; x++) {
        let r = 0, g = 0, b = 0, a = 0

        for (let s = 0; s < samples; s++) {
          const t = (s / (samples - 1) - 0.5) * 2 // -1 to 1
          const sampleX = Math.round(x + motionX * t)
          const sampleY = Math.round(y + motionY * t)

          if (sampleX >= 0 && sampleX < imageData.width &&
              sampleY >= 0 && sampleY < imageData.height) {
            const idx = (sampleY * imageData.width + sampleX) * 4
            r += imageData.data[idx]
            g += imageData.data[idx + 1]
            b += imageData.data[idx + 2]
            a += imageData.data[idx + 3]
          } else {
            // Sample current pixel if out of bounds
            const idx = (y * imageData.width + x) * 4
            r += imageData.data[idx]
            g += imageData.data[idx + 1]
            b += imageData.data[idx + 2]
            a += imageData.data[idx + 3]
          }
        }

        const idx = (y * imageData.width + x) * 4
        result.data[idx] = r / samples
        result.data[idx + 1] = g / samples
        result.data[idx + 2] = b / samples
        result.data[idx + 3] = a / samples
      }
    }

    return result
  }

  private applyGrain(imageData: ImageData, params: PostProcessingParams): ImageData {
    const result = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    )

    const grainSize = params.grainSize
    const grainAmount = params.grainAmount * 255
    const timeOffset = params.grainAnimated ? this.time * 0.01 : 0

    for (let y = 0; y < imageData.height; y += grainSize) {
      for (let x = 0; x < imageData.width; x += grainSize) {
        // Generate grain noise
        const noiseValue = this.noise2D(x * 0.1 + timeOffset, y * 0.1 + timeOffset)
        const grain = (noiseValue - 0.5) * grainAmount

        // Apply grain to block
        for (let dy = 0; dy < grainSize && y + dy < imageData.height; dy++) {
          for (let dx = 0; dx < grainSize && x + dx < imageData.width; dx++) {
            const idx = ((y + dy) * imageData.width + (x + dx)) * 4

            result.data[idx] = Math.max(0, Math.min(255, result.data[idx] + grain))
            result.data[idx + 1] = Math.max(0, Math.min(255, result.data[idx + 1] + grain))
            result.data[idx + 2] = Math.max(0, Math.min(255, result.data[idx + 2] + grain))
          }
        }
      }
    }

    return result
  }

  private applyColorGrading(imageData: ImageData, params: PostProcessingParams): ImageData {
    const result = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    )

    for (let i = 0; i < result.data.length; i += 4) {
      let r = result.data[i] / 255
      let g = result.data[i + 1] / 255
      let b = result.data[i + 2] / 255

      // Apply exposure
      r *= Math.pow(2, params.exposure)
      g *= Math.pow(2, params.exposure)
      b *= Math.pow(2, params.exposure)

      // Apply contrast
      r = (r - 0.5) * params.contrast + 0.5
      g = (g - 0.5) * params.contrast + 0.5
      b = (b - 0.5) * params.contrast + 0.5

      // Apply highlights/shadows (simplified)
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b
      if (luminance > 0.5) {
        // Highlights
        const factor = params.highlights
        r = r + (1 - r) * factor * (luminance - 0.5) * 2
        g = g + (1 - g) * factor * (luminance - 0.5) * 2
        b = b + (1 - b) * factor * (luminance - 0.5) * 2
      } else {
        // Shadows
        const factor = params.shadows
        r = r * (1 + factor * (0.5 - luminance) * 2)
        g = g * (1 + factor * (0.5 - luminance) * 2)
        b = b * (1 + factor * (0.5 - luminance) * 2)
      }

      // Apply temperature and tint (simplified white balance)
      if (params.temperature !== 0) {
        const temp = params.temperature * 0.5
        r += temp
        b -= temp
      }

      if (params.tint !== 0) {
        const tintValue = params.tint * 0.5
        g += tintValue
      }

      // Clamp values
      result.data[i] = Math.max(0, Math.min(255, r * 255))
      result.data[i + 1] = Math.max(0, Math.min(255, g * 255))
      result.data[i + 2] = Math.max(0, Math.min(255, b * 255))
    }

    return result
  }

  private applyVignette(imageData: ImageData, params: PostProcessingParams): ImageData {
    const result = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    )

    const centerX = imageData.width * 0.5
    const centerY = imageData.height * 0.5
    const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY)

    for (let y = 0; y < imageData.height; y++) {
      for (let x = 0; x < imageData.width; x++) {
        const dx = x - centerX
        const dy = y - centerY
        const distance = Math.sqrt(dx * dx + dy * dy)

        let vignette = 1.0
        if (distance > params.vignetteRadius * maxDistance) {
          const falloff = (distance - params.vignetteRadius * maxDistance) /
                         ((1 - params.vignetteRadius) * maxDistance)
          vignette = 1.0 - Math.pow(Math.min(1, falloff), params.vignetteSoftness) * params.vignetteIntensity
        }

        const idx = (y * imageData.width + x) * 4
        result.data[idx] *= vignette
        result.data[idx + 1] *= vignette
        result.data[idx + 2] *= vignette
      }
    }

    return result
  }

  private applyChromaticAberration(imageData: ImageData, params: PostProcessingParams): ImageData {
    const result = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    )

    const strength = params.chromaticAberrationIntensity
    const centerX = imageData.width * 0.5
    const centerY = imageData.height * 0.5

    for (let y = 0; y < imageData.height; y++) {
      for (let x = 0; x < imageData.width; x++) {
        const dx = (x - centerX) / centerX
        const dy = (y - centerY) / centerY
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Sample red channel with outward offset
        const redOffset = strength * distance * 2
        const redX = Math.round(x + dx * redOffset)
        const redY = Math.round(y + dy * redOffset)

        // Sample blue channel with inward offset
        const blueOffset = strength * distance * -2
        const blueX = Math.round(x + dx * blueOffset)
        const blueY = Math.round(y + dy * blueOffset)

        const idx = (y * imageData.width + x) * 4

        // Sample red
        if (redX >= 0 && redX < imageData.width && redY >= 0 && redY < imageData.height) {
          const redIdx = (redY * imageData.width + redX) * 4
          result.data[idx] = imageData.data[redIdx]
        }

        // Keep original green
        result.data[idx + 1] = imageData.data[idx + 1]

        // Sample blue
        if (blueX >= 0 && blueX < imageData.width && blueY >= 0 && blueY < imageData.height) {
          const blueIdx = (blueY * imageData.width + blueX) * 4
          result.data[idx + 2] = imageData.data[blueIdx + 2]
        }

        result.data[idx + 3] = imageData.data[idx + 3]
      }
    }

    return result
  }

  private applyDistortion(imageData: ImageData, params: PostProcessingParams): ImageData {
    const result = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    )

    const centerX = imageData.width * 0.5
    const centerY = imageData.height * 0.5
    const maxRadius = Math.min(centerX, centerY)

    for (let y = 0; y < imageData.height; y++) {
      for (let x = 0; x < imageData.width; x++) {
        const dx = (x - centerX) / maxRadius
        const dy = (y - centerY) / maxRadius
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < 1.0) {
          // Apply barrel/pincushion distortion
          let distortedDistance = distance
          if (params.barrelDistortion !== 0) {
            distortedDistance = distance + params.barrelDistortion * distance * distance * distance
          }
          if (params.pincushionDistortion !== 0) {
            distortedDistance = distance + params.pincushionDistortion * distance * distance * distance
          }

          const factor = distortedDistance / distance
          const sourceX = Math.round(centerX + dx * maxRadius * factor)
          const sourceY = Math.round(centerY + dy * maxRadius * factor)

          if (sourceX >= 0 && sourceX < imageData.width &&
              sourceY >= 0 && sourceY < imageData.height) {
            const sourceIdx = (sourceY * imageData.width + sourceX) * 4
            const targetIdx = (y * imageData.width + x) * 4

            result.data[targetIdx] = imageData.data[sourceIdx]
            result.data[targetIdx + 1] = imageData.data[sourceIdx + 1]
            result.data[targetIdx + 2] = imageData.data[sourceIdx + 2]
            result.data[targetIdx + 3] = imageData.data[sourceIdx + 3]
          }
        }
      }
    }

    return result
  }

  private noise2D(x: number, y: number): number {
    // Simple 2D noise function
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
    return n - Math.floor(n)
  }

  public resize(width: number, height: number): void {
    this.width = width
    this.height = height

    // Recreate render targets with new size
    this.renderTargets.clear()
    this.initializeRenderTargets()
  }

  public dispose(): void {
    this.renderTargets.clear()
  }
}