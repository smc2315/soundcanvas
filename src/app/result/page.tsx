'use client'

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  Square,
  Download,
  Share2,
  Settings,
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Volume2,
  VolumeX,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Eye,
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { VisualizationEngine, getOptimalRenderConfig } from '@/lib/visualization'
import { SupabaseService } from '@/lib/supabase/client'
import { StyleConfig, VisualizationStyle } from '@/components/visualization/style-picker'
import { FrameRenderer, FrameStyle } from '@/lib/frames/frame-renderer'
import { FrameSelector } from '@/components/frames/frame-selector'

interface CanvasSize {
  width: number
  height: number
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

interface ExportSettings {
  format: 'png' | 'jpg'
  quality: number
  size: CanvasSize
  includeFrame: boolean
  frameStyle: FrameStyle
}

const canvasSizes: CanvasSize[] = [
  { width: 512, height: 512, label: '정사각형 (512px)', icon: Monitor },
  { width: 768, height: 768, label: '정사각형 (768px)', icon: Monitor },
  { width: 1024, height: 1024, label: '정사각형 (1024px)', icon: Monitor },
  { width: 2048, height: 2048, label: '정사각형 (2048px)', icon: Monitor },
  { width: 1080, height: 1920, label: '세로형 (1080x1920)', icon: Smartphone },
  { width: 1920, height: 1080, label: '가로형 (1920x1080)', icon: Monitor },
  { width: 1536, height: 2048, label: '태블릿 (1536x2048)', icon: Tablet },
]

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const slideIn = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
}

export default function ResultPage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const visualizationEngineRef = useRef<VisualizationEngine>()
  const isCanvasReady = useRef<boolean>(false)

  // State management
  const [isLoading, setIsLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [volume, setVolume] = useState([70])

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareTitle, setShareTitle] = useState('')
  const [shareArtistName, setShareArtistName] = useState('')
  const [shareTags, setShareTags] = useState('')
  const [shareDescription, setShareDescription] = useState('')
  const [isSharing, setIsSharing] = useState(false)

  // Visualization settings
  const [audioFile, setAudioFile] = useState<any>(null)
  const [selectedStyle, setSelectedStyle] = useState<VisualizationStyle['id']>('particles')
  const [styleConfig, setStyleConfig] = useState<StyleConfig>({
    sensitivity: 1,
    smoothing: 0.8,
    scale: 1
  })

  // Export settings
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    format: 'png',
    quality: 90,
    size: canvasSizes[2], // 1024x1024 default
    includeFrame: false,
    frameStyle: 'none'
  })

  // Show/hide panels
  const [showSettings, setShowSettings] = useState(false)
  const [showExportPanel, setShowExportPanel] = useState(false)

  // Load session data on mount
  useEffect(() => {
    const loadSessionData = async () => {
      try {
        // Get data from session storage
        const audioData = sessionStorage.getItem('soundcanvas-audio')
        const style = sessionStorage.getItem('soundcanvas-style')
        const config = sessionStorage.getItem('soundcanvas-config')

        if (!audioData || !style) {
          // No session data, load demo MP3
          try {
            const response = await fetch('/demo.mp3')
            const blob = await response.blob()
            const file = new File([blob], 'demo.mp3', { type: 'audio/mpeg' })

            setAudioFile({
              file,
              name: 'Demo Audio',
              size: blob.size,
              type: 'audio/mpeg'
            })
          } catch (error) {
            console.warn('Failed to load demo audio:', error)
          }

          setSelectedStyle('particles')
          setStyleConfig({
            sensitivity: 1.2,
            smoothing: 0.8,
            scale: 1
          })
        } else {
          setAudioFile(JSON.parse(audioData))
          setSelectedStyle(style)
          if (config) {
            setStyleConfig(JSON.parse(config))
          }
        }

        // Fallback initialization if canvas ref callback doesn't work
        setTimeout(() => {
          if (isLoading) {
            console.log('⏰ Fallback initialization attempt...')
            if (canvasRef.current) {
              console.log('✅ Canvas found in fallback, initializing...')
              initializeVisualization().then(() => {
                setIsLoading(false)
              }).catch((error) => {
                console.error('❌ Fallback initialization failed:', error)
                setError('시각화 초기화에 실패했습니다.')
                setIsLoading(false)
              })
            } else {
              console.log('❌ Canvas still not found in fallback')
              setError('캔버스를 찾을 수 없습니다.')
              setIsLoading(false)
            }
          }
        }, 1000)
      } catch (err) {
        console.error('Failed to load session data:', err)
        setError('세션 데이터를 불러오는데 실패했습니다.')
        setIsLoading(false)
      }
    }

    loadSessionData()

    return () => {
      cleanup()
    }
  }, [router])

  // Initialize visualization system
  const initializeVisualization = async () => {
    try {
      console.log('🚀 INITIALIZING NEW VISUALIZATION ENGINE...')

      if (!canvasRef.current) {
        console.error('❌ Canvas not found!')
        return
      }

      console.log('📺 Canvas found:', canvasRef.current.width, 'x', canvasRef.current.height)

      // Initialize new visualization engine
      visualizationEngineRef.current = new VisualizationEngine({
        enableOfflineMode: true
      })

      await visualizationEngineRef.current.initialize()
      console.log('🎛️ VisualizationEngine initialized')

      // Get optimal render config
      const renderConfig = getOptimalRenderConfig(canvasRef.current)
      console.log('⚙️ Render config:', renderConfig)

      // Load selected visualization mode
      const success = await visualizationEngineRef.current.loadVisualizationMode(
        selectedStyle,
        canvasRef.current,
        renderConfig
      )

      if (!success) {
        throw new Error('Failed to load visualization mode')
      }

      console.log('✅ Visualization mode loaded:', selectedStyle)

      // Generate static image immediately
      console.log('🖼️ Generating static image in 100ms...')
      setTimeout(() => {
        console.log('🖼️ NOW GENERATING STATIC IMAGE!')
        generateStaticVisualization()
      }, 100)

    } catch (err) {
      console.error('❌ Failed to initialize visualization:', err)
      setError('시각화 시스템 초기화에 실패했습니다.')
    }
  }

  // Cleanup resources
  const cleanup = () => {
    visualizationEngineRef.current?.dispose()
  }

  // Generate static image visualization
  const generateStaticVisualization = async () => {
    try {
      console.log('🖼️ GENERATING STATIC VISUALIZATION!')

      if (!visualizationEngineRef.current) {
        console.error('❌ No visualization engine found!')
        return
      }

      console.log('✅ Visualization engine exists, proceeding...')
      setError(null)
      setIsPlaying(true)

      // Load audio file if available
      if (audioFile?.file) {
        try {
          await visualizationEngineRef.current.loadAudioFile(audioFile.file)
          console.log('📊 Audio file loaded')
        } catch (error) {
          console.warn('Audio loading failed, using demo mode:', error)
        }
      }

      // Start realtime visualization for demo
      visualizationEngineRef.current.startRealtimeVisualization()

      console.log('🖼️ Static image generation complete!')
      setIsPlaying(false)
      setSuccess('시각화 이미지가 성공적으로 생성되었습니다!')

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)

    } catch (err) {
      console.error('Failed to generate static visualization:', err)
      setError('정적 시각화 생성에 실패했습니다.')
      setIsPlaying(false)
    }
  }

  // Legacy animated visualization method (kept for compatibility)
  const startVisualization = async () => {
    try {
      console.log('🎬 START VISUALIZATION CALLED!')

      if (!rendererRef.current) {
        console.error('❌ No renderer found!')
        return
      }

      console.log('✅ Renderer exists, proceeding...')
      setError(null)
      setIsPlaying(true)

      let audio: HTMLAudioElement | null = null

      // Try to load audio if available
      if (audioFile && processorRef.current) {
        try {
          audio = new Audio()
          audio.src = URL.createObjectURL(audioFile.file)
          audio.volume = isMuted ? 0 : volume[0] / 100

          // Connect to processor
          await processorRef.current.loadAudioElement(audio)

          // Start playback
          audio.play()
        } catch (audioError) {
          console.warn('Audio loading failed, using demo visualization:', audioError)
        }
      }

      // Start animation loop (works with or without audio)
      console.log('🎞️ Creating animation loop...')

      let frameCount = 0
      const animate = () => {
        frameCount++
        // Only log every 60 frames (roughly once per second at 60fps) to reduce console spam
        if (frameCount % 60 === 0) {
          console.log('🎞️ ANIMATE FRAME!', frameCount)
        }

        if (!rendererRef.current) {
          console.error('❌ No renderer in animate!')
          return
        }

        let frequencyData: Uint8Array
        let amplitude: number

        if (processorRef.current) {
          frequencyData = processorRef.current.getFrequencies()
          amplitude = processorRef.current.getAmplitude()
          if (frameCount % 60 === 0) {
            console.log('🎵 Using real audio data, amplitude:', amplitude)
          }
        } else {
          // Fallback demo data
          frequencyData = new Uint8Array(512)
          const timestamp = Date.now()
          for (let i = 0; i < frequencyData.length; i++) {
            frequencyData[i] = Math.floor(128 + Math.sin(timestamp * 0.01 + i * 0.1) * 60)
          }
          amplitude = 0.5 + Math.sin(timestamp * 0.005) * 0.3
          if (frameCount % 60 === 0) {
            console.log('🎵 Using fallback demo data, amplitude:', amplitude)
          }
        }

        if (frameCount === 1) {
          console.log('🎨 First render call to renderer...')
        }
        rendererRef.current.render(frequencyData, amplitude, performance.now())

        if (isPlaying) {
          animationRef.current = requestAnimationFrame(animate)
        }
      }

      console.log('🎞️ Starting first animation frame...')
      animationRef.current = requestAnimationFrame(animate)

      // Handle audio end if audio exists
      if (audio) {
        audio.onended = () => {
          setIsPlaying(false)
        }
      }

    } catch (err) {
      console.error('Failed to start visualization:', err)
      setError('시각화 재생에 실패했습니다.')
      setIsPlaying(false)
    }
  }

  // Stop visualization
  const stopVisualization = () => {
    setIsPlaying(false)
    visualizationEngineRef.current?.stopVisualization()
  }

  // Share to gallery
  const shareToGallery = async () => {
    try {
      if (!canvasRef.current || !audioFile) return

      setIsSharing(true)
      setError(null)

      // Generate image data URL
      const imageDataUrl = canvasRef.current.toDataURL('image/png', 0.9)

      // Parse tags from comma-separated string
      const tags = shareTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      // Share to Supabase
      const { data, error } = await SupabaseService.shareWork({
        title: shareTitle,
        artistName: shareArtistName,
        style: selectedStyle as any,
        config: styleConfig,
        imageDataUrl,
        audioFileName: audioFile.name,
        frameStyle: exportSettings.frameStyle,
        tags,
        description: shareDescription
      })

      if (error) {
        throw error
      }

      setSuccess('작품이 갤러리에 공유되었습니다!')
      setShowShareModal(false)

      // Reset form
      setShareTitle('')
      setShareArtistName('')
      setShareTags('')
      setShareDescription('')

    } catch (err) {
      console.error('Failed to share work:', err)
      setError('작품 공유에 실패했습니다.')
    } finally {
      setIsSharing(false)
    }
  }

  // Export current canvas
  const exportCanvas = async () => {
    try {
      if (!canvasRef.current) return

      setIsExporting(true)
      setExportProgress(0)
      setError(null)

      // Create export canvas with desired size
      const exportCanvas = document.createElement('canvas')
      const exportCtx = exportCanvas.getContext('2d')!

      exportCanvas.width = exportSettings.size.width
      exportCanvas.height = exportSettings.size.height

      // Scale and draw current canvas
      setExportProgress(25)
      exportCtx.drawImage(
        canvasRef.current,
        0, 0, canvasRef.current.width, canvasRef.current.height,
        0, 0, exportCanvas.width, exportCanvas.height
      )

      // Add frame if selected
      if (exportSettings.includeFrame && exportSettings.frameStyle !== 'none') {
        setExportProgress(50)
        const frameConfig = FrameRenderer.getDefaultConfig(exportSettings.frameStyle, {
          width: exportCanvas.width,
          height: exportCanvas.height
        })
        FrameRenderer.renderFrame(exportCtx, exportCanvas.width, exportCanvas.height, frameConfig)
      }

      // Convert to blob
      setExportProgress(75)
      const blob = await new Promise<Blob>((resolve) => {
        exportCanvas.toBlob(
          (blob) => resolve(blob!),
          `image/${exportSettings.format}`,
          exportSettings.quality / 100
        )
      })

      // Download
      setExportProgress(100)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `soundcanvas-${selectedStyle}-${Date.now()}.${exportSettings.format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setSuccess('이미지가 성공적으로 내보내졌습니다!')
      setShowExportPanel(false)

    } catch (err) {
      console.error('Export failed:', err)
      setError('이미지 내보내기에 실패했습니다.')
    } finally {
      setIsExporting(false)
      setExportProgress(0)
    }
  }

  // Handle canvas ref
  const handleCanvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    if (canvas) {
      console.log('📺 Canvas element mounted:', canvas.width, 'x', canvas.height)
      canvasRef.current = canvas
      isCanvasReady.current = true

      // Try to initialize immediately when canvas is mounted
      setTimeout(async () => {
        if (canvasRef.current && isCanvasReady.current) {
          console.log('🚀 Immediate initialization attempt...')
          try {
            await initializeVisualization()
            setIsLoading(false)
          } catch (error) {
            console.error('❌ Immediate initialization failed:', error)
            setError('시각화 시스템 초기화에 실패했습니다.')
            setIsLoading(false)
          }
        }
      }, 50)
    } else {
      console.log('📺 Canvas element unmounted')
      isCanvasReady.current = false
    }
  }, [selectedStyle, styleConfig])

  // Handle frame selection
  const handleFrameSelect = (frameStyle: FrameStyle) => {
    setExportSettings(prev => ({
      ...prev,
      frameStyle,
      includeFrame: frameStyle !== 'none'
    }))
  }

  // Update volume
  const handleVolumeChange = (value: number[]) => {
    setVolume(value)
    // Update actual audio volume if playing
    // This would need to be connected to the actual audio element
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[var(--color-accent-neon-blue)]" />
          <p className="text-[var(--color-primary-text-secondary)]">시각화를 준비하고 있습니다...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={() => router.push('/create')}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="mr-2" size={16} />
            돌아가기
          </Button>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowSettings(!showSettings)}
              variant="ghost"
              size="sm"
            >
              <Settings size={16} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Canvas Area */}
          <div className="lg:col-span-2">
            <Card className="bg-[var(--color-primary-surface-glass)] border-[var(--color-primary-border-default)]">
              <CardContent className="p-6">
                <div className="relative">
                  <canvas
                    ref={handleCanvasRef}
                    width={800}
                    height={600}
                    className="w-full h-auto bg-[var(--color-canvas-background)] rounded-lg border border-[var(--color-primary-border-default)]"
                  />

                  {/* Overlay controls */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={isPlaying ? stopVisualization : generateStaticVisualization}
                        variant="primary"
                        size="sm"
                        disabled={isPlaying}
                      >
                        {isPlaying ? (
                          <>
                            <Loader2 className="mr-2 animate-spin" size={16} />
                            생성 중...
                          </>
                        ) : (
                          <>
                            <Play className="mr-2" size={16} />
                            이미지 생성
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={generateStaticVisualization}
                        variant="ghost"
                        size="sm"
                        disabled={isPlaying}
                        title="새로운 이미지 생성"
                      >
                        <RotateCcw size={16} />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setShowShareModal(true)}
                        variant="outline"
                        size="sm"
                      >
                        <Share2 className="mr-2" size={16} />
                        공유하기
                      </Button>

                      <Button
                        onClick={() => setShowExportPanel(!showExportPanel)}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="mr-2" size={16} />
                        내보내기
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Control Panel */}
          <div className="space-y-6">
            {/* Image Generation Controls */}
            <Card className="bg-[var(--color-primary-surface-glass)] border-[var(--color-primary-border-default)]">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[var(--color-primary-text-primary)]">
                  이미지 생성 제어
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Button
                    onClick={generateStaticVisualization}
                    disabled={isPlaying}
                    className="w-full"
                    variant="primary"
                  >
                    {isPlaying ? (
                      <>
                        <Loader2 className="mr-2 animate-spin" size={16} />
                        생성 중...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="mr-2" size={16} />
                        새 이미지 생성
                      </>
                    )}
                  </Button>
                </div>

                {audioFile && (
                  <div className="text-sm text-[var(--color-primary-text-secondary)]">
                    <p><strong>파일:</strong> {audioFile.name}</p>
                    <p><strong>스타일:</strong> {selectedStyle}</p>
                    <p><strong>유형:</strong> 정적 이미지</p>
                  </div>
                )}

                <div className="text-xs text-[var(--color-primary-text-tertiary)]">
                  각 생성마다 오디오 분석을 기반으로 고유한 예술 작품이 만들어집니다.
                </div>
              </CardContent>
            </Card>

            {/* Export Panel */}
            <AnimatePresence>
              {showExportPanel && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="bg-[var(--color-primary-surface-glass)] border-[var(--color-primary-border-default)]">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-[var(--color-primary-text-primary)]">
                        내보내기 설정
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Size Selection */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--color-primary-text-primary)]">
                          이미지 크기
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                          {canvasSizes.map((size, index) => (
                            <Button
                              key={index}
                              onClick={() => setExportSettings(prev => ({ ...prev, size }))}
                              variant={exportSettings.size === size ? "primary" : "outline"}
                              size="sm"
                              className="justify-start"
                            >
                              <size.icon className="mr-2" size={16} />
                              {size.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Frame Selection */}
                      <FrameSelector
                        selectedFrame={exportSettings.frameStyle}
                        onFrameSelect={handleFrameSelect}
                      />

                      {/* Format Selection */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--color-primary-text-primary)]">
                          파일 형식
                        </label>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setExportSettings(prev => ({ ...prev, format: 'png' }))}
                            variant={exportSettings.format === 'png' ? "primary" : "outline"}
                            size="sm"
                          >
                            PNG
                          </Button>
                          <Button
                            onClick={() => setExportSettings(prev => ({ ...prev, format: 'jpg' }))}
                            variant={exportSettings.format === 'jpg' ? "primary" : "outline"}
                            size="sm"
                          >
                            JPG
                          </Button>
                        </div>
                      </div>

                      {/* Export Button */}
                      <Button
                        onClick={exportCanvas}
                        disabled={isExporting}
                        className="w-full"
                        variant="primary"
                      >
                        {isExporting ? (
                          <>
                            <Loader2 className="mr-2 animate-spin" size={16} />
                            내보내는 중... {exportProgress}%
                          </>
                        ) : (
                          <>
                            <Download className="mr-2" size={16} />
                            이미지 다운로드
                          </>
                        )}
                      </Button>

                      {isExporting && (
                        <Progress value={exportProgress} className="h-2" />
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Status Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed bottom-4 right-4 p-4 bg-[var(--color-semantic-error)]/10 border border-[var(--color-semantic-error)]/20 rounded-lg max-w-sm"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle size={20} className="text-[var(--color-semantic-error)] flex-shrink-0" />
                <p className="text-[var(--color-semantic-error)] text-sm">{error}</p>
              </div>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed bottom-4 right-4 p-4 bg-[var(--color-semantic-success)]/10 border border-[var(--color-semantic-success)]/20 rounded-lg max-w-sm"
            >
              <div className="flex items-center gap-3">
                <CheckCircle size={20} className="text-[var(--color-semantic-success)] flex-shrink-0" />
                <p className="text-[var(--color-semantic-success)] text-sm">{success}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Share Modal */}
        <AnimatePresence>
          {showShareModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[var(--color-primary-surface-elevated)] rounded-lg border border-[var(--color-primary-border-default)] max-w-md w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-[var(--color-primary-text-primary)]">
                      갤러리에 공유하기
                    </h2>
                    <Button
                      onClick={() => setShowShareModal(false)}
                      variant="ghost"
                      size="sm"
                    >
                      ×
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-primary-text-primary)] mb-2">
                        작품 제목 *
                      </label>
                      <Input
                        placeholder="작품 제목을 입력하세요"
                        value={shareTitle}
                        onChange={(e) => setShareTitle(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--color-primary-text-primary)] mb-2">
                        아티스트명 *
                      </label>
                      <Input
                        placeholder="아티스트명을 입력하세요"
                        value={shareArtistName}
                        onChange={(e) => setShareArtistName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--color-primary-text-primary)] mb-2">
                        태그
                      </label>
                      <Input
                        placeholder="태그를 쉼표로 구분하여 입력 (예: jazz, ambient, chill)"
                        value={shareTags}
                        onChange={(e) => setShareTags(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--color-primary-text-primary)] mb-2">
                        설명
                      </label>
                      <textarea
                        className="w-full h-20 px-3 py-2 rounded-md border border-[var(--color-primary-border-default)] bg-[var(--color-primary-surface-elevated)] text-[var(--color-primary-text-primary)] placeholder:text-[var(--color-primary-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-neon-blue)]"
                        placeholder="작품에 대한 설명을 입력하세요"
                        value={shareDescription}
                        onChange={(e) => setShareDescription(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-2 text-xs text-[var(--color-primary-text-secondary)]">
                      <Globe size={12} className="flex-shrink-0 mt-0.5" />
                      <span>
                        공유된 작품은 모든 사용자가 볼 수 있으며, 갤러리에 표시됩니다.
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      onClick={() => setShowShareModal(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      취소
                    </Button>
                    <Button
                      onClick={shareToGallery}
                      variant="primary"
                      className="flex-1"
                      disabled={!shareTitle.trim() || !shareArtistName.trim() || isSharing}
                    >
                      {isSharing ? (
                        <>
                          <Loader2 className="mr-2 animate-spin" size={16} />
                          공유 중...
                        </>
                      ) : (
                        <>
                          <Users className="mr-2" size={16} />
                          공유하기
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}