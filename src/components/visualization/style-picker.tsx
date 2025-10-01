'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CircleDot,
  Droplets,
  Grid3X3,
  Play,
  Pause,
  Settings,
  Palette,
  Sliders
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

// Types
export interface VisualizationStyle {
  id: 'mandala' | 'inkflow' | 'neongrid'
  name: string
  description: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  colors: string[]
  features: string[]
  complexity: 'low' | 'medium' | 'high'
  performance: 'good' | 'medium' | 'intensive'
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
    id: 'mandala',
    name: '만다라',
    description: '대칭적인 원형 패턴으로 주파수별 반응을 아름다운 기하학적 형태로 표현합니다.',
    icon: CircleDot,
    colors: ['#00F5FF', '#9D4EDD', '#FF6EC7'],
    features: ['8중 대칭', '주파수 분할', '회전 애니메이션', '중심 집중'],
    complexity: 'medium',
    performance: 'good'
  },
  {
    id: 'inkflow',
    name: '잉크플로우',
    description: '유체역학을 바탕으로 한 유기적 파티클 시스템으로 자연스러운 흐름을 생성합니다.',
    icon: Droplets,
    colors: ['#9D4EDD', '#FF6EC7', '#00F5FF'],
    features: ['파티클 시스템', '점성 효과', '유기적 움직임', '색상 혼합'],
    complexity: 'high',
    performance: 'intensive'
  },
  {
    id: 'neongrid',
    name: '네온그리드',
    description: '미래지향적인 기하학 그리드 패턴으로 맥동하는 네온 효과를 구현합니다.',
    icon: Grid3X3,
    colors: ['#FF6EC7', '#00F5FF', '#39FF14'],
    features: ['그리드 토폴로지', '글로우 이펙트', '노드 맥동', '에너지 전파'],
    complexity: 'medium',
    performance: 'medium'
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
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {visualizationStyles.map((style) => (
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
                    <div className="flex items-center justify-between pt-3 border-t border-[var(--color-primary-border-default)]">
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