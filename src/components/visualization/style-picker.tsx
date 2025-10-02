'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CircleDot,
  Zap,
  Palette as PaletteIcon,
  Brain,
  Box,
  Play,
  Pause,
  Settings,
  Sliders
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

// Types
export interface VisualizationStyle {
  id: 'spectrum-3d' | 'particles' | 'spectrogram-art' | 'cozy-abstract' | 'ml-emotion'
  name: string
  description: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  colors: string[]
  features: string[]
  complexity: 'low' | 'medium' | 'high'
  performance: 'good' | 'medium' | 'intensive'
  category: 'data' | 'artistic' | 'abstract'
  supports3D: boolean
}

export interface StyleConfig {
  sensitivity: number
  smoothing: number
  scale: number
  customColors?: {
    primary: string
    secondary: string
    accent: string
  }
}

export interface StylePickerProps {
  selectedStyle?: VisualizationStyle['id']
  onStyleSelect: (style: VisualizationStyle['id']) => void
  onConfigChange?: (config: StyleConfig) => void
  isPlaying?: boolean
  onPreviewToggle?: () => void
  className?: string
}

// Style definitions
const visualizationStyles: VisualizationStyle[] = [
  {
    id: 'spectrum-3d',
    name: 'Spectrum 3D',
    description: 'Three.js 기반 3D 주파수 스펙트럼 지형으로 입체적인 오디오 시각화를 제공합니다.',
    icon: Box,
    colors: ['#003f5c', '#2f4b7c', '#665191', '#a05195', '#d45087'],
    features: ['3D 지형', '실시간 높이맵', '카메라 회전', '파티클 시스템'],
    complexity: 'high',
    performance: 'intensive',
    category: 'data',
    supports3D: true
  },
  {
    id: 'particles',
    name: 'Fluid Particles',
    description: '유체 역학 파티클 시스템으로 부드러운 빛 효과와 유기적 흐름을 생성합니다.',
    icon: CircleDot,
    colors: ['#FF6B6B', '#FFE66D', '#FF8E53', '#C44569', '#F8B500'],
    features: ['유체 파티클', '소프트 블렌딩', '트레일 효과', '온셋 반응'],
    complexity: 'medium',
    performance: 'good',
    category: 'artistic',
    supports3D: false
  },
  {
    id: 'spectrogram-art',
    name: 'Spectrogram Art',
    description: '예술적 스펙트로그램으로 수채화, 유화 등 다양한 페인팅 스타일을 지원합니다.',
    icon: PaletteIcon,
    colors: ['#2E1065', '#7C3AED', '#A855F7', '#EC4899', '#F97316'],
    features: ['페인팅 효과', '시간축 표시', '주파수 매핑', '텍스처 혼합'],
    complexity: 'medium',
    performance: 'medium',
    category: 'artistic',
    supports3D: false
  },
  {
    id: 'cozy-abstract',
    name: 'Cozy Abstract',
    description: '따뜻하고 편안한 추상 패턴으로 부드러운 조명과 유기적 움직임을 구현합니다.',
    icon: Zap,
    colors: ['#8B4513', '#CD853F', '#DEB887', '#F4A460', '#FFE4B5'],
    features: ['유기적 형태', '앰비언트 글로우', '종이 텍스처', '호흡 애니메이션'],
    complexity: 'low',
    performance: 'good',
    category: 'abstract',
    supports3D: false
  },
  {
    id: 'ml-emotion',
    name: 'ML Emotion',
    description: 'AI 감정 분석을 통한 신경망 패턴으로 적응형 시각화를 제공합니다.',
    icon: Brain,
    colors: ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#7209b7'],
    features: ['감정 분석', '신경망 연결', '적응형 색상', '데이터 오버레이'],
    complexity: 'high',
    performance: 'medium',
    category: 'data',
    supports3D: false
  }
]

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' }
  }
}

export function StylePicker({
  selectedStyle,
  onStyleSelect,
  onConfigChange,
  isPlaying = false,
  onPreviewToggle,
  className
}: StylePickerProps) {
  const [config, setConfig] = useState<StyleConfig>({
    sensitivity: 1,
    smoothing: 0.8,
    scale: 1
  })

  const [activeTab, setActiveTab] = useState<'styles' | 'settings'>('styles')
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'data' | 'artistic' | 'abstract'>('all')

  // Handle config changes
  const handleConfigChange = (key: keyof StyleConfig, value: any) => {
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
    onConfigChange?.(newConfig)
  }

  // Get performance color
  const getPerformanceColor = (performance: VisualizationStyle['performance']) => {
    switch (performance) {
      case 'good': return 'text-[var(--color-semantic-success)]'
      case 'medium': return 'text-[var(--color-semantic-warning)]'
      case 'intensive': return 'text-[var(--color-semantic-error)]'
      default: return 'text-[var(--color-primary-text-secondary)]'
    }
  }

  // Get complexity indicator
  const getComplexityDots = (complexity: VisualizationStyle['complexity']) => {
    const dots = complexity === 'low' ? 1 : complexity === 'medium' ? 2 : 3
    return Array.from({ length: 3 }, (_, i) => (
      <div
        key={i}
        className={cn(
          'w-2 h-2 rounded-full',
          i < dots ? 'bg-[var(--color-accent-neon-blue)]' : 'bg-[var(--color-primary-surface-elevated)]'
        )}
      />
    ))
  }

  // Filter styles by category
  const filteredStyles = selectedCategory === 'all'
    ? visualizationStyles
    : visualizationStyles.filter(style => style.category === selectedCategory)

  return (
    <div className={cn('w-full max-w-4xl mx-auto', className)}>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        {/* Tab Navigation */}
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="styles" className="flex items-center gap-2">
            <Palette size={16} />
            스타일 선택
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings size={16} />
            설정
          </TabsTrigger>
        </TabsList>

        {/* Styles Tab */}
        <TabsContent value="styles" className="space-y-6">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {[
              { id: 'all', label: '전체', count: visualizationStyles.length },
              { id: 'data', label: '데이터', count: visualizationStyles.filter(s => s.category === 'data').length },
              { id: 'artistic', label: '아티스틱', count: visualizationStyles.filter(s => s.category === 'artistic').length },
              { id: 'abstract', label: '추상', count: visualizationStyles.filter(s => s.category === 'abstract').length }
            ].map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id as any)}
                className="text-sm"
              >
                {category.label} ({category.count})
              </Button>
            ))}
          </div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredStyles.map((style) => (
              <motion.div key={style.id} variants={cardVariants}>
                <Card
                  className={cn(
                    'cursor-pointer transition-all duration-300 hover:scale-105',
                    'bg-[var(--color-primary-surface-glass)] border-2',
                    selectedStyle === style.id
                      ? 'border-[var(--color-accent-neon-blue)] glow-blue'
                      : 'border-[var(--color-primary-border-default)] hover:border-[var(--color-accent-neon-purple)]'
                  )}
                  onClick={() => onStyleSelect(style.id)}
                >
                  <CardHeader className="text-center pb-4">
                    {/* Style Icon */}
                    <div className={cn(
                      'w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-all duration-300',
                      selectedStyle === style.id
                        ? 'bg-gradient-to-br from-[var(--color-accent-neon-blue)] to-[var(--color-accent-neon-purple)]'
                        : 'bg-[var(--color-primary-surface-elevated)] hover:bg-[var(--color-accent-glow-purple)]'
                    )}>
                      <style.icon
                        size={24}
                        className={selectedStyle === style.id ? 'text-white' : 'text-[var(--color-accent-neon-blue)]'}
                      />
                    </div>

                    {/* Style Name */}
                    <CardTitle className="text-xl font-semibold text-[var(--color-primary-text-primary)] font-[var(--font-family-heading)]">
                      {style.name}
                    </CardTitle>

                    {/* Color Palette */}
                    <div className="flex justify-center gap-2 mt-3">
                      {style.colors.map((color, index) => (
                        <div
                          key={index}
                          className="w-4 h-4 rounded-full border border-[var(--color-primary-border-default)]"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Description */}
                    <p className="text-sm text-[var(--color-primary-text-secondary)] leading-relaxed">
                      {style.description}
                    </p>

                    {/* Features */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-[var(--color-primary-text-primary)]">주요 특징</h4>
                      <ul className="space-y-1">
                        {style.features.map((feature, index) => (
                          <li key={index} className="text-xs text-[var(--color-primary-text-tertiary)] flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-[var(--color-accent-neon-blue)]" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Performance Indicators */}
                    <div className="space-y-2 pt-3 border-t border-[var(--color-primary-border-default)]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--color-primary-text-tertiary)]">복잡도:</span>
                          <div className="flex gap-1">
                            {getComplexityDots(style.complexity)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--color-primary-text-tertiary)]">성능:</span>
                          <span className={cn('text-xs font-medium', getPerformanceColor(style.performance))}>
                            {style.performance === 'good' ? '좋음' : style.performance === 'medium' ? '보통' : '집약적'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--color-primary-text-tertiary)]">카테고리:</span>
                          <span className="text-xs font-medium text-[var(--color-accent-neon-purple)]">
                            {style.category === 'data' ? '데이터' : style.category === 'artistic' ? '아티스틱' : '추상'}
                          </span>
                        </div>
                        {style.supports3D && (
                          <div className="flex items-center gap-1">
                            <Box size={12} className="text-[var(--color-accent-neon-blue)]" />
                            <span className="text-xs font-medium text-[var(--color-accent-neon-blue)]">3D</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Selection Indicator */}
                    {selectedStyle === style.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center justify-center gap-2 py-2 bg-[var(--color-accent-glow-blue)] rounded-lg"
                      >
                        <div className="w-2 h-2 rounded-full bg-[var(--color-accent-neon-blue)]" />
                        <span className="text-sm font-medium text-[var(--color-accent-neon-blue)]">선택됨</span>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Preview Controls */}
          {selectedStyle && onPreviewToggle && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center pt-6"
            >
              <Button
                onClick={onPreviewToggle}
                variant={isPlaying ? "outline" : "primary"}
                size="lg"
                className="min-w-32"
              >
                {isPlaying ? (
                  <>
                    <Pause className="mr-2" size={16} />
                    일시정지
                  </>
                ) : (
                  <>
                    <Play className="mr-2" size={16} />
                    미리보기
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="bg-[var(--color-primary-surface-glass)] border-[var(--color-primary-border-default)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-[var(--color-primary-text-primary)]">
                  <Sliders size={20} />
                  시각화 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Sensitivity */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-[var(--color-primary-text-primary)]">
                      민감도
                    </label>
                    <span className="text-sm text-[var(--color-primary-text-secondary)]">
                      {config.sensitivity.toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={config.sensitivity}
                    onChange={(e) => handleConfigChange('sensitivity', parseFloat(e.target.value))}
                    className="w-full h-2 bg-[var(--color-primary-surface-elevated)] rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-xs text-[var(--color-primary-text-tertiary)]">
                    오디오 신호에 대한 시각화 반응 강도를 조절합니다
                  </p>
                </div>

                {/* Smoothing */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-[var(--color-primary-text-primary)]">
                      부드러움
                    </label>
                    <span className="text-sm text-[var(--color-primary-text-secondary)]">
                      {(config.smoothing * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.smoothing}
                    onChange={(e) => handleConfigChange('smoothing', parseFloat(e.target.value))}
                    className="w-full h-2 bg-[var(--color-primary-surface-elevated)] rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-xs text-[var(--color-primary-text-tertiary)]">
                    시각화 변화의 부드러움 정도를 조절합니다
                  </p>
                </div>

                {/* Scale */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-[var(--color-primary-text-primary)]">
                      크기
                    </label>
                    <span className="text-sm text-[var(--color-primary-text-secondary)]">
                      {(config.scale * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={config.scale}
                    onChange={(e) => handleConfigChange('scale', parseFloat(e.target.value))}
                    className="w-full h-2 bg-[var(--color-primary-surface-elevated)] rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-xs text-[var(--color-primary-text-tertiary)]">
                    시각화 요소들의 전체적인 크기를 조절합니다
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Style-specific settings would go here */}
            {selectedStyle && (
              <Card className="bg-[var(--color-primary-surface-glass)] border-[var(--color-primary-border-default)]">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-[var(--color-primary-text-primary)]">
                    {visualizationStyles.find(s => s.id === selectedStyle)?.name} 전용 설정
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[var(--color-primary-text-secondary)]">
                    스타일별 고급 설정은 곧 추가될 예정입니다.
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}