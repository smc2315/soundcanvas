import type { RecordingState, AudioError, AudioMetadata } from './types'

export class MicrophoneRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private audioStream: MediaStream | null = null
  private recordedChunks: Blob[] = []
  private startTime: number = 0
  private pausedTime: number = 0
  private isRecording: boolean = false
  private isPaused: boolean = false

  private eventCallbacks: {
    onStateChange?: (state: RecordingState) => void
    onError?: (error: AudioError) => void
    onDataAvailable?: (audioBlob: Blob, metadata: AudioMetadata) => void
  } = {}

  constructor(callbacks?: {
    onStateChange?: (state: RecordingState) => void
    onError?: (error: AudioError) => void
    onDataAvailable?: (audioBlob: Blob, metadata: AudioMetadata) => void
  }) {
    this.eventCallbacks = callbacks || {}
  }

  async initialize(): Promise<boolean> {
    try {
      // Check if browser supports required APIs
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API not supported')
      }

      if (!window.MediaRecorder) {
        throw new Error('MediaRecorder API not supported')
      }

      return true
    } catch (error) {
      this.handleError('INITIALIZATION_FAILED', `Failed to initialize recorder: ${error}`)
      return false
    }
  }

  async requestMicrophonePermission(): Promise<boolean> {
    try {
      // Request microphone permission with optimal settings
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 2
        }
      })

      return true
    } catch (error: any) {
      let errorMessage = 'Unknown microphone error'
      let errorCode = 'MICROPHONE_ERROR'

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Microphone permission denied. Please allow microphone access and try again.'
        errorCode = 'PERMISSION_DENIED'
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone and try again.'
        errorCode = 'NO_MICROPHONE'
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Microphone is being used by another application.'
        errorCode = 'MICROPHONE_BUSY'
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        errorMessage = 'Microphone does not support the required audio settings.'
        errorCode = 'UNSUPPORTED_CONSTRAINTS'
      }

      this.handleError(errorCode, errorMessage, error)
      return false
    }
  }

  async startRecording(): Promise<boolean> {
    try {
      if (!this.audioStream) {
        const hasPermission = await this.requestMicrophonePermission()
        if (!hasPermission) return false
      }

      // Determine best audio format
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/wav'
      ]

      let selectedMimeType = 'audio/webm'
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType
          break
        }
      }

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.audioStream!, {
        mimeType: selectedMimeType,
        bitsPerSecond: 128000
      })

      // Reset state
      this.recordedChunks = []
      this.startTime = Date.now()
      this.pausedTime = 0
      this.isRecording = true
      this.isPaused = false

      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data)
        }
      }

      this.mediaRecorder.onstop = () => {
        if (this.recordedChunks.length > 0) {
          const audioBlob = new Blob(this.recordedChunks, { type: selectedMimeType })
          const metadata: AudioMetadata = {
            duration: this.getCurrentDuration(),
            sampleRate: 44100,
            channels: 2,
            format: this.extractFormatFromMimeType(selectedMimeType),
            size: audioBlob.size
          }

          this.eventCallbacks.onDataAvailable?.(audioBlob, metadata)
        }

        this.cleanup()
      }

      this.mediaRecorder.onerror = (event: any) => {
        this.handleError('RECORDING_ERROR', 'Recording failed', event.error)
        this.cleanup()
      }

      // Start recording
      this.mediaRecorder.start(100) // Collect data every 100ms
      this.updateState()

      return true
    } catch (error) {
      this.handleError('START_RECORDING_FAILED', `Failed to start recording: ${error}`)
      return false
    }
  }

  pauseRecording(): boolean {
    try {
      if (!this.mediaRecorder || !this.isRecording || this.isPaused) {
        return false
      }

      this.mediaRecorder.pause()
      this.isPaused = true
      this.pausedTime = Date.now()
      this.updateState()

      return true
    } catch (error) {
      this.handleError('PAUSE_FAILED', `Failed to pause recording: ${error}`)
      return false
    }
  }

  resumeRecording(): boolean {
    try {
      if (!this.mediaRecorder || !this.isRecording || !this.isPaused) {
        return false
      }

      this.mediaRecorder.resume()
      this.isPaused = false
      this.updateState()

      return true
    } catch (error) {
      this.handleError('RESUME_FAILED', `Failed to resume recording: ${error}`)
      return false
    }
  }

  stopRecording(): boolean {
    try {
      if (!this.mediaRecorder || !this.isRecording) {
        return false
      }

      this.mediaRecorder.stop()
      return true
    } catch (error) {
      this.handleError('STOP_FAILED', `Failed to stop recording: ${error}`)
      return false
    }
  }

  getCurrentDuration(): number {
    if (!this.isRecording) return 0

    const now = Date.now()
    if (this.isPaused) {
      return this.pausedTime - this.startTime
    }
    return now - this.startTime
  }

  getAudioStream(): MediaStream | null {
    return this.audioStream
  }

  getState(): RecordingState {
    return {
      isRecording: this.isRecording,
      isPlaying: false,
      isPaused: this.isPaused,
      duration: this.getCurrentDuration(),
      currentTime: this.getCurrentDuration(),
      volume: this.getInputLevel()
    }
  }

  private getInputLevel(): number {
    // This would require additional audio analysis
    // For now, return a placeholder value
    return 0.5
  }

  private updateState(): void {
    this.eventCallbacks.onStateChange?.(this.getState())
  }

  private handleError(code: string, message: string, details?: any): void {
    const error: AudioError = { code, message, details }
    this.eventCallbacks.onError?.(error)
  }

  private extractFormatFromMimeType(mimeType: string): string {
    if (mimeType.includes('webm')) return 'webm'
    if (mimeType.includes('mp4')) return 'm4a'
    if (mimeType.includes('ogg')) return 'ogg'
    if (mimeType.includes('wav')) return 'wav'
    return 'webm'
  }

  private cleanup(): void {
    this.isRecording = false
    this.isPaused = false
    this.recordedChunks = []
    this.mediaRecorder = null
    this.updateState()
  }

  dispose(): void {
    if (this.isRecording) {
      this.stopRecording()
    }

    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop())
      this.audioStream = null
    }

    this.cleanup()
  }

  // Static utility methods
  static async checkMicrophoneSupport(): Promise<boolean> {
    try {
      return !!(navigator.mediaDevices &&
                navigator.mediaDevices.getUserMedia &&
                window.MediaRecorder)
    } catch {
      return false
    }
  }

  static async getAvailableAudioInputDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      return devices.filter(device => device.kind === 'audioinput')
    } catch {
      return []
    }
  }

  static getSupportedRecordingFormats(): string[] {
    const formats: string[] = []
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/wav'
    ]

    mimeTypes.forEach(mimeType => {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        if (mimeType.includes('webm')) formats.push('webm')
        else if (mimeType.includes('mp4')) formats.push('m4a')
        else if (mimeType.includes('ogg')) formats.push('ogg')
        else if (mimeType.includes('wav')) formats.push('wav')
      }
    })

    return [...new Set(formats)] // Remove duplicates
  }
}