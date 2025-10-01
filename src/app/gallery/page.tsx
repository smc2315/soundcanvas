'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  Share2,
  Download,
  Eye,
  Play,
  Pause,
  Filter,
  Search,
  Sparkles,
  Zap,
  Users,
  TrendingUp,
  Clock,
  Grid3X3,
  CircleDot,
  Droplets,
  MoreHorizontal,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { SupabaseService, SharedWork } from '@/lib/supabase/client'

interface GalleryItem {
  id: string
  title: string
  artist: string
  style: 'mandala' | 'inkflow' | 'neongrid'
  imageUrl: string
  audioTitle?: string
  createdAt: Date
  likes: number
  views: number
  downloads: number
  tags: string[]
  isPremium: boolean
  isLiked: boolean
  duration?: number
}

interface FilterState {
  style: 'all' | 'mandala' | 'inkflow' | 'neongrid'
  sort: 'recent' | 'popular' | 'trending' | 'likes'
  timeRange: 'all' | 'day' | 'week' | 'month'
}

// Mock data for gallery items
const mockGalleryItems: GalleryItem[] = [
  {
    id: '1',
    title: '여름밤의 재즈',
    artist: 'SoundArtist01',
    style: 'mandala',
    imageUrl: '/api/placeholder/400/600',
    audioTitle: 'Summer Jazz Night.mp3',
    createdAt: new Date('2024-01-15'),
    likes: 234,
    views: 1580,
    downloads: 89,
    tags: ['jazz', 'summer', 'night'],
    isPremium: false,
    isLiked: true,
    duration: 185
  },
  {
    id: '2',
    title: '일렉트로닉 펄스',
    artist: 'VisualizerPro',
    style: 'neongrid',
    imageUrl: '/api/placeholder/400/500',
    audioTitle: 'Electronic Pulse.wav',
    createdAt: new Date('2024-01-14'),
    likes: 512,
    views: 3200,
    downloads: 156,
    tags: ['electronic', 'dance', 'pulse'],
    isPremium: true,
    isLiked: false,
    duration: 210
  },
  {
    id: '3',
    title: '클래식 심포니',
    artist: 'OrchestraFan',
    style: 'inkflow',
    imageUrl: '/api/placeholder/400/700',
    audioTitle: 'Classical Symphony.mp3',
    createdAt: new Date('2024-01-13'),
    likes: 189,
    views: 945,
    downloads: 67,
    tags: ['classical', 'orchestra', 'symphony'],
    isPremium: false,
    isLiked: true,
    duration: 322
  },
  // Add more mock items...
]

const styleOptions = [
  { id: 'all', name: '전체', icon: Grid3X3 },
  { id: 'mandala', name: '만다라', icon: CircleDot },
  { id: 'inkflow', name: '잉크플로우', icon: Droplets },
  { id: 'neongrid', name: '네온그리드', icon: Grid3X3 }
]

const sortOptions = [
  { id: 'recent', name: '최신순', icon: Clock },
  { id: 'popular', name: '인기순', icon: Eye },
  { id: 'trending', name: '트렌딩', icon: TrendingUp },
  { id: 'likes', name: '좋아요순', icon: Heart }
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
    transition: { duration: 0.4 }
  }
}

export default function GalleryPage() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<GalleryItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterState>({
    style: 'all',
    sort: 'recent',
    timeRange: 'all'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [likedWorks, setLikedWorks] = useState<string[]>([])
  const masonryRef = useRef<HTMLDivElement>(null)

  // Load works from Supabase on mount
  useEffect(() => {
    loadGalleryWorks()
    loadLikedWorks()
  }, [])

  // Load liked works from localStorage
  const loadLikedWorks = () => {
    try {
      const liked = JSON.parse(localStorage.getItem('soundcanvas-liked-works') || '[]')
      setLikedWorks(liked)
    } catch (error) {
      console.error('Error loading liked works:', error)
    }
  }

  // Load gallery works from Supabase
  const loadGalleryWorks = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // First try to load from Supabase
      const { data: supabaseWorks, error: supabaseError } = await SupabaseService.getSharedWorks({
        limit: 50
      })

      if (supabaseError) {
        console.warn('Supabase error, falling back to mock data:', supabaseError)
        // Fall back to mock data if Supabase is not available
        const convertedMockData = mockGalleryItems.map(item => ({
          ...item,
          artist: item.artist,
          imageUrl: item.imageUrl,
          audioTitle: item.audioTitle,
          createdAt: item.createdAt,
          isPremium: item.isPremium,
          isLiked: item.isLiked,
          duration: item.duration
        }))
        setGalleryItems(convertedMockData)
      } else if (supabaseWorks && supabaseWorks.length > 0) {
        // Convert Supabase data to gallery item format
        const convertedWorks: GalleryItem[] = supabaseWorks.map(work => ({
          id: work.id,
          title: work.title,
          artist: work.artist_name,
          style: work.style,
          imageUrl: work.image_data_url,
          audioTitle: work.audio_file_name,
          createdAt: new Date(work.created_at),
          likes: work.likes,
          views: work.views,
          downloads: work.downloads,
          tags: work.tags,
          isPremium: work.is_featured, // Use featured as premium indicator
          isLiked: false, // Will be updated from localStorage
          duration: undefined // Duration not stored in Supabase yet
        }))
        setGalleryItems(convertedWorks)
      } else {
        // No data available, use mock data
        const convertedMockData = mockGalleryItems.map(item => ({
          ...item,
          artist: item.artist,
          imageUrl: item.imageUrl,
          audioTitle: item.audioTitle,
          createdAt: item.createdAt,
          isPremium: item.isPremium,
          isLiked: item.isLiked,
          duration: item.duration
        }))
        setGalleryItems(convertedMockData)
      }
    } catch (error) {
      console.error('Error loading gallery works:', error)
      setError('작품을 불러오는데 실패했습니다.')
      // Fall back to mock data
      const convertedMockData = mockGalleryItems.map(item => ({
        ...item,
        artist: item.artist,
        imageUrl: item.imageUrl,
        audioTitle: item.audioTitle,
        createdAt: item.createdAt,
        isPremium: item.isPremium,
        isLiked: item.isLiked,
        duration: item.duration
      }))
      setGalleryItems(convertedMockData)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter and search logic
  useEffect(() => {
    let filtered = [...galleryItems]

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Filter by style
    if (filters.style !== 'all') {
      filtered = filtered.filter(item => item.style === filters.style)
    }

    // Sort items
    filtered.sort((a, b) => {
      switch (filters.sort) {
        case 'recent':
          return b.createdAt.getTime() - a.createdAt.getTime()
        case 'popular':
          return b.views - a.views
        case 'trending':
          return (b.views + b.likes * 3) - (a.views + a.likes * 3)
        case 'likes':
          return b.likes - a.likes
        default:
          return 0
      }
    })

    setFilteredItems(filtered)
  }, [galleryItems, searchQuery, filters])

  // Handle like toggle
  const handleLikeToggle = async (itemId: string) => {
    try {
      // Optimistically update UI
      const currentItem = galleryItems.find(item => item.id === itemId)
      if (!currentItem) return

      const isCurrentlyLiked = likedWorks.includes(itemId)
      const newLikedWorks = isCurrentlyLiked
        ? likedWorks.filter(id => id !== itemId)
        : [...likedWorks, itemId]

      setLikedWorks(newLikedWorks)
      localStorage.setItem('soundcanvas-liked-works', JSON.stringify(newLikedWorks))

      setGalleryItems(prev => prev.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            isLiked: !isCurrentlyLiked,
            likes: isCurrentlyLiked ? item.likes - 1 : item.likes + 1
          }
        }
        return item
      }))

      // Update in Supabase
      await SupabaseService.toggleLike(itemId)
    } catch (error) {
      console.error('Error toggling like:', error)
      // Revert optimistic update on error
      const revertedLikedWorks = likedWorks.includes(itemId)
        ? likedWorks.filter(id => id !== itemId)
        : [...likedWorks, itemId]
      setLikedWorks(revertedLikedWorks)
      localStorage.setItem('soundcanvas-liked-works', JSON.stringify(revertedLikedWorks))
    }
  }

  // Handle download
  const handleDownload = async (item: GalleryItem) => {
    try {
      // Optimistically update UI
      setGalleryItems(prev => prev.map(i =>
        i.id === item.id ? { ...i, downloads: i.downloads + 1 } : i
      ))

      // Track download in Supabase
      await SupabaseService.trackDownload(item.id)

      // For demo purposes, create a download of the image
      const link = document.createElement('a')
      link.href = item.imageUrl
      link.download = `${item.title}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading:', error)
    }
  }

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Format number
  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`
    }
    return num.toString()
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent-neon-blue)] mx-auto mb-4" />
          <p className="text-[var(--color-primary-text-secondary)]">갤러리를 불러오고 있습니다...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-primary-text-primary)] mb-4 font-[var(--font-family-heading)]">
              갤러리
            </h1>
            <p className="text-lg text-[var(--color-primary-text-secondary)]">
              전 세계 아티스트들의 놀라운 사운드 시각화 작품들을 둘러보세요
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-primary-text-tertiary)]" size={20} />
                <Input
                  placeholder="작품 제목, 아티스트, 태그 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                size="sm"
              >
                <Filter size={16} className="mr-2" />
                필터
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Style Filter */}
                  <div>
                    <h3 className="text-sm font-medium text-[var(--color-primary-text-primary)] mb-3">
                      스타일
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {styleOptions.map(option => (
                        <Button
                          key={option.id}
                          onClick={() => setFilters(prev => ({ ...prev, style: option.id as any }))}
                          variant={filters.style === option.id ? "primary" : "outline"}
                          size="sm"
                        >
                          <option.icon size={14} className="mr-1" />
                          {option.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Sort Filter */}
                  <div>
                    <h3 className="text-sm font-medium text-[var(--color-primary-text-primary)] mb-3">
                      정렬
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {sortOptions.map(option => (
                        <Button
                          key={option.id}
                          onClick={() => setFilters(prev => ({ ...prev, sort: option.id as any }))}
                          variant={filters.sort === option.id ? "primary" : "outline"}
                          size="sm"
                        >
                          <option.icon size={14} className="mr-1" />
                          {option.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Results Count */}
                  <div className="flex items-end">
                    <div className="text-sm text-[var(--color-primary-text-secondary)]">
                      총 <span className="text-[var(--color-accent-neon-blue)] font-medium">
                        {filteredItems.length}
                      </span>개의 작품
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Gallery Grid */}
        <motion.div
          ref={masonryRef}
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6"
        >
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              variants={itemVariants}
              className="break-inside-avoid"
            >
              <Card className="bg-[var(--color-primary-surface-glass)] border-[var(--color-primary-border-default)] overflow-hidden hover:border-[var(--color-accent-neon-blue)] transition-all duration-300 group">
                {/* Image */}
                <div className="relative">
                  <div
                    className="w-full bg-gradient-to-br from-[var(--color-accent-neon-blue)]/20 to-[var(--color-accent-neon-purple)]/20 rounded-t-lg"
                    style={{ aspectRatio: `400/${400 + Math.random() * 300}` }}
                  >
                    {/* Placeholder visualization pattern */}
                    <div className="w-full h-full flex items-center justify-center">
                      {item.style === 'mandala' && <CircleDot size={48} className="text-[var(--color-accent-neon-blue)]" />}
                      {item.style === 'inkflow' && <Droplets size={48} className="text-[var(--color-accent-neon-purple)]" />}
                      {item.style === 'neongrid' && <Grid3X3 size={48} className="text-[var(--color-accent-neon-pink)]" />}
                    </div>
                  </div>

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-t-lg">
                    <div className="absolute top-3 right-3 flex gap-2">
                      {item.isPremium && (
                        <Badge className="bg-[var(--color-accent-neon-orange)]/20 text-[var(--color-accent-neon-orange)] border-[var(--color-accent-neon-orange)]">
                          <Sparkles size={12} className="mr-1" />
                          프리미엄
                        </Badge>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex items-center justify-between">
                        <Button size="sm" variant="outline" className="bg-black/50 border-white/20">
                          <Play size={14} className="mr-1" />
                          재생
                        </Button>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="bg-black/50 hover:bg-black/70"
                            onClick={() => handleDownload(item)}
                          >
                            <Download size={14} />
                          </Button>
                          <Button size="sm" variant="ghost" className="bg-black/50 hover:bg-black/70">
                            <Share2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <CardContent className="p-4">
                  {/* Title and Artist */}
                  <div className="mb-3">
                    <h3 className="font-semibold text-[var(--color-primary-text-primary)] mb-1 line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[var(--color-primary-text-secondary)]">
                      by {item.artist}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-[var(--color-primary-text-tertiary)] mb-3">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Eye size={12} />
                        {formatNumber(item.views)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart size={12} />
                        {formatNumber(item.likes)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download size={12} />
                        {formatNumber(item.downloads)}
                      </span>
                    </div>
                    {item.duration && (
                      <span>{formatDuration(item.duration)}</span>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.tags.slice(0, 3).map(tag => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleLikeToggle(item.id)}
                      variant={likedWorks.includes(item.id) ? "primary" : "outline"}
                      size="sm"
                      className="flex-1"
                    >
                      <Heart
                        size={14}
                        className={cn("mr-1", likedWorks.includes(item.id) && "fill-current")}
                      />
                      좋아요
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal size={14} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-20">
            <Search size={64} className="mx-auto mb-4 text-[var(--color-primary-text-tertiary)]" />
            <h3 className="text-xl font-semibold text-[var(--color-primary-text-primary)] mb-2">
              검색 결과가 없습니다
            </h3>
            <p className="text-[var(--color-primary-text-secondary)] mb-6">
              다른 검색어나 필터를 시도해보세요
            </p>
            <Button
              onClick={() => {
                setSearchQuery('')
                setFilters({ style: 'all', sort: 'recent', timeRange: 'all' })
              }}
              variant="outline"
            >
              필터 초기화
            </Button>
          </div>
        )}

        {/* Load More */}
        {filteredItems.length > 0 && (
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              <Zap className="mr-2" size={16} />
              더 많은 작품 보기
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}