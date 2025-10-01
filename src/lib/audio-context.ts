/**
 * Web Audio API Context Manager for SoundCanvas
 * Handles FFT analysis, audio processing, and visualization data generation
 */

import type { AudioContextManager, FFTData, AudioMetadata, AudioError } from '@/types';
import { PerformanceMonitor } from '@/utils';

export class SoundCanvasAudioContext implements AudioContextManager {
  public context: AudioContext | null = null;
  public analyser: AnalyserNode | null = null;
  public source: AudioBufferSourceNode | MediaElementAudioSourceNode | null = null;

  private currentSource: HTMLAudioElement | AudioBuffer | null = null;
  private performanceMonitor = new PerformanceMonitor();
  private fftSize = 2048;
  private smoothingTimeConstant = 0.8;
  private minDecibels = -90;
  private maxDecibels = -10;

  // Frequency band ranges (Hz)
  private readonly frequencyBands = {
    bass: { min: 20, max: 250 },
    mid: { min: 250, max: 4000 },
    treble: { min: 4000, max: 20000 }
  };

  private frequencyData: Uint8Array = new Uint8Array(0);
  private timeData: Uint8Array = new Uint8Array(0);

  /**
   * Initialize the Web Audio API context
   */
  async initialize(): Promise<void> {
    try {
      // Check for Web Audio API support
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;

      if (!AudioContextClass) {
        throw new Error('Web Audio API is not supported in this browser');
      }

      this.context = new AudioContextClass();

      // Resume context if suspended (required by browser autoplay policies)
      if (this.context.state === 'suspended') {
        await this.context.resume();
      }

      // Create analyzer node
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = this.fftSize;
      this.analyser.smoothingTimeConstant = this.smoothingTimeConstant;
      this.analyser.minDecibels = this.minDecibels;
      this.analyser.maxDecibels = this.maxDecibels;

      // Initialize data arrays
      const bufferLength = this.analyser.frequencyBinCount;
      this.frequencyData = new Uint8Array(bufferLength);
      this.timeData = new Uint8Array(bufferLength);

      console.log('SoundCanvas Audio Context initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      throw error;
    }
  }

  /**
   * Connect an audio source (HTMLAudioElement or AudioBuffer) to the analyzer
   */
  async connectSource(source: HTMLAudioElement | AudioBuffer): Promise<void> {
    if (!this.context || !this.analyser) {
      throw new Error('Audio context not initialized');
    }

    this.performanceMonitor.start('connectSource');

    try {
      // Disconnect existing source
      if (this.source) {
        this.source.disconnect();
      }

      if (source instanceof HTMLAudioElement) {
        // Connect HTML audio element
        this.source = this.context.createMediaElementSource(source);
        this.currentSource = source;
      } else if (source instanceof AudioBuffer) {
        // Connect audio buffer
        this.source = this.context.createBufferSource();
        this.source.buffer = source;
        this.currentSource = source;
      } else {
        throw new Error('Unsupported audio source type');
      }

      // Connect source to analyzer and destination
      this.source.connect(this.analyser);
      this.source.connect(this.context.destination);

      // Start buffer source if it's an AudioBuffer
      if (this.source instanceof AudioBufferSourceNode) {
        this.source.start();
      }

      this.performanceMonitor.end('connectSource');
      console.log('Audio source connected successfully');
    } catch (error) {
      this.performanceMonitor.end('connectSource');
      console.error('Failed to connect audio source:', error);
      throw error;
    }
  }

  /**
   * Get current FFT analysis data
   */
  getFFTData(): FFTData {
    if (!this.analyser) {
      return {
        frequencyData: new Uint8Array(0),
        timeData: new Uint8Array(0),
        bassEnergy: 0,
        midEnergy: 0,
        trebleEnergy: 0,
        totalEnergy: 0
      };
    }

    this.performanceMonitor.start('getFFTData');

    // Get frequency and time domain data
    this.analyser.getByteFrequencyData(this.frequencyData);
    this.analyser.getByteTimeDomainData(this.timeData);

    // Calculate energy levels for different frequency bands
    const sampleRate = this.context?.sampleRate || 44100;
    const nyquist = sampleRate / 2;
    const binWidth = nyquist / this.frequencyData.length;

    const bassEnergy = this.calculateBandEnergy(
      this.frequencyBands.bass.min,
      this.frequencyBands.bass.max,
      binWidth
    );

    const midEnergy = this.calculateBandEnergy(
      this.frequencyBands.mid.min,
      this.frequencyBands.mid.max,
      binWidth
    );

    const trebleEnergy = this.calculateBandEnergy(
      this.frequencyBands.treble.min,
      this.frequencyBands.treble.max,
      binWidth
    );

    const totalEnergy = this.calculateTotalEnergy();

    this.performanceMonitor.end('getFFTData');

    return {
      frequencyData: this.frequencyData.slice(),
      timeData: this.timeData.slice(),
      bassEnergy,
      midEnergy,
      trebleEnergy,
      totalEnergy
    };
  }

  /**
   * Calculate energy for a specific frequency band
   */
  private calculateBandEnergy(minFreq: number, maxFreq: number, binWidth: number): number {
    const startBin = Math.floor(minFreq / binWidth);
    const endBin = Math.floor(maxFreq / binWidth);
    let energy = 0;
    let count = 0;

    for (let i = startBin; i <= endBin && i < this.frequencyData.length; i++) {
      energy += this.frequencyData[i];
      count++;
    }

    return count > 0 ? energy / count / 255 : 0; // Normalize to 0-1
  }

  /**
   * Calculate total energy across all frequencies
   */
  private calculateTotalEnergy(): number {
    let total = 0;
    for (let i = 0; i < this.frequencyData.length; i++) {
      total += this.frequencyData[i];
    }
    return total / this.frequencyData.length / 255; // Normalize to 0-1
  }

  /**
   * Resume the audio context (required for autoplay policies)
   */
  async resume(): Promise<void> {
    if (this.context && this.context.state === 'suspended') {
      await this.context.resume();
      console.log('Audio context resumed');
    }
  }

  /**
   * Disconnect and cleanup audio resources
   */
  disconnect(): void {
    try {
      if (this.source) {
        this.source.disconnect();
        this.source = null;
      }

      if (this.analyser) {
        this.analyser.disconnect();
      }

      this.currentSource = null;
      console.log('Audio source disconnected');
    } catch (error) {
      console.error('Error disconnecting audio source:', error);
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return this.performanceMonitor.getMetrics();
  }

  /**
   * Clear performance metrics
   */
  clearPerformanceMetrics(): void {
    this.performanceMonitor.clear();
  }

  /**
   * Destroy the audio context and cleanup all resources
   */
  async destroy(): Promise<void> {
    try {
      this.disconnect();

      if (this.context) {
        await this.context.close();
        this.context = null;
        this.analyser = null;
      }

      this.performanceMonitor.clear();
      console.log('Audio context destroyed');
    } catch (error) {
      console.error('Error destroying audio context:', error);
    }
  }
}

/**
 * Audio file processing utilities
 */
export class AudioProcessor {
  private static readonly SUPPORTED_FORMATS = ['mp3', 'wav', 'm4a', 'ogg', 'aac', 'flac'];
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly MAX_DURATION = 300; // 5 minutes

  /**
   * Validate audio file
   */
  static validateAudioFile(file: File): AudioError | null {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        code: 'FILE_TOO_LARGE',
        message: `File size exceeds ${this.MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
        details: `File size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`
      };
    }

    // Check file format
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !this.SUPPORTED_FORMATS.includes(extension)) {
      return {
        code: 'UNSUPPORTED_FORMAT',
        message: `Unsupported file format: ${extension}`,
        details: `Supported formats: ${this.SUPPORTED_FORMATS.join(', ')}`
      };
    }

    return null;
  }

  /**
   * Load and decode audio file
   */
  static async loadAudioFile(file: File, context: AudioContext): Promise<{
    audioBuffer: AudioBuffer;
    metadata: AudioMetadata;
  }> {
    const arrayBuffer = await file.arrayBuffer();

    try {
      const audioBuffer = await context.decodeAudioData(arrayBuffer);

      // Check duration
      if (audioBuffer.duration > this.MAX_DURATION) {
        throw {
          code: 'DURATION_TOO_LONG',
          message: `Audio duration exceeds ${this.MAX_DURATION / 60} minute limit`,
          details: `Duration: ${Math.round(audioBuffer.duration)}s`
        } as AudioError;
      }

      const metadata: AudioMetadata = {
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
        format: file.type || `audio/${file.name.split('.').pop()}`,
        size: file.size,
        name: file.name,
        uploadedAt: new Date()
      };

      return { audioBuffer, metadata };
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }
      throw {
        code: 'PROCESSING_FAILED',
        message: 'Failed to decode audio file',
        details: error instanceof Error ? error.message : 'Unknown error'
      } as AudioError;
    }
  }

  /**
   * Create HTMLAudioElement from file
   */
  static createAudioElement(file: File): Promise<{
    audio: HTMLAudioElement;
    metadata: AudioMetadata;
  }> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const url = URL.createObjectURL(file);

      const cleanup = () => {
        URL.revokeObjectURL(url);
      };

      audio.addEventListener('loadedmetadata', () => {
        // Check duration
        if (audio.duration > this.MAX_DURATION) {
          cleanup();
          reject({
            code: 'DURATION_TOO_LONG',
            message: `Audio duration exceeds ${this.MAX_DURATION / 60} minute limit`,
            details: `Duration: ${Math.round(audio.duration)}s`
          } as AudioError);
          return;
        }

        const metadata: AudioMetadata = {
          duration: audio.duration,
          sampleRate: 44100, // Default, actual sample rate not available
          channels: 2, // Default stereo
          format: file.type || `audio/${file.name.split('.').pop()}`,
          size: file.size,
          name: file.name,
          uploadedAt: new Date()
        };

        resolve({ audio, metadata });
      });

      audio.addEventListener('error', () => {
        cleanup();
        reject({
          code: 'PROCESSING_FAILED',
          message: 'Failed to load audio file',
          details: audio.error?.message || 'Unknown error'
        } as AudioError);
      });

      audio.src = url;
      audio.preload = 'metadata';
    });
  }
}

/**
 * Microphone recorder utility
 */
export class MicrophoneRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private recordingStartTime = 0;

  /**
   * Request microphone permission and start recording
   */
  async startRecording(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: this.getSupportedMimeType()
      });

      this.chunks = [];
      this.recordingStartTime = Date.now();

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100); // Collect data every 100ms
      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw {
        code: 'MICROPHONE_ACCESS_DENIED',
        message: 'Microphone access denied or not available',
        details: error instanceof Error ? error.message : 'Unknown error'
      } as AudioError;
    }
  }

  /**
   * Stop recording and return audio blob with metadata
   */
  async stopRecording(): Promise<{
    audioBlob: Blob;
    metadata: AudioMetadata;
  }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.chunks, {
          type: this.getSupportedMimeType()
        });

        const duration = (Date.now() - this.recordingStartTime) / 1000;
        const metadata: AudioMetadata = {
          duration,
          sampleRate: 44100, // Estimated
          channels: 1, // Mono recording
          format: this.getSupportedMimeType(),
          size: audioBlob.size,
          name: `Recording-${new Date().toISOString()}.webm`,
          uploadedAt: new Date()
        };

        this.cleanup();
        resolve({ audioBlob, metadata });
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Get current recording duration
   */
  getRecordingDuration(): number {
    if (this.recordingStartTime === 0) return 0;
    return (Date.now() - this.recordingStartTime) / 1000;
  }

  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  /**
   * Cancel recording
   */
  cancelRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.cleanup();
  }

  /**
   * Get supported MIME type for recording
   */
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm'; // Fallback
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.chunks = [];
    this.recordingStartTime = 0;
  }
}

// Export a singleton instance
export const audioContext = new SoundCanvasAudioContext();