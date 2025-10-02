/**
 * Offline audio analysis using OfflineAudioContext
 * Provides precise fixed-timestep analysis for video export and reproducible results
 */

import { RealtimeAudioFeatures } from './analyser'

export interface OfflineAudioFeatures extends Omit<RealtimeAudioFeatures, 'timestamp'> {
  frameIndex: number
  timePosition: number // Exact time in seconds
}

export interface OfflineAnalysisConfig {
  sampleRate: number
  fftSize: number
  hopSize: number // Samples between analysis frames
  windowFunction: 'hann' | 'hamming' | 'blackman'
}

export class OfflineAudioAnalyser {
  private config: OfflineAnalysisConfig
  private audioBuffer: AudioBuffer | null = null

  constructor(config: Partial<OfflineAnalysisConfig> = {}) {
    this.config = {
      sampleRate: 44100,
      fftSize: 2048,
      hopSize: 512,
      windowFunction: 'hann',
      ...config
    }
  }

  /**
   * Load audio file for offline analysis
   */
  async loadAudioFile(file: File): Promise<void> {
    const arrayBuffer = await file.arrayBuffer()
    const audioContext = new OfflineAudioContext(1, 1, this.config.sampleRate)
    this.audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
  }

  /**
   * Load audio buffer directly
   */
  loadAudioBuffer(buffer: AudioBuffer): void {
    this.audioBuffer = buffer
  }

  /**
   * Analyze entire audio file and return timestamped features
   */
  async analyzeComplete(): Promise<OfflineAudioFeatures[]> {
    if (!this.audioBuffer) {
      throw new Error('No audio buffer loaded')
    }

    const channelData = this.audioBuffer.getChannelData(0)
    const features: OfflineAudioFeatures[] = []
    const windowSize = this.config.fftSize
    const hopSize = this.config.hopSize

    // Create analysis window
    const window = this.createWindow(windowSize, this.config.windowFunction)

    let frameIndex = 0
    for (let pos = 0; pos + windowSize <= channelData.length; pos += hopSize) {
      const timePosition = pos / this.config.sampleRate

      // Extract windowed frame
      const frame = new Float32Array(windowSize)
      for (let i = 0; i < windowSize; i++) {
        frame[i] = channelData[pos + i] * window[i]
      }

      // Compute features for this frame
      const frameFeatures = await this.analyzeFrame(frame, frameIndex, timePosition)
      features.push(frameFeatures)

      frameIndex++
    }

    return features
  }

  /**
   * Analyze specific time range
   */
  async analyzeRange(startTime: number, endTime: number): Promise<OfflineAudioFeatures[]> {
    if (!this.audioBuffer) {
      throw new Error('No audio buffer loaded')
    }

    const startSample = Math.floor(startTime * this.config.sampleRate)
    const endSample = Math.floor(endTime * this.config.sampleRate)
    const channelData = this.audioBuffer.getChannelData(0).slice(startSample, endSample)

    const features: OfflineAudioFeatures[] = []
    const windowSize = this.config.fftSize
    const hopSize = this.config.hopSize
    const window = this.createWindow(windowSize, this.config.windowFunction)

    let frameIndex = 0
    for (let pos = 0; pos + windowSize <= channelData.length; pos += hopSize) {
      const timePosition = startTime + (pos / this.config.sampleRate)

      const frame = new Float32Array(windowSize)
      for (let i = 0; i < windowSize; i++) {
        frame[i] = channelData[pos + i] * window[i]
      }

      const frameFeatures = await this.analyzeFrame(frame, frameIndex, timePosition)
      features.push(frameFeatures)

      frameIndex++
    }

    return features
  }

  /**
   * Get features at specific time with interpolation
   */
  async getFeaturesAtTime(time: number): Promise<OfflineAudioFeatures | null> {
    if (!this.audioBuffer) {
      throw new Error('No audio buffer loaded')
    }

    const samplePos = time * this.config.sampleRate
    const frameStart = Math.floor(samplePos - this.config.fftSize / 2)

    if (frameStart < 0 || frameStart + this.config.fftSize > this.audioBuffer.length) {
      return null
    }

    const channelData = this.audioBuffer.getChannelData(0)
    const frame = new Float32Array(this.config.fftSize)
    const window = this.createWindow(this.config.fftSize, this.config.windowFunction)

    for (let i = 0; i < this.config.fftSize; i++) {
      frame[i] = channelData[frameStart + i] * window[i]
    }

    return this.analyzeFrame(frame, Math.floor(time * this.config.sampleRate / this.config.hopSize), time)
  }

  private async analyzeFrame(frame: Float32Array, frameIndex: number, timePosition: number): Promise<OfflineAudioFeatures> {
    // Time domain analysis
    const waveform = new Float32Array(frame)
    const rms = this.calculateRMS(frame)
    const zcr = this.calculateZCR(frame)

    // FFT for frequency domain
    const fftResult = await this.performFFT(frame)
    const magnitudeSpectrum = fftResult.magnitude
    const frequencyData = this.magnitudeToUint8(magnitudeSpectrum)

    const nyquist = this.config.sampleRate / 2
    const binWidth = nyquist / magnitudeSpectrum.length

    // Spectral features
    const spectralCentroid = this.calculateSpectralCentroid(magnitudeSpectrum, binWidth)
    const spectralRolloff = this.calculateSpectralRolloff(magnitudeSpectrum, binWidth, 0.85)
    const spectralFlux = this.calculateSpectralFlux(magnitudeSpectrum, frameIndex)

    // Perceptual features
    const energy = rms
    const brightness = spectralCentroid / nyquist
    const noisiness = zcr / (this.config.sampleRate / 2)

    // Onset detection
    const onsetStrength = this.calculateOnsetStrength(spectralFlux)
    const bpm = this.calculateBPM(onsetStrength, timePosition)

    // Pitch detection
    const fundamentalFreq = this.calculateFundamentalFreq(frame, this.config.sampleRate)
    const harmonicity = this.calculateHarmonicity(magnitudeSpectrum, fundamentalFreq, binWidth)

    return {
      frameIndex,
      timePosition,

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
      sampleRate: this.config.sampleRate
    }
  }

  private createWindow(size: number, type: 'hann' | 'hamming' | 'blackman'): Float32Array {
    const window = new Float32Array(size)

    for (let i = 0; i < size; i++) {
      switch (type) {
        case 'hann':
          window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (size - 1)))
          break
        case 'hamming':
          window[i] = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (size - 1))
          break
        case 'blackman':
          window[i] = 0.42 - 0.5 * Math.cos(2 * Math.PI * i / (size - 1)) + 0.08 * Math.cos(4 * Math.PI * i / (size - 1))
          break
      }
    }

    return window
  }

  private async performFFT(frame: Float32Array): Promise<{ magnitude: Float32Array, phase: Float32Array }> {
    // Simple DFT implementation (could be replaced with faster FFT)
    const N = frame.length
    const magnitude = new Float32Array(N / 2)
    const phase = new Float32Array(N / 2)

    for (let k = 0; k < N / 2; k++) {
      let realSum = 0
      let imagSum = 0

      for (let n = 0; n < N; n++) {
        const angle = -2 * Math.PI * k * n / N
        realSum += frame[n] * Math.cos(angle)
        imagSum += frame[n] * Math.sin(angle)
      }

      magnitude[k] = Math.sqrt(realSum * realSum + imagSum * imagSum)
      phase[k] = Math.atan2(imagSum, realSum)
    }

    return { magnitude, phase }
  }

  private magnitudeToUint8(magnitude: Float32Array): Uint8Array {
    const result = new Uint8Array(magnitude.length)
    const maxVal = Math.max(...magnitude)

    for (let i = 0; i < magnitude.length; i++) {
      result[i] = Math.floor((magnitude[i] / maxVal) * 255)
    }

    return result
  }

  // Feature calculation methods (similar to realtime analyser)
  private calculateRMS(data: Float32Array): number {
    let sum = 0
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i]
    }
    return Math.sqrt(sum / data.length)
  }

  private calculateZCR(data: Float32Array): number {
    let crossings = 0
    for (let i = 1; i < data.length; i++) {
      if ((data[i-1] >= 0) !== (data[i] >= 0)) {
        crossings++
      }
    }
    return crossings / data.length
  }

  private calculateSpectralCentroid(magnitude: Float32Array, binWidth: number): number {
    let numerator = 0
    let denominator = 0

    for (let i = 0; i < magnitude.length; i++) {
      const frequency = i * binWidth
      numerator += frequency * magnitude[i]
      denominator += magnitude[i]
    }

    return denominator > 0 ? numerator / denominator : 0
  }

  private calculateSpectralRolloff(magnitude: Float32Array, binWidth: number, threshold: number): number {
    const totalEnergy = magnitude.reduce((sum, mag) => sum + mag * mag, 0)
    const targetEnergy = totalEnergy * threshold

    let cumulativeEnergy = 0
    for (let i = 0; i < magnitude.length; i++) {
      cumulativeEnergy += magnitude[i] * magnitude[i]
      if (cumulativeEnergy >= targetEnergy) {
        return i * binWidth
      }
    }

    return (magnitude.length - 1) * binWidth
  }

  private previousMagnitudeFrames: Float32Array[] = []

  private calculateSpectralFlux(magnitude: Float32Array, frameIndex: number): number {
    this.previousMagnitudeFrames.push(new Float32Array(magnitude))
    if (this.previousMagnitudeFrames.length > 3) {
      this.previousMagnitudeFrames.shift()
    }

    if (this.previousMagnitudeFrames.length < 2) return 0

    const prev = this.previousMagnitudeFrames[this.previousMagnitudeFrames.length - 2]
    let flux = 0

    for (let i = 0; i < magnitude.length; i++) {
      const diff = magnitude[i] - prev[i]
      if (diff > 0) {
        flux += diff
      }
    }

    return flux / magnitude.length
  }

  private onsetHistory: Array<{time: number, strength: number}> = []

  private calculateOnsetStrength(spectralFlux: number): number {
    // Simple onset detection based on spectral flux peaks
    this.onsetHistory.push({ time: Date.now(), strength: spectralFlux })
    if (this.onsetHistory.length > 10) {
      this.onsetHistory.shift()
    }

    const avgFlux = this.onsetHistory.reduce((sum, val) => sum + val.strength, 0) / this.onsetHistory.length
    const onsetThreshold = avgFlux * 1.5

    return spectralFlux > onsetThreshold ? 1.0 : 0.0
  }

  private bpmHistory: number[] = []

  private calculateBPM(onsetStrength: number, currentTime: number): number {
    if (onsetStrength > 0.5) {
      this.bpmHistory.push(currentTime)

      // Keep only recent onsets (last 10 seconds)
      const cutoff = currentTime - 10
      this.bpmHistory = this.bpmHistory.filter(time => time > cutoff)

      if (this.bpmHistory.length >= 4) {
        const intervals: number[] = []
        for (let i = 1; i < this.bpmHistory.length; i++) {
          intervals.push(this.bpmHistory[i] - this.bpmHistory[i-1])
        }

        const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length
        return 60 / avgInterval
      }
    }

    return 0
  }

  private calculateFundamentalFreq(timeData: Float32Array, sampleRate: number): number {
    // Autocorrelation-based pitch detection
    const minPeriod = Math.floor(sampleRate / 800)
    const maxPeriod = Math.floor(sampleRate / 80)

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

  private calculateHarmonicity(magnitude: Float32Array, fundamentalFreq: number, binWidth: number): number {
    if (fundamentalFreq === 0) return 0

    const fundamentalBin = Math.round(fundamentalFreq / binWidth)
    let harmonicEnergy = 0
    let totalEnergy = 0

    // Check first 6 harmonics
    for (let harmonic = 1; harmonic <= 6; harmonic++) {
      const harmonicBin = Math.round(fundamentalBin * harmonic)
      if (harmonicBin < magnitude.length) {
        harmonicEnergy += magnitude[harmonicBin]
      }
    }

    // Calculate total energy
    totalEnergy = magnitude.reduce((sum, mag) => sum + mag, 0)

    return totalEnergy > 0 ? harmonicEnergy / totalEnergy : 0
  }

  /**
   * Get total duration of loaded audio
   */
  getDuration(): number {
    return this.audioBuffer ? this.audioBuffer.duration : 0
  }

  /**
   * Get sample rate of loaded audio
   */
  getSampleRate(): number {
    return this.audioBuffer ? this.audioBuffer.sampleRate : this.config.sampleRate
  }
}