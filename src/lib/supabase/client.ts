import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface SharedWork {
  id: string
  title: string
  artist_name: string
  style: 'mandala' | 'inkflow' | 'neongrid'
  config: {
    sensitivity: number
    smoothing: number
    scale: number
  }
  image_data_url: string
  audio_file_name: string
  audio_blob_url?: string
  frame_style?: string
  tags: string[]
  description?: string
  views: number
  likes: number
  downloads: number
  created_at: string
  updated_at: string
  is_featured: boolean
  user_id?: string
}

export interface WorkLike {
  id: string
  work_id: string
  user_id: string
  created_at: string
}

export interface WorkView {
  id: string
  work_id: string
  user_id?: string
  ip_address: string
  created_at: string
}

// Supabase service functions
export class SupabaseService {

  /**
   * Share a work to the public gallery
   */
  static async shareWork(work: {
    title: string
    artistName: string
    style: 'mandala' | 'inkflow' | 'neongrid'
    config: { sensitivity: number; smoothing: number; scale: number }
    imageDataUrl: string
    audioFileName: string
    frameStyle?: string
    tags: string[]
    description?: string
  }): Promise<{ data: SharedWork | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('shared_works')
        .insert({
          title: work.title,
          artist_name: work.artistName,
          style: work.style,
          config: work.config,
          image_data_url: work.imageDataUrl,
          audio_file_name: work.audioFileName,
          frame_style: work.frameStyle,
          tags: work.tags,
          description: work.description,
          views: 0,
          likes: 0,
          downloads: 0,
          is_featured: false
        })
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error sharing work:', error)
      return { data: null, error }
    }
  }

  /**
   * Get all shared works for gallery
   */
  static async getSharedWorks(filters: {
    style?: string
    sort?: 'recent' | 'popular' | 'trending' | 'likes'
    limit?: number
    offset?: number
    search?: string
  } = {}): Promise<{ data: SharedWork[] | null; error: any }> {
    try {
      let query = supabase
        .from('shared_works')
        .select('*')

      // Apply style filter
      if (filters.style && filters.style !== 'all') {
        query = query.eq('style', filters.style)
      }

      // Apply search filter
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,artist_name.ilike.%${filters.search}%,tags.cs.{${filters.search}}`)
      }

      // Apply sorting
      switch (filters.sort) {
        case 'popular':
          query = query.order('views', { ascending: false })
          break
        case 'trending':
          query = query.order('likes', { ascending: false }).order('views', { ascending: false })
          break
        case 'likes':
          query = query.order('likes', { ascending: false })
          break
        case 'recent':
        default:
          query = query.order('created_at', { ascending: false })
          break
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit)
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
      }

      const { data, error } = await query

      return { data, error }
    } catch (error) {
      console.error('Error fetching shared works:', error)
      return { data: null, error }
    }
  }

  /**
   * Get a single shared work by ID
   */
  static async getSharedWork(id: string): Promise<{ data: SharedWork | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('shared_works')
        .select('*')
        .eq('id', id)
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error fetching shared work:', error)
      return { data: null, error }
    }
  }

  /**
   * Like/unlike a work
   */
  static async toggleLike(workId: string, userId: string | null = null): Promise<{ isLiked: boolean; error: any }> {
    try {
      if (!userId) {
        // For anonymous users, use localStorage to track likes
        const likedWorks = JSON.parse(localStorage.getItem('soundcanvas-liked-works') || '[]')
        const isCurrentlyLiked = likedWorks.includes(workId)

        if (isCurrentlyLiked) {
          // Remove like
          const updatedLikes = likedWorks.filter((id: string) => id !== workId)
          localStorage.setItem('soundcanvas-liked-works', JSON.stringify(updatedLikes))

          // Decrease like count in database
          await supabase.rpc('decrement_likes', { work_id: workId })
          return { isLiked: false, error: null }
        } else {
          // Add like
          likedWorks.push(workId)
          localStorage.setItem('soundcanvas-liked-works', JSON.stringify(likedWorks))

          // Increase like count in database
          await supabase.rpc('increment_likes', { work_id: workId })
          return { isLiked: true, error: null }
        }
      } else {
        // For authenticated users, use database
        const { data: existingLike } = await supabase
          .from('work_likes')
          .select('id')
          .eq('work_id', workId)
          .eq('user_id', userId)
          .single()

        if (existingLike) {
          // Remove like
          await supabase
            .from('work_likes')
            .delete()
            .eq('work_id', workId)
            .eq('user_id', userId)

          await supabase.rpc('decrement_likes', { work_id: workId })
          return { isLiked: false, error: null }
        } else {
          // Add like
          await supabase
            .from('work_likes')
            .insert({ work_id: workId, user_id: userId })

          await supabase.rpc('increment_likes', { work_id: workId })
          return { isLiked: true, error: null }
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      return { isLiked: false, error }
    }
  }

  /**
   * Track a view for a work
   */
  static async trackView(workId: string, userId: string | null = null): Promise<void> {
    try {
      const ipAddress = await fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => 'unknown')

      // Check if this IP has already viewed this work recently (within 24 hours)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      const { data: recentView } = await supabase
        .from('work_views')
        .select('id')
        .eq('work_id', workId)
        .eq('ip_address', ipAddress)
        .gte('created_at', twentyFourHoursAgo)
        .single()

      if (!recentView) {
        // Record new view
        await supabase
          .from('work_views')
          .insert({
            work_id: workId,
            user_id: userId,
            ip_address: ipAddress
          })

        // Increment view count
        await supabase.rpc('increment_views', { work_id: workId })
      }
    } catch (error) {
      console.error('Error tracking view:', error)
    }
  }

  /**
   * Track a download for a work
   */
  static async trackDownload(workId: string): Promise<void> {
    try {
      await supabase.rpc('increment_downloads', { work_id: workId })
    } catch (error) {
      console.error('Error tracking download:', error)
    }
  }

  /**
   * Check if user has liked a work (for anonymous users, check localStorage)
   */
  static async isWorkLiked(workId: string, userId: string | null = null): Promise<boolean> {
    try {
      if (!userId) {
        const likedWorks = JSON.parse(localStorage.getItem('soundcanvas-liked-works') || '[]')
        return likedWorks.includes(workId)
      } else {
        const { data } = await supabase
          .from('work_likes')
          .select('id')
          .eq('work_id', workId)
          .eq('user_id', userId)
          .single()

        return !!data
      }
    } catch (error) {
      return false
    }
  }

  /**
   * Get featured works for homepage
   */
  static async getFeaturedWorks(limit = 6): Promise<{ data: SharedWork[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('shared_works')
        .select('*')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(limit)

      return { data, error }
    } catch (error) {
      console.error('Error fetching featured works:', error)
      return { data: null, error }
    }
  }

  /**
   * Get trending works (high likes and views in recent time)
   */
  static async getTrendingWorks(limit = 6): Promise<{ data: SharedWork[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('shared_works')
        .select('*')
        .order('likes', { ascending: false })
        .order('views', { ascending: false })
        .limit(limit)

      return { data, error }
    } catch (error) {
      console.error('Error fetching trending works:', error)
      return { data: null, error }
    }
  }
}