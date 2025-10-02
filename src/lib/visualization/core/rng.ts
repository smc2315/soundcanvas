/**
 * Seeded random number generator for deterministic visualization output
 * Ensures same seed produces identical visual results across runs
 */

export class SeededRNG {
  private seed: number
  private state: number

  constructor(seed: number) {
    this.seed = seed
    this.state = seed
  }

  /**
   * Generate next pseudo-random float between 0 and 1
   */
  random(): number {
    // Linear congruential generator (LCG)
    this.state = (this.state * 1664525 + 1013904223) % 0x100000000
    return this.state / 0x100000000
  }

  /**
   * Generate random integer between min and max (inclusive)
   */
  randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min
  }

  /**
   * Generate random float between min and max
   */
  randomFloat(min: number, max: number): number {
    return this.random() * (max - min) + min
  }

  /**
   * Generate random boolean with given probability of true
   */
  randomBool(probability: number = 0.5): boolean {
    return this.random() < probability
  }

  /**
   * Pick random element from array
   */
  randomChoice<T>(array: T[]): T {
    return array[this.randomInt(0, array.length - 1)]
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.randomInt(0, i)
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  }

  /**
   * Generate random point on unit circle
   */
  randomPointOnCircle(): { x: number, y: number } {
    const angle = this.random() * 2 * Math.PI
    return {
      x: Math.cos(angle),
      y: Math.sin(angle)
    }
  }

  /**
   * Generate random point inside unit circle
   */
  randomPointInCircle(): { x: number, y: number } {
    const angle = this.random() * 2 * Math.PI
    const radius = Math.sqrt(this.random())
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    }
  }

  /**
   * Generate random color in HSL space
   */
  randomColor(hueRange?: [number, number], satRange?: [number, number], lightRange?: [number, number]): string {
    const hue = hueRange ? this.randomFloat(hueRange[0], hueRange[1]) : this.random() * 360
    const sat = satRange ? this.randomFloat(satRange[0], satRange[1]) : this.randomFloat(40, 90)
    const light = lightRange ? this.randomFloat(lightRange[0], lightRange[1]) : this.randomFloat(30, 70)

    return `hsl(${hue}, ${sat}%, ${light}%)`
  }

  /**
   * Generate normally distributed random number (Box-Muller transform)
   */
  randomNormal(mean: number = 0, stdDev: number = 1): number {
    // Box-Muller transform
    const u1 = this.random()
    const u2 = this.random()
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    return z0 * stdDev + mean
  }

  /**
   * Generate Perlin-like noise value at coordinates
   */
  noise2D(x: number, y: number, scale: number = 1): number {
    const scaledX = x * scale
    const scaledY = y * scale

    const intX = Math.floor(scaledX)
    const intY = Math.floor(scaledY)
    const fracX = scaledX - intX
    const fracY = scaledY - intY

    // Get pseudo-random gradients at corners
    const a = this.gradientAt(intX, intY)
    const b = this.gradientAt(intX + 1, intY)
    const c = this.gradientAt(intX, intY + 1)
    const d = this.gradientAt(intX + 1, intY + 1)

    // Calculate dot products
    const dotA = a.x * fracX + a.y * fracY
    const dotB = b.x * (fracX - 1) + b.y * fracY
    const dotC = c.x * fracX + c.y * (fracY - 1)
    const dotD = d.x * (fracX - 1) + d.y * (fracY - 1)

    // Interpolate
    const u = this.fade(fracX)
    const v = this.fade(fracY)

    const x1 = this.lerp(dotA, dotB, u)
    const x2 = this.lerp(dotC, dotD, u)

    return this.lerp(x1, x2, v)
  }

  private gradientAt(x: number, y: number): { x: number, y: number } {
    // Generate deterministic gradient vector from coordinates
    const hash = this.hashCoords(x, y)
    const angle = (hash % 8) * Math.PI / 4
    return {
      x: Math.cos(angle),
      y: Math.sin(angle)
    }
  }

  private hashCoords(x: number, y: number): number {
    // Simple hash function for coordinates
    return ((x * 374761393) + (y * 668265263)) % 2147483647
  }

  private fade(t: number): number {
    // Smoothstep function for noise interpolation
    return t * t * t * (t * (t * 6 - 15) + 10)
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a)
  }

  /**
   * Generate fractal noise (multiple octaves)
   */
  fractalNoise2D(x: number, y: number, octaves: number = 4, persistence: number = 0.5, scale: number = 1): number {
    let value = 0
    let amplitude = 1
    let frequency = scale

    for (let i = 0; i < octaves; i++) {
      value += this.noise2D(x, y, frequency) * amplitude
      amplitude *= persistence
      frequency *= 2
    }

    return value
  }

  /**
   * Reset to original seed
   */
  reset(): void {
    this.state = this.seed
  }

  /**
   * Get current seed
   */
  getSeed(): number {
    return this.seed
  }

  /**
   * Set new seed
   */
  setSeed(seed: number): void {
    this.seed = seed
    this.state = seed
  }

  /**
   * Generate weighted random choice
   */
  weightedChoice<T>(choices: Array<{ item: T, weight: number }>): T {
    const totalWeight = choices.reduce((sum, choice) => sum + choice.weight, 0)
    let random = this.random() * totalWeight

    for (const choice of choices) {
      random -= choice.weight
      if (random <= 0) {
        return choice.item
      }
    }

    return choices[choices.length - 1].item
  }

  /**
   * Generate random walk step
   */
  randomWalkStep(currentPos: { x: number, y: number }, stepSize: number): { x: number, y: number } {
    const angle = this.random() * 2 * Math.PI
    return {
      x: currentPos.x + Math.cos(angle) * stepSize,
      y: currentPos.y + Math.sin(angle) * stepSize
    }
  }
}