import { StyleConfig } from '@/components/visualization/style-picker'

export type VisualizationStyle = 'mandala' | 'inkflow' | 'neongrid'

export class VisualizationRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private animationId: number | null = null
  private style: VisualizationStyle
  private config: StyleConfig
  private hasLoggedFirstRender: boolean = false

  constructor(canvas: HTMLCanvasElement, style: VisualizationStyle) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas')
    }
    this.ctx = ctx
    this.style = style
    this.config = {
      sensitivity: 1,
      smoothing: 0.8,
      scale: 1
    }
  }

  /**
   * Update the renderer configuration
   */
  updateConfig(config: StyleConfig): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Generate a static image based on audio analysis
   */
  generateStaticImage(audioAnalysis: { frequencyData: Uint8Array, amplitude: number, duration: number }): void {
    console.log('🎨 GENERATING STATIC IMAGE!', {
      style: this.style,
      canvasSize: `${this.canvas.width}x${this.canvas.height}`,
      dataLength: audioAnalysis.frequencyData.length,
      amplitude: audioAnalysis.amplitude,
      duration: audioAnalysis.duration
    })

    // Clear the canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // Use duration and amplitude to create a unique composition
    const compositionSeed = audioAnalysis.duration * audioAnalysis.amplitude

    // Create elegant background gradient based on style and audio characteristics
    const bgGradient = this.createStaticBackground(audioAnalysis)
    this.ctx.fillStyle = bgGradient
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // Generate static composition based on entire audio analysis
    this.renderStaticVisualization(audioAnalysis, compositionSeed)
  }

  /**
   * Render a single frame of the visualization (legacy animated method)
   */
  render(frequencyData: Uint8Array, amplitude: number, timestamp: number): void {
    // Only log on first render and occasionally to avoid spam
    if (!this.hasLoggedFirstRender || Math.floor(timestamp) % 5000 < 50) {
      console.log('🎨 RENDERER CALLED!', {
        style: this.style,
        canvasSize: `${this.canvas.width}x${this.canvas.height}`,
        dataLength: frequencyData.length,
        amplitude
      })
      this.hasLoggedFirstRender = true
    }

    // Clear the canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // Create elegant background gradient based on style
    const bgGradient = this.createStyledBackground(timestamp)
    this.ctx.fillStyle = bgGradient
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // Add subtle particle effects
    this.drawBackgroundParticles(timestamp)

    // Simple demo visualization based on style
    this.renderVisualization(frequencyData, amplitude, timestamp)
  }

  private createStaticBackground(audioAnalysis: { frequencyData: Uint8Array, amplitude: number, duration: number }): CanvasGradient {
    const centerX = this.canvas.width / 2
    const centerY = this.canvas.height / 2
    const maxRadius = Math.max(this.canvas.width, this.canvas.height) / 2

    // Create more sophisticated gradient with multiple focal points
    const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius)

    // Use audio characteristics to influence colors with richer palette
    const bassInfluence = this.calculateBandAverage(audioAnalysis.frequencyData, 0, 0.1)
    const midInfluence = this.calculateBandAverage(audioAnalysis.frequencyData, 0.1, 0.6)
    const trebleInfluence = this.calculateBandAverage(audioAnalysis.frequencyData, 0.6, 1.0)

    switch (this.style) {
      case 'mandala':
        // Rich, mystical colors with golden undertones
        const goldHue = Math.floor(bassInfluence * 30 + 25) // Golden tones
        const deepPurple = Math.floor(midInfluence * 40 + 20) // Deep purple
        const warmRed = Math.floor(trebleInfluence * 25 + 15) // Warm red

        gradient.addColorStop(0, `rgba(${goldHue + 10}, ${warmRed}, ${deepPurple * 0.3}, 0.98)`)
        gradient.addColorStop(0.2, `rgba(${goldHue + 20}, ${warmRed + 5}, ${deepPurple * 0.5}, 0.95)`)
        gradient.addColorStop(0.4, `rgba(${goldHue}, ${warmRed * 0.8}, ${deepPurple * 0.7}, 0.92)`)
        gradient.addColorStop(0.7, `rgba(${goldHue * 0.6}, ${warmRed * 0.4}, ${deepPurple}, 0.88)`)
        gradient.addColorStop(1, `rgba(8, 4, ${Math.floor(deepPurple * 0.8)}, 0.98)`)
        break

      case 'inkflow':
        // Ethereal blues and purples like aurora
        const oceanBlue = Math.floor(trebleInfluence * 35 + 15)
        const mysticalPurple = Math.floor(bassInfluence * 40 + 25)
        const shimmerCyan = Math.floor(midInfluence * 25 + 10)

        gradient.addColorStop(0, `rgba(${shimmerCyan}, ${oceanBlue}, ${mysticalPurple + 15}, 0.98)`)
        gradient.addColorStop(0.25, `rgba(${shimmerCyan + 10}, ${oceanBlue + 10}, ${mysticalPurple + 20}, 0.94)`)
        gradient.addColorStop(0.5, `rgba(${shimmerCyan + 5}, ${oceanBlue + 15}, ${mysticalPurple + 10}, 0.90)`)
        gradient.addColorStop(0.75, `rgba(${shimmerCyan * 0.7}, ${oceanBlue + 5}, ${mysticalPurple}, 0.86)`)
        gradient.addColorStop(1, `rgba(5, ${Math.floor(oceanBlue * 0.5)}, ${Math.floor(mysticalPurple * 0.8)}, 0.98)`)
        break

      case 'neongrid':
        // Cyberpunk neon colors with electric feel
        const neonCyan = Math.floor(midInfluence * 40 + 20)
        const electricPink = Math.floor(trebleInfluence * 35 + 25)
        const vividPurple = Math.floor(bassInfluence * 30 + 20)

        gradient.addColorStop(0, `rgba(${electricPink * 0.3}, ${neonCyan}, ${vividPurple + 15}, 0.98)`)
        gradient.addColorStop(0.2, `rgba(${electricPink * 0.5}, ${neonCyan + 15}, ${vividPurple + 20}, 0.95)`)
        gradient.addColorStop(0.4, `rgba(${electricPink * 0.7}, ${neonCyan + 10}, ${vividPurple + 10}, 0.92)`)
        gradient.addColorStop(0.7, `rgba(${electricPink * 0.4}, ${neonCyan}, ${vividPurple}, 0.88)`)
        gradient.addColorStop(1, `rgba(2, ${Math.floor(neonCyan * 0.3)}, ${Math.floor(vividPurple * 0.7)}, 0.98)`)
        break
    }

    return gradient
  }

  private calculateBandAverage(frequencyData: Uint8Array, startRatio: number, endRatio: number): number {
    const startIndex = Math.floor(startRatio * frequencyData.length)
    const endIndex = Math.floor(endRatio * frequencyData.length)
    let sum = 0
    let count = 0

    for (let i = startIndex; i < endIndex && i < frequencyData.length; i++) {
      sum += frequencyData[i]
      count++
    }

    return count > 0 ? (sum / count) / 255 : 0
  }

  private renderStaticVisualization(audioAnalysis: { frequencyData: Uint8Array, amplitude: number, duration: number }, seed: number): void {
    const centerX = this.canvas.width / 2
    const centerY = this.canvas.height / 2
    const scale = this.config.scale
    const sensitivity = this.config.sensitivity

    // Create a static composition based on the entire audio analysis
    switch (this.style) {
      case 'mandala':
        this.renderStaticMandala(centerX, centerY, audioAnalysis, seed, scale, sensitivity)
        break
      case 'inkflow':
        this.renderStaticInkflow(centerX, centerY, audioAnalysis, seed, scale, sensitivity)
        break
      case 'neongrid':
        this.renderStaticNeonGrid(centerX, centerY, audioAnalysis, seed, scale, sensitivity)
        break
    }
  }

  private createStyledBackground(timestamp: number): CanvasGradient {
    const centerX = this.canvas.width / 2
    const centerY = this.canvas.height / 2
    const maxRadius = Math.max(this.canvas.width, this.canvas.height) / 2

    const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius)

    switch (this.style) {
      case 'mandala':
        // Deep mystical gradient with golden undertones
        gradient.addColorStop(0, 'rgba(15, 5, 25, 0.95)')
        gradient.addColorStop(0.3, 'rgba(25, 15, 35, 0.9)')
        gradient.addColorStop(0.6, 'rgba(35, 25, 45, 0.85)')
        gradient.addColorStop(1, 'rgba(5, 0, 15, 0.98)')
        break
      case 'inkflow':
        // Fluid, organic gradient with purple-blue tones
        gradient.addColorStop(0, 'rgba(10, 5, 20, 0.95)')
        gradient.addColorStop(0.4, 'rgba(20, 10, 30, 0.9)')
        gradient.addColorStop(0.7, 'rgba(15, 20, 35, 0.85)')
        gradient.addColorStop(1, 'rgba(5, 10, 25, 0.98)')
        break
      case 'neongrid':
        // Electric, cyberpunk gradient
        gradient.addColorStop(0, 'rgba(5, 15, 25, 0.95)')
        gradient.addColorStop(0.3, 'rgba(10, 25, 35, 0.9)')
        gradient.addColorStop(0.6, 'rgba(5, 20, 30, 0.85)')
        gradient.addColorStop(1, 'rgba(0, 10, 20, 0.98)')
        break
    }

    return gradient
  }

  private drawBackgroundParticles(timestamp: number): void {
    const particleCount = 30
    this.ctx.save()

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.sin(timestamp * 0.0001 + i * 0.5) + 1) * this.canvas.width * 0.5
      const y = (Math.cos(timestamp * 0.0002 + i * 0.3) + 1) * this.canvas.height * 0.5
      const size = Math.sin(timestamp * 0.003 + i) * 2 + 3
      const opacity = Math.sin(timestamp * 0.002 + i * 0.7) * 0.3 + 0.1

      this.ctx.beginPath()
      this.ctx.arc(x, y, size, 0, Math.PI * 2)
      this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
      this.ctx.fill()
    }

    this.ctx.restore()
  }

  private renderVisualization(frequencyData: Uint8Array, amplitude: number, timestamp: number): void {
    const centerX = this.canvas.width / 2
    const centerY = this.canvas.height / 2
    const scale = this.config.scale
    const sensitivity = this.config.sensitivity

    // Create a simplified visualization for demo purposes
    switch (this.style) {
      case 'mandala':
        this.renderMandala(centerX, centerY, frequencyData, amplitude, timestamp, scale, sensitivity)
        break
      case 'inkflow':
        this.renderInkflow(centerX, centerY, frequencyData, amplitude, timestamp, scale, sensitivity)
        break
      case 'neongrid':
        this.renderNeonGrid(centerX, centerY, frequencyData, amplitude, timestamp, scale, sensitivity)
        break
    }
  }

  private renderMandala(centerX: number, centerY: number, frequencyData: Uint8Array, amplitude: number, timestamp: number, scale: number, sensitivity: number): void {
    this.ctx.save()

    // Abstract expressionist brush strokes radiating from center
    const brushStrokes = 40
    const maxRadius = Math.min(centerX, centerY) * 0.9 * scale

    // Create organic, painterly background washes
    this.drawAbstractWashes(centerX, centerY, amplitude, timestamp, maxRadius)

    // Main abstract composition with expressive brush strokes
    for (let stroke = 0; stroke < brushStrokes; stroke++) {
      const freqIndex = Math.floor((stroke / brushStrokes) * frequencyData.length)
      const freqValue = frequencyData[freqIndex] || (60 + Math.sin(timestamp * 0.007 + stroke) * 50)
      const intensity = Math.max(0.2, (freqValue / 255) * sensitivity)

      // Create organic, non-geometric angles
      const baseAngle = (stroke / brushStrokes) * Math.PI * 2
      const angleVariation = Math.sin(timestamp * 0.002 + stroke * 0.7) * 1.2
      const angle = baseAngle + angleVariation

      // Expressive brush stroke properties
      const strokeLength = maxRadius * (0.3 + intensity * 0.6) * (0.8 + Math.sin(timestamp * 0.004 + stroke) * 0.4)
      const strokeWidth = 2 + intensity * 15 + Math.sin(timestamp * 0.006 + stroke * 0.5) * 8
      const opacity = intensity * (0.6 + Math.sin(timestamp * 0.003 + stroke) * 0.3)

      // Artistic color palette - warm and cool contrasts
      const colorPhase = timestamp * 0.001 + stroke * 0.3
      const hue1 = 25 + Math.sin(colorPhase) * 40 // Warm oranges/reds
      const hue2 = 200 + Math.cos(colorPhase * 1.3) * 50 // Cool blues/cyans
      const mixRatio = Math.sin(timestamp * 0.005 + stroke * 0.4) * 0.5 + 0.5
      const finalHue = hue1 * mixRatio + hue2 * (1 - mixRatio)

      // Create expressive brush stroke path
      this.drawExpressionistStroke(centerX, centerY, angle, strokeLength, strokeWidth,
                                   finalHue, opacity, intensity, timestamp + stroke)
    }

    // Add spontaneous paint splatters
    this.drawPaintSplatters(centerX, centerY, amplitude, timestamp, frequencyData, sensitivity)

    // Abstract central focal point
    this.drawAbstractCenter(centerX, centerY, amplitude, timestamp)

    this.ctx.restore()
  }

  private drawAbstractWashes(centerX: number, centerY: number, amplitude: number, timestamp: number, maxRadius: number): void {
    const washes = 8

    for (let wash = 0; wash < washes; wash++) {
      const washRadius = maxRadius * (0.2 + wash * 0.15) * (1 + amplitude * 0.3)
      const washOpacity = (1 - wash * 0.1) * 0.3 * amplitude

      // Organic, watercolor-like shapes
      const centerOffset = Math.sin(timestamp * 0.001 + wash) * 50
      const washX = centerX + Math.cos(wash * 2) * centerOffset
      const washY = centerY + Math.sin(wash * 1.7) * centerOffset

      const washGradient = this.ctx.createRadialGradient(washX, washY, 0, washX, washY, washRadius)

      // Earth tones and deep colors
      const hue = 15 + wash * 45 + timestamp * 0.01
      washGradient.addColorStop(0, `hsla(${hue}, 70%, 45%, ${washOpacity})`)
      washGradient.addColorStop(0.4, `hsla(${hue + 20}, 60%, 35%, ${washOpacity * 0.7})`)
      washGradient.addColorStop(1, `hsla(${hue + 40}, 50%, 25%, 0)`)

      this.ctx.fillStyle = washGradient
      this.ctx.beginPath()
      this.ctx.arc(washX, washY, washRadius, 0, Math.PI * 2)
      this.ctx.fill()
    }
  }

  private drawExpressionistStroke(centerX: number, centerY: number, angle: number, length: number,
                                  width: number, hue: number, opacity: number, intensity: number, phase: number): void {
    // Create organic brush stroke path
    const segments = 8
    const segmentLength = length / segments

    this.ctx.beginPath()

    let currentX = centerX
    let currentY = centerY
    let currentAngle = angle

    this.ctx.moveTo(currentX, currentY)

    for (let seg = 0; seg < segments; seg++) {
      // Add organic variation to each segment
      const variation = Math.sin(phase * 0.01 + seg * 0.5) * 0.3
      currentAngle += variation

      const nextX = currentX + Math.cos(currentAngle) * segmentLength * (1 + Math.sin(phase * 0.005 + seg) * 0.3)
      const nextY = currentY + Math.sin(currentAngle) * segmentLength * (1 + Math.cos(phase * 0.007 + seg) * 0.3)

      // Create curved, expressive strokes
      const controlX = (currentX + nextX) / 2 + Math.sin(phase * 0.003 + seg) * 30
      const controlY = (currentY + nextY) / 2 + Math.cos(phase * 0.004 + seg) * 30

      this.ctx.quadraticCurveTo(controlX, controlY, nextX, nextY)

      currentX = nextX
      currentY = nextY
    }

    // Apply painterly stroke style
    const strokeGradient = this.ctx.createLinearGradient(centerX, centerY, currentX, currentY)
    strokeGradient.addColorStop(0, `hsla(${hue}, 80%, 60%, ${opacity})`)
    strokeGradient.addColorStop(0.5, `hsla(${hue + 30}, 85%, 65%, ${opacity * 0.8})`)
    strokeGradient.addColorStop(1, `hsla(${hue + 60}, 70%, 45%, ${opacity * 0.4})`)

    this.ctx.strokeStyle = strokeGradient
    this.ctx.lineWidth = width * (0.7 + intensity * 0.6)
    this.ctx.lineCap = 'round'
    this.ctx.lineJoin = 'round'
    this.ctx.stroke()
  }

  private drawPaintSplatters(centerX: number, centerY: number, amplitude: number, timestamp: number,
                           frequencyData: Uint8Array, sensitivity: number): void {
    const splatters = 15

    for (let splat = 0; splat < splatters; splat++) {
      const freqIndex = Math.floor((splat / splatters) * frequencyData.length)
      const freqValue = frequencyData[freqIndex] || (30 + Math.sin(timestamp * 0.01 + splat) * 40)
      const intensity = (freqValue / 255) * sensitivity

      if (intensity < 0.4) continue

      // Random splatter positions with organic distribution
      const angle = Math.random() * Math.PI * 2
      const distance = Math.random() * 200 * amplitude
      const splatX = centerX + Math.cos(angle) * distance
      const splatY = centerY + Math.sin(angle) * distance

      const splatSize = 2 + intensity * 12 + Math.random() * 8
      const splatOpacity = intensity * 0.7

      // Artistic splatter colors
      const splatHue = Math.random() * 60 + 300 + timestamp * 0.02 // Purples and magentas

      const splatGradient = this.ctx.createRadialGradient(splatX, splatY, 0, splatX, splatY, splatSize)
      splatGradient.addColorStop(0, `hsla(${splatHue}, 90%, 70%, ${splatOpacity})`)
      splatGradient.addColorStop(0.7, `hsla(${splatHue + 20}, 80%, 50%, ${splatOpacity * 0.6})`)
      splatGradient.addColorStop(1, `hsla(${splatHue + 40}, 70%, 30%, 0)`)

      this.ctx.fillStyle = splatGradient
      this.ctx.beginPath()
      this.ctx.arc(splatX, splatY, splatSize, 0, Math.PI * 2)
      this.ctx.fill()
    }
  }

  private drawAbstractCenter(centerX: number, centerY: number, amplitude: number, timestamp: number): void {
    // Abstract, non-geometric center composition
    const layers = 5

    for (let layer = 0; layer < layers; layer++) {
      const layerRadius = (20 + layer * 8) * (1 + amplitude * 0.8)
      const layerOpacity = (1 - layer * 0.15) * amplitude
      const rotation = timestamp * 0.0008 * (layer % 2 === 0 ? 1 : -1)

      this.ctx.save()
      this.ctx.translate(centerX, centerY)
      this.ctx.rotate(rotation)

      // Create abstract, organic center shape
      this.ctx.beginPath()
      const points = 6 + layer
      for (let p = 0; p < points; p++) {
        const pointAngle = (p / points) * Math.PI * 2
        const radiusVariation = 1 + Math.sin(timestamp * 0.005 + p + layer) * 0.4
        const pointRadius = layerRadius * radiusVariation

        const x = Math.cos(pointAngle) * pointRadius
        const y = Math.sin(pointAngle) * pointRadius

        if (p === 0) {
          this.ctx.moveTo(x, y)
        } else {
          // Create flowing, curved connections
          const prevAngle = ((p - 1) / points) * Math.PI * 2
          const prevRadius = layerRadius * (1 + Math.sin(timestamp * 0.005 + (p - 1) + layer) * 0.4)
          const prevX = Math.cos(prevAngle) * prevRadius
          const prevY = Math.sin(prevAngle) * prevRadius

          const controlX = (prevX + x) / 2 * 1.3
          const controlY = (prevY + y) / 2 * 1.3

          this.ctx.quadraticCurveTo(controlX, controlY, x, y)
        }
      }
      this.ctx.closePath()

      // Artistic center colors - deep, rich tones
      const centerHue = 280 + layer * 20 + timestamp * 0.03
      const centerGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, layerRadius)
      centerGradient.addColorStop(0, `hsla(${centerHue}, 90%, 80%, ${layerOpacity})`)
      centerGradient.addColorStop(0.6, `hsla(${centerHue + 30}, 85%, 60%, ${layerOpacity * 0.7})`)
      centerGradient.addColorStop(1, `hsla(${centerHue + 60}, 80%, 40%, 0)`)

      this.ctx.fillStyle = centerGradient
      this.ctx.fill()

      this.ctx.restore()
    }
  }

  private renderInkflow(centerX: number, centerY: number, frequencyData: Uint8Array, amplitude: number, timestamp: number, scale: number, sensitivity: number): void {
    this.ctx.save()

    // Abstract fluid art inspired by Jackson Pollock and contemporary digital art
    const maxRadius = Math.min(centerX, centerY) * 0.95 * scale

    // Create organic paint drips and flows
    this.drawFluidDrops(centerX, centerY, amplitude, timestamp, maxRadius, frequencyData, sensitivity)

    // Add abstract paint textures
    this.drawPaintTextures(centerX, centerY, amplitude, timestamp, maxRadius)

    // Create flowing organic lines
    this.drawOrganicFlows(centerX, centerY, timestamp, frequencyData, sensitivity, maxRadius)

    // Add color field washes
    this.drawColorFields(centerX, centerY, amplitude, timestamp, maxRadius)

    this.ctx.restore()
  }

  private drawFluidDrops(centerX: number, centerY: number, amplitude: number, timestamp: number,
                        maxRadius: number, frequencyData: Uint8Array, sensitivity: number): void {
    const dropSources = 8

    for (let source = 0; source < dropSources; source++) {
      const freqIndex = Math.floor((source / dropSources) * frequencyData.length)
      const freqValue = frequencyData[freqIndex] || (40 + Math.sin(timestamp * 0.006 + source) * 50)
      const intensity = Math.max(0.3, (freqValue / 255) * sensitivity)

      // Source position with organic movement
      const sourceAngle = (source / dropSources) * Math.PI * 2 + timestamp * 0.0003
      const sourceDistance = Math.sin(timestamp * 0.002 + source) * 80 + 120
      const sourceX = centerX + Math.cos(sourceAngle) * sourceDistance
      const sourceY = centerY + Math.sin(sourceAngle) * sourceDistance

      // Create fluid drops flowing from source
      const dropCount = Math.floor(5 + intensity * 15)
      for (let drop = 0; drop < dropCount; drop++) {
        const dropProgress = drop / dropCount
        const dropLife = (timestamp * 0.002 + source + drop * 0.1) % 1

        // Gravity and flow physics simulation
        const gravityEffect = dropLife * dropLife * 200
        const horizontalDrift = Math.sin(timestamp * 0.003 + drop) * 100 * dropLife

        const dropX = sourceX + horizontalDrift
        const dropY = sourceY + gravityEffect

        // Skip drops that have flowed off canvas
        if (dropY > centerY + maxRadius) continue

        const dropSize = (2 + intensity * 8) * (1 - dropLife * 0.7)
        const dropOpacity = intensity * (1 - dropLife) * 0.8

        // Artistic color mixing - earth tones and vibrant accents
        const baseHue = 220 + source * 30 + timestamp * 0.02
        const colorVariation = Math.sin(timestamp * 0.005 + drop) * 60
        const dropHue = baseHue + colorVariation

        // Create realistic paint drop with transparency
        const dropGradient = this.ctx.createRadialGradient(dropX, dropY, 0, dropX, dropY, dropSize * 1.5)
        dropGradient.addColorStop(0, `hsla(${dropHue}, 85%, 65%, ${dropOpacity})`)
        dropGradient.addColorStop(0.6, `hsla(${dropHue + 20}, 75%, 55%, ${dropOpacity * 0.7})`)
        dropGradient.addColorStop(1, `hsla(${dropHue + 40}, 65%, 45%, 0)`)

        this.ctx.fillStyle = dropGradient
        this.ctx.beginPath()

        // Create organic drop shape (not perfect circle)
        const dropPoints = 8
        this.ctx.moveTo(dropX + dropSize, dropY)
        for (let p = 1; p <= dropPoints; p++) {
          const angle = (p / dropPoints) * Math.PI * 2
          const radiusVariation = 1 + Math.sin(angle * 3 + timestamp * 0.01) * 0.2
          const px = dropX + Math.cos(angle) * dropSize * radiusVariation
          const py = dropY + Math.sin(angle) * dropSize * radiusVariation * (1 + gravityEffect * 0.001)
          this.ctx.lineTo(px, py)
        }
        this.ctx.closePath()
        this.ctx.fill()

        // Add paint trail
        if (drop > 0 && dropLife > 0.1) {
          const prevDropY = sourceY + (dropLife - 0.1) * (dropLife - 0.1) * 200
          const prevDropX = sourceX + Math.sin(timestamp * 0.003 + drop) * 100 * (dropLife - 0.1)

          this.ctx.beginPath()
          this.ctx.moveTo(prevDropX, prevDropY)
          this.ctx.lineTo(dropX, dropY)
          this.ctx.strokeStyle = `hsla(${dropHue}, 70%, 50%, ${dropOpacity * 0.5})`
          this.ctx.lineWidth = dropSize * 0.3
          this.ctx.lineCap = 'round'
          this.ctx.stroke()
        }
      }
    }
  }

  private drawPaintTextures(centerX: number, centerY: number, amplitude: number, timestamp: number, maxRadius: number): void {
    // Create abstract paint texture areas
    const textureAreas = 12

    for (let area = 0; area < textureAreas; area++) {
      const areaX = centerX + (Math.sin(timestamp * 0.001 + area) * maxRadius * 0.6)
      const areaY = centerY + (Math.cos(timestamp * 0.0007 + area * 1.3) * maxRadius * 0.6)
      const areaSize = 30 + Math.sin(timestamp * 0.003 + area) * 40 + amplitude * 50

      // Create rough, organic texture shapes
      this.ctx.beginPath()
      const texturePoints = 12
      let firstPoint = true

      for (let p = 0; p < texturePoints; p++) {
        const angle = (p / texturePoints) * Math.PI * 2
        const radiusNoise = 1 + Math.sin(timestamp * 0.004 + p + area) * 0.6
        const pointRadius = areaSize * radiusNoise
        const px = areaX + Math.cos(angle) * pointRadius
        const py = areaY + Math.sin(angle) * pointRadius

        if (firstPoint) {
          this.ctx.moveTo(px, py)
          firstPoint = false
        } else {
          // Add some randomness to create organic edges
          const controlRadius = pointRadius * 0.7
          const controlAngle = angle - Math.PI / texturePoints
          const cpx = areaX + Math.cos(controlAngle) * controlRadius
          const cpy = areaY + Math.sin(controlAngle) * controlRadius
          this.ctx.quadraticCurveTo(cpx, cpy, px, py)
        }
      }
      this.ctx.closePath()

      // Rich, layered colors
      const textureHue = area * 45 + timestamp * 0.015
      const textureGradient = this.ctx.createRadialGradient(areaX, areaY, 0, areaX, areaY, areaSize)
      textureGradient.addColorStop(0, `hsla(${textureHue}, 70%, 60%, ${amplitude * 0.3})`)
      textureGradient.addColorStop(0.7, `hsla(${textureHue + 40}, 60%, 45%, ${amplitude * 0.2})`)
      textureGradient.addColorStop(1, `hsla(${textureHue + 80}, 50%, 30%, 0)`)

      this.ctx.fillStyle = textureGradient
      this.ctx.fill()
    }
  }

  private drawOrganicFlows(centerX: number, centerY: number, timestamp: number,
                          frequencyData: Uint8Array, sensitivity: number, maxRadius: number): void {
    const flowLines = 20

    for (let line = 0; line < flowLines; line++) {
      const freqIndex = Math.floor((line / flowLines) * frequencyData.length)
      const freqValue = frequencyData[freqIndex] || (50 + Math.sin(timestamp * 0.008 + line) * 40)
      const intensity = Math.max(0.2, (freqValue / 255) * sensitivity)

      // Start from random edge positions
      const startAngle = (line / flowLines) * Math.PI * 2 + timestamp * 0.0002
      const startRadius = maxRadius * 0.8
      const startX = centerX + Math.cos(startAngle) * startRadius
      const startY = centerY + Math.sin(startAngle) * startRadius

      // Flow toward center with organic curves
      const flowSegments = 15
      this.ctx.beginPath()
      this.ctx.moveTo(startX, startY)

      let currentX = startX
      let currentY = startY

      for (let seg = 0; seg < flowSegments; seg++) {
        const segmentProgress = seg / flowSegments
        const flowDirection = Math.atan2(centerY - currentY, centerX - currentX)

        // Add organic deviation
        const deviation = Math.sin(timestamp * 0.003 + line + seg) * 0.8 +
                         Math.cos(timestamp * 0.005 + line * 2 + seg) * 0.5
        const actualDirection = flowDirection + deviation

        const stepSize = (maxRadius * 0.1) * (1 - segmentProgress * 0.3) * intensity
        const nextX = currentX + Math.cos(actualDirection) * stepSize
        const nextY = currentY + Math.sin(actualDirection) * stepSize

        // Create curved flow
        const controlX = (currentX + nextX) / 2 + Math.sin(timestamp * 0.004 + seg) * 20
        const controlY = (currentY + nextY) / 2 + Math.cos(timestamp * 0.004 + seg) * 20

        this.ctx.quadraticCurveTo(controlX, controlY, nextX, nextY)

        currentX = nextX
        currentY = nextY
      }

      // Apply organic flow styling
      const flowHue = 180 + line * 15 + timestamp * 0.02
      const flowGradient = this.ctx.createLinearGradient(startX, startY, currentX, currentY)
      flowGradient.addColorStop(0, `hsla(${flowHue}, 80%, 70%, ${intensity * 0.6})`)
      flowGradient.addColorStop(0.5, `hsla(${flowHue + 30}, 75%, 60%, ${intensity * 0.4})`)
      flowGradient.addColorStop(1, `hsla(${flowHue + 60}, 70%, 50%, ${intensity * 0.2})`)

      this.ctx.strokeStyle = flowGradient
      this.ctx.lineWidth = 1 + intensity * 6
      this.ctx.lineCap = 'round'
      this.ctx.lineJoin = 'round'
      this.ctx.stroke()
    }
  }

  private drawColorFields(centerX: number, centerY: number, amplitude: number, timestamp: number, maxRadius: number): void {
    // Large abstract color field areas like Rothko paintings
    const fields = 6

    for (let field = 0; field < fields; field++) {
      const fieldAngle = (field / fields) * Math.PI * 2 + timestamp * 0.0001
      const fieldDistance = Math.sin(timestamp * 0.002 + field) * maxRadius * 0.4 + maxRadius * 0.3
      const fieldX = centerX + Math.cos(fieldAngle) * fieldDistance
      const fieldY = centerY + Math.sin(fieldAngle) * fieldDistance

      const fieldWidth = maxRadius * (0.3 + amplitude * 0.4)
      const fieldHeight = maxRadius * (0.2 + amplitude * 0.3)

      // Soft, blended rectangular color fields
      const fieldGradient = this.ctx.createRadialGradient(fieldX, fieldY, 0, fieldX, fieldY, Math.max(fieldWidth, fieldHeight))

      const fieldHue = field * 60 + timestamp * 0.01
      fieldGradient.addColorStop(0, `hsla(${fieldHue}, 65%, 55%, ${amplitude * 0.4})`)
      fieldGradient.addColorStop(0.5, `hsla(${fieldHue + 20}, 60%, 45%, ${amplitude * 0.3})`)
      fieldGradient.addColorStop(1, `hsla(${fieldHue + 40}, 55%, 35%, 0)`)

      this.ctx.fillStyle = fieldGradient
      this.ctx.fillRect(fieldX - fieldWidth/2, fieldY - fieldHeight/2, fieldWidth, fieldHeight)
    }
  }

  private renderNeonGrid(centerX: number, centerY: number, frequencyData: Uint8Array, amplitude: number, timestamp: number, scale: number, sensitivity: number): void {
    this.ctx.save()

    // Modern digital art inspired by generative design and data visualization
    const maxRadius = Math.min(centerX, centerY) * 0.9 * scale

    // Create digital noise pattern background
    this.drawDigitalNoise(centerX, centerY, timestamp, maxRadius, amplitude)

    // Generate data visualization streams
    this.drawDataStreams(centerX, centerY, frequencyData, sensitivity, timestamp, maxRadius)

    // Add abstract geometric fragments
    this.drawGeometricFragments(centerX, centerY, amplitude, timestamp, maxRadius)

    // Create digital glitch effects
    this.drawGlitchEffects(centerX, centerY, timestamp, frequencyData, sensitivity, maxRadius)

    // Add holographic overlay patterns
    this.drawHolographicPatterns(centerX, centerY, amplitude, timestamp, maxRadius)

    this.ctx.restore()
  }

  private drawDigitalNoise(centerX: number, centerY: number, timestamp: number, maxRadius: number, amplitude: number): void {
    // Create digital pixel noise pattern
    const noiseResolution = 8
    const noiseSize = maxRadius * 2 / noiseResolution

    for (let x = 0; x < noiseResolution; x++) {
      for (let y = 0; y < noiseResolution; y++) {
        const noiseX = centerX - maxRadius + x * noiseSize
        const noiseY = centerY - maxRadius + y * noiseSize

        // Generate pseudo-random noise value
        const noiseValue = Math.sin(timestamp * 0.003 + x * 7 + y * 13) *
                          Math.cos(timestamp * 0.005 + x * 11 + y * 17) * 0.5 + 0.5

        if (noiseValue > 0.7) { // Only draw significant noise
          const pixelOpacity = (noiseValue - 0.7) * 3.33 * amplitude * 0.3
          const pixelHue = (x + y) * 30 + timestamp * 0.02

          this.ctx.fillStyle = `hsla(${pixelHue}, 80%, 70%, ${pixelOpacity})`
          this.ctx.fillRect(noiseX, noiseY, noiseSize * 0.8, noiseSize * 0.8)
        }
      }
    }
  }

  private drawDataStreams(centerX: number, centerY: number, frequencyData: Uint8Array,
                         sensitivity: number, timestamp: number, maxRadius: number): void {
    const streamCount = 24
    const streamSegments = 30

    for (let stream = 0; stream < streamCount; stream++) {
      const freqIndex = Math.floor((stream / streamCount) * frequencyData.length)
      const freqValue = frequencyData[freqIndex] || (40 + Math.sin(timestamp * 0.007 + stream) * 60)
      const intensity = Math.max(0.1, (freqValue / 255) * sensitivity)

      if (intensity < 0.3) continue

      // Start position on circle edge
      const startAngle = (stream / streamCount) * Math.PI * 2 + timestamp * 0.0005
      const startRadius = maxRadius * 0.9
      let currentX = centerX + Math.cos(startAngle) * startRadius
      let currentY = centerY + Math.sin(startAngle) * startRadius

      // Data stream path points
      const streamPath: { x: number, y: number, intensity: number }[] = []

      for (let seg = 0; seg < streamSegments; seg++) {
        const segmentProgress = seg / streamSegments

        // Flow toward center with digital deviation
        const targetX = centerX + (currentX - centerX) * (1 - segmentProgress * 0.8)
        const targetY = centerY + (currentY - centerY) * (1 - segmentProgress * 0.8)

        // Add digital randomness
        const digitalNoise = Math.sin(timestamp * 0.01 + stream + seg) * 30 * intensity
        const noiseAngle = (stream + seg) * 0.5

        currentX = targetX + Math.cos(noiseAngle) * digitalNoise
        currentY = targetY + Math.sin(noiseAngle) * digitalNoise

        const segmentIntensity = intensity * (1 - segmentProgress * 0.5)
        streamPath.push({ x: currentX, y: currentY, intensity: segmentIntensity })
      }

      // Draw data stream
      this.ctx.beginPath()
      this.ctx.moveTo(streamPath[0].x, streamPath[0].y)

      for (let i = 1; i < streamPath.length; i++) {
        this.ctx.lineTo(streamPath[i].x, streamPath[i].y)
      }

      const streamHue = stream * 15 + timestamp * 0.03
      const streamGradient = this.ctx.createLinearGradient(
        streamPath[0].x, streamPath[0].y,
        streamPath[streamPath.length - 1].x, streamPath[streamPath.length - 1].y
      )
      streamGradient.addColorStop(0, `hsla(${streamHue}, 90%, 80%, ${intensity * 0.8})`)
      streamGradient.addColorStop(0.5, `hsla(${streamHue + 30}, 85%, 70%, ${intensity * 0.6})`)
      streamGradient.addColorStop(1, `hsla(${streamHue + 60}, 80%, 60%, 0)`)

      this.ctx.strokeStyle = streamGradient
      this.ctx.lineWidth = 1 + intensity * 4
      this.ctx.lineCap = 'round'
      this.ctx.stroke()

      // Add data points along stream
      for (let i = 0; i < streamPath.length; i += 3) {
        const point = streamPath[i]
        const pointSize = 2 + point.intensity * 6

        this.ctx.beginPath()
        this.ctx.arc(point.x, point.y, pointSize, 0, Math.PI * 2)
        this.ctx.fillStyle = `hsla(${streamHue + i * 5}, 95%, 85%, ${point.intensity})`
        this.ctx.fill()
      }
    }
  }

  private drawGeometricFragments(centerX: number, centerY: number, amplitude: number,
                                timestamp: number, maxRadius: number): void {
    const fragmentCount = 15

    for (let frag = 0; frag < fragmentCount; frag++) {
      const fragAngle = (frag / fragmentCount) * Math.PI * 2 + timestamp * 0.001
      const fragDistance = Math.sin(timestamp * 0.002 + frag) * maxRadius * 0.6 + maxRadius * 0.4
      const fragX = centerX + Math.cos(fragAngle) * fragDistance
      const fragY = centerY + Math.sin(fragAngle) * fragDistance

      const fragSize = 10 + amplitude * 20 + Math.sin(timestamp * 0.004 + frag) * 15
      const fragRotation = timestamp * 0.002 + frag * 0.7

      this.ctx.save()
      this.ctx.translate(fragX, fragY)
      this.ctx.rotate(fragRotation)

      // Create abstract geometric fragment
      const fragmentType = frag % 4
      const fragHue = frag * 24 + timestamp * 0.025
      const fragOpacity = amplitude * (0.4 + Math.sin(timestamp * 0.003 + frag) * 0.3)

      this.ctx.strokeStyle = `hsla(${fragHue}, 85%, 75%, ${fragOpacity})`
      this.ctx.fillStyle = `hsla(${fragHue}, 80%, 65%, ${fragOpacity * 0.3})`
      this.ctx.lineWidth = 2

      switch (fragmentType) {
        case 0: // Triangle
          this.ctx.beginPath()
          this.ctx.moveTo(0, -fragSize)
          this.ctx.lineTo(-fragSize * 0.8, fragSize * 0.6)
          this.ctx.lineTo(fragSize * 0.8, fragSize * 0.6)
          this.ctx.closePath()
          break
        case 1: // Diamond
          this.ctx.beginPath()
          this.ctx.moveTo(0, -fragSize)
          this.ctx.lineTo(fragSize * 0.7, 0)
          this.ctx.lineTo(0, fragSize)
          this.ctx.lineTo(-fragSize * 0.7, 0)
          this.ctx.closePath()
          break
        case 2: // Cross
          this.ctx.beginPath()
          this.ctx.rect(-fragSize * 0.2, -fragSize, fragSize * 0.4, fragSize * 2)
          this.ctx.rect(-fragSize, -fragSize * 0.2, fragSize * 2, fragSize * 0.4)
          break
        case 3: // Pentagon
          this.ctx.beginPath()
          for (let p = 0; p < 5; p++) {
            const angle = (p / 5) * Math.PI * 2
            const x = Math.cos(angle) * fragSize
            const y = Math.sin(angle) * fragSize
            if (p === 0) this.ctx.moveTo(x, y)
            else this.ctx.lineTo(x, y)
          }
          this.ctx.closePath()
          break
      }

      this.ctx.fill()
      this.ctx.stroke()
      this.ctx.restore()
    }
  }

  private drawGlitchEffects(centerX: number, centerY: number, timestamp: number,
                           frequencyData: Uint8Array, sensitivity: number, maxRadius: number): void {
    const glitchLines = 8

    for (let line = 0; line < glitchLines; line++) {
      const freqIndex = Math.floor((line / glitchLines) * frequencyData.length)
      const freqValue = frequencyData[freqIndex] || (30 + Math.sin(timestamp * 0.009 + line) * 50)
      const intensity = (freqValue / 255) * sensitivity

      if (intensity < 0.5) continue

      // Random glitch displacement
      const glitchY = centerY + (line - glitchLines / 2) * (maxRadius * 0.2)
      const displacement = Math.sin(timestamp * 0.05 + line) * intensity * 40
      const glitchWidth = maxRadius * (0.3 + intensity * 0.5)
      const glitchHeight = 2 + intensity * 6

      // RGB channel separation effect
      const hue = line * 45 + timestamp * 0.02

      // Red channel
      this.ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${intensity * 0.7})`
      this.ctx.fillRect(centerX - glitchWidth / 2 + displacement - 2, glitchY, glitchWidth, glitchHeight)

      // Green channel
      this.ctx.fillStyle = `hsla(${hue + 120}, 100%, 60%, ${intensity * 0.6})`
      this.ctx.fillRect(centerX - glitchWidth / 2 + displacement, glitchY, glitchWidth, glitchHeight)

      // Blue channel
      this.ctx.fillStyle = `hsla(${hue + 240}, 100%, 60%, ${intensity * 0.5})`
      this.ctx.fillRect(centerX - glitchWidth / 2 + displacement + 2, glitchY, glitchWidth, glitchHeight)
    }
  }

  private drawHolographicPatterns(centerX: number, centerY: number, amplitude: number,
                                 timestamp: number, maxRadius: number): void {
    // Create holographic interference patterns
    const patternCount = 6

    for (let pattern = 0; pattern < patternCount; pattern++) {
      const patternRadius = maxRadius * (0.3 + pattern * 0.15)
      const patternOpacity = amplitude * (1 - pattern * 0.15) * 0.4
      const rotationSpeed = 0.001 * (pattern % 2 === 0 ? 1 : -1)

      this.ctx.save()
      this.ctx.translate(centerX, centerY)
      this.ctx.rotate(timestamp * rotationSpeed)

      // Create interference pattern
      this.ctx.beginPath()
      const segments = 64
      for (let seg = 0; seg < segments; seg++) {
        const angle = (seg / segments) * Math.PI * 2
        const waveOffset = Math.sin(angle * 8 + timestamp * 0.005) * 0.3
        const radius = patternRadius * (1 + waveOffset)

        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius

        if (seg === 0) this.ctx.moveTo(x, y)
        else this.ctx.lineTo(x, y)
      }
      this.ctx.closePath()

      const patternHue = pattern * 60 + timestamp * 0.01
      this.ctx.strokeStyle = `hsla(${patternHue}, 90%, 80%, ${patternOpacity})`
      this.ctx.lineWidth = 1
      this.ctx.stroke()

      this.ctx.restore()
    }
  }

  // Static rendering methods for image generation
  private renderStaticMandala(centerX: number, centerY: number, audioAnalysis: { frequencyData: Uint8Array, amplitude: number, duration: number }, seed: number, scale: number, sensitivity: number): void {
    this.ctx.save()

    const maxRadius = Math.max(centerX, centerY, this.canvas.width * 0.7, this.canvas.height * 0.7) * scale
    const frequencyData = audioAnalysis.frequencyData
    const amplitude = audioAnalysis.amplitude

    // Create composition based on audio characteristics
    const bassEnergy = this.calculateBandAverage(frequencyData, 0, 0.15)
    const midEnergy = this.calculateBandAverage(frequencyData, 0.15, 0.7)
    const trebleEnergy = this.calculateBandAverage(frequencyData, 0.7, 1.0)

    // Add canvas texture first
    this.drawCanvasTexture(audioAnalysis, seed)

    // Create painterly base with thick impasto-like strokes
    this.drawImpastoBase(audioAnalysis, seed)

    // Fill entire canvas with organic paint washes
    this.drawOrganicPaintWashes(audioAnalysis, seed)

    // Generate expressive brushwork
    const strokeCount = Math.floor(60 + bassEnergy * 80)

    for (let stroke = 0; stroke < strokeCount; stroke++) {
      const freqIndex = Math.floor((stroke / strokeCount) * frequencyData.length)
      const freqValue = frequencyData[freqIndex] || 100
      const intensity = Math.max(0.2, (freqValue / 255) * sensitivity)

      // Create organic, painterly angles with natural variation
      const baseAngle = (stroke / strokeCount) * Math.PI * 2
      const naturalVariation = Math.sin(seed + stroke * 0.31) * 0.8 + Math.cos(seed + stroke * 0.47) * 0.6
      const angle = baseAngle + naturalVariation

      const strokeLength = maxRadius * (0.2 + intensity * 0.7) * (0.7 + Math.sin(seed + stroke * 0.23) * 0.5)
      const strokeWidth = 8 + intensity * 25 + Math.sin(seed + stroke * 0.41) * 12

      // Rich, painterly color palette
      const hue = (stroke / strokeCount) * 300 + bassEnergy * 120 + Math.sin(seed + stroke) * 60
      const saturation = 60 + midEnergy * 40 + Math.cos(seed + stroke) * 20
      const lightness = 30 + trebleEnergy * 50 + Math.sin(seed + stroke * 0.7) * 25

      this.drawPainterlyStroke(centerX, centerY, angle, strokeLength, strokeWidth, hue, saturation, lightness, intensity, seed + stroke)
    }

    // Add extended strokes that reach canvas edges
    this.drawExtendedStrokes(centerX, centerY, audioAnalysis, seed, maxRadius)

    // Add edge-to-edge flowing elements
    this.drawEdgeConnections(audioAnalysis, seed)

    // Add static paint splatters covering full canvas
    const splatterCount = Math.floor(40 + amplitude * 60)
    for (let splat = 0; splat < splatterCount; splat++) {
      // Distribute splatters across entire canvas, not just center
      const splatX = Math.random() * this.canvas.width
      const splatY = Math.random() * this.canvas.height

      const splatSize = 2 + amplitude * 12 + Math.sin(seed + splat * 0.8) * 8
      const hue = (splat / splatterCount) * 300 + trebleEnergy * 120

      const splatGradient = this.ctx.createRadialGradient(splatX, splatY, 0, splatX, splatY, splatSize)
      splatGradient.addColorStop(0, `hsla(${hue}, 90%, 70%, ${amplitude * 0.6})`)
      splatGradient.addColorStop(0.7, `hsla(${hue + 20}, 80%, 50%, ${amplitude * 0.4})`)
      splatGradient.addColorStop(1, `hsla(${hue + 40}, 70%, 30%, 0)`)

      this.ctx.fillStyle = splatGradient
      this.ctx.beginPath()
      this.ctx.arc(splatX, splatY, splatSize, 0, Math.PI * 2)
      this.ctx.fill()
    }

    // Static center composition
    this.drawStaticCenter(centerX, centerY, amplitude, bassEnergy, midEnergy, trebleEnergy, seed)

    this.ctx.restore()
  }

  private renderStaticInkflow(centerX: number, centerY: number, audioAnalysis: { frequencyData: Uint8Array, amplitude: number, duration: number }, seed: number, scale: number, sensitivity: number): void {
    this.ctx.save()

    const maxRadius = Math.max(this.canvas.width, this.canvas.height) * 0.8 * scale
    const frequencyData = audioAnalysis.frequencyData
    const amplitude = audioAnalysis.amplitude

    // Add paper texture
    this.drawPaperTexture(audioAnalysis, seed)

    // Create watercolor base layers
    this.drawWatercolorBase(audioAnalysis, seed)

    // Add ink bleeding effects
    this.drawInkBleeding(audioAnalysis, seed)

    // Create organic paint flows with natural brush effects
    const flowCount = Math.floor(20 + amplitude * 35)

    for (let flow = 0; flow < flowCount; flow++) {
      // Start from random edges and flow across canvas
      const startEdge = Math.floor(Math.random() * 4)
      let startX: number, startY: number, endX: number, endY: number

      switch (startEdge) {
        case 0: // top edge
          startX = Math.random() * this.canvas.width
          startY = 0
          endX = Math.random() * this.canvas.width
          endY = this.canvas.height * (0.5 + Math.random() * 0.5)
          break
        case 1: // right edge
          startX = this.canvas.width
          startY = Math.random() * this.canvas.height
          endX = this.canvas.width * (0.2 + Math.random() * 0.6)
          endY = Math.random() * this.canvas.height
          break
        case 2: // bottom edge
          startX = Math.random() * this.canvas.width
          startY = this.canvas.height
          endX = Math.random() * this.canvas.width
          endY = this.canvas.height * (0.2 + Math.random() * 0.3)
          break
        default: // left edge
          startX = 0
          startY = Math.random() * this.canvas.height
          endX = this.canvas.width * (0.4 + Math.random() * 0.6)
          endY = Math.random() * this.canvas.height
          break
      }

      // Create flowing path across canvas
      const pathSegments = 25
      this.ctx.beginPath()
      this.ctx.moveTo(startX, startY)

      let currentX = startX
      let currentY = startY

      for (let seg = 0; seg < pathSegments; seg++) {
        const progress = seg / pathSegments
        const targetX = startX + (endX - startX) * progress
        const targetY = startY + (endY - startY) * progress

        // Add organic deviation that spreads across canvas
        const deviation = Math.sin(seed + flow + seg * 0.5) * Math.max(this.canvas.width, this.canvas.height) * 0.1 * (1 - progress * 0.7)
        const deviationAngle = (flow + seg) * 0.3

        const nextX = targetX + Math.cos(deviationAngle) * deviation
        const nextY = targetY + Math.sin(deviationAngle) * deviation

        const controlX = (currentX + nextX) / 2 + Math.sin(seed + seg) * 50
        const controlY = (currentY + nextY) / 2 + Math.cos(seed + seg) * 50

        this.ctx.quadraticCurveTo(controlX, controlY, nextX, nextY)
        currentX = nextX
        currentY = nextY
      }

      // Apply flowing style
      const freqIndex = Math.floor((flow / flowCount) * frequencyData.length)
      const freqValue = frequencyData[freqIndex] || 80
      const intensity = (freqValue / 255) * sensitivity

      const flowHue = 200 + flow * 20 + amplitude * 60
      const flowGradient = this.ctx.createLinearGradient(startX, startY, currentX, currentY)
      flowGradient.addColorStop(0, `hsla(${flowHue}, 80%, 70%, ${intensity * 0.7})`)
      flowGradient.addColorStop(0.5, `hsla(${flowHue + 30}, 75%, 60%, ${intensity * 0.5})`)
      flowGradient.addColorStop(1, `hsla(${flowHue + 60}, 70%, 50%, ${intensity * 0.3})`)

      this.ctx.strokeStyle = flowGradient
      this.ctx.lineWidth = 2 + intensity * 8
      this.ctx.lineCap = 'round'
      this.ctx.lineJoin = 'round'
      this.ctx.stroke()
    }

    this.ctx.restore()
  }

  private renderStaticNeonGrid(centerX: number, centerY: number, audioAnalysis: { frequencyData: Uint8Array, amplitude: number, duration: number }, seed: number, scale: number, sensitivity: number): void {
    this.ctx.save()

    const maxRadius = Math.max(this.canvas.width, this.canvas.height) * 0.8 * scale
    const frequencyData = audioAnalysis.frequencyData
    const amplitude = audioAnalysis.amplitude

    // Create deep space background with subtle gradients
    this.drawDeepSpaceBackground(audioAnalysis, seed)

    // Add holographic grid patterns
    this.drawHolographicGrid(audioAnalysis, seed)

    // Create 3D geometric crystals/diamonds
    this.drawCrystallineStructures(centerX, centerY, audioAnalysis, seed, maxRadius)

    // Add optical tunnels and depth effects
    this.drawOpticalTunnels(centerX, centerY, audioAnalysis, seed, maxRadius)

    // Create interconnected network lines
    this.drawNetworkConnections(audioAnalysis, seed)

    // Add holographic particles and light effects
    this.drawHolographicParticles(audioAnalysis, seed)

    this.ctx.restore()
  }

  private drawStaticStroke(centerX: number, centerY: number, angle: number, length: number, width: number, hue: number, saturation: number, lightness: number, intensity: number, seed: number): void {
    const segments = 8
    const segmentLength = length / segments

    this.ctx.beginPath()

    let currentX = centerX
    let currentY = centerY
    let currentAngle = angle

    this.ctx.moveTo(currentX, currentY)

    for (let seg = 0; seg < segments; seg++) {
      const variation = Math.sin(seed + seg * 0.5) * 0.3
      currentAngle += variation

      const nextX = currentX + Math.cos(currentAngle) * segmentLength * (1 + Math.sin(seed + seg) * 0.2)
      const nextY = currentY + Math.sin(currentAngle) * segmentLength * (1 + Math.cos(seed + seg) * 0.2)

      const controlX = (currentX + nextX) / 2 + Math.sin(seed + seg) * 20
      const controlY = (currentY + nextY) / 2 + Math.cos(seed + seg) * 20

      this.ctx.quadraticCurveTo(controlX, controlY, nextX, nextY)

      currentX = nextX
      currentY = nextY
    }

    const strokeGradient = this.ctx.createLinearGradient(centerX, centerY, currentX, currentY)
    strokeGradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, ${intensity * 0.8})`)
    strokeGradient.addColorStop(0.5, `hsla(${hue + 30}, ${saturation - 10}%, ${lightness - 10}%, ${intensity * 0.6})`)
    strokeGradient.addColorStop(1, `hsla(${hue + 60}, ${saturation - 20}%, ${lightness - 20}%, ${intensity * 0.3})`)

    this.ctx.strokeStyle = strokeGradient
    this.ctx.lineWidth = width * (0.8 + intensity * 0.4)
    this.ctx.lineCap = 'round'
    this.ctx.lineJoin = 'round'
    this.ctx.stroke()
  }

  private drawStaticCenter(centerX: number, centerY: number, amplitude: number, bassEnergy: number, midEnergy: number, trebleEnergy: number, seed: number): void {
    const layers = 4

    for (let layer = 0; layer < layers; layer++) {
      const layerRadius = (15 + layer * 12) * (1 + amplitude * 0.6)
      const layerOpacity = (1 - layer * 0.2) * amplitude * 0.8
      const rotation = seed * 0.001 * (layer % 2 === 0 ? 1 : -1)

      this.ctx.save()
      this.ctx.translate(centerX, centerY)
      this.ctx.rotate(rotation)

      this.ctx.beginPath()
      const points = 6 + layer * 2
      for (let p = 0; p < points; p++) {
        const pointAngle = (p / points) * Math.PI * 2
        const radiusVariation = 1 + Math.sin(seed + p + layer) * 0.4
        const pointRadius = layerRadius * radiusVariation

        const x = Math.cos(pointAngle) * pointRadius
        const y = Math.sin(pointAngle) * pointRadius

        if (p === 0) {
          this.ctx.moveTo(x, y)
        } else {
          const prevAngle = ((p - 1) / points) * Math.PI * 2
          const prevRadius = layerRadius * (1 + Math.sin(seed + (p - 1) + layer) * 0.4)
          const prevX = Math.cos(prevAngle) * prevRadius
          const prevY = Math.sin(prevAngle) * prevRadius

          const controlX = (prevX + x) / 2 * 1.2
          const controlY = (prevY + y) / 2 * 1.2

          this.ctx.quadraticCurveTo(controlX, controlY, x, y)
        }
      }
      this.ctx.closePath()

      const centerHue = 280 + layer * 25 + bassEnergy * 80
      const centerGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, layerRadius)
      centerGradient.addColorStop(0, `hsla(${centerHue}, 90%, ${70 + trebleEnergy * 20}%, ${layerOpacity})`)
      centerGradient.addColorStop(0.6, `hsla(${centerHue + 30}, 85%, ${50 + midEnergy * 30}%, ${layerOpacity * 0.7})`)
      centerGradient.addColorStop(1, `hsla(${centerHue + 60}, 80%, 40%, 0)`)

      this.ctx.fillStyle = centerGradient
      this.ctx.fill()

      this.ctx.restore()
    }
  }

  // Full canvas fill methods
  private drawFullCanvasWashes(audioAnalysis: { frequencyData: Uint8Array, amplitude: number, duration: number }, seed: number): void {
    const washes = 15
    const frequencyData = audioAnalysis.frequencyData
    const amplitude = audioAnalysis.amplitude

    for (let wash = 0; wash < washes; wash++) {
      // Distribute washes across entire canvas
      const washX = (Math.sin(seed + wash * 0.7) + 1) * this.canvas.width * 0.5
      const washY = (Math.cos(seed + wash * 0.9) + 1) * this.canvas.height * 0.5
      const washRadius = Math.max(this.canvas.width, this.canvas.height) * (0.2 + wash * 0.08) * (1 + amplitude * 0.4)
      const washOpacity = (1 - wash * 0.06) * 0.25 * amplitude

      const washGradient = this.ctx.createRadialGradient(washX, washY, 0, washX, washY, washRadius)

      const freqIndex = Math.floor((wash / washes) * frequencyData.length)
      const freqValue = frequencyData[freqIndex] || 100
      const hue = (freqValue / 255) * 360 + wash * 30 + seed * 0.1

      washGradient.addColorStop(0, `hsla(${hue}, 70%, 45%, ${washOpacity})`)
      washGradient.addColorStop(0.4, `hsla(${hue + 20}, 60%, 35%, ${washOpacity * 0.7})`)
      washGradient.addColorStop(1, `hsla(${hue + 40}, 50%, 25%, 0)`)

      this.ctx.fillStyle = washGradient
      this.ctx.beginPath()
      this.ctx.arc(washX, washY, washRadius, 0, Math.PI * 2)
      this.ctx.fill()
    }
  }

  private drawExtendedStrokes(centerX: number, centerY: number, audioAnalysis: { frequencyData: Uint8Array, amplitude: number, duration: number }, seed: number, maxRadius: number): void {
    const extendedStrokes = 25
    const frequencyData = audioAnalysis.frequencyData

    for (let stroke = 0; stroke < extendedStrokes; stroke++) {
      const freqIndex = Math.floor((stroke / extendedStrokes) * frequencyData.length)
      const freqValue = frequencyData[freqIndex] || 80
      const intensity = (freqValue / 255)

      // Start from random edge
      const edge = Math.floor(Math.random() * 4) // 0=top, 1=right, 2=bottom, 3=left
      let startX: number, startY: number, endX: number, endY: number

      switch (edge) {
        case 0: // top edge
          startX = Math.random() * this.canvas.width
          startY = 0
          endX = Math.random() * this.canvas.width
          endY = this.canvas.height * (0.3 + Math.random() * 0.7)
          break
        case 1: // right edge
          startX = this.canvas.width
          startY = Math.random() * this.canvas.height
          endX = this.canvas.width * (0.3 + Math.random() * 0.4)
          endY = Math.random() * this.canvas.height
          break
        case 2: // bottom edge
          startX = Math.random() * this.canvas.width
          startY = this.canvas.height
          endX = Math.random() * this.canvas.width
          endY = this.canvas.height * (0.3 + Math.random() * 0.4)
          break
        default: // left edge
          startX = 0
          startY = Math.random() * this.canvas.height
          endX = this.canvas.width * (0.3 + Math.random() * 0.4)
          endY = Math.random() * this.canvas.height
          break
      }

      // Draw flowing stroke from edge to interior
      this.ctx.beginPath()
      this.ctx.moveTo(startX, startY)

      const segments = 8
      let currentX = startX
      let currentY = startY

      for (let seg = 0; seg < segments; seg++) {
        const progress = seg / segments
        const targetX = startX + (endX - startX) * progress
        const targetY = startY + (endY - startY) * progress

        // Add organic variation
        const variation = Math.sin(seed + stroke + seg) * 40 * intensity
        const nextX = targetX + Math.cos(stroke + seg) * variation
        const nextY = targetY + Math.sin(stroke + seg) * variation

        const controlX = (currentX + nextX) / 2 + Math.sin(seed + seg) * 30
        const controlY = (currentY + nextY) / 2 + Math.cos(seed + seg) * 30

        this.ctx.quadraticCurveTo(controlX, controlY, nextX, nextY)
        currentX = nextX
        currentY = nextY
      }

      const strokeHue = (stroke / extendedStrokes) * 360 + seed * 0.1
      const strokeGradient = this.ctx.createLinearGradient(startX, startY, currentX, currentY)
      strokeGradient.addColorStop(0, `hsla(${strokeHue}, 80%, 60%, ${intensity * 0.7})`)
      strokeGradient.addColorStop(0.5, `hsla(${strokeHue + 30}, 75%, 50%, ${intensity * 0.5})`)
      strokeGradient.addColorStop(1, `hsla(${strokeHue + 60}, 70%, 40%, ${intensity * 0.3})`)

      this.ctx.strokeStyle = strokeGradient
      this.ctx.lineWidth = 2 + intensity * 8
      this.ctx.lineCap = 'round'
      this.ctx.stroke()
    }
  }

  private drawEdgeConnections(audioAnalysis: { frequencyData: Uint8Array, amplitude: number, duration: number }, seed: number): void {
    const connections = 12
    const frequencyData = audioAnalysis.frequencyData

    for (let conn = 0; conn < connections; conn++) {
      const freqIndex = Math.floor((conn / connections) * frequencyData.length)
      const freqValue = frequencyData[freqIndex] || 70
      const intensity = (freqValue / 255)

      // Connect opposite edges
      const startX = Math.random() * this.canvas.width
      const startY = Math.random() < 0.5 ? 0 : this.canvas.height
      const endX = Math.random() * this.canvas.width
      const endY = startY === 0 ? this.canvas.height : 0

      this.ctx.beginPath()
      this.ctx.moveTo(startX, startY)

      // Create curved connection across canvas
      const midX = (startX + endX) / 2 + (Math.sin(seed + conn) - 0.5) * this.canvas.width * 0.3
      const midY = (startY + endY) / 2 + (Math.cos(seed + conn) - 0.5) * this.canvas.height * 0.2

      this.ctx.quadraticCurveTo(midX, midY, endX, endY)

      const connectionHue = (conn / connections) * 300 + seed * 0.1
      this.ctx.strokeStyle = `hsla(${connectionHue}, 85%, 65%, ${intensity * 0.4})`
      this.ctx.lineWidth = 1 + intensity * 6
      this.ctx.lineCap = 'round'
      this.ctx.stroke()
    }
  }

  private drawFullCanvasFluidBackground(audioAnalysis: { frequencyData: Uint8Array, amplitude: number, duration: number }, seed: number): void {
    const fluidAreas = 20
    const frequencyData = audioAnalysis.frequencyData

    for (let area = 0; area < fluidAreas; area++) {
      const areaX = (Math.sin(seed + area * 0.8) + 1) * this.canvas.width * 0.5
      const areaY = (Math.cos(seed + area * 1.1) + 1) * this.canvas.height * 0.5
      const areaWidth = this.canvas.width * (0.2 + Math.sin(seed + area) * 0.3)
      const areaHeight = this.canvas.height * (0.15 + Math.cos(seed + area) * 0.25)

      const freqIndex = Math.floor((area / fluidAreas) * frequencyData.length)
      const freqValue = frequencyData[freqIndex] || 80
      const hue = (freqValue / 255) * 300 + area * 25

      const fluidGradient = this.ctx.createRadialGradient(
        areaX, areaY, 0,
        areaX, areaY, Math.max(areaWidth, areaHeight)
      )
      fluidGradient.addColorStop(0, `hsla(${hue}, 70%, 60%, 0.2)`)
      fluidGradient.addColorStop(0.5, `hsla(${hue + 20}, 65%, 50%, 0.15)`)
      fluidGradient.addColorStop(1, `hsla(${hue + 40}, 60%, 40%, 0)`)

      this.ctx.fillStyle = fluidGradient
      this.ctx.fillRect(areaX - areaWidth/2, areaY - areaHeight/2, areaWidth, areaHeight)
    }
  }

  private drawFullCanvasDigitalGrid(audioAnalysis: { frequencyData: Uint8Array, amplitude: number, duration: number }, seed: number): void {
    const gridSize = 25
    const cellWidth = this.canvas.width / gridSize
    const cellHeight = this.canvas.height / gridSize
    const frequencyData = audioAnalysis.frequencyData

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const cellX = x * cellWidth
        const cellY = y * cellHeight

        const freqIndex = Math.floor(((x + y) / (gridSize * 2)) * frequencyData.length)
        const freqValue = frequencyData[freqIndex] || 40
        const intensity = (freqValue / 255)

        if (intensity > 0.3) {
          const hue = (x + y) * 8 + seed * 0.1
          const opacity = intensity * 0.4

          this.ctx.fillStyle = `hsla(${hue}, 90%, 70%, ${opacity})`
          this.ctx.fillRect(cellX, cellY, cellWidth * 0.8, cellHeight * 0.8)
        }
      }
    }
  }

  // Artistic texture methods
  private drawCanvasTexture(audioAnalysis: { frequencyData: Uint8Array, amplitude: number, duration: number }, seed: number): void {
    // Create subtle canvas weave texture
    const textureSize = 3
    this.ctx.globalAlpha = 0.03

    for (let x = 0; x < this.canvas.width; x += textureSize) {
      for (let y = 0; y < this.canvas.height; y += textureSize) {
        const noise = Math.sin(seed + x * 0.1 + y * 0.1) * 0.5 + 0.5
        if (noise > 0.7) {
          this.ctx.fillStyle = noise > 0.85 ? 'white' : 'rgba(255,255,255,0.5)'
          this.ctx.fillRect(x, y, textureSize * 0.7, textureSize * 0.7)
        }
      }
    }
    this.ctx.globalAlpha = 1
  }

  private drawImpastoBase(audioAnalysis: { frequencyData: Uint8Array, amplitude: number, duration: number }, seed: number): void {
    // Create thick paint texture with impasto effect
    const impastoStrokes = 80
    const frequencyData = audioAnalysis.frequencyData

    for (let stroke = 0; stroke < impastoStrokes; stroke++) {
      const x = Math.random() * this.canvas.width
      const y = Math.random() * this.canvas.height
      const size = 40 + Math.random() * 60

      const freqIndex = Math.floor((stroke / impastoStrokes) * frequencyData.length)
      const freqValue = frequencyData[freqIndex] || 60
      const hue = (freqValue / 255) * 360 + seed * 0.1

      // Multiple layers for thickness
      for (let layer = 0; layer < 3; layer++) {
        const layerSize = size * (1 - layer * 0.15)
        const layerAlpha = 0.15 - layer * 0.03

        this.ctx.globalAlpha = layerAlpha
        this.ctx.fillStyle = `hsl(${hue + layer * 10}, ${70 - layer * 10}%, ${45 + layer * 15}%)`

        this.ctx.beginPath()
        const sides = 6 + Math.floor(Math.random() * 6)
        for (let i = 0; i < sides; i++) {
          const angle = (i / sides) * Math.PI * 2
          const radius = layerSize * (0.8 + Math.random() * 0.4)
          const px = x + Math.cos(angle) * radius
          const py = y + Math.sin(angle) * radius
          if (i === 0) this.ctx.moveTo(px, py)
          else this.ctx.lineTo(px, py)
        }
        this.ctx.closePath()
        this.ctx.fill()
      }
    }
    this.ctx.globalAlpha = 1
  }

  private drawOrganicPaintWashes(audioAnalysis: { frequencyData: Uint8Array, amplitude: number, duration: number }, seed: number): void {
    const washes = 12
    const frequencyData = audioAnalysis.frequencyData

    for (let wash = 0; wash < washes; wash++) {
      const centerX = Math.random() * this.canvas.width
      const centerY = Math.random() * this.canvas.height
      const radius = 100 + Math.random() * 200

      const freqIndex = Math.floor((wash / washes) * frequencyData.length)
      const freqValue = frequencyData[freqIndex] || 80
      const hue = (freqValue / 255) * 360 + wash * 40 + seed * 0.1

      const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
      gradient.addColorStop(0, `hsla(${hue}, 65%, 55%, 0.08)`)
      gradient.addColorStop(0.4, `hsla(${hue + 20}, 60%, 45%, 0.06)`)
      gradient.addColorStop(0.8, `hsla(${hue + 40}, 55%, 35%, 0.03)`)
      gradient.addColorStop(1, `hsla(${hue + 60}, 50%, 25%, 0)`)

      this.ctx.fillStyle = gradient
      this.ctx.beginPath()

      // Organic shape instead of perfect circle
      const points = 8 + Math.floor(Math.random() * 8)
      for (let p = 0; p < points; p++) {
        const angle = (p / points) * Math.PI * 2
        const variation = 0.7 + Math.sin(seed + wash + p) * 0.6
        const r = radius * variation
        const px = centerX + Math.cos(angle) * r
        const py = centerY + Math.sin(angle) * r
        if (p === 0) this.ctx.moveTo(px, py)
        else this.ctx.lineTo(px, py)
      }
      this.ctx.closePath()
      this.ctx.fill()
    }
  }

  private drawPainterlyStroke(centerX: number, centerY: number, angle: number, length: number, width: number, hue: number, saturation: number, lightness: number, intensity: number, seed: number): void {
    // Create highly realistic brush stroke with artistic flair
    const segments = 15
    const segmentLength = length / segments

    // Add a subtle glow effect behind the stroke
    this.ctx.save()
    this.ctx.shadowColor = `hsla(${hue}, ${saturation}%, ${lightness + 20}%, 0.4)`
    this.ctx.shadowBlur = width * 0.5
    this.ctx.globalCompositeOperation = 'multiply'

    for (let seg = 0; seg < segments; seg++) {
      const progress = seg / segments
      const currentWidth = width * (0.6 + intensity * 0.8) * (1 - progress * 0.2) * (0.9 + Math.sin(seed + seg * 0.7) * 0.3)

      // More sophisticated bristle simulation
      const bristles = Math.floor(currentWidth / 2.5) + 2

      for (let bristle = 0; bristle < bristles; bristle++) {
        this.ctx.beginPath()

        const bristleOffset = (bristle - bristles / 2) * (currentWidth / bristles) * (0.8 + Math.sin(seed + bristle) * 0.4)
        const bristleAngle = angle + (bristleOffset / length) * 0.15 + Math.sin(seed + seg + bristle) * 0.1

        const startX = centerX + Math.cos(angle) * segmentLength * seg + Math.cos(angle + Math.PI/2) * bristleOffset
        const startY = centerY + Math.sin(angle) * segmentLength * seg + Math.sin(angle + Math.PI/2) * bristleOffset

        // Add organic curve to brush stroke
        const controlX = startX + Math.cos(bristleAngle) * segmentLength * 0.7 + Math.sin(seed + seg) * 8
        const controlY = startY + Math.sin(bristleAngle) * segmentLength * 0.7 + Math.cos(seed + seg) * 8
        const endX = startX + Math.cos(bristleAngle) * segmentLength * (1 + Math.sin(seed + seg + bristle) * 0.25)
        const endY = startY + Math.sin(bristleAngle) * segmentLength * (1 + Math.cos(seed + seg + bristle) * 0.25)

        this.ctx.moveTo(startX, startY)
        this.ctx.quadraticCurveTo(controlX, controlY, endX, endY)

        // Rich color variations for each bristle
        const bristleHue = hue + (bristle - bristles/2) * 8 + Math.sin(seed + seg) * 15
        const bristleSaturation = Math.max(30, saturation + Math.cos(seed + bristle) * 20)
        const bristleLightness = lightness + Math.sin(seed + seg + bristle) * 15 + (bristle % 2) * 10
        const alpha = (intensity * 0.8) * (1 - progress * 0.3) * (0.6 + Math.sin(seed + bristle) * 0.4)

        // Create gradient stroke for depth
        const strokeGradient = this.ctx.createLinearGradient(startX, startY, endX, endY)
        strokeGradient.addColorStop(0, `hsla(${bristleHue}, ${bristleSaturation}%, ${bristleLightness + 10}%, ${alpha})`)
        strokeGradient.addColorStop(0.6, `hsla(${bristleHue + 5}, ${bristleSaturation - 5}%, ${bristleLightness}%, ${alpha * 0.9})`)
        strokeGradient.addColorStop(1, `hsla(${bristleHue + 10}, ${bristleSaturation - 10}%, ${bristleLightness - 10}%, ${alpha * 0.7})`)

        this.ctx.strokeStyle = strokeGradient
        this.ctx.lineWidth = (1.5 + Math.sin(seed + bristle) * 1.5) * (intensity * 0.5 + 0.5)
        this.ctx.lineCap = 'round'
        this.ctx.lineJoin = 'round'
        this.ctx.stroke()
      }
    }

    this.ctx.restore()
  }

  private drawPaperTexture(audioAnalysis: { frequencyData: Uint8Array, amplitude: number, duration: number }, seed: number): void {
    // Watercolor paper texture
    const grainSize = 2
    this.ctx.globalAlpha = 0.02

    for (let x = 0; x < this.canvas.width; x += grainSize) {
      for (let y = 0; y < this.canvas.height; y += grainSize) {
        const noise = Math.sin(seed + x * 0.05 + y * 0.07) * Math.cos(seed + x * 0.03 + y * 0.11)
        if (noise > 0.3) {
          this.ctx.fillStyle = noise > 0.7 ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.3)'
          this.ctx.fillRect(x, y, grainSize, grainSize)
        }
      }
    }
    this.ctx.globalAlpha = 1
  }

  private drawWatercolorBase(audioAnalysis: { frequencyData: Uint8Array, amplitude: number, duration: number }, seed: number): void {
    const layers = 8
    const frequencyData = audioAnalysis.frequencyData

    for (let layer = 0; layer < layers; layer++) {
      const x = Math.random() * this.canvas.width
      const y = Math.random() * this.canvas.height
      const radius = 150 + Math.random() * 300

      const freqIndex = Math.floor((layer / layers) * frequencyData.length)
      const freqValue = frequencyData[freqIndex] || 70
      const hue = (freqValue / 255) * 300 + layer * 45

      // Watercolor bleeding effect
      for (let bleed = 0; bleed < 3; bleed++) {
        const bleedRadius = radius * (1 + bleed * 0.3)
        const bleedAlpha = 0.04 / (bleed + 1)

        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, bleedRadius)
        gradient.addColorStop(0, `hsla(${hue}, 70%, 60%, ${bleedAlpha})`)
        gradient.addColorStop(0.6, `hsla(${hue + 30}, 65%, 50%, ${bleedAlpha * 0.7})`)
        gradient.addColorStop(1, `hsla(${hue + 60}, 60%, 40%, 0)`)

        this.ctx.fillStyle = gradient
        this.ctx.beginPath()
        this.ctx.arc(x, y, bleedRadius, 0, Math.PI * 2)
        this.ctx.fill()
      }
    }
  }

  private drawInkBleeding(audioAnalysis: { frequencyData: Uint8Array, amplitude: number, duration: number }, seed: number): void {
    const bleeds = 20
    const frequencyData = audioAnalysis.frequencyData

    for (let bleed = 0; bleed < bleeds; bleed++) {
      const x = Math.random() * this.canvas.width
      const y = Math.random() * this.canvas.height
      const size = 20 + Math.random() * 80

      const freqIndex = Math.floor((bleed / bleeds) * frequencyData.length)
      const freqValue = frequencyData[freqIndex] || 50
      const hue = (freqValue / 255) * 360 + bleed * 20

      // Irregular ink blot shape
      this.ctx.beginPath()
      const points = 6 + Math.floor(Math.random() * 8)
      for (let p = 0; p < points; p++) {
        const angle = (p / points) * Math.PI * 2
        const radius = size * (0.5 + Math.sin(seed + bleed + p) * 0.8)
        const px = x + Math.cos(angle) * radius
        const py = y + Math.sin(angle) * radius
        if (p === 0) this.ctx.moveTo(px, py)
        else this.ctx.lineTo(px, py)
      }
      this.ctx.closePath()

      this.ctx.fillStyle = `hsla(${hue}, 80%, 30%, 0.08)`
      this.ctx.fill()
    }
  }

  private drawMixedMediaTexture(audioAnalysis: { frequencyData: Uint8Array, amplitude: number, duration: number }, seed: number): void {
    // Collage-like mixed media texture
    const patches = 15
    const frequencyData = audioAnalysis.frequencyData

    for (let patch = 0; patch < patches; patch++) {
      const x = Math.random() * this.canvas.width
      const y = Math.random() * this.canvas.height
      const width = 80 + Math.random() * 200
      const height = 60 + Math.random() * 150

      const freqIndex = Math.floor((patch / patches) * frequencyData.length)
      const freqValue = frequencyData[freqIndex] || 60
      const hue = (freqValue / 255) * 360 + patch * 25

      this.ctx.save()
      this.ctx.translate(x, y)
      this.ctx.rotate((Math.random() - 0.5) * 0.4)

      // Torn paper edge effect
      this.ctx.beginPath()
      const edgePoints = 12
      for (let i = 0; i < edgePoints; i++) {
        const progress = i / edgePoints
        const edgeX = progress * width
        const edgeY = Math.sin(seed + patch + i) * 8
        if (i === 0) this.ctx.moveTo(edgeX, edgeY)
        else this.ctx.lineTo(edgeX, edgeY)
      }

      for (let i = edgePoints; i >= 0; i--) {
        const progress = i / edgePoints
        const edgeX = progress * width
        const edgeY = height + Math.cos(seed + patch + i) * 6
        this.ctx.lineTo(edgeX, edgeY)
      }
      this.ctx.closePath()

      this.ctx.fillStyle = `hsla(${hue}, 40%, 75%, 0.12)`
      this.ctx.fill()

      this.ctx.restore()
    }
  }

  private drawAbstractColorFields(audioAnalysis: { frequencyData: Uint8Array, amplitude: number, duration: number }, seed: number): void {
    const fields = 6
    const frequencyData = audioAnalysis.frequencyData

    for (let field = 0; field < fields; field++) {
      const x = Math.random() * this.canvas.width
      const y = Math.random() * this.canvas.height
      const width = this.canvas.width * (0.3 + Math.random() * 0.5)
      const height = this.canvas.height * (0.2 + Math.random() * 0.4)

      const freqIndex = Math.floor((field / fields) * frequencyData.length)
      const freqValue = frequencyData[freqIndex] || 70
      const hue = (freqValue / 255) * 300 + field * 50

      const gradient = this.ctx.createLinearGradient(x, y, x + width, y + height)
      gradient.addColorStop(0, `hsla(${hue}, 60%, 50%, 0.15)`)
      gradient.addColorStop(0.5, `hsla(${hue + 40}, 55%, 45%, 0.12)`)
      gradient.addColorStop(1, `hsla(${hue + 80}, 50%, 40%, 0.08)`)

      this.ctx.fillStyle = gradient
      this.ctx.fillRect(x, y, width, height)
    }
  }

  private drawGesturalMarks(audioAnalysis: { frequencyData: Uint8Array, amplitude: number, duration: number }, seed: number): void {
    const marks = 30
    const frequencyData = audioAnalysis.frequencyData

    for (let mark = 0; mark < marks; mark++) {
      const startX = Math.random() * this.canvas.width
      const startY = Math.random() * this.canvas.height
      const length = 50 + Math.random() * 200
      const angle = Math.random() * Math.PI * 2

      const freqIndex = Math.floor((mark / marks) * frequencyData.length)
      const freqValue = frequencyData[freqIndex] || 60
      const intensity = (freqValue / 255)

      if (intensity < 0.3) continue

      // Expressive, gestural mark
      this.ctx.beginPath()
      let currentX = startX
      let currentY = startY
      this.ctx.moveTo(currentX, currentY)

      const segments = 8
      for (let seg = 0; seg < segments; seg++) {
        const segmentLength = length / segments
        const variation = Math.sin(seed + mark + seg) * 20 * intensity
        const segmentAngle = angle + variation * 0.1

        currentX += Math.cos(segmentAngle) * segmentLength
        currentY += Math.sin(segmentAngle) * segmentLength
        this.ctx.lineTo(currentX, currentY)
      }

      const hue = (freqValue / 255) * 360 + mark * 15
      this.ctx.strokeStyle = `hsla(${hue}, 70%, 40%, ${intensity * 0.6})`
      this.ctx.lineWidth = 2 + intensity * 8
      this.ctx.lineCap = 'round'
      this.ctx.lineJoin = 'round'
      this.ctx.stroke()
    }
  }

  // Modern digital art methods for NeonGrid style
  private drawDeepSpaceBackground(audioAnalysis: { frequencyData: Uint8Array, amplitude: number, duration: number }, seed: number): void {
    // Create deep space gradient with subtle color shifts
    const gradient = this.ctx.createRadialGradient(
      this.canvas.width * 0.3, this.canvas.height * 0.3, 0,
      this.canvas.width * 0.7, this.canvas.height * 0.7, Math.max(this.canvas.width, this.canvas.height)
    )

    // Audio-reactive color shifts
    const bassInfluence = this.calculateBandAverage(audioAnalysis.frequencyData, 0, 0.1)
    const midInfluence = this.calculateBandAverage(audioAnalysis.frequencyData, 0.1, 0.6)
    const trebleInfluence = this.calculateBandAverage(audioAnalysis.frequencyData, 0.6, 1.0)

    const deepBlue = Math.floor(bassInfluence * 30 + 5)
    const cosmicPurple = Math.floor(midInfluence * 40 + 10)
    const voidBlack = Math.floor(trebleInfluence * 20 + 2)

    gradient.addColorStop(0, `rgba(${voidBlack}, ${deepBlue}, ${cosmicPurple + 15}, 0.95)`)
    gradient.addColorStop(0.4, `rgba(${voidBlack + 5}, ${deepBlue + 10}, ${cosmicPurple + 20}, 0.92)`)
    gradient.addColorStop(0.7, `rgba(${voidBlack + 2}, ${deepBlue + 5}, ${cosmicPurple + 10}, 0.88)`)
    gradient.addColorStop(1, `rgba(${voidBlack}, ${deepBlue * 0.5}, ${cosmicPurple * 0.7}, 0.98)`)

    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  private drawHolographicGrid(audioAnalysis: { frequencyData: Uint8Array, amplitude: number, duration: number }, seed: number): void {
    const gridSize = 40
    const cellWidth = this.canvas.width / gridSize
    const cellHeight = this.canvas.height / gridSize
    const frequencyData = audioAnalysis.frequencyData

    this.ctx.globalCompositeOperation = 'screen'
    this.ctx.globalAlpha = 0.3

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const cellX = x * cellWidth
        const cellY = y * cellHeight

        // Create perspective effect - stronger toward center
        const centerX = gridSize / 2
        const centerY = gridSize / 2
        const distanceFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
        const maxDistance = Math.sqrt(centerX ** 2 + centerY ** 2)
        const perspectiveIntensity = 1 - (distanceFromCenter / maxDistance) * 0.7

        const freqIndex = Math.floor(((x + y) / (gridSize * 2)) * frequencyData.length)
        const freqValue = frequencyData[freqIndex] || 20
        const intensity = (freqValue / 255) * perspectiveIntensity

        if (intensity > 0.2) {
          // Create grid lines with perspective
          const lineWidth = intensity * 2
          const opacity = intensity * 0.8
          const hue = 180 + (x + y) * 3 + seed * 0.1

          this.ctx.strokeStyle = `hsla(${hue}, 90%, 70%, ${opacity})`
          this.ctx.lineWidth = lineWidth

          // Horizontal lines
          this.ctx.beginPath()
          this.ctx.moveTo(cellX, cellY)
          this.ctx.lineTo(cellX + cellWidth, cellY)
          this.ctx.stroke()

          // Vertical lines
          this.ctx.beginPath()
          this.ctx.moveTo(cellX, cellY)
          this.ctx.lineTo(cellX, cellY + cellHeight)
          this.ctx.stroke()
        }
      }
    }

    this.ctx.globalAlpha = 1
    this.ctx.globalCompositeOperation = 'source-over'
  }

  private drawCrystallineStructures(centerX: number, centerY: number, audioAnalysis: { frequencyData: Uint8Array, amplitude: number, duration: number }, seed: number, maxRadius: number): void {
    const crystalCount = Math.floor(15 + audioAnalysis.amplitude * 25)
    const frequencyData = audioAnalysis.frequencyData

    for (let crystal = 0; crystal < crystalCount; crystal++) {
      const freqIndex = Math.floor((crystal / crystalCount) * frequencyData.length)
      const freqValue = frequencyData[freqIndex] || 40
      const intensity = Math.max(0.3, (freqValue / 255))

      // Position crystals across canvas with some clustering
      const clusterX = centerX + (Math.sin(seed + crystal * 0.7) * maxRadius * 0.8)
      const clusterY = centerY + (Math.cos(seed + crystal * 0.9) * maxRadius * 0.8)

      const crystalX = clusterX + (Math.random() - 0.5) * 200
      const crystalY = clusterY + (Math.random() - 0.5) * 200

      // Ensure crystals stay within canvas
      const finalX = Math.max(50, Math.min(this.canvas.width - 50, crystalX))
      const finalY = Math.max(50, Math.min(this.canvas.height - 50, crystalY))

      const crystalSize = 20 + intensity * 60
      const rotation = seed + crystal * 0.5

      this.drawSingleCrystal(finalX, finalY, crystalSize, rotation, intensity, freqValue, crystal)
    }
  }

  private drawSingleCrystal(x: number, y: number, size: number, rotation: number, intensity: number, freqValue: number, index: number): void {
    this.ctx.save()
    this.ctx.translate(x, y)
    this.ctx.rotate(rotation)

    // Create 3D diamond/crystal shape
    const vertices = [
      { x: 0, y: -size },           // top
      { x: size * 0.6, y: -size * 0.3 },  // top-right
      { x: size * 0.6, y: size * 0.3 },   // bottom-right
      { x: 0, y: size },            // bottom
      { x: -size * 0.6, y: size * 0.3 },  // bottom-left
      { x: -size * 0.6, y: -size * 0.3 }  // top-left
    ]

    // Multiple faces for 3D effect
    const faces = [
      [0, 1, 3, 4], // main diamond
      [0, 1, 2],    // top-right face
      [0, 5, 4],    // top-left face
      [3, 2, 1],    // bottom-right face
      [3, 4, 5]     // bottom-left face
    ]

    faces.forEach((face, faceIndex) => {
      this.ctx.beginPath()
      this.ctx.moveTo(vertices[face[0]].x, vertices[face[0]].y)
      face.forEach(vertexIndex => {
        this.ctx.lineTo(vertices[vertexIndex].x, vertices[vertexIndex].y)
      })
      this.ctx.closePath()

      // Different brightness for each face (3D lighting effect)
      const faceBrightness = 0.3 + faceIndex * 0.15
      const hue = 240 + (freqValue / 255) * 120 + index * 8
      const saturation = 80 + intensity * 20
      const lightness = 40 + faceBrightness * 40 + intensity * 30
      const alpha = intensity * (0.6 + faceIndex * 0.1)

      // Gradient fill for depth
      const faceGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, size)
      faceGradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness + 20}%, ${alpha})`)
      faceGradient.addColorStop(0.7, `hsla(${hue + 20}, ${saturation - 10}%, ${lightness}%, ${alpha * 0.8})`)
      faceGradient.addColorStop(1, `hsla(${hue + 40}, ${saturation - 20}%, ${lightness - 15}%, ${alpha * 0.4})`)

      this.ctx.fillStyle = faceGradient
      this.ctx.fill()

      // Bright edges for crystal effect
      this.ctx.strokeStyle = `hsla(${hue}, 100%, 80%, ${alpha * 0.8})`
      this.ctx.lineWidth = 1 + intensity * 2
      this.ctx.stroke()
    })

    // Add inner glow
    this.ctx.beginPath()
    this.ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2)
    const glowHue = 200 + (freqValue / 255) * 160
    this.ctx.fillStyle = `hsla(${glowHue}, 100%, 90%, ${intensity * 0.4})`
    this.ctx.fill()

    this.ctx.restore()
  }

  private drawOpticalTunnels(centerX: number, centerY: number, audioAnalysis: { frequencyData: Uint8Array, amplitude: number, duration: number }, seed: number, maxRadius: number): void {
    const tunnelCount = 3 + Math.floor(audioAnalysis.amplitude * 4)

    for (let tunnel = 0; tunnel < tunnelCount; tunnel++) {
      const freqIndex = Math.floor((tunnel / tunnelCount) * audioAnalysis.frequencyData.length)
      const freqValue = audioAnalysis.frequencyData[freqIndex] || 30
      const intensity = (freqValue / 255)

      if (intensity < 0.4) continue

      // Tunnel position with some offset from center
      const tunnelX = centerX + Math.sin(seed + tunnel * 2) * maxRadius * 0.3
      const tunnelY = centerY + Math.cos(seed + tunnel * 2.3) * maxRadius * 0.3

      const rings = 20
      const maxTunnelRadius = maxRadius * (0.3 + intensity * 0.4)

      this.ctx.globalCompositeOperation = 'screen'

      for (let ring = 0; ring < rings; ring++) {
        const ringProgress = ring / rings
        const ringRadius = maxTunnelRadius * (1 - ringProgress) * (0.1 + ringProgress * 0.9)
        const ringOpacity = intensity * (1 - ringProgress) * 0.6

        if (ringOpacity < 0.05) continue

        const hue = 160 + tunnel * 40 + ring * 8 + (freqValue / 255) * 80
        this.ctx.strokeStyle = `hsla(${hue}, 90%, 70%, ${ringOpacity})`
        this.ctx.lineWidth = 2 + intensity * 4 * (1 - ringProgress)

        this.ctx.beginPath()
        this.ctx.arc(tunnelX, tunnelY, ringRadius, 0, Math.PI * 2)
        this.ctx.stroke()
      }

      this.ctx.globalCompositeOperation = 'source-over'
    }
  }

  private drawNetworkConnections(audioAnalysis: { frequencyData: Uint8Array, amplitude: number, duration: number }, seed: number): void {
    const nodeCount = Math.floor(20 + audioAnalysis.amplitude * 30)
    const nodes: { x: number, y: number, intensity: number }[] = []

    // Create nodes
    for (let i = 0; i < nodeCount; i++) {
      const freqIndex = Math.floor((i / nodeCount) * audioAnalysis.frequencyData.length)
      const freqValue = audioAnalysis.frequencyData[freqIndex] || 20
      const intensity = (freqValue / 255)

      nodes.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        intensity
      })
    }

    // Connect nearby nodes
    this.ctx.globalAlpha = 0.6
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const distance = Math.sqrt(
          (nodes[i].x - nodes[j].x) ** 2 + (nodes[i].y - nodes[j].y) ** 2
        )

        const maxConnectionDistance = 200 + audioAnalysis.amplitude * 100
        if (distance < maxConnectionDistance) {
          const connectionIntensity = (nodes[i].intensity + nodes[j].intensity) / 2
          const connectionOpacity = connectionIntensity * (1 - distance / maxConnectionDistance) * 0.8

          if (connectionOpacity > 0.1) {
            const hue = 200 + (i + j) * 5 + seed * 0.1
            this.ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${connectionOpacity})`
            this.ctx.lineWidth = 1 + connectionIntensity * 3

            this.ctx.beginPath()
            this.ctx.moveTo(nodes[i].x, nodes[i].y)
            this.ctx.lineTo(nodes[j].x, nodes[j].y)
            this.ctx.stroke()
          }
        }
      }
    }
    this.ctx.globalAlpha = 1
  }

  private drawHolographicParticles(audioAnalysis: { frequencyData: Uint8Array, amplitude: number, duration: number }, seed: number): void {
    const particleCount = Math.floor(50 + audioAnalysis.amplitude * 100)

    this.ctx.globalCompositeOperation = 'screen'

    for (let particle = 0; particle < particleCount; particle++) {
      const freqIndex = Math.floor((particle / particleCount) * audioAnalysis.frequencyData.length)
      const freqValue = audioAnalysis.frequencyData[freqIndex] || 10
      const intensity = (freqValue / 255)

      if (intensity < 0.2) continue

      const particleX = Math.random() * this.canvas.width
      const particleY = Math.random() * this.canvas.height
      const particleSize = 1 + intensity * 8
      const opacity = intensity * 0.8

      const hue = 180 + particle * 2 + (freqValue / 255) * 180

      const particleGradient = this.ctx.createRadialGradient(
        particleX, particleY, 0,
        particleX, particleY, particleSize * 2
      )
      particleGradient.addColorStop(0, `hsla(${hue}, 100%, 90%, ${opacity})`)
      particleGradient.addColorStop(0.5, `hsla(${hue + 30}, 90%, 70%, ${opacity * 0.6})`)
      particleGradient.addColorStop(1, `hsla(${hue + 60}, 80%, 50%, 0)`)

      this.ctx.fillStyle = particleGradient
      this.ctx.beginPath()
      this.ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2)
      this.ctx.fill()
    }

    this.ctx.globalCompositeOperation = 'source-over'
  }


  /**
   * Start continuous rendering (animation loop)
   */
  startAnimation(getFrequencyData: () => Uint8Array, getAmplitude: () => number): void {
    if (this.animationId) {
      this.stopAnimation()
    }

    const animate = (timestamp: number) => {
      const frequencyData = getFrequencyData()
      const amplitude = getAmplitude()

      this.render(frequencyData, amplitude, timestamp)

      this.animationId = requestAnimationFrame(animate)
    }

    this.animationId = requestAnimationFrame(animate)
  }

  /**
   * Stop the animation loop
   */
  stopAnimation(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  /**
   * Resize the canvas and update the renderer
   */
  resize(width: number, height: number): void {
    this.canvas.width = width
    this.canvas.height = height
  }

  /**
   * Get the current canvas as image data URL
   */
  getImageDataUrl(format: 'png' | 'jpeg' = 'png', quality?: number): string {
    return this.canvas.toDataURL(`image/${format}`, quality)
  }

  /**
   * Get the current canvas as blob
   */
  async getBlob(format: 'png' | 'jpeg' = 'png', quality?: number): Promise<Blob> {
    return new Promise((resolve) => {
      this.canvas.toBlob(
        (blob) => resolve(blob!),
        `image/${format}`,
        quality
      )
    })
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopAnimation()
  }

  /**
   * Get renderer statistics for debugging
   */
  getStats(): Record<string, any> {
    return {
      rendererType: `Simple${this.style.charAt(0).toUpperCase() + this.style.slice(1)}Renderer`,
      canvasSize: { width: this.canvas.width, height: this.canvas.height },
      isAnimating: this.animationId !== null,
      style: this.style,
      config: this.config
    }
  }
}