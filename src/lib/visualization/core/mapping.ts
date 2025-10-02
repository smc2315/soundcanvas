/**
 * Audio feature to visual parameter mapping system
 * Handles the transformation of audio analysis data into visual parameters
 */

import { AudioFeatures, VisualParams, AudioMappingRules } from './types'

export class AudioMapper {
  private rules: AudioMappingRules
  private smoothingBuffers: Map<string, number[]> = new Map()
  private lastOnsetTimes: Map<string, number> = new Map()

  constructor(rules: AudioMappingRules) {
    this.rules = rules
  }

  /**
   * Update mapping rules
   */
  updateRules(rules: Partial<AudioMappingRules>): void {
    this.rules = { ...this.rules, ...rules }
  }

  /**
   * Map audio features to visual parameters
   */
  mapFeatures(audioFeatures: AudioFeatures, currentParams: VisualParams): Partial<VisualParams> {
    const mappedParams: Partial<VisualParams> = {}

    // Map energy-based parameters
    this.rules.energy.forEach(mapping => {
      const smoothedValue = this.applySmoothing(
        `energy_${mapping.target}`,
        audioFeatures.energy,
        mapping.smoothing
      )

      const mappedValue = this.applyMapping(
        smoothedValue,
        mapping.range,
        mapping.curve
      )

      ;(mappedParams as any)[mapping.target] = mappedValue
    })

    // Map brightness-based parameters
    this.rules.brightness.forEach(mapping => {
      const smoothedValue = this.applySmoothing(
        `brightness_${mapping.target}`,
        audioFeatures.brightness,
        mapping.smoothing
      )

      const mappedValue = this.applyMapping(
        smoothedValue,
        mapping.range,
        mapping.curve
      )

      ;(mappedParams as any)[mapping.target] = mappedValue
    })

    // Handle onset triggers
    const currentTime = 'timestamp' in audioFeatures ? audioFeatures.timestamp : Date.now() / 1000
    this.rules.onset.forEach(onsetRule => {
      if (audioFeatures.onsetStrength > onsetRule.threshold) {
        const lastOnsetTime = this.lastOnsetTimes.get(onsetRule.trigger) || 0
        if (currentTime - lastOnsetTime > onsetRule.cooldown) {
          // Trigger onset event (this would be handled by the visualizer)
          this.lastOnsetTimes.set(onsetRule.trigger, currentTime)
          ;(mappedParams as any)[`_onset_${onsetRule.trigger}`] = true
        }
      }
    })

    // Map pitch-based parameters
    this.rules.pitch.forEach(mapping => {
      if (audioFeatures.fundamentalFreq >= mapping.freqRange[0] &&
          audioFeatures.fundamentalFreq <= mapping.freqRange[1]) {

        const normalizedPitch = (audioFeatures.fundamentalFreq - mapping.freqRange[0]) /
                               (mapping.freqRange[1] - mapping.freqRange[0])

        const mappedValue = mapping.range[0] + normalizedPitch * (mapping.range[1] - mapping.range[0])
        ;(mappedParams as any)[mapping.target] = mappedValue
      }
    })

    return mappedParams
  }

  /**
   * Apply smoothing to a value using exponential moving average
   */
  private applySmoothing(key: string, value: number, smoothingFactor: number): number {
    if (!this.smoothingBuffers.has(key)) {
      this.smoothingBuffers.set(key, [])
    }

    const buffer = this.smoothingBuffers.get(key)!
    buffer.push(value)

    // Exponential moving average
    if (buffer.length === 1) {
      return value
    }

    const smoothed = buffer[buffer.length - 2] * smoothingFactor + value * (1 - smoothingFactor)
    buffer[buffer.length - 1] = smoothed

    // Keep buffer size reasonable
    if (buffer.length > 10) {
      buffer.shift()
    }

    return smoothed
  }

  /**
   * Apply mapping curve to transform input range to output range
   */
  private applyMapping(
    value: number,
    outputRange: [number, number],
    curve: 'linear' | 'exponential' | 'logarithmic'
  ): number {
    // Clamp input to 0-1
    const clampedValue = Math.max(0, Math.min(1, value))

    let transformedValue: number

    switch (curve) {
      case 'exponential':
        transformedValue = Math.pow(clampedValue, 2)
        break
      case 'logarithmic':
        transformedValue = clampedValue === 0 ? 0 : Math.log10(clampedValue * 9 + 1)
        break
      case 'linear':
      default:
        transformedValue = clampedValue
        break
    }

    // Map to output range
    return outputRange[0] + transformedValue * (outputRange[1] - outputRange[0])
  }

  /**
   * Create spectral band mappings for frequency-based visualization
   */
  static createSpectralMapping(
    frequencyData: Uint8Array,
    sampleRate: number,
    bandCount: number = 32
  ): { bands: number[], frequencies: number[] } {
    const nyquist = sampleRate / 2
    const bands: number[] = []
    const frequencies: number[] = []

    const binCount = frequencyData.length
    const binsPerBand = Math.floor(binCount / bandCount)

    for (let i = 0; i < bandCount; i++) {
      const startBin = i * binsPerBand
      const endBin = Math.min(startBin + binsPerBand, binCount)

      // Calculate average for this band
      let sum = 0
      for (let j = startBin; j < endBin; j++) {
        sum += frequencyData[j]
      }
      const average = sum / (endBin - startBin)

      bands.push(average / 255) // Normalize to 0-1
      frequencies.push((startBin + endBin) / 2 * nyquist / binCount)
    }

    return { bands, frequencies }
  }

  /**
   * Create logarithmic frequency bands (more perceptually relevant)
   */
  static createLogSpectralMapping(
    frequencyData: Uint8Array,
    sampleRate: number,
    bandCount: number = 32,
    minFreq: number = 20,
    maxFreq?: number
  ): { bands: number[], frequencies: number[] } {
    const nyquist = sampleRate / 2
    const actualMaxFreq = maxFreq || nyquist
    const binCount = frequencyData.length

    const bands: number[] = []
    const frequencies: number[] = []

    // Create logarithmic frequency boundaries
    const logMin = Math.log10(minFreq)
    const logMax = Math.log10(actualMaxFreq)
    const logStep = (logMax - logMin) / bandCount

    for (let i = 0; i < bandCount; i++) {
      const logFreqStart = logMin + i * logStep
      const logFreqEnd = logMin + (i + 1) * logStep

      const freqStart = Math.pow(10, logFreqStart)
      const freqEnd = Math.pow(10, logFreqEnd)

      // Convert frequencies to bin indices
      const binStart = Math.floor(freqStart * binCount / nyquist)
      const binEnd = Math.ceil(freqEnd * binCount / nyquist)

      // Calculate average for this band
      let sum = 0
      let count = 0
      for (let j = binStart; j < Math.min(binEnd, binCount); j++) {
        sum += frequencyData[j]
        count++
      }

      const average = count > 0 ? sum / count : 0
      bands.push(average / 255) // Normalize to 0-1
      frequencies.push((freqStart + freqEnd) / 2)
    }

    return { bands, frequencies }
  }

  /**
   * Analyze beat and rhythm patterns
   */
  static analyzeBeat(
    onsetHistory: Array<{ time: number, strength: number }>,
    windowSize: number = 4000 // ms
  ): {
    bpm: number
    confidence: number
    pattern: number[]
  } {
    const currentTime = Date.now()
    const recentOnsets = onsetHistory.filter(
      onset => currentTime - onset.time < windowSize
    )

    if (recentOnsets.length < 4) {
      return { bpm: 0, confidence: 0, pattern: [] }
    }

    // Calculate intervals between onsets
    const intervals: number[] = []
    for (let i = 1; i < recentOnsets.length; i++) {
      intervals.push(recentOnsets[i].time - recentOnsets[i - 1].time)
    }

    // Find most common interval (rough BPM detection)
    const intervalHistogram = new Map<number, number>()
    const tolerance = 50 // ms tolerance for grouping intervals

    intervals.forEach(interval => {
      let found = false
      for (const [key, count] of intervalHistogram.entries()) {
        if (Math.abs(key - interval) < tolerance) {
          intervalHistogram.set(key, count + 1)
          found = true
          break
        }
      }
      if (!found) {
        intervalHistogram.set(interval, 1)
      }
    })

    // Find most frequent interval
    let maxCount = 0
    let dominantInterval = 0
    for (const [interval, count] of intervalHistogram.entries()) {
      if (count > maxCount) {
        maxCount = count
        dominantInterval = interval
      }
    }

    const bpm = dominantInterval > 0 ? 60000 / dominantInterval : 0
    const confidence = maxCount / intervals.length

    // Extract rhythm pattern
    const pattern = intervals.map(interval =>
      Math.round((interval / dominantInterval) * 4) / 4
    )

    return { bpm, confidence, pattern }
  }

  /**
   * Calculate harmonic content analysis
   */
  static analyzeHarmony(
    frequencyData: Uint8Array,
    fundamentalFreq: number,
    sampleRate: number
  ): {
    harmonics: number[]
    inharmonicity: number
    spectralSpread: number
  } {
    if (fundamentalFreq === 0) {
      return { harmonics: [], inharmonicity: 1, spectralSpread: 1 }
    }

    const nyquist = sampleRate / 2
    const binWidth = nyquist / frequencyData.length
    const fundamentalBin = Math.round(fundamentalFreq / binWidth)

    const harmonics: number[] = []
    let harmonicEnergy = 0
    let totalEnergy = 0

    // Analyze first 8 harmonics
    for (let h = 1; h <= 8; h++) {
      const harmonicBin = Math.round(fundamentalBin * h)
      if (harmonicBin < frequencyData.length) {
        const magnitude = frequencyData[harmonicBin] / 255
        harmonics.push(magnitude)
        harmonicEnergy += magnitude
      } else {
        harmonics.push(0)
      }
    }

    // Calculate total spectral energy
    for (let i = 0; i < frequencyData.length; i++) {
      totalEnergy += (frequencyData[i] / 255) ** 2
    }

    const inharmonicity = totalEnergy > 0 ? 1 - (harmonicEnergy / totalEnergy) : 1

    // Calculate spectral spread (measure of frequency distribution)
    const spectralCentroid = this.calculateSpectralCentroid(frequencyData, binWidth)
    let spectralSpread = 0
    let totalMagnitude = 0

    for (let i = 0; i < frequencyData.length; i++) {
      const magnitude = frequencyData[i] / 255
      const frequency = i * binWidth
      spectralSpread += magnitude * Math.pow(frequency - spectralCentroid, 2)
      totalMagnitude += magnitude
    }

    spectralSpread = totalMagnitude > 0 ? Math.sqrt(spectralSpread / totalMagnitude) : 0

    return {
      harmonics,
      inharmonicity: Math.max(0, Math.min(1, inharmonicity)),
      spectralSpread: spectralSpread / nyquist // Normalize
    }
  }

  private static calculateSpectralCentroid(frequencyData: Uint8Array, binWidth: number): number {
    let numerator = 0
    let denominator = 0

    for (let i = 0; i < frequencyData.length; i++) {
      const magnitude = frequencyData[i] / 255
      const frequency = i * binWidth
      numerator += frequency * magnitude
      denominator += magnitude
    }

    return denominator > 0 ? numerator / denominator : 0
  }

  /**
   * Clear all smoothing buffers (useful for reset)
   */
  clearBuffers(): void {
    this.smoothingBuffers.clear()
    this.lastOnsetTimes.clear()
  }
}