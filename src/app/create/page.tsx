'use client'

import React, { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  Mic,
  Play,
  Pause,
  Square,
  Volume2,
  FileAudio,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ArrowRight,
  ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { StylePicker, VisualizationStyle, StyleConfig } from '@/components/visualization/style-picker'

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const slideIn = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
}

// Step types
type CreateStep = 'upload' | 'customize' | 'preview' | 'export'

interface AudioFile {
  file: File
  name: string
  size: number
  duration: number
  format: string
}

interface RecordingState {
  isRecording: boolean
  isPaused: boolean
  duration: number
  audioBlob?: Blob
}

export default function CreatePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentStep, setCurrentStep] = useState<CreateStep>('upload')
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null)
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedStyle, setSelectedStyle] = useState<VisualizationStyle['id']>('particles')
  const [styleConfig, setStyleConfig] = useState<StyleConfig>({
    sensitivity: 1,
    smoothing: 0.8,
    scale: 1
  })
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)

  // File upload handling
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return

    setError(null)
    setIsLoading(true)

    const file = files[0]

    // Validate file type
    const supportedFormats = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg', 'audio/webm']
    if (!supportedFormats.some(format => file.type.startsWith(format))) {
      setError('지원하지 않는 파일 형식입니다. MP3, WAV, M4A, OGG 파일을 업로드해주세요.')
      setIsLoading(false)
      return
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      setError('파일 크기가 너무 큽니다. 50MB 이하의 파일을 업로드해주세요.')
      setIsLoading(false)
      return
    }

    // Simulate file processing
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 15
      setUploadProgress(Math.min(progress, 90))

      if (progress >= 90) {
        clearInterval(interval)

        // Extract file information
        const audio = new Audio()
        audio.src = URL.createObjectURL(file)

        audio.addEventListener('loadedmetadata', () => {
          const audioFileInfo: AudioFile = {
            file,
            name: file.name,
            size: file.size,
            duration: audio.duration,
            format: file.type.split('/')[1] || 'unknown'
          }

          setAudioFile(audioFileInfo)
          setUploadProgress(100)
          setIsLoading(false)

          setTimeout(() => {
            setCurrentStep('customize')
          }, 500)
        })

        audio.addEventListener('error', () => {
          setError('오디오 파일을 읽을 수 없습니다. 다른 파일을 시도해주세요.')
          setIsLoading(false)
          setUploadProgress(0)
        })
      }
    }, 100)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  // Recording functions
  const startRecording = async () => {
    try {
      setError(null)

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      // TODO: Implement actual recording with MediaRecorder
      setRecordingState(prev => ({ ...prev, isRecording: true }))

      // Simulate recording timer
      const startTime = Date.now()
      const interval = setInterval(() => {
        setRecordingState(prev => ({
          ...prev,
          duration: Date.now() - startTime
        }))
      }, 100)

      // Store interval reference for cleanup
      ;(window as any).recordingInterval = interval

    } catch (err) {
      setError('마이크 권한을 허용해주세요.')
    }
  }

  const stopRecording = () => {
    if ((window as any).recordingInterval) {
      clearInterval((window as any).recordingInterval)
    }

    setRecordingState(prev => ({ ...prev, isRecording: false }))

    // TODO: Process recorded audio
    // For now, simulate successful recording
    setTimeout(() => {
      setCurrentStep('customize')
    }, 500)
  }

  const pauseRecording = () => {
    setRecordingState(prev => ({ ...prev, isPaused: !prev.isPaused }))
  }

  // Style and preview handlers
  const handleStyleSelect = (style: VisualizationStyle['id']) => {
    setSelectedStyle(style)
  }

  const handleConfigChange = (config: StyleConfig) => {
    setStyleConfig(config)
  }

  const handlePreviewToggle = () => {
    setIsPreviewPlaying(!isPreviewPlaying)
    // TODO: Implement actual preview functionality
  }

  const handleNextToPreview = () => {
    if (selectedStyle) {
      // Store the visualization data for the next step
      sessionStorage.setItem('soundcanvas-audio', audioFile ? JSON.stringify(audioFile) : '')
      sessionStorage.setItem('soundcanvas-style', selectedStyle)
      sessionStorage.setItem('soundcanvas-config', JSON.stringify(styleConfig))

      setCurrentStep('preview')
    }
  }

  // Format duration helper
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Format file size helper
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Step content renderer
  const renderStepContent = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="max-w-2xl mx-auto"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-primary-text-primary)] mb-4 font-[var(--font-family-heading)]">
                오디오 추가하기
              </h1>
              <p className="text-lg text-[var(--color-primary-text-secondary)]">
                음악 파일을 업로드하거나 직접 녹음해서 시각화를 시작하세요
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* File Upload */}
              <Card className="bg-[var(--color-primary-surface-glass)] border-[var(--color-primary-border-default)] hover:border-[var(--color-accent-neon-blue)] transition-all duration-300 glass-morphism">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[var(--color-accent-neon-blue)] to-[var(--color-accent-neon-purple)] flex items-center justify-center">
                    <Upload size={24} className="text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-[var(--color-primary-text-primary)]">
                    파일 업로드
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 cursor-pointer",
                      "border-[var(--color-primary-border-default)] hover:border-[var(--color-accent-neon-blue)]",
                      "bg-[var(--color-primary-surface-default)]/50"
                    )}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileAudio size={32} className="mx-auto mb-4 text-[var(--color-primary-text-secondary)]" />
                    <p className="text-[var(--color-primary-text-primary)] font-medium mb-2">
                      파일을 드래그하거나 클릭하여 선택
                    </p>
                    <p className="text-sm text-[var(--color-primary-text-tertiary)]">
                      MP3, WAV, M4A, OGG (최대 50MB)
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />

                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 animate-spin" size={16} />
                        업로드 중...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2" size={16} />
                        파일 선택
                      </>
                    )}
                  </Button>

                  {isLoading && (
                    <div className="space-y-2">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-sm text-center text-[var(--color-primary-text-secondary)]">
                        {uploadProgress < 100 ? '파일 업로드 중...' : '파일 처리 중...'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Voice Recording */}
              <Card className="bg-[var(--color-primary-surface-glass)] border-[var(--color-primary-border-default)] hover:border-[var(--color-accent-neon-purple)] transition-all duration-300 glass-morphism">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[var(--color-accent-neon-purple)] to-[var(--color-accent-neon-pink)] flex items-center justify-center">
                    <Mic size={24} className="text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-[var(--color-primary-text-primary)]">
                    직접 녹음
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-8">
                    <div className={cn(
                      "w-20 h-20 rounded-full border-4 mx-auto mb-4 transition-all duration-300",
                      recordingState.isRecording
                        ? "border-[var(--color-semantic-error)] animate-pulse"
                        : "border-[var(--color-primary-border-default)]"
                    )}>
                      <div className={cn(
                        "w-full h-full rounded-full flex items-center justify-center transition-all duration-300",
                        recordingState.isRecording
                          ? "bg-[var(--color-semantic-error)]"
                          : "bg-[var(--color-primary-surface-elevated)]"
                      )}>
                        <Volume2 size={24} className="text-white" />
                      </div>
                    </div>

                    {recordingState.isRecording && (
                      <div className="text-2xl font-mono font-bold text-[var(--color-accent-neon-purple)] mb-2">
                        {formatDuration(recordingState.duration)}
                      </div>
                    )}

                    <p className="text-sm text-[var(--color-primary-text-secondary)] mb-4">
                      {recordingState.isRecording
                        ? (recordingState.isPaused ? '일시정지됨' : '녹음 중...')
                        : '마이크 버튼을 눌러 녹음을 시작하세요'
                      }
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {!recordingState.isRecording ? (
                      <Button
                        onClick={startRecording}
                        variant="primary"
                        className="flex-1"
                      >
                        <Mic className="mr-2" size={16} />
                        녹음 시작
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={pauseRecording}
                          variant="outline"
                          className="flex-1"
                        >
                          {recordingState.isPaused ? (
                            <>
                              <Play className="mr-2" size={16} />
                              재개
                            </>
                          ) : (
                            <>
                              <Pause className="mr-2" size={16} />
                              일시정지
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={stopRecording}
                          variant="destructive"
                          className="flex-1"
                        >
                          <Square className="mr-2" size={16} />
                          정지
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Error display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-6 p-4 bg-[var(--color-semantic-error)]/10 border border-[var(--color-semantic-error)]/20 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={20} className="text-[var(--color-semantic-error)] flex-shrink-0" />
                    <p className="text-[var(--color-semantic-error)] text-sm">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success display */}
            {audioFile && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-[var(--color-semantic-success)]/10 border border-[var(--color-semantic-success)]/20 rounded-lg"
              >
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle size={20} className="text-[var(--color-semantic-success)] flex-shrink-0" />
                  <p className="text-[var(--color-semantic-success)] font-medium">파일 업로드 완료!</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[var(--color-primary-text-tertiary)]">파일명:</span>
                    <p className="text-[var(--color-primary-text-primary)] font-medium truncate">{audioFile.name}</p>
                  </div>
                  <div>
                    <span className="text-[var(--color-primary-text-tertiary)]">크기:</span>
                    <p className="text-[var(--color-primary-text-primary)] font-medium">{formatFileSize(audioFile.size)}</p>
                  </div>
                  <div>
                    <span className="text-[var(--color-primary-text-tertiary)]">재생시간:</span>
                    <p className="text-[var(--color-primary-text-primary)] font-medium">{formatDuration(audioFile.duration * 1000)}</p>
                  </div>
                  <div>
                    <span className="text-[var(--color-primary-text-tertiary)]">포맷:</span>
                    <p className="text-[var(--color-primary-text-primary)] font-medium uppercase">{audioFile.format}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )

      case 'customize':
        return (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={slideIn}
            className="max-w-6xl mx-auto"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-primary-text-primary)] mb-4 font-[var(--font-family-heading)]">
                스타일 선택
              </h1>
              <p className="text-lg text-[var(--color-primary-text-secondary)]">
                원하는 시각화 스타일을 선택하고 설정을 조정하세요
              </p>
            </div>

            <StylePicker
              selectedStyle={selectedStyle}
              onStyleSelect={handleStyleSelect}
              onConfigChange={handleConfigChange}
              isPlaying={isPreviewPlaying}
              onPreviewToggle={handlePreviewToggle}
              className="mb-8"
            />

            <div className="flex justify-between max-w-4xl mx-auto">
              <Button
                onClick={() => setCurrentStep('upload')}
                variant="outline"
              >
                <ArrowLeft className="mr-2" size={16} />
                이전
              </Button>
              <Button
                onClick={handleNextToPreview}
                variant="primary"
                disabled={!selectedStyle}
              >
                미리보기
                <ArrowRight className="ml-2" size={16} />
              </Button>
            </div>
          </motion.div>
        )

      case 'preview':
        return (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-primary-text-primary)] mb-4 font-[var(--font-family-heading)]">
                시각화 준비 완료
              </h1>
              <p className="text-lg text-[var(--color-primary-text-secondary)]">
                모든 설정이 완료되었습니다. 시각화를 생성하시겠습니까?
              </p>
            </div>

            <Card className="bg-[var(--color-primary-surface-glass)] border-[var(--color-primary-border-default)] mb-8">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {audioFile && (
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--color-primary-text-secondary)]">오디오 파일:</span>
                      <span className="text-[var(--color-primary-text-primary)] font-medium">{audioFile.name}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-primary-text-secondary)]">시각화 스타일:</span>
                    <span className="text-[var(--color-primary-text-primary)] font-medium">
                      {selectedStyle === 'spectrum-3d' ? 'Spectrum 3D' :
                       selectedStyle === 'particles' ? 'Fluid Particles' :
                       selectedStyle === 'spectrogram-art' ? 'Spectrogram Art' :
                       selectedStyle === 'cozy-abstract' ? 'Cozy Abstract' :
                       selectedStyle === 'ml-emotion' ? 'ML Emotion' : selectedStyle}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-primary-text-secondary)]">민감도:</span>
                    <span className="text-[var(--color-primary-text-primary)] font-medium">{styleConfig.sensitivity.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-primary-text-secondary)]">부드러움:</span>
                    <span className="text-[var(--color-primary-text-primary)] font-medium">{Math.round(styleConfig.smoothing * 100)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-primary-text-secondary)]">크기:</span>
                    <span className="text-[var(--color-primary-text-primary)] font-medium">{Math.round(styleConfig.scale * 100)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => setCurrentStep('customize')}
                variant="outline"
                size="lg"
              >
                <ArrowLeft className="mr-2" size={16} />
                이전 단계
              </Button>
              <Button
                onClick={() => router.push('/result')}
                variant="primary"
                size="lg"
                className="min-w-48"
              >
                <Play className="mr-2" size={16} />
                시각화 생성
              </Button>
            </div>
          </motion.div>
        )

      default:
        return (
          <div className="text-center py-20">
            <p className="text-[var(--color-primary-text-secondary)]">
              이 단계는 아직 구현 중입니다.
            </p>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      {/* Progress indicator */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-4">
          {(['upload', 'customize', 'preview', 'export'] as CreateStep[]).map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
                currentStep === step
                  ? "bg-[var(--color-accent-neon-blue)] text-white"
                  : index <= (['upload', 'customize', 'preview', 'export'] as CreateStep[]).indexOf(currentStep)
                  ? "bg-[var(--color-accent-neon-blue)]/20 text-[var(--color-accent-neon-blue)]"
                  : "bg-[var(--color-primary-surface-elevated)] text-[var(--color-primary-text-tertiary)]"
              )}>
                {index + 1}
              </div>
              {index < 3 && (
                <div className={cn(
                  "w-16 h-1 mx-2 rounded-full transition-all duration-300",
                  index < (['upload', 'customize', 'preview', 'export'] as CreateStep[]).indexOf(currentStep)
                    ? "bg-[var(--color-accent-neon-blue)]"
                    : "bg-[var(--color-primary-surface-elevated)]"
                )} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm">
          <span className={cn(
            "transition-colors duration-300",
            currentStep === 'upload'
              ? "text-[var(--color-accent-neon-blue)]"
              : "text-[var(--color-primary-text-tertiary)]"
          )}>
            업로드
          </span>
          <span className={cn(
            "transition-colors duration-300",
            currentStep === 'customize'
              ? "text-[var(--color-accent-neon-blue)]"
              : "text-[var(--color-primary-text-tertiary)]"
          )}>
            커스터마이즈
          </span>
          <span className={cn(
            "transition-colors duration-300",
            currentStep === 'preview'
              ? "text-[var(--color-accent-neon-blue)]"
              : "text-[var(--color-primary-text-tertiary)]"
          )}>
            미리보기
          </span>
          <span className={cn(
            "transition-colors duration-300",
            currentStep === 'export'
              ? "text-[var(--color-accent-neon-blue)]"
              : "text-[var(--color-primary-text-tertiary)]"
          )}>
            내보내기
          </span>
        </div>
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        {renderStepContent()}
      </AnimatePresence>
    </div>
  )
}