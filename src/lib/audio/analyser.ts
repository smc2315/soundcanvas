/**
 * Real-time audio analysis using Web Audio API AnalyserNode
 * Provides low-latency frequency and time domain data for live visualization
 */

export interface RealtimeAudioFeatures {
  // Time domain
  waveform: Float32Array
  rms: number
  zcr: number // Zero Crossing Rate

  // Frequency domain
  frequencyData: Uint8Array
  magnitudeSpectrum: Float32Array
  spectralCentroid: number
  spectralRolloff: number
  spectralFlux: number

  // Perceptual features
  energy: number
  brightness: number
  noisiness: number

  // Rhythm/beat
  onsetStrength: number
  bpm: number

  // Harmony (basic)
  fundamentalFreq: number
  harmonicity: number

  // Meta
  timestamp: number
  sampleRate: number
}

export class RealtimeAudioAnalyser {
  private audioContext: AudioContext
  private analyserNode: AnalyserNode
  private sourceNode: AudioNode | null = null
  private dataArray: Uint8Array
  private floatDataArray: Float32Array
  private magnitudeArray: Float32Array

  // Feature extraction state
  private previousMagnitude: Float32Array | null = null
  private onsetHistory: number[] = []
  private bpmHistory: number[] = []
  private lastOnsetTime = 0

  constructor(
    audioContext: AudioContext,
    fftSize: number = 2048,
    smoothingTimeConstant: number = 0.8
  ) {
    this.audioContext = audioContext

    // Create and configure analyser with proper browser compatibility
    try {
      // Try standard method first
      this.analyserNode = audioContext.createAnalyser()
    } catch (e) {
      // Fallback for older browsers or different implementations
      this.analyserNode = (audioContext as any).createAnalyzer?.() ||
                          (audioContext as any).createAnalyserNode?.()

      if (!this.analyserNode) {
        throw new Error('AnalyserNode not supported in this browser')
      }
    }

    this.analyserNode.fftSize = fftSize
    this.analyserNode.smoothingTimeConstant = smoothingTimeConstant

    // Initialize data arrays
    const bufferLength = this.analyserNode.frequencyBinCount
    this.dataArray = new Uint8Array(bufferLength)
    this.floatDataArray = new Float32Array(bufferLength)
    this.magnitudeArray = new Float32Array(bufferLength)
  }

  /**
   * Connect audio source to analyser
   */
  connect(sourceNode: AudioNode): void {
    if (this.sourceNode) {
      this.sourceNode.disconnect(this.analyserNode)
    }

    this.sourceNode = sourceNode
    sourceNode.connect(this.analyserNode)
  }

  /**
   * Extract comprehensive audio features for current frame
   */
  getFeatures(): RealtimeAudioFeatures {
    // Get raw data
    this.analyserNode.getByteFrequencyData(this.dataArray)
    this.analyserNode.getFloatFrequencyData(this.floatDataArray)
    this.analyserNode.getFloatTimeDomainData(this.magnitudeArray)

    const sampleRate = this.audioContext.sampleRate
    const nyquist = sampleRate / 2
    const binWidth = nyquist / this.dataArray.length

    // Time domain analysis
    const waveform = new Float32Array(this.magnitudeArray)
    const rms = this.calculateRMS(this.magnitudeArray)
    const zcr = this.calculateZCR(this.magnitudeArray)

    // Frequency domain analysis
    const frequencyData = new Uint8Array(this.dataArray)
    const magnitudeSpectrum = new Float32Array(this.floatDataArray)
    const spectralCentroid = this.calculateSpectralCentroid(this.floatDataArray, binWidth)
    const spectralRolloff = this.calculateSpectralRolloff(this.floatDataArray, binWidth, 0.85)
    const spectralFlux = this.calculateSpectralFlux(this.floatDataArray)

    // Perceptual features
    const energy = rms
    const brightness = spectralCentroid / nyquist
    const noisiness = zcr / (sampleRate / 2)

    // Onset detection
    const onsetStrength = this.calculateOnsetStrength(spectralFlux)
    const bpm = this.calculateBPM(onsetStrength)

    // Pitch detection (fundamental frequency)
    const fundamentalFreq = this.calculateFundamentalFreq(this.magnitudeArray, sampleRate)
    const harmonicity = this.calculateHarmonicity(this.floatDataArray, fundamentalFreq, binWidth)

    return {
      // Time domain
      waveform,
      rms,
      zcr,

      // Frequency domain
      frequencyData,
      magnitudeSpectrum,
      spectralCentroid,
      spectralRolloff,
      spectralFlux,

      // Perceptual
      energy,
      brightness,
      noisiness,

      // Rhythm
      onsetStrength,
      bpm,

      // Harmony
      fundamentalFreq,
      harmonicity,

      // Meta
      timestamp: this.audioContext.currentTime,
      sampleRate
    }
  }

  private calculateRMS(timeData: Float32Array): number {
    let sum = 0
    for (let i = 0; i < timeData.length; i++) {
      sum += timeData[i] * timeData[i]
    }
    return Math.sqrt(sum / timeData.length)
  }

  private calculateZCR(timeData: Float32Array): number {
    let crossings = 0
    for (let i = 1; i < timeData.length; i++) {
      if ((timeData[i-1] >= 0) !== (timeData[i] >= 0)) {
        crossings++
      }
    }
    return crossings / timeData.length
  }

  private calculateSpectralCentroid(freqData: Float32Array, binWidth: number): number {
    let numerator = 0
    let denominator = 0

    for (let i = 0; i < freqData.length; i++) {
      const magnitude = Math.pow(10, freqData[i] / 20) // Convert dB to linear
      const frequency = i * binWidth
      numerator += frequency * magnitude
      denominator += magnitude
    }

    return denominator > 0 ? numerator / denominator : 0
  }

  private calculateSpectralRolloff(freqData: Float32Array, binWidth: number, threshold: number): number {
    const magnitudes = freqData.map(db => Math.pow(10, db / 20))
    const totalEnergy = magnitudes.reduce((sum, mag) => sum + mag * mag, 0)
    const targetEnergy = totalEnergy * threshold

    let cumulativeEnergy = 0
    for (let i = 0; i < magnitudes.length; i++) {
      cumulativeEnergy += magnitudes[i] * magnitudes[i]
      if (cumulativeEnergy >= targetEnergy) {
        return i * binWidth
      }
    }

    return (magnitudes.length - 1) * binWidth
  }

  private calculateSpectralFlux(freqData: Float32Array): number {
    if (!this.previousMagnitude) {
      this.previousMagnitude = new Float32Array(freqData.length)
      freqData.forEach((val, i) => this.previousMagnitude![i] = val)
      return 0
    }

    let flux = 0
    for (let i = 0; i < freqData.length; i++) {
      const diff = freqData[i] - this.previousMagnitude[i]
      if (diff > 0) {
        flux += diff
      }
      this.previousMagnitude[i] = freqData[i]
    }

    return flux / freqData.length
  }

  private calculateOnsetStrength(spectralFlux: number): number {
    const currentTime = this.audioContext.currentTime

    // Simple onset detection based on spectral flux peaks
    this.onsetHistory.push(spectralFlux)
    if (this.onsetHistory.length > 10) {
      this.onsetHistory.shift()
    }

    const avgFlux = this.onsetHistory.reduce((sum, val) => sum + val, 0) / this.onsetHistory.length
    const onsetThreshold = avgFlux * 1.5

    if (spectralFlux > onsetThreshold && currentTime - this.lastOnsetTime > 0.1) {
      this.lastOnsetTime = currentTime
      return 1.0
    }

    return 0.0
  }

  private calculateBPM(onsetStrength: number): number {
    if (onsetStrength > 0.5) {
      const currentTime = this.audioContext.currentTime
      this.bpmHistory.push(currentTime)

      // Keep only recent onsets (last 10 seconds)
      const cutoff = currentTime - 10
      this.bpmHistory = this.bpmHistory.filter(time => time > cutoff)

      if (this.bpmHistory.length >= 4) {
        // Calculate average interval between onsets
        const intervals: number[] = []
        for (let i = 1; i < this.bpmHistory.length; i++) {
          intervals.push(this.bpmHistory[i] - this.bpmHistory[i-1])
        }

        const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length
        return 60 / avgInterval // Convert to BPM
      }
    }

    return 0
  }

  private calculateFundamentalFreq(timeData: Float32Array, sampleRate: number): number {
    // Simple autocorrelation-based pitch detection
    const minPeriod = Math.floor(sampleRate / 800) // ~800 Hz max
    const maxPeriod = Math.floor(sampleRate / 80)  // ~80 Hz min

    let bestCorrelation = 0
    let bestPeriod = 0

    for (let period = minPeriod; period < maxPeriod && period < timeData.length / 2; period++) {
      let correlation = 0
      for (let i = 0; i < timeData.length - period; i++) {
        correlation += timeData[i] * timeData[i + period]
      }

      if (correlation > bestCorrelation) {
        bestCorrelation = correlation
        bestPeriod = period
      }
    }

    return bestPeriod > 0 ? sampleRate / bestPeriod : 0
  }

  private calculateHarmonicity(freqData: Float32Array, fundamentalFreq: number, binWidth: number): number {
    if (fundamentalFreq === 0) return 0

    const fundamentalBin = Math.round(fundamentalFreq / binWidth)
    let harmonicEnergy = 0
    let totalEnergy = 0

    // Check first 6 harmonics
    for (let harmonic = 1; harmonic <= 6; harmonic++) {
      const harmonicBin = Math.round(fundamentalBin * harmonic)
      if (harmonicBin < freqData.length) {
        const magnitude = Math.pow(10, freqData[harmonicBin] / 20)
        harmonicEnergy += magnitude
      }
    }

    // Calculate total energy
    for (let i = 0; i < freqData.length; i++) {
      totalEnergy += Math.pow(10, freqData[i] / 20)
    }

    return totalEnergy > 0 ? harmonicEnergy / totalEnergy : 0
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.sourceNode) {
      this.sourceNode.disconnect(this.analyserNode)
    }
    this.analyserNode.disconnect()
  }
}