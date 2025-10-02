/**
 * High-resolution image export system
 * Supports PNG, JPEG, WebP with quality control and super-resolution
 */

import { Visualizer, ExportOptions } from '../visualization/core/types'

export interface ImageExportOptions extends ExportOptions {
  format: 'png' | 'jpeg' | 'webp'
  quality: number
  width: number
  height: number
  antialiasing: boolean
  highQuality: boolean
  superSample: number // Multiplier for super-sampling anti-aliasing
}

export class ImageExporter {
  private visualizer: Visualizer

  constructor(visualizer: Visualizer) {
    this.visualizer = visualizer
  }

  /**
   * Export current frame as high-resolution image
   */
  async exportCurrentFrame(options: Partial<ImageExportOptions> = {}): Promise<Blob> {
    const opts: ImageExportOptions = {
      format: 'png',
      quality: 1.0,
      width: 3840, // 4K width
      height: 2160, // 4K height
      antialiasing: true,
      highQuality: true,
      useOfflineRendering: false,
      superSample: options.highQuality ? 2 : 1,
      ...options
    }

    return await this.renderHighResolution(opts)
  }

  /**
   * Export multiple frames as image sequence
   */
  async exportFrameSequence(
    timeRange: { start: number; end: number; fps: number },
    options: Partial<ImageExportOptions> = {}
  ): Promise<Blob[]> {
    const opts: ImageExportOptions = {
      format: 'png',
      quality: 0.95,
      width: 1920,
      height: 1080,
      antialiasing: true,
      highQuality: false,
      useOfflineRendering: true,
      superSample: 1,
      ...options
    }

    const frames: Blob[] = []
    const totalFrames = Math.ceil((timeRange.end - timeRange.start) * timeRange.fps)
    const timeStep = 1 / timeRange.fps

    for (let i = 0; i < totalFrames; i++) {
      const currentTime = timeRange.start + i * timeStep

      // Seek to specific time
      this.visualizer.seek(currentTime)

      // Render frame
      const frameBlob = await this.renderHighResolution(opts)
      frames.push(frameBlob)

      // Progress callback could be added here
    }

    return frames
  }

  /**
   * Render at high resolution with super-sampling
   */
  private async renderHighResolution(options: ImageExportOptions): Promise<Blob> {
    const actualWidth = options.width * options.superSample
    const actualHeight = options.height * options.superSample

    // Create high-resolution canvas
    let exportCanvas: HTMLCanvasElement | OffscreenCanvas
    if (typeof OffscreenCanvas !== 'undefined') {
      exportCanvas = new OffscreenCanvas(actualWidth, actualHeight)
    } else {
      exportCanvas = document.createElement('canvas')
      exportCanvas.width = actualWidth
      exportCanvas.height = actualHeight
    }

    const exportCtx = exportCanvas.getContext('2d')
    if (!exportCtx) {
      throw new Error('Failed to get export canvas context')
    }

    // Configure high-quality rendering
    if (options.antialiasing) {
      exportCtx.imageSmoothingEnabled = true
      exportCtx.imageSmoothingQuality = 'high'
    }

    // Scale context for super-sampling
    if (options.superSample > 1) {
      exportCtx.scale(options.superSample, options.superSample)
    }

    // Store original visualizer settings
    const originalState = this.visualizer.getState()

    try {
      // Create temporary high-resolution visualizer instance
      const tempVisualizer = await this.createHighResVisualizer(exportCanvas, options)

      // Copy current parameters
      tempVisualizer.updateParams(this.visualizer.getParams())

      // Render current frame
      const frame = {
        frameIndex: originalState.frameCount,
        timePosition: originalState.currentTime,
        canvas: exportCanvas,
        context: exportCtx,
        features: {} as any, // Would be populated with actual audio features
        params: tempVisualizer.getParams()
      }

      tempVisualizer.renderFrame(frame)

      // If super-sampling was used, scale down for final image
      let finalCanvas = exportCanvas
      if (options.superSample > 1) {
        finalCanvas = await this.scaleDown(exportCanvas, options.width, options.height)
      }

      // Convert to blob with specified format and quality
      return await this.canvasToBlob(finalCanvas, options)

    } catch (error) {
      throw new Error(`High-resolution rendering failed: ${error}`)
    }
  }

  /**
   * Create a temporary high-resolution visualizer instance
   */
  private async createHighResVisualizer(
    canvas: HTMLCanvasElement | OffscreenCanvas,
    options: ImageExportOptions
  ): Promise<Visualizer> {
    // This would create a new instance of the same visualizer type
    // For now, we'll assume we can clone the visualizer
    // In a real implementation, you'd use a factory pattern

    const config = {
      width: options.width,
      height: options.height,
      pixelRatio: 1,
      fps: 60,
      backgroundColor: '#000000',
      seed: Date.now()
    }

    // Create new visualizer instance (this would be done via factory)
    const tempVisualizer = Object.create(Object.getPrototypeOf(this.visualizer))
    await tempVisualizer.init(canvas, config)

    return tempVisualizer
  }

  /**
   * Scale down super-sampled canvas
   */
  private async scaleDown(
    sourceCanvas: HTMLCanvasElement | OffscreenCanvas,
    targetWidth: number,
    targetHeight: number
  ): Promise<HTMLCanvasElement | OffscreenCanvas> {
    let scaledCanvas: HTMLCanvasElement | OffscreenCanvas
    if (typeof OffscreenCanvas !== 'undefined') {
      scaledCanvas = new OffscreenCanvas(targetWidth, targetHeight)
    } else {
      scaledCanvas = document.createElement('canvas')
      scaledCanvas.width = targetWidth
      scaledCanvas.height = targetHeight
    }

    const scaledCtx = scaledCanvas.getContext('2d')!
    scaledCtx.imageSmoothingEnabled = true
    scaledCtx.imageSmoothingQuality = 'high'

    scaledCtx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight)

    return scaledCanvas
  }

  /**
   * Convert canvas to blob with specified format and quality
   */
  private async canvasToBlob(
    canvas: HTMLCanvasElement | OffscreenCanvas,
    options: ImageExportOptions
  ): Promise<Blob> {
    const mimeType = `image/${options.format}`

    if ('convertToBlob' in canvas) {
      // OffscreenCanvas
      return await canvas.convertToBlob({
        type: mimeType,
        quality: options.quality
      })
    } else {
      // HTMLCanvasElement
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to convert canvas to blob'))
            }
          },
          mimeType,
          options.quality
        )
      })
    }
  }

  /**
   * Generate filename with timestamp and format
   */
  generateFilename(options: ImageExportOptions, prefix: string = 'soundcanvas'): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const resolution = `${options.width}x${options.height}`
    return `${prefix}_${timestamp}_${resolution}.${options.format}`
  }

  /**
   * Download blob as file (browser only)
   */
  downloadBlob(blob: Blob, filename: string): void {
    if (typeof window === 'undefined') {
      throw new Error('Download is only available in browser environment')
    }

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up
    URL.revokeObjectURL(url)
  }

  /**
   * Get optimal export settings based on use case
   */
  static getPresetOptions(preset: 'web' | 'print' | 'social' | 'wallpaper'): Partial<ImageExportOptions> {
    switch (preset) {
      case 'web':
        return {
          format: 'jpeg',
          quality: 0.85,
          width: 1920,
          height: 1080,
          highQuality: false,
          superSample: 1
        }

      case 'print':
        return {
          format: 'png',
          quality: 1.0,
          width: 3840,
          height: 2160,
          highQuality: true,
          superSample: 2
        }

      case 'social':
        return {
          format: 'jpeg',
          quality: 0.9,
          width: 1080,
          height: 1080,
          highQuality: false,
          superSample: 1
        }

      case 'wallpaper':
        return {
          format: 'png',
          quality: 1.0,
          width: 2560,
          height: 1440,
          highQuality: true,
          superSample: 1
        }

      default:
        return {}
    }
  }

  /**
   * Estimate file size based on export options
   */
  estimateFileSize(options: ImageExportOptions): number {
    const pixels = options.width * options.height

    switch (options.format) {
      case 'png':
        // PNG is typically 3-4 bytes per pixel for full color
        return pixels * 3.5

      case 'jpeg':
        // JPEG varies greatly with quality
        const qualityFactor = options.quality * 0.1 + 0.05 // 0.05 to 0.15
        return pixels * qualityFactor

      case 'webp':
        // WebP is typically more efficient than JPEG
        const webpFactor = options.quality * 0.08 + 0.04 // 0.04 to 0.12
        return pixels * webpFactor

      default:
        return pixels * 0.1
    }
  }
}