// Audio processing types for SoundCanvas
export interface AudioAnalysisResult {
  frequencyData: Uint8Array
  bassEnergy: number
  midEnergy: number
  trebleEnergy: number
  averageFrequency: number
  dominantFrequency: number
  volume: number
  timestamp: number
}

export interface FFTConfig {
  fftSize: number
  smoothingTimeConstant: number
  minDecibels: number
  maxDecibels: number
}

export interface FrequencyBands {
  bass: [number, number]
  mid: [number, number]
  treble: [number, number]
}

export interface AudioMetadata {
  duration: number
  sampleRate: number
  channels: number
  bitrate?: number
  format: string
  size: number
}

export interface RecordingState {
  isRecording: boolean
  isPlaying: boolean
  isPaused: boolean
  duration: number
  currentTime: number
  volume: number
}

export interface AudioProcessorOptions {
  fftSize?: number
  smoothingTimeConstant?: number
  minDecibels?: number
  maxDecibels?: number
  enableRealTimeAnalysis?: boolean
}

export interface VisualizationData {
  frequencyData: number[]
  waveformData: number[]
  bassEnergy: number
  midEnergy: number
  trebleEnergy: number
  volume: number
  timestamp: number
  spectralCentroid: number
  spectralRolloff: number
  zeroCrossingRate: number
}

export type AudioFormat = 'mp3' | 'wav' | 'm4a' | 'ogg' | 'webm'

export interface AudioInputSource {
  type: 'file' | 'microphone' | 'url'
  data: File | MediaStream | string
  metadata?: AudioMetadata
}

export interface AudioError {
  code: string
  message: string
  details?: any
}

// Events
export interface AudioProcessorEvents {
  'analysis': (data: VisualizationData) => void
  'stateChange': (state: RecordingState) => void
  'error': (error: AudioError) => void
  'loadStart': () => void
  'loadEnd': (metadata: AudioMetadata) => void
}

export type AudioProcessorEventType = keyof AudioProcessorEvents