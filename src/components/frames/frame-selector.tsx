'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  Square,
  Layers,
  Zap,
  Crown,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { FrameStyle } from '@/lib/frames/frame-renderer'

interface FrameOption {
  id: FrameStyle
  name: string
  description: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  preview: string
  isPremium?: boolean
}

interface FrameSelectorProps {
  selectedFrame: FrameStyle
  onFrameSelect: (frame: FrameStyle) => void
  className?: string
}

const frameOptions: FrameOption[] = [
  {
    id: 'none',
    name: '프레임 없음',
    description: '깔끔한 테두리 없는 이미지',
    icon: Square,
    preview: 'bg-transparent border-2 border-dashed border-[var(--color-primary-border-default)]'
  },
  {
    id: 'simple',
    name: '심플 프레임',
    description: '클래식한 흰색 테두리',
    icon: Square,
    preview: 'bg-[var(--color-primary-surface-elevated)] border-4 border-white'
  },
  {
    id: 'wood',
    name: '우드 프레임',
    description: '따뜻한 나무 질감의 테두리',
    icon: Layers,
    preview: 'bg-[var(--color-primary-surface-elevated)] border-4 border-[#8B4513]'
  },
  {
    id: 'metal',
    name: '메탈 프레임',
    description: '세련된 금속 질감의 테두리',
    icon: Layers,
    preview: 'bg-[var(--color-primary-surface-elevated)] border-4 border-[#C0C0C0]'
  },
  {
    id: 'neon',
    name: '네온 프레임',
    description: '빛나는 네온 효과 테두리',
    icon: Zap,
    preview: 'bg-[var(--color-primary-surface-elevated)] border-2 border-[var(--color-accent-neon-blue)] glow-blue'
  },
  {
    id: 'antique',
    name: '앤틱 프레임',
    description: '고급스러운 앤틱 골드 테두리',
    icon: Crown,
    preview: 'bg-[var(--color-primary-surface-elevated)] border-4 border-[#DAA520]',
    isPremium: true
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

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }
  }
}

export function FrameSelector({ selectedFrame, onFrameSelect, className }: FrameSelectorProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[var(--color-primary-text-primary)] mb-2">
          프레임 선택
        </h3>
        <p className="text-sm text-[var(--color-primary-text-secondary)]">
          이미지에 적용할 프레임 스타일을 선택하세요
        </p>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="grid grid-cols-2 md:grid-cols-3 gap-3"
      >
        {frameOptions.map((frame) => (
          <motion.div key={frame.id} variants={itemVariants}>
            <Card
              className={cn(
                'cursor-pointer transition-all duration-300 hover:scale-105',
                'bg-[var(--color-primary-surface-glass)] border-2',
                selectedFrame === frame.id
                  ? 'border-[var(--color-accent-neon-blue)] glow-blue'
                  : 'border-[var(--color-primary-border-default)] hover:border-[var(--color-accent-neon-purple)]'
              )}
              onClick={() => onFrameSelect(frame.id)}
            >
              <CardContent className="p-4">
                <div className="text-center">
                  {/* Frame Preview */}
                  <div className="relative mb-3 mx-auto">
                    <div className={cn(
                      'w-16 h-12 rounded mx-auto transition-all duration-300',
                      frame.preview
                    )}>
                      <div className="w-full h-full flex items-center justify-center">
                        <frame.icon
                          size={16}
                          className={cn(
                            'transition-colors duration-300',
                            selectedFrame === frame.id
                              ? 'text-[var(--color-accent-neon-blue)]'
                              : 'text-[var(--color-primary-text-tertiary)]'
                          )}
                        />
                      </div>
                    </div>

                    {/* Premium Badge */}
                    {frame.isPremium && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--color-accent-neon-orange)] rounded-full flex items-center justify-center">
                        <Sparkles size={10} className="text-white" />
                      </div>
                    )}

                    {/* Selection Indicator */}
                    {selectedFrame === frame.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -left-1 w-6 h-6 bg-[var(--color-accent-neon-blue)] rounded-full flex items-center justify-center"
                      >
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </motion.div>
                    )}
                  </div>

                  {/* Frame Info */}
                  <div className="space-y-1">
                    <h4 className={cn(
                      'text-sm font-medium transition-colors duration-300',
                      selectedFrame === frame.id
                        ? 'text-[var(--color-accent-neon-blue)]'
                        : 'text-[var(--color-primary-text-primary)]'
                    )}>
                      {frame.name}
                    </h4>
                    <p className="text-xs text-[var(--color-primary-text-tertiary)] leading-tight">
                      {frame.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Frame Settings */}
      {selectedFrame !== 'none' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-[var(--color-primary-surface-elevated)] rounded-lg border border-[var(--color-primary-border-default)]"
        >
          <div className="text-center">
            <p className="text-sm text-[var(--color-primary-text-secondary)] mb-2">
              선택된 프레임: <span className="text-[var(--color-accent-neon-blue)] font-medium">
                {frameOptions.find(f => f.id === selectedFrame)?.name}
              </span>
            </p>
            {frameOptions.find(f => f.id === selectedFrame)?.isPremium && (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--color-accent-neon-orange)]/20 rounded-full">
                <Sparkles size={12} className="text-[var(--color-accent-neon-orange)]" />
                <span className="text-xs text-[var(--color-accent-neon-orange)] font-medium">프리미엄</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}