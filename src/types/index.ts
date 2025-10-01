// Core Types for SoundCanvas Application

export interface AudioMetadata {
  duration: number;
  sampleRate: number;
  channels: number;
  format: string;
  size: number;
  name: string;
  uploadedAt: Date;
}

export interface AudioError {
  code: 'UNSUPPORTED_FORMAT' | 'FILE_TOO_LARGE' | 'DURATION_TOO_LONG' | 'MICROPHONE_ACCESS_DENIED' | 'PROCESSING_FAILED';
  message: string;
  details?: string;
}

export type VisualizationStyle = 'mandala' | 'inkflow' | 'neongrid';

export type FrameType = 'none' | 'simple' | 'wood' | 'metal' | 'neon' | 'antique';

export type CanvasSize = 'small' | 'medium' | 'large' | 'xlarge' | 'max';

export interface VisualizationCustomization {
  colorPalette: 'blue' | 'purple' | 'pink' | 'green' | 'orange' | 'rainbow';
  sensitivity: number; // 0.1 to 2.0
  speed: number; // 0.5 to 2.0
  scale: number; // 0.5 to 2.0
  backgroundOpacity: number; // 0 to 1
}

export interface FFTData {
  frequencyData: Uint8Array;
  timeData: Uint8Array;
  bassEnergy: number;
  midEnergy: number;
  trebleEnergy: number;
  totalEnergy: number;
}

export interface Visualization {
  id: string;
  title: string;
  description?: string;
  style: VisualizationStyle;
  frame: FrameType;
  customization: VisualizationCustomization;
  imageUrl: string;
  thumbnailUrl: string;
  audioMetadata: AudioMetadata;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  isPublic: boolean;
  likes: number;
  views: number;
  tags: string[];
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface GalleryFilter {
  sort: 'popular' | 'recent' | 'trending';
  timeRange?: '24h' | '7d' | '30d' | 'all';
  style?: VisualizationStyle;
  searchQuery?: string;
  userOnly?: boolean;
}

export interface ExportOptions {
  format: 'png' | 'jpg' | 'webp';
  quality: number; // 0.1 to 1.0
  size: CanvasSize;
  includeFrame: boolean;
  filename?: string;
}

export interface LocalStorageData {
  visualizations: Visualization[];
  preferences: UserPreferences;
  lastCleanup: Date;
}

export interface UserPreferences {
  defaultStyle: VisualizationStyle;
  defaultFrame: FrameType;
  defaultCustomization: VisualizationCustomization;
  canvasSize: CanvasSize;
  autoSave: boolean;
  reducedMotion: boolean;
  theme: 'dark' | 'light';
}

export interface AppState {
  currentVisualization: Visualization | null;
  audioSource: HTMLAudioElement | AudioBuffer | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  error: AudioError | null;
  gallery: {
    items: Visualization[];
    filter: GalleryFilter;
    hasMore: boolean;
    loading: boolean;
  };
  user: User | null;
}

export type ComponentVariant = 'default' | 'primary' | 'secondary' | 'ghost' | 'danger';
export type ComponentSize = 'small' | 'medium' | 'large';
export type ComponentState = 'idle' | 'loading' | 'success' | 'error' | 'disabled';

export interface ButtonProps {
  variant?: ComponentVariant;
  size?: ComponentSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

export interface InputProps {
  type?: 'text' | 'email' | 'password' | 'search' | 'file' | 'range';
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  accept?: string;
  className?: string;
  'aria-describedby'?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  children: React.ReactNode;
  className?: string;
}

export interface ToastProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onDismiss: (id: string) => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Web Audio API Types
export interface AudioContextManager {
  context: AudioContext | null;
  analyser: AnalyserNode | null;
  source: AudioBufferSourceNode | MediaElementAudioSourceNode | null;
  initialize: () => Promise<void>;
  connectSource: (source: HTMLAudioElement | AudioBuffer) => Promise<void>;
  getFFTData: () => FFTData;
  disconnect: () => void;
  resume: () => Promise<void>;
}

// Canvas Renderer Types
export interface CanvasRenderer {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  animationId: number | null;
  initialize: (canvas: HTMLCanvasElement) => void;
  render: (fftData: FFTData, customization: VisualizationCustomization) => void;
  resize: (width: number, height: number) => void;
  exportImage: (options: ExportOptions) => Promise<Blob>;
  clear: () => void;
  destroy: () => void;
}

// Visualization Pattern Interfaces
export interface MandalaPattern {
  symmetry: number;
  radiusMultiplier: number;
  rotationSpeed: number;
  petals: number;
  centerSize: number;
}

export interface InkFlowPattern {
  viscosity: number;
  dispersion: number;
  fadeRate: number;
  flowSpeed: number;
  particleCount: number;
}

export interface NeonGridPattern {
  gridSize: number;
  glowIntensity: number;
  pulsation: number;
  lineWidth: number;
  nodeSize: number;
}

export type VisualizationPattern = MandalaPattern | InkFlowPattern | NeonGridPattern;

// Frame Overlay Types
export interface FrameConfig {
  width: number;
  color: string;
  style?: 'solid' | 'dashed' | 'dotted';
  texture?: string;
  reflection?: boolean;
  glow?: string;
  pattern?: string;
}

// AdSlot Types
export interface AdSlotProps {
  slot: 'banner' | 'interstitial' | 'sidebar';
  className?: string;
  onAdLoaded?: () => void;
  onAdError?: (error: Error) => void;
}

// Error Boundary Types
export interface ErrorInfo {
  componentStack: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// Navigation Types
export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string | number;
  disabled?: boolean;
}

// Theme Types
export interface ThemeConfig {
  colors: {
    primary: Record<string, string>;
    accent: Record<string, string>;
    semantic: Record<string, string>;
    canvas: Record<string, string>;
    gallery: Record<string, string>;
    audio: Record<string, string>;
  };
  typography: {
    fontFamilies: Record<string, string>;
    fontSizes: Record<string, string>;
    fontWeights: Record<string, number>;
    lineHeights: Record<string, number>;
    letterSpacing: Record<string, string>;
  };
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
  animation: {
    duration: Record<string, string>;
    easing: Record<string, string>;
  };
}

// Performance Monitoring Types
export interface PerformanceMetrics {
  renderTime: number;
  fftProcessingTime: number;
  memoryUsage: number;
  fps: number;
  canvasOperations: number;
}

// Storage Types
export interface StorageManager {
  save: <T>(key: string, data: T) => Promise<void>;
  load: <T>(key: string) => Promise<T | null>;
  remove: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  getSize: () => Promise<number>;
  cleanup: () => Promise<void>;
}

// Accessibility Types
export interface A11yConfig {
  announcements: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  focusVisible: boolean;
  screenReaderOptimized: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SupabaseVisualization {
  id: string;
  title: string;
  description: string | null;
  style: VisualizationStyle;
  frame: FrameType;
  customization: VisualizationCustomization;
  image_url: string;
  thumbnail_url: string;
  audio_metadata: AudioMetadata;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  is_public: boolean;
  likes: number;
  views: number;
  tags: string[];
}

// Event Types
export type AudioEvent = 'loadstart' | 'canplay' | 'play' | 'pause' | 'ended' | 'timeupdate' | 'error';
export type VisualizationEvent = 'render' | 'export' | 'style-change' | 'frame-change' | 'customization-change';
export type AppEvent = 'navigation' | 'user-login' | 'user-logout' | 'error' | 'notification';

export interface EventPayload {
  type: AudioEvent | VisualizationEvent | AppEvent;
  data?: unknown;
  timestamp: number;
}