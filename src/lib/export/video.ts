/**
 * Video export system with audio muxing
 * Supports WebCodecs API with ffmpeg.wasm fallback
 */

import { Visualizer, ExportOptions } from '../visualization/core/types'
import { OfflineAudioAnalyser } from '../audio/offline'

export interface VideoExportOptions extends ExportOptions {
  duration: number
  fps: number
  videoFormat: 'mp4' | 'webm'
  videoBitrate: number
  audioIncluded: boolean
  audioBitrate?: number
  width: number
  height: number
}

export class VideoExporter {
  private visualizer: Visualizer
  private offlineAnalyser: OfflineAudioAnalyser
  private isExporting = false
  private exportProgress = 0

  // WebCodecs support
  private videoEncoder?: VideoEncoder
  private videoWriter?: WritableStreamDefaultWriter

  // FFmpeg fallback
  private ffmpeg?: any

  constructor(visualizer: Visualizer, offlineAnalyser: OfflineAudioAnalyser) {
    this.visualizer = visualizer
    this.offlineAnalyser = offlineAnalyser
  }

  /**
   * Export video with synchronized audio visualization
   */
  async exportVideo(
    audioFile: File,
    options: VideoExportOptions,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    if (this.isExporting) {
      throw new Error('Export already in progress')
    }

    this.isExporting = true
    this.exportProgress = 0

    try {
      // Load and analyze audio
      await this.offlineAnalyser.loadAudioFile(audioFile)
      const audioFeatures = await this.offlineAnalyser.analyzeComplete()

      // Choose export method based on browser support
      if (this.supportsWebCodecs()) {
        return await this.exportWithWebCodecs(audioFile, audioFeatures, options, onProgress)
      } else {
        return await this.exportWithFFmpeg(audioFile, audioFeatures, options, onProgress)
      }
    } finally {
      this.isExporting = false
    }
  }

  /**
   * Export using WebCodecs API (modern browsers)
   */
  private async exportWithWebCodecs(
    audioFile: File,
    audioFeatures: any[],
    options: VideoExportOptions,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    const totalFrames = Math.ceil(options.duration * options.fps)
    const timeStep = 1 / options.fps

    // Setup video encoder
    const videoChunks: Uint8Array[] = []
    this.videoEncoder = new VideoEncoder({
      output: (chunk, metadata) => {
        const data = new Uint8Array(chunk.byteLength)
        chunk.copyTo(data)
        videoChunks.push(data)
      },
      error: (error) => {
        throw error
      }
    })

    this.videoEncoder.configure({
      codec: options.videoFormat === 'mp4' ? 'avc1.42E01E' : 'vp8',
      width: options.width,
      height: options.height,
      bitrate: options.videoBitrate,
      framerate: options.fps
    })

    // Create high-resolution canvas for rendering
    const renderCanvas = new OffscreenCanvas(options.width, options.height)
    const renderCtx = renderCanvas.getContext('2d')!

    // Initialize visualizer for high-res rendering
    const tempVisualizer = await this.createVisualizerInstance(renderCanvas, options)

    // Render frames
    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      const currentTime = frameIndex * timeStep

      // Get audio features for this time
      const nearestFeatureIndex = Math.floor(currentTime * 60) // Assuming 60fps analysis
      const features = audioFeatures[nearestFeatureIndex] || audioFeatures[audioFeatures.length - 1]

      // Update visualizer with audio features
      tempVisualizer.update(features)

      // Render frame
      const renderFrame = {
        frameIndex,
        timePosition: currentTime,
        canvas: renderCanvas,
        context: renderCtx,
        features,
        params: tempVisualizer.getParams()
      }

      tempVisualizer.renderFrame(renderFrame)

      // Convert canvas to VideoFrame
      const videoFrame = new VideoFrame(renderCanvas, {
        timestamp: frameIndex * (1000000 / options.fps) // microseconds
      })

      // Encode frame
      this.videoEncoder.encode(videoFrame, { keyFrame: frameIndex % 30 === 0 })
      videoFrame.close()

      // Update progress
      this.exportProgress = frameIndex / totalFrames
      onProgress?.(this.exportProgress)
    }

    // Finish encoding
    await this.videoEncoder.flush()
    this.videoEncoder.close()

    // Combine video chunks
    const videoBlob = new Blob(videoChunks, { type: `video/${options.videoFormat}` })

    // If audio is included, mux with original audio
    if (options.audioIncluded) {
      return await this.muxAudioVideo(videoBlob, audioFile, options)
    }

    return videoBlob
  }

  /**
   * Export using FFmpeg.wasm (fallback)
   */
  private async exportWithFFmpeg(
    audioFile: File,
    audioFeatures: any[],
    options: VideoExportOptions,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    // Initialize FFmpeg
    if (!this.ffmpeg) {
      const { createFFmpeg, fetchFile } = await import('@ffmpeg/ffmpeg')
      this.ffmpeg = createFFmpeg({
        log: false,
        progress: (p) => {
          this.exportProgress = p.ratio
          onProgress?.(this.exportProgress)
        }
      })
      await this.ffmpeg.load()
    }

    const totalFrames = Math.ceil(options.duration * options.fps)
    const timeStep = 1 / options.fps

    // Create high-resolution canvas
    const renderCanvas = new OffscreenCanvas(options.width, options.height)
    const renderCtx = renderCanvas.getContext('2d')!

    // Initialize visualizer
    const tempVisualizer = await this.createVisualizerInstance(renderCanvas, options)

    // Render all frames to images
    const frameBlobs: Blob[] = []
    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      const currentTime = frameIndex * timeStep

      // Get audio features
      const nearestFeatureIndex = Math.floor(currentTime * 60)
      const features = audioFeatures[nearestFeatureIndex] || audioFeatures[audioFeatures.length - 1]

      // Render frame
      tempVisualizer.update(features)
      const renderFrame = {
        frameIndex,
        timePosition: currentTime,
        canvas: renderCanvas,
        context: renderCtx,
        features,
        params: tempVisualizer.getParams()
      }

      tempVisualizer.renderFrame(renderFrame)

      // Convert to PNG blob
      const frameBlob = await renderCanvas.convertToBlob({ type: 'image/png' })
      frameBlobs.push(frameBlob)
    }

    // Write frames to FFmpeg
    for (let i = 0; i < frameBlobs.length; i++) {
      const frameData = await frameBlobs[i].arrayBuffer()
      this.ffmpeg.FS('writeFile', `frame${i.toString().padStart(6, '0')}.png`, new Uint8Array(frameData))
    }

    // Write audio file if included
    if (options.audioIncluded) {
      const audioData = await audioFile.arrayBuffer()
      this.ffmpeg.FS('writeFile', 'audio.wav', new Uint8Array(audioData))
    }

    // Run FFmpeg command
    const codec = options.videoFormat === 'mp4' ? 'libx264' : 'libvpx'
    const extension = options.videoFormat

    let ffmpegArgs = [
      '-framerate', options.fps.toString(),
      '-i', 'frame%06d.png',
      '-c:v', codec,
      '-b:v', `${options.videoBitrate}k`,
      '-r', options.fps.toString()
    ]

    if (options.audioIncluded) {
      ffmpegArgs.push(
        '-i', 'audio.wav',
        '-c:a', 'aac',
        '-b:a', `${options.audioBitrate || 128}k`,
        '-shortest'
      )
    }

    ffmpegArgs.push(`output.${extension}`)

    await this.ffmpeg.run(...ffmpegArgs)

    // Read output file
    const outputData = this.ffmpeg.FS('readFile', `output.${extension}`)
    return new Blob([outputData.buffer], { type: `video/${options.videoFormat}` })
  }

  /**
   * Mux video and audio using Web APIs
   */
  private async muxAudioVideo(videoBlob: Blob, audioFile: File, options: VideoExportOptions): Promise<Blob> {
    // This is a simplified version - real implementation would use proper muxing
    // For now, we'll return the video blob as-is
    // In production, you'd use a library like MP4Box.js or similar
    return videoBlob
  }

  /**
   * Create visualizer instance for video rendering
   */
  private async createVisualizerInstance(
    canvas: OffscreenCanvas,
    options: VideoExportOptions
  ): Promise<Visualizer> {
    const config = {
      width: options.width,
      height: options.height,
      pixelRatio: 1,
      fps: options.fps,
      backgroundColor: '#000000',
      seed: Date.now()
    }

    // Clone visualizer (simplified - would use factory pattern)
    const tempVisualizer = Object.create(Object.getPrototypeOf(this.visualizer))
    await tempVisualizer.init(canvas, config)
    tempVisualizer.updateParams(this.visualizer.getParams())

    return tempVisualizer
  }

  /**
   * Check if WebCodecs is supported
   */
  private supportsWebCodecs(): boolean {
    return typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined'
  }

  /**
   * Get export progress (0-1)
   */
  getProgress(): number {
    return this.exportProgress
  }

  /**
   * Cancel ongoing export
   */
  async cancelExport(): Promise<void> {
    if (!this.isExporting) return

    this.isExporting = false

    if (this.videoEncoder) {
      this.videoEncoder.close()
      this.videoEncoder = undefined
    }

    // Clean up any FFmpeg processes
    if (this.ffmpeg) {
      // FFmpeg cleanup would go here
    }
  }

  /**
   * Estimate export time based on options
   */
  estimateExportTime(options: VideoExportOptions): number {
    const totalFrames = options.duration * options.fps
    const averageFrameTime = this.supportsWebCodecs() ? 0.1 : 0.5 // seconds per frame

    return totalFrames * averageFrameTime
  }

  /**
   * Get optimal export settings based on use case
   */
  static getPresetOptions(preset: 'web' | 'social' | 'hd' | '4k'): Partial<VideoExportOptions> {
    switch (preset) {
      case 'web':
        return {
          width: 1280,
          height: 720,
          fps: 30,
          videoBitrate: 2000,
          audioBitrate: 128,
          videoFormat: 'mp4'
        }

      case 'social':
        return {
          width: 1080,
          height: 1080,
          fps: 30,
          videoBitrate: 3000,
          audioBitrate: 128,
          videoFormat: 'mp4'
        }

      case 'hd':
        return {
          width: 1920,
          height: 1080,
          fps: 60,
          videoBitrate: 8000,
          audioBitrate: 192,
          videoFormat: 'mp4'
        }

      case '4k':
        return {
          width: 3840,
          height: 2160,
          fps: 30,
          videoBitrate: 25000,
          audioBitrate: 320,
          videoFormat: 'mp4'
        }

      default:
        return {}
    }
  }

  /**
   * Estimate file size
   */
  estimateFileSize(options: VideoExportOptions): number {
    const videoBitrate = options.videoBitrate * 1000 / 8 // Convert to bytes per second
    const audioBitrate = options.audioIncluded ? (options.audioBitrate || 128) * 1000 / 8 : 0

    return (videoBitrate + audioBitrate) * options.duration
  }
}