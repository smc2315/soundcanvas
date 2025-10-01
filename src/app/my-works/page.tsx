'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  Trash2,
  Edit2,
  Share2,
  Download,
  Eye,
  Calendar,
  Music,
  Palette,
  MoreVertical,
  Plus,
  Search,
  SortAsc,
  SortDesc,
  Filter,
  Settings,
  AlertCircle,
  CheckCircle,
  Copy,
  ExternalLink,
  Heart,
  PlayCircle,
  Grid3X3,
  CircleDot,
  Droplets
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface MyWork {
  id: string
  title: string
  audioFileName: string
  style: 'mandala' | 'inkflow' | 'neongrid'
  config: {
    sensitivity: number
    smoothing: number
    scale: number
  }
  createdAt: Date
  updatedAt: Date
  imageDataUrl?: string
  audioBlob?: Blob
  isShared: boolean
  shareId?: string
  views: number
  likes: number
  tags: string[]
  description?: string
}

interface StorageStats {
  totalWorks: number
  totalSize: number
  sharedWorks: number
  privateWorks: number
}

type SortOption = 'newest' | 'oldest' | 'title' | 'style'

// Mock data for demonstration
const mockWorks: MyWork[] = [
  {
    id: '1',
    title: '밤의 재즈',
    audioFileName: 'night_jazz.mp3',
    style: 'mandala',
    config: { sensitivity: 1.2, smoothing: 0.8, scale: 1 },
    createdAt: new Date('2024-01-15T14:30:00'),
    updatedAt: new Date('2024-01-15T14:30:00'),
    isShared: true,
    shareId: 'nj_12345',
    views: 45,
    likes: 12,
    tags: ['jazz', 'night', 'smooth'],
    description: '조용한 밤의 재즈 클럽 분위기'
  },
  {
    id: '2',
    title: '일렉트로닉 비트',
    audioFileName: 'electronic_beat.wav',
    style: 'neongrid',
    config: { sensitivity: 1.5, smoothing: 0.6, scale: 1.2 },
    createdAt: new Date('2024-01-14T16:15:00'),
    updatedAt: new Date('2024-01-14T16:15:00'),
    isShared: false,
    views: 0,
    likes: 0,
    tags: ['electronic', 'dance', 'upbeat']
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

export default function MyWorksPage() {
  const router = useRouter()
  const [works, setWorks] = useState<MyWork[]>([])
  const [filteredWorks, setFilteredWorks] = useState<MyWork[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [filterStyle, setFilterStyle] = useState<'all' | 'mandala' | 'inkflow' | 'neongrid'>('all')
  const [selectedWorks, setSelectedWorks] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [storageStats, setStorageStats] = useState<StorageStats>({
    totalWorks: 0,
    totalSize: 0,
    sharedWorks: 0,
    privateWorks: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Load works from localStorage on mount
  useEffect(() => {
    loadWorksFromStorage()
  }, [])

  // Filter and sort works
  useEffect(() => {
    let filtered = [...works]

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(work =>
        work.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        work.audioFileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        work.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Style filter
    if (filterStyle !== 'all') {
      filtered = filtered.filter(work => work.style === filterStyle)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.createdAt.getTime() - a.createdAt.getTime()
        case 'oldest':
          return a.createdAt.getTime() - b.createdAt.getTime()
        case 'title':
          return a.title.localeCompare(b.title)
        case 'style':
          return a.style.localeCompare(b.style)
        default:
          return 0
      }
    })

    setFilteredWorks(filtered)
  }, [works, searchQuery, sortBy, filterStyle])

  const loadWorksFromStorage = () => {
    try {
      setIsLoading(true)

      // For demo purposes, use mock data
      // In real implementation, load from localStorage:
      // const savedWorks = localStorage.getItem('soundcanvas-works')
      // const works = savedWorks ? JSON.parse(savedWorks) : []

      setWorks(mockWorks)
      calculateStorageStats(mockWorks)

    } catch (error) {
      console.error('Failed to load works:', error)
      showNotification('error', '작품을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const saveWorksToStorage = (newWorks: MyWork[]) => {
    try {
      localStorage.setItem('soundcanvas-works', JSON.stringify(newWorks))
      calculateStorageStats(newWorks)
    } catch (error) {
      console.error('Failed to save works:', error)
      showNotification('error', '작품 저장에 실패했습니다.')
    }
  }

  const calculateStorageStats = (works: MyWork[]) => {
    const stats: StorageStats = {
      totalWorks: works.length,
      totalSize: works.length * 2.5, // Rough estimate in MB
      sharedWorks: works.filter(w => w.isShared).length,
      privateWorks: works.filter(w => !w.isShared).length
    }
    setStorageStats(stats)
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleDeleteWork = (workId: string) => {
    const updatedWorks = works.filter(w => w.id !== workId)
    setWorks(updatedWorks)
    saveWorksToStorage(updatedWorks)
    setSelectedWorks(prev => prev.filter(id => id !== workId))
    showNotification('success', '작품이 삭제되었습니다.')
  }

  const handleDeleteSelected = () => {
    const updatedWorks = works.filter(w => !selectedWorks.includes(w.id))
    setWorks(updatedWorks)
    saveWorksToStorage(updatedWorks)
    setSelectedWorks([])
    showNotification('success', `${selectedWorks.length}개 작품이 삭제되었습니다.`)
  }

  const handleToggleShare = (workId: string) => {
    const updatedWorks = works.map(work => {
      if (work.id === workId) {
        return {
          ...work,
          isShared: !work.isShared,
          shareId: !work.isShared ? `sc_${Date.now()}` : undefined
        }
      }
      return work
    })
    setWorks(updatedWorks)
    saveWorksToStorage(updatedWorks)

    const work = updatedWorks.find(w => w.id === workId)
    showNotification('success',
      work?.isShared ? '작품이 공유되었습니다.' : '작품 공유가 해제되었습니다.'
    )
  }

  const handleWorkSelect = (workId: string) => {
    setSelectedWorks(prev =>
      prev.includes(workId)
        ? prev.filter(id => id !== workId)
        : [...prev, workId]
    )
  }

  const handleSelectAll = () => {
    if (selectedWorks.length === filteredWorks.length) {
      setSelectedWorks([])
    } else {
      setSelectedWorks(filteredWorks.map(w => w.id))
    }
  }

  const getStyleIcon = (style: string) => {
    switch (style) {
      case 'mandala': return CircleDot
      case 'inkflow': return Droplets
      case 'neongrid': return Grid3X3
      default: return Palette
    }
  }

  const getStyleName = (style: string) => {
    switch (style) {
      case 'mandala': return '만다라'
      case 'inkflow': return '잉크플로우'
      case 'neongrid': return '네온그리드'
      default: return style
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const formatFileSize = (sizeMB: number) => {
    if (sizeMB < 1) {
      return `${Math.round(sizeMB * 1024)} KB`
    }
    return `${sizeMB.toFixed(1)} MB`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--color-accent-neon-blue)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--color-primary-text-secondary)]">작품을 불러오고 있습니다...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-primary-text-primary)] mb-2 font-[var(--font-family-heading)]">
                내 작품
              </h1>
              <p className="text-lg text-[var(--color-primary-text-secondary)]">
                나만의 사운드 시각화 작품들을 관리하세요
              </p>
            </div>
            <Button
              onClick={() => router.push('/create')}
              variant="primary"
              size="lg"
            >
              <Plus className="mr-2" size={16} />
              새 작품 만들기
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-[var(--color-primary-surface-glass)] border-[var(--color-primary-border-default)]">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-[var(--color-accent-neon-blue)] mb-1">
                  {storageStats.totalWorks}
                </div>
                <div className="text-sm text-[var(--color-primary-text-secondary)]">
                  전체 작품
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[var(--color-primary-surface-glass)] border-[var(--color-primary-border-default)]">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-[var(--color-accent-neon-purple)] mb-1">
                  {storageStats.sharedWorks}
                </div>
                <div className="text-sm text-[var(--color-primary-text-secondary)]">
                  공유된 작품
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[var(--color-primary-surface-glass)] border-[var(--color-primary-border-default)]">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-[var(--color-accent-neon-pink)] mb-1">
                  {storageStats.privateWorks}
                </div>
                <div className="text-sm text-[var(--color-primary-text-secondary)]">
                  비공개 작품
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[var(--color-primary-surface-glass)] border-[var(--color-primary-border-default)]">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-[var(--color-accent-neon-green)] mb-1">
                  {formatFileSize(storageStats.totalSize)}
                </div>
                <div className="text-sm text-[var(--color-primary-text-secondary)]">
                  사용 용량
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Controls */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-primary-text-tertiary)]" size={20} />
                <Input
                  placeholder="작품 제목, 파일명, 태그 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedWorks.length > 0 && (
                <div className="flex items-center gap-2 mr-4">
                  <span className="text-sm text-[var(--color-primary-text-secondary)]">
                    {selectedWorks.length}개 선택됨
                  </span>
                  <Button
                    onClick={handleDeleteSelected}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 size={14} className="mr-1" />
                    삭제
                  </Button>
                </div>
              )}

              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                size="sm"
              >
                <Filter size={16} className="mr-2" />
                필터
              </Button>

              <Button
                onClick={handleSelectAll}
                variant="ghost"
                size="sm"
              >
                {selectedWorks.length === filteredWorks.length ? '선택 해제' : '전체 선택'}
              </Button>
            </div>
          </div>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 bg-[var(--color-primary-surface-glass)] rounded-lg border border-[var(--color-primary-border-default)]"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Style Filter */}
                  <div>
                    <h3 className="text-sm font-medium text-[var(--color-primary-text-primary)] mb-3">
                      시각화 스타일
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'all', name: '전체' },
                        { id: 'mandala', name: '만다라' },
                        { id: 'inkflow', name: '잉크플로우' },
                        { id: 'neongrid', name: '네온그리드' }
                      ].map(option => (
                        <Button
                          key={option.id}
                          onClick={() => setFilterStyle(option.id as any)}
                          variant={filterStyle === option.id ? "primary" : "outline"}
                          size="sm"
                        >
                          {option.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Sort Options */}
                  <div>
                    <h3 className="text-sm font-medium text-[var(--color-primary-text-primary)] mb-3">
                      정렬 기준
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'newest', name: '최신순', icon: SortDesc },
                        { id: 'oldest', name: '오래된순', icon: SortAsc },
                        { id: 'title', name: '제목순', icon: SortAsc },
                        { id: 'style', name: '스타일순', icon: Palette }
                      ].map(option => (
                        <Button
                          key={option.id}
                          onClick={() => setSortBy(option.id as SortOption)}
                          variant={sortBy === option.id ? "primary" : "outline"}
                          size="sm"
                        >
                          <option.icon size={14} className="mr-1" />
                          {option.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Works Grid */}
        {filteredWorks.length > 0 ? (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredWorks.map((work) => {
              const StyleIcon = getStyleIcon(work.style)
              const isSelected = selectedWorks.includes(work.id)

              return (
                <motion.div key={work.id} variants={itemVariants}>
                  <Card
                    className={cn(
                      "bg-[var(--color-primary-surface-glass)] border-2 transition-all duration-300 hover:scale-105 cursor-pointer",
                      isSelected
                        ? "border-[var(--color-accent-neon-blue)] glow-blue"
                        : "border-[var(--color-primary-border-default)] hover:border-[var(--color-accent-neon-purple)]"
                    )}
                    onClick={() => handleWorkSelect(work.id)}
                  >
                    {/* Preview Area */}
                    <div className="relative">
                      <div className="w-full h-48 bg-gradient-to-br from-[var(--color-accent-neon-blue)]/20 to-[var(--color-accent-neon-purple)]/20 rounded-t-lg flex items-center justify-center">
                        <StyleIcon size={48} className="text-[var(--color-accent-neon-blue)]" />
                      </div>

                      {/* Selection Indicator */}
                      <div className="absolute top-3 left-3">
                        <div className={cn(
                          "w-5 h-5 rounded border-2 transition-all duration-200",
                          isSelected
                            ? "bg-[var(--color-accent-neon-blue)] border-[var(--color-accent-neon-blue)]"
                            : "border-white/50 hover:border-white"
                        )}>
                          {isSelected && (
                            <CheckCircle size={20} className="text-white -m-0.5" />
                          )}
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="absolute top-3 right-3 flex gap-2">
                        {work.isShared && (
                          <Badge className="bg-[var(--color-accent-neon-green)]/20 text-[var(--color-accent-neon-green)] border-[var(--color sensor-neon-green)]">
                            공유됨
                          </Badge>
                        )}
                      </div>
                    </div>

                    <CardContent className="p-4">
                      {/* Title and Style */}
                      <div className="mb-3">
                        <h3 className="font-semibold text-[var(--color-primary-text-primary)] mb-1 line-clamp-1">
                          {work.title}
                        </h3>
                        <div className="flex items-center justify-between text-sm text-[var(--color-primary-text-secondary)]">
                          <span>{getStyleName(work.style)}</span>
                          <span>{formatDate(work.createdAt)}</span>
                        </div>
                      </div>

                      {/* Audio File */}
                      <div className="flex items-center gap-2 mb-3 text-xs text-[var(--color-primary-text-tertiary)]">
                        <Music size={12} />
                        <span className="line-clamp-1">{work.audioFileName}</span>
                      </div>

                      {/* Stats */}
                      {work.isShared && (
                        <div className="flex items-center gap-3 text-xs text-[var(--color-primary-text-tertiary)] mb-3">
                          <span className="flex items-center gap-1">
                            <Eye size={12} />
                            {work.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart size={12} />
                            {work.likes}
                          </span>
                        </div>
                      )}

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {work.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {work.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{work.tags.length - 2}
                          </Badge>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="flex-1">
                          <PlayCircle size={14} className="mr-1" />
                          재생
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleShare(work.id)
                          }}
                        >
                          <Share2 size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteWork(work.id)
                          }}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        ) : (
          /* Empty State */
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-[var(--color-primary-surface-elevated)] rounded-full flex items-center justify-center mx-auto mb-6">
              <Palette size={32} className="text-[var(--color-primary-text-tertiary)]" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-primary-text-primary)] mb-2">
              {searchQuery || filterStyle !== 'all' ? '검색 결과가 없습니다' : '아직 작품이 없습니다'}
            </h3>
            <p className="text-[var(--color-primary-text-secondary)] mb-6">
              {searchQuery || filterStyle !== 'all'
                ? '다른 검색어나 필터를 시도해보세요'
                : '첫 번째 사운드 시각화 작품을 만들어보세요'
              }
            </p>
            <Button
              onClick={() => {
                if (searchQuery || filterStyle !== 'all') {
                  setSearchQuery('')
                  setFilterStyle('all')
                } else {
                  router.push('/create')
                }
              }}
              variant="primary"
            >
              {searchQuery || filterStyle !== 'all' ? (
                <>
                  <Search className="mr-2" size={16} />
                  필터 초기화
                </>
              ) : (
                <>
                  <Plus className="mr-2" size={16} />
                  새 작품 만들기
                </>
              )}
            </Button>
          </div>
        )}

        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed bottom-4 right-4 p-4 rounded-lg max-w-sm z-50"
              style={{
                backgroundColor: notification.type === 'success'
                  ? 'var(--color-semantic-success)'
                  : 'var(--color-semantic-error)',
                color: 'white'
              }}
            >
              <div className="flex items-center gap-3">
                {notification.type === 'success' ? (
                  <CheckCircle size={20} />
                ) : (
                  <AlertCircle size={20} />
                )}
                <p className="text-sm font-medium">{notification.message}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}