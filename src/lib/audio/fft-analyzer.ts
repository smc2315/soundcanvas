import type {
  AudioAnalysisResult,
  FFTConfig,
  FrequencyBands,
  VisualizationData,
  AudioProcessorOptions
} from './types'

export class FFTAnalyzer {
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private source: AudioNode | null = null
  private frequencyData: Uint8Array = new Uint8Array()
  private waveformData: Uint8Array = new Uint8Array()
  private isInitialized = false

  private config: FFTConfig = {
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    minDecibels: -90,
    maxDecibels: -10
  }

  private frequencyBands: FrequencyBands = {
    bass: [20, 250],
    mid: [250, 4000],
    treble: [4000, 20000]
  }

  constructor(options?: AudioProcessorOptions) {
    if (options) {
      this.config = { ...this.config, ...options }
    }
  }

  async initialize(): Promise<void> {
    try {
      // Create audio context with optimal settings
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 44100,
        latencyHint: 'interactive'
      })

      // Resume context if suspended (required by browser policies)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      // Create analyser node
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = this.config.fftSize
      this.analyser.smoothingTimeConstant = this.config.smoothingTimeConstant
      this.analyser.minDecibels = this.config.minDecibels
      this.analyser.maxDecibels = this.config.maxDecibels

      // Initialize data arrays
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount)
      this.waveformData = new Uint8Array(this.analyser.fftSize)

      this.isInitialized = true
    } catch (error) {
      throw new Error(`Failed to initialize FFT analyzer: ${error}`)
    }
  }

  async connectSource(audioNode: AudioNode): Promise<void> {
    if (!this.isInitialized || !this.analyser) {
      await this.initialize()
    }

    if (this.source) {
      this.source.disconnect()
    }

    this.source = audioNode
    audioNode.connect(this.analyser!)
  }

  async connectMediaElement(audioElement: HTMLAudioElement): Promise<void> {
    if (!this.audioContext) {
      await this.initialize()
    }

    const source = this.audioContext!.createMediaElementSource(audioElement)
    await this.connectSource(source)

    // Connect to destination so audio can be heard
    source.connect(this.audioContext!.destination)
  }

  async connectMediaStream(stream: MediaStream): Promise<void> {
    if (!this.audioContext) {
      await this.initialize()
    }

    const source = this.audioContext!.createMediaStreamSource(stream)
    await this.connectSource(source)
  }

  getVisualizationData(): VisualizationData {
    if (!this.analyser) {
      throw new Error('FFT analyzer not initialized')
    }

    // Get frequency and waveform data
    this.analyser.getByteFrequencyData(this.frequencyData)
    this.analyser.getByteTimeDomainData(this.waveformData)

    // Convert to normalized arrays (0-1)
    const frequencyDataNormalized = Array.from(this.frequencyData).map(value => value / 255)
    const waveformDataNormalized = Array.from(this.waveformData).map(value => (value - 128) / 128)

    // Calculate energy levels for different frequency bands
    const sampleRate = this.audioContext!.sampleRate
    const nyquist = sampleRate / 2
    const binSize = nyquist / this.analyser.frequencyBinCount

    const bassEnergy = this.calculateBandEnergy(this.frequencyBands.bass, binSize)
    const midEnergy = this.calculateBandEnergy(this.frequencyBands.mid, binSize)
    const trebleEnergy = this.calculateBandEnergy(this.frequencyBands.treble, binSize)

    // Calculate overall volume (RMS)
    const volume = this.calculateRMS(waveformDataNormalized)

    // Calculate spectral features
    const spectralCentroid = this.calculateSpectralCentroid(frequencyDataNormalized, binSize)
    const spectralRolloff = this.calculateSpectralRolloff(frequencyDataNormalized, binSize)
    const zeroCrossingRate = this.calculateZeroCrossingRate(waveformDataNormalized)

    return {
      frequencyData: frequencyDataNormalized,
      waveformData: waveformDataNormalized,
      bassEnergy,
      midEnergy,
      trebleEnergy,
      volume,
      timestamp: Date.now(),
      spectralCentroid,
      spectralRolloff,
      zeroCrossingRate
    }
  }

  private calculateBandEnergy(band: [number, number], binSize: number): number {
    const [minFreq, maxFreq] = band
    const startBin = Math.floor(minFreq / binSize)
    const endBin = Math.floor(maxFreq / binSize)

    let energy = 0
    let count = 0

    for (let i = startBin; i <= endBin && i < this.frequencyData.length; i++) {
      energy += this.frequencyData[i]
      count++
    }

    return count > 0 ? (energy / count) / 255 : 0
  }

  private calculateRMS(waveformData: number[]): number {
    const sumSquares = waveformData.reduce((sum, value) => sum + value * value, 0)
    return Math.sqrt(sumSquares / waveformData.length)
  }

  private calculateSpectralCentroid(frequencyData: number[], binSize: number): number {
    let weightedSum = 0
    let magnitudeSum = 0

    for (let i = 0; i < frequencyData.length; i++) {
      const frequency = i * binSize
      const magnitude = frequencyData[i]
      weightedSum += frequency * magnitude
      magnitudeSum += magnitude
    }

    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0
  }

  private calculateSpectralRolloff(frequencyData: number[], binSize: number, threshold = 0.85): number {
    const totalEnergy = frequencyData.reduce((sum, value) => sum + value, 0)
    const rolloffThreshold = totalEnergy * threshold

    let cumulativeEnergy = 0
    for (let i = 0; i < frequencyData.length; i++) {
      cumulativeEnergy += frequencyData[i]
      if (cumulativeEnergy >= rolloffThreshold) {
        return i * binSize
      }
    }

    return (frequencyData.length - 1) * binSize
  }

  private calculateZeroCrossingRate(waveformData: number[]): number {
    let crossings = 0
    for (let i = 1; i < waveformData.length; i++) {
      if ((waveformData[i] >= 0 && waveformData[i - 1] < 0) ||
          (waveformData[i] < 0 && waveformData[i - 1] >= 0)) {
        crossings++
      }
    }
    return crossings / (waveformData.length - 1)
  }

  getAudioContext(): AudioContext | null {
    return this.audioContext
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser
  }

  // Methods needed by visualization renderer
  getFrequencyData(): Uint8Array {
    if (!this.analyser) {
      return new Uint8Array(512) // Empty data if not initialized
    }
    this.analyser.getByteFrequencyData(this.frequencyData)
    return this.frequencyData
  }

  getWaveformData(): Uint8Array {
    if (!this.analyser) {
      return new Uint8Array(512) // Empty data if not initialized
    }
    this.analyser.getByteTimeDomainData(this.waveformData)
    return this.waveformData
  }

  getAmplitude(): number {
    if (!this.analyser) {
      return 0
    }

    this.analyser.getByteFrequencyData(this.frequencyData)

    // Calculate RMS amplitude from frequency data
    let sum = 0
    for (let i = 0; i < this.frequencyData.length; i++) {
      sum += this.frequencyData[i] * this.frequencyData[i]
    }

    const rms = Math.sqrt(sum / this.frequencyData.length)
    return rms / 255 // Normalize to 0-1
  }

  dispose(): void {
    if (this.source) {
      this.source.disconnect()
      this.source = null
    }

    if (this.analyser) {
      this.analyser.disconnect()
      this.analyser = null
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(console.error)
      this.audioContext = null
    }

    this.isInitialized = false
  }

  // Static utility methods
  static async checkBrowserSupport(): Promise<boolean> {
    return !!(window.AudioContext || (window as any).webkitAudioContext)
  }

  static async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch {
      return false
    }
  }

  static getSupportedAudioFormats(): string[] {
    const audio = document.createElement('audio')
    const formats: string[] = []

    const codecs = [
      { ext: 'mp3', type: 'audio/mpeg' },
      { ext: 'wav', type: 'audio/wav' },
      { ext: 'm4a', type: 'audio/mp4; codecs="mp4a.40.2"' },
      { ext: 'ogg', type: 'audio/ogg; codecs="vorbis"' },
      { ext: 'webm', type: 'audio/webm; codecs="vorbis"' }
    ]

    codecs.forEach(({ ext, type }) => {
      if (audio.canPlayType(type) !== '') {
        formats.push(ext)
      }
    })

    return formats
  }
}