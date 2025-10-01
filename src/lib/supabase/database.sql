-- Supabase Database Schema for SoundCanvas
-- Run this in your Supabase SQL editor to set up the required tables

-- Create shared_works table
CREATE TABLE IF NOT EXISTS shared_works (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  artist_name VARCHAR(255) NOT NULL,
  style VARCHAR(50) NOT NULL CHECK (style IN ('mandala', 'inkflow', 'neongrid')),
  config JSONB NOT NULL DEFAULT '{}',
  image_data_url TEXT NOT NULL,
  audio_file_name VARCHAR(255) NOT NULL,
  audio_blob_url TEXT,
  frame_style VARCHAR(50),
  tags TEXT[] DEFAULT '{}',
  description TEXT,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create work_likes table for tracking likes
CREATE TABLE IF NOT EXISTS work_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  work_id UUID NOT NULL REFERENCES shared_works(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL, -- Can store anonymous session IDs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(work_id, user_id)
);

-- Create work_views table for tracking views
CREATE TABLE IF NOT EXISTS work_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  work_id UUID NOT NULL REFERENCES shared_works(id) ON DELETE CASCADE,
  user_id VARCHAR(255), -- Optional, can be null for anonymous
  ip_address VARCHAR(45) NOT NULL, -- Store IP for duplicate view prevention
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shared_works_style ON shared_works(style);
CREATE INDEX IF NOT EXISTS idx_shared_works_created_at ON shared_works(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shared_works_likes ON shared_works(likes DESC);
CREATE INDEX IF NOT EXISTS idx_shared_works_views ON shared_works(views DESC);
CREATE INDEX IF NOT EXISTS idx_shared_works_featured ON shared_works(is_featured);
CREATE INDEX IF NOT EXISTS idx_shared_works_tags ON shared_works USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_work_likes_work_id ON work_likes(work_id);
CREATE INDEX IF NOT EXISTS idx_work_likes_user_id ON work_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_work_views_work_id ON work_views(work_id);
CREATE INDEX IF NOT EXISTS idx_work_views_ip_created ON work_views(ip_address, created_at);

-- Create RPC functions for atomic counter updates
CREATE OR REPLACE FUNCTION increment_likes(work_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE shared_works
  SET likes = likes + 1, updated_at = NOW()
  WHERE id = work_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_likes(work_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE shared_works
  SET likes = GREATEST(0, likes - 1), updated_at = NOW()
  WHERE id = work_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_views(work_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE shared_works
  SET views = views + 1, updated_at = NOW()
  WHERE id = work_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_downloads(work_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE shared_works
  SET downloads = downloads + 1, updated_at = NOW()
  WHERE id = work_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_shared_works_updated_at
    BEFORE UPDATE ON shared_works
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE shared_works ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_views ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public read access for shared_works" ON shared_works
    FOR SELECT USING (true);

CREATE POLICY "Public insert access for shared_works" ON shared_works
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access for work_likes" ON work_likes
    FOR SELECT USING (true);

CREATE POLICY "Public insert access for work_likes" ON work_likes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public delete access for work_likes" ON work_likes
    FOR DELETE USING (true);

CREATE POLICY "Public insert access for work_views" ON work_views
    FOR INSERT WITH CHECK (true);

-- Insert some sample data for testing
INSERT INTO shared_works (title, artist_name, style, config, image_data_url, audio_file_name, tags, description, views, likes, downloads, is_featured) VALUES
('여름밤의 재즈', 'SoundArtist01', 'mandala', '{"sensitivity": 1.2, "smoothing": 0.8, "scale": 1}', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'Summer Jazz Night.mp3', ARRAY['jazz', 'summer', 'night'], '조용한 밤의 재즈 클럽 분위기를 표현한 만다라 시각화', 1580, 234, 89, true),
('일렉트로닉 펄스', 'VisualizerPro', 'neongrid', '{"sensitivity": 1.5, "smoothing": 0.6, "scale": 1.2}', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'Electronic Pulse.wav', ARRAY['electronic', 'dance', 'pulse'], '강렬한 일렉트로닉 비트를 네온그리드로 시각화', 3200, 512, 156, true),
('클래식 심포니', 'OrchestraFan', 'inkflow', '{"sensitivity": 1.0, "smoothing": 0.9, "scale": 0.8}', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'Classical Symphony.mp3', ARRAY['classical', 'orchestra', 'symphony'], '클래식 오케스트라의 아름다운 하모니를 잉크플로우로 표현', 945, 189, 67, false);