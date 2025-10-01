export type FrameStyle = 'none' | 'simple' | 'wood' | 'metal' | 'neon' | 'antique'

export interface FrameConfig {
  style: FrameStyle
  width: number
  color?: string
  glowIntensity?: number
}

export class FrameRenderer {
  /**
   * Renders a frame overlay on the given canvas context
   */
  static renderFrame(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    config: FrameConfig
  ): void {
    if (config.style === 'none') return

    const frameWidth = config.width || Math.floor(Math.min(width, height) * 0.05)

    ctx.save()

    switch (config.style) {
      case 'simple':
        this.renderSimpleFrame(ctx, width, height, frameWidth, config.color)
        break

      case 'wood':
        this.renderWoodFrame(ctx, width, height, frameWidth)
        break

      case 'metal':
        this.renderMetalFrame(ctx, width, height, frameWidth)
        break

      case 'neon':
        this.renderNeonFrame(ctx, width, height, frameWidth, config.glowIntensity)
        break

      case 'antique':
        this.renderAntiqueFrame(ctx, width, height, frameWidth)
        break
    }

    ctx.restore()
  }

  private static renderSimpleFrame(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    frameWidth: number,
    color = '#FFFFFF'
  ): void {
    ctx.strokeStyle = color
    ctx.lineWidth = frameWidth
    ctx.strokeRect(
      frameWidth / 2,
      frameWidth / 2,
      width - frameWidth,
      height - frameWidth
    )
  }

  private static renderWoodFrame(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    frameWidth: number
  ): void {
    // Wood base color
    ctx.fillStyle = '#8B4513'

    // Top
    ctx.fillRect(0, 0, width, frameWidth)
    // Bottom
    ctx.fillRect(0, height - frameWidth, width, frameWidth)
    // Left
    ctx.fillRect(0, 0, frameWidth, height)
    // Right
    ctx.fillRect(width - frameWidth, 0, frameWidth, height)

    // Add wood grain texture effect
    ctx.save()
    ctx.globalAlpha = 0.3

    // Create wood grain lines
    ctx.strokeStyle = '#654321'
    ctx.lineWidth = 2

    for (let i = 0; i < 5; i++) {
      const y = (frameWidth / 6) * (i + 1)

      // Top frame grain
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()

      // Bottom frame grain
      ctx.beginPath()
      ctx.moveTo(0, height - frameWidth + y)
      ctx.lineTo(width, height - frameWidth + y)
      ctx.stroke()
    }

    for (let i = 0; i < 5; i++) {
      const x = (frameWidth / 6) * (i + 1)

      // Left frame grain
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()

      // Right frame grain
      ctx.beginPath()
      ctx.moveTo(width - frameWidth + x, 0)
      ctx.lineTo(width - frameWidth + x, height)
      ctx.stroke()
    }

    ctx.restore()
  }

  private static renderMetalFrame(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    frameWidth: number
  ): void {
    // Create metallic gradient
    const gradient = ctx.createLinearGradient(0, 0, frameWidth, frameWidth)
    gradient.addColorStop(0, '#E6E6E6')
    gradient.addColorStop(0.3, '#C0C0C0')
    gradient.addColorStop(0.7, '#A0A0A0')
    gradient.addColorStop(1, '#808080')

    ctx.fillStyle = gradient

    // Top
    ctx.fillRect(0, 0, width, frameWidth)
    // Bottom
    ctx.fillRect(0, height - frameWidth, width, frameWidth)
    // Left
    ctx.fillRect(0, 0, frameWidth, height)
    // Right
    ctx.fillRect(width - frameWidth, 0, frameWidth, height)

    // Add metallic highlights
    ctx.save()
    ctx.globalAlpha = 0.6

    const highlightGradient = ctx.createLinearGradient(0, 0, frameWidth, 0)
    highlightGradient.addColorStop(0, 'transparent')
    highlightGradient.addColorStop(0.5, '#FFFFFF')
    highlightGradient.addColorStop(1, 'transparent')

    ctx.fillStyle = highlightGradient

    // Add highlight strips
    const stripWidth = frameWidth / 4
    ctx.fillRect(stripWidth, stripWidth, width - stripWidth * 2, stripWidth)
    ctx.fillRect(stripWidth, height - stripWidth * 2, width - stripWidth * 2, stripWidth)
    ctx.fillRect(stripWidth, stripWidth, stripWidth, height - stripWidth * 2)
    ctx.fillRect(width - stripWidth * 2, stripWidth, stripWidth, height - stripWidth * 2)

    ctx.restore()
  }

  private static renderNeonFrame(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    frameWidth: number,
    glowIntensity = 1
  ): void {
    const neonColor = '#00F5FF'
    const innerWidth = frameWidth / 3

    ctx.save()

    // Create neon glow effect
    ctx.shadowBlur = frameWidth * glowIntensity
    ctx.shadowColor = neonColor
    ctx.strokeStyle = neonColor
    ctx.lineWidth = innerWidth

    // Outer glow
    ctx.strokeRect(
      frameWidth / 2,
      frameWidth / 2,
      width - frameWidth,
      height - frameWidth
    )

    // Inner bright line
    ctx.shadowBlur = frameWidth / 4
    ctx.lineWidth = innerWidth / 2
    ctx.strokeRect(
      frameWidth / 2,
      frameWidth / 2,
      width - frameWidth,
      height - frameWidth
    )

    // Core bright line
    ctx.shadowBlur = 0
    ctx.lineWidth = 1
    ctx.strokeStyle = '#FFFFFF'
    ctx.strokeRect(
      frameWidth / 2,
      frameWidth / 2,
      width - frameWidth,
      height - frameWidth
    )

    ctx.restore()

    // Add corner accents
    this.renderNeonCorners(ctx, width, height, frameWidth, neonColor)
  }

  private static renderNeonCorners(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    frameWidth: number,
    color: string
  ): void {
    const cornerSize = frameWidth * 1.5
    const offset = frameWidth / 2

    ctx.save()
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.shadowBlur = 10
    ctx.shadowColor = color

    // Top-left corner
    ctx.beginPath()
    ctx.moveTo(offset + cornerSize, offset)
    ctx.lineTo(offset, offset)
    ctx.lineTo(offset, offset + cornerSize)
    ctx.stroke()

    // Top-right corner
    ctx.beginPath()
    ctx.moveTo(width - offset - cornerSize, offset)
    ctx.lineTo(width - offset, offset)
    ctx.lineTo(width - offset, offset + cornerSize)
    ctx.stroke()

    // Bottom-left corner
    ctx.beginPath()
    ctx.moveTo(offset, height - offset - cornerSize)
    ctx.lineTo(offset, height - offset)
    ctx.lineTo(offset + cornerSize, height - offset)
    ctx.stroke()

    // Bottom-right corner
    ctx.beginPath()
    ctx.moveTo(width - offset - cornerSize, height - offset)
    ctx.lineTo(width - offset, height - offset)
    ctx.lineTo(width - offset, height - offset - cornerSize)
    ctx.stroke()

    ctx.restore()
  }

  private static renderAntiqueFrame(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    frameWidth: number
  ): void {
    // Base antique gold color
    const baseColor = '#DAA520'
    const accentColor = '#FFD700'

    ctx.fillStyle = baseColor

    // Top
    ctx.fillRect(0, 0, width, frameWidth)
    // Bottom
    ctx.fillRect(0, height - frameWidth, width, frameWidth)
    // Left
    ctx.fillRect(0, 0, frameWidth, height)
    // Right
    ctx.fillRect(width - frameWidth, 0, frameWidth, height)

    // Add decorative corners
    const cornerSize = frameWidth * 1.5
    ctx.fillStyle = accentColor

    // Corner decorations
    ctx.fillRect(0, 0, cornerSize, cornerSize)
    ctx.fillRect(width - cornerSize, 0, cornerSize, cornerSize)
    ctx.fillRect(0, height - cornerSize, cornerSize, cornerSize)
    ctx.fillRect(width - cornerSize, height - cornerSize, cornerSize, cornerSize)

    // Add ornate patterns
    this.renderAntiquePattern(ctx, width, height, frameWidth, accentColor)

    // Add aged effect
    ctx.save()
    ctx.globalAlpha = 0.3
    ctx.fillStyle = '#8B4513'

    // Random aging spots
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * width
      const y = Math.random() * height
      const size = Math.random() * 5 + 2

      // Only draw on frame areas
      if ((x < frameWidth || x > width - frameWidth) ||
          (y < frameWidth || y > height - frameWidth)) {
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    ctx.restore()
  }

  private static renderAntiquePattern(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    frameWidth: number,
    color: string
  ): void {
    ctx.save()
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.7

    const patternSize = frameWidth / 6

    // Top border pattern
    for (let x = frameWidth; x < width - frameWidth; x += patternSize * 2) {
      ctx.beginPath()
      ctx.arc(x, frameWidth / 2, patternSize / 2, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Bottom border pattern
    for (let x = frameWidth; x < width - frameWidth; x += patternSize * 2) {
      ctx.beginPath()
      ctx.arc(x, height - frameWidth / 2, patternSize / 2, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Left border pattern
    for (let y = frameWidth; y < height - frameWidth; y += patternSize * 2) {
      ctx.beginPath()
      ctx.arc(frameWidth / 2, y, patternSize / 2, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Right border pattern
    for (let y = frameWidth; y < height - frameWidth; y += patternSize * 2) {
      ctx.beginPath()
      ctx.arc(width - frameWidth / 2, y, patternSize / 2, 0, Math.PI * 2)
      ctx.stroke()
    }

    ctx.restore()
  }

  /**
   * Gets the default configuration for a frame style
   */
  static getDefaultConfig(style: FrameStyle, canvasSize: { width: number; height: number }): FrameConfig {
    const baseWidth = Math.floor(Math.min(canvasSize.width, canvasSize.height) * 0.05)

    switch (style) {
      case 'simple':
        return { style, width: baseWidth, color: '#FFFFFF' }

      case 'wood':
        return { style, width: Math.floor(baseWidth * 1.2) }

      case 'metal':
        return { style, width: baseWidth }

      case 'neon':
        return { style, width: Math.floor(baseWidth * 0.8), glowIntensity: 1 }

      case 'antique':
        return { style, width: Math.floor(baseWidth * 1.5) }

      default:
        return { style: 'none', width: 0 }
    }
  }

  /**
   * Calculates the content area after frame is applied
   */
  static getContentArea(
    canvasWidth: number,
    canvasHeight: number,
    frameConfig: FrameConfig
  ): { x: number; y: number; width: number; height: number } {
    if (frameConfig.style === 'none') {
      return { x: 0, y: 0, width: canvasWidth, height: canvasHeight }
    }

    const frameWidth = frameConfig.width
    return {
      x: frameWidth,
      y: frameWidth,
      width: canvasWidth - frameWidth * 2,
      height: canvasHeight - frameWidth * 2
    }
  }
}