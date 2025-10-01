/**
 * Canvas Visualization Renderer for SoundCanvas
 * Implements Mandala, InkFlow, and NeonGrid visualization patterns
 */

import type {
  CanvasRenderer,
  FFTData,
  VisualizationCustomization,
  ExportOptions,
  VisualizationStyle,
  MandalaPattern,
  InkFlowPattern,
  NeonGridPattern
} from '@/types';
import { PerformanceMonitor, FPSMonitor, clamp, mapRange, hslToRgb, rgbToHex } from '@/utils';

export class SoundCanvasRenderer implements CanvasRenderer {
  public canvas: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;
  public width: number = 0;
  public height: number = 0;
  public animationId: number | null = null;

  private performanceMonitor = new PerformanceMonitor();
  private fpsMonitor = new FPSMonitor();
  private devicePixelRatio: number;
  private currentStyle: VisualizationStyle = 'mandala';
  private particles: Particle[] = [];
  private trails: TrailPoint[] = [];
  private gridNodes: GridNode[] = [];
  private time = 0;

  // Pattern configurations
  private mandalaConfig: MandalaPattern = {
    symmetry: 8,
    radiusMultiplier: 1.5,
    rotationSpeed: 0.02,
    petals: 12,
    centerSize: 20
  };

  private inkflowConfig: InkFlowPattern = {
    viscosity: 0.8,
    dispersion: 1.2,
    fadeRate: 0.95,
    flowSpeed: 1.0,
    particleCount: 100
  };

  private neongridConfig: NeonGridPattern = {
    gridSize: 32,
    glowIntensity: 0.7,
    pulsation: 1.1,
    lineWidth: 2,
    nodeSize: 4
  };

  // Color palettes
  private readonly colorPalettes = {
    blue: ['#00F5FF', '#0080FF', '#0040FF'],
    purple: ['#9D4EDD', '#7209B7', '#560BAD'],
    pink: ['#FF6EC7', '#FF1493', '#C71585'],
    green: ['#39FF14', '#00FF00', '#32CD32'],
    orange: ['#FF6B35', '#FF4500', '#FF8C00'],
    rainbow: ['#FF0000', '#FF8000', '#FFFF00', '#80FF00', '#00FF00', '#00FF80', '#00FFFF', '#0080FF', '#0000FF', '#8000FF', '#FF00FF', '#FF0080']
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', {
      alpha: true,
      desynchronized: true,
      colorSpace: 'srgb'
    });

    if (!ctx) {
      throw new Error('Unable to get 2D canvas context');
    }

    this.context = ctx;
    this.devicePixelRatio = window.devicePixelRatio || 1;
    this.initialize(canvas);
  }

  /**
   * Initialize the canvas renderer
   */
  initialize(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.setupCanvas();
    this.initializePatterns();
    console.log('Canvas renderer initialized');
  }

  /**
   * Setup canvas with proper scaling for high DPI displays
   */
  private setupCanvas(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    // Scale canvas for high DPI displays
    this.canvas.width = this.width * this.devicePixelRatio;
    this.canvas.height = this.height * this.devicePixelRatio;

    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    // Scale context to match device pixel ratio
    this.context.scale(this.devicePixelRatio, this.devicePixelRatio);

    // Set canvas background
    this.context.fillStyle = '#000000';
    this.context.fillRect(0, 0, this.width, this.height);
  }

  /**
   * Initialize pattern-specific data structures
   */
  private initializePatterns(): void {
    // Initialize particles for InkFlow
    this.particles = [];
    for (let i = 0; i < this.inkflowConfig.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 1,
        life: 1,
        color: { r: 255, g: 255, b: 255 }
      });
    }

    // Initialize grid nodes for NeonGrid
    this.gridNodes = [];
    const cols = Math.ceil(this.width / this.neongridConfig.gridSize);
    const rows = Math.ceil(this.height / this.neongridConfig.gridSize);

    for (let i = 0; i <= cols; i++) {
      for (let j = 0; j <= rows; j++) {
        this.gridNodes.push({
          x: i * this.neongridConfig.gridSize,
          y: j * this.neongridConfig.gridSize,
          energy: 0,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    // Initialize trails
    this.trails = [];
  }

  /**
   * Main render function - called for each frame
   */
  render(fftData: FFTData, customization: VisualizationCustomization): void {
    this.performanceMonitor.start('render');

    // Update time for animations
    this.time += 0.016; // Assume 60fps

    // Clear canvas with background opacity
    this.context.globalAlpha = 1 - customization.backgroundOpacity;
    this.context.fillStyle = '#000000';
    this.context.fillRect(0, 0, this.width, this.height);
    this.context.globalAlpha = 1;

    // Render based on current style
    switch (this.currentStyle) {
      case 'mandala':
        this.renderMandala(fftData, customization);
        break;
      case 'inkflow':
        this.renderInkFlow(fftData, customization);
        break;
      case 'neongrid':
        this.renderNeonGrid(fftData, customization);
        break;
    }

    // Update FPS monitor
    this.fpsMonitor.measure();
    this.performanceMonitor.end('render');
  }

  /**
   * Render Mandala pattern
   */
  private renderMandala(fftData: FFTData, customization: VisualizationCustomization): void {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const maxRadius = Math.min(this.width, this.height) / 2 * 0.8;

    this.context.save();
    this.context.translate(centerX, centerY);

    // Rotate based on audio energy and time
    const rotation = this.time * this.mandalaConfig.rotationSpeed + fftData.totalEnergy * Math.PI;
    this.context.rotate(rotation);

    // Get color palette
    const colors = this.getColorPalette(customization.colorPalette);

    // Draw multiple layers with symmetry
    for (let layer = 0; layer < 3; layer++) {
      this.context.save();

      const layerRadius = maxRadius * (0.3 + layer * 0.3);
      const layerAlpha = 0.7 - layer * 0.2;

      for (let i = 0; i < this.mandalaConfig.symmetry; i++) {
        this.context.save();
        this.context.rotate((Math.PI * 2 / this.mandalaConfig.symmetry) * i);

        // Draw petals based on frequency data
        this.drawMandalaSection(
          fftData.frequencyData,
          layerRadius,
          colors[layer % colors.length],
          layerAlpha,
          customization
        );

        this.context.restore();
      }

      this.context.restore();
    }

    // Draw center circle
    this.context.fillStyle = colors[0];
    this.context.globalAlpha = 0.8;
    this.context.beginPath();
    this.context.arc(0, 0, this.mandalaConfig.centerSize * fftData.totalEnergy, 0, Math.PI * 2);
    this.context.fill();

    this.context.restore();
  }

  /**
   * Draw a mandala section (petal)
   */
  private drawMandalaSection(
    frequencyData: Uint8Array,
    radius: number,
    color: string,
    alpha: number,
    customization: VisualizationCustomization
  ): void {
    this.context.globalAlpha = alpha;
    this.context.strokeStyle = color;
    this.context.fillStyle = color;
    this.context.lineWidth = 2;

    const petalCount = this.mandalaConfig.petals;
    const angleStep = (Math.PI * 2) / petalCount;

    for (let i = 0; i < petalCount; i++) {
      const angle = i * angleStep;
      const freqIndex = Math.floor(mapRange(i, 0, petalCount, 0, frequencyData.length - 1));
      const amplitude = frequencyData[freqIndex] / 255 * customization.sensitivity;

      const petalRadius = radius * amplitude * customization.scale;
      const x = Math.cos(angle) * petalRadius;
      const y = Math.sin(angle) * petalRadius;

      if (i === 0) {
        this.context.beginPath();
        this.context.moveTo(0, 0);
      }

      this.context.lineTo(x, y);
    }

    this.context.closePath();
    this.context.stroke();
    this.context.globalAlpha = alpha * 0.3;
    this.context.fill();
  }

  /**
   * Render InkFlow pattern
   */
  private renderInkFlow(fftData: FFTData, customization: VisualizationCustomization): void {
    const colors = this.getColorPalette(customization.colorPalette);

    // Update particles based on audio data
    this.updateInkFlowParticles(fftData, customization);

    // Draw particle trails
    this.drawParticleTrails(colors, customization);

    // Draw particles
    this.drawInkFlowParticles(colors, customization);
  }

  /**
   * Update InkFlow particles
   */
  private updateInkFlowParticles(fftData: FFTData, customization: VisualizationCustomization): void {
    const bassForce = fftData.bassEnergy * customization.sensitivity;
    const midForce = fftData.midEnergy * customization.sensitivity;
    const trebleForce = fftData.trebleEnergy * customization.sensitivity;

    this.particles.forEach((particle, index) => {
      // Apply forces based on frequency bands
      const freqIndex = Math.floor(mapRange(index, 0, this.particles.length, 0, fftData.frequencyData.length - 1));
      const frequency = fftData.frequencyData[freqIndex] / 255;

      // Add some randomness influenced by audio
      particle.vx += (Math.random() - 0.5) * bassForce * 0.5;
      particle.vy += (Math.random() - 0.5) * midForce * 0.5;

      // Apply viscosity
      particle.vx *= this.inkflowConfig.viscosity;
      particle.vy *= this.inkflowConfig.viscosity;

      // Update position
      particle.x += particle.vx * this.inkflowConfig.flowSpeed * customization.speed;
      particle.y += particle.vy * this.inkflowConfig.flowSpeed * customization.speed;

      // Wrap around screen
      if (particle.x < 0) particle.x = this.width;
      if (particle.x > this.width) particle.x = 0;
      if (particle.y < 0) particle.y = this.height;
      if (particle.y > this.height) particle.y = 0;

      // Update life and color based on audio
      particle.life = clamp(particle.life * this.inkflowConfig.fadeRate + frequency * 0.1, 0, 1);

      // Update color based on frequency
      const hue = mapRange(frequency, 0, 1, 0, 360);
      const rgb = hslToRgb(hue, 80, 60);
      particle.color = rgb;
    });
  }

  /**
   * Draw particle trails for InkFlow
   */
  private drawParticleTrails(colors: string[], customization: VisualizationCustomization): void {
    this.context.globalCompositeOperation = 'screen';

    this.particles.forEach((particle, index) => {
      if (particle.life > 0.1) {
        // Add current position to trails
        this.trails.push({
          x: particle.x,
          y: particle.y,
          life: particle.life,
          color: particle.color,
          time: this.time
        });
      }
    });

    // Remove old trails
    this.trails = this.trails.filter(trail => this.time - trail.time < 2);

    // Draw trails
    this.trails.forEach(trail => {
      const alpha = trail.life * 0.5;
      this.context.globalAlpha = alpha;
      this.context.fillStyle = `rgba(${trail.color.r}, ${trail.color.g}, ${trail.color.b}, ${alpha})`;
      this.context.beginPath();
      this.context.arc(trail.x, trail.y, 1, 0, Math.PI * 2);
      this.context.fill();
    });

    this.context.globalCompositeOperation = 'source-over';
  }

  /**
   * Draw InkFlow particles
   */
  private drawInkFlowParticles(colors: string[], customization: VisualizationCustomization): void {
    this.particles.forEach(particle => {
      if (particle.life > 0) {
        const alpha = particle.life;
        const size = particle.size * customization.scale;

        this.context.globalAlpha = alpha;
        this.context.fillStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha})`;

        // Draw particle with glow effect
        this.context.shadowColor = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, 0.8)`;
        this.context.shadowBlur = size * 2;

        this.context.beginPath();
        this.context.arc(particle.x, particle.y, size, 0, Math.PI * 2);
        this.context.fill();

        this.context.shadowBlur = 0;
      }
    });
  }

  /**
   * Render NeonGrid pattern
   */
  private renderNeonGrid(fftData: FFTData, customization: VisualizationCustomization): void {
    const colors = this.getColorPalette(customization.colorPalette);

    // Update grid nodes
    this.updateGridNodes(fftData, customization);

    // Draw grid lines
    this.drawGridLines(colors, customization);

    // Draw grid nodes
    this.drawGridNodes(colors, customization);
  }

  /**
   * Update NeonGrid nodes
   */
  private updateGridNodes(fftData: FFTData, customization: VisualizationCustomization): void {
    this.gridNodes.forEach((node, index) => {
      // Map node to frequency data
      const freqIndex = Math.floor(mapRange(index, 0, this.gridNodes.length, 0, fftData.frequencyData.length - 1));
      const frequency = fftData.frequencyData[freqIndex] / 255;

      // Update energy with pulsation
      const pulsation = Math.sin(this.time * 2 + node.phase) * 0.5 + 0.5;
      node.energy = frequency * customization.sensitivity * pulsation * this.neongridConfig.pulsation;
    });
  }

  /**
   * Draw NeonGrid lines
   */
  private drawGridLines(colors: string[], customization: VisualizationCustomization): void {
    this.context.lineWidth = this.neongridConfig.lineWidth;
    this.context.globalCompositeOperation = 'screen';

    const cols = Math.ceil(this.width / this.neongridConfig.gridSize);
    const rows = Math.ceil(this.height / this.neongridConfig.gridSize);

    // Draw horizontal lines
    for (let j = 0; j <= rows; j++) {
      const y = j * this.neongridConfig.gridSize;
      const energySum = this.getRowEnergy(j, cols);
      const alpha = clamp(energySum * this.neongridConfig.glowIntensity, 0.1, 1);

      this.context.globalAlpha = alpha;
      this.context.strokeStyle = colors[j % colors.length];
      this.context.shadowColor = colors[j % colors.length];
      this.context.shadowBlur = energySum * 10;

      this.context.beginPath();
      this.context.moveTo(0, y);
      this.context.lineTo(this.width, y);
      this.context.stroke();
    }

    // Draw vertical lines
    for (let i = 0; i <= cols; i++) {
      const x = i * this.neongridConfig.gridSize;
      const energySum = this.getColumnEnergy(i, rows);
      const alpha = clamp(energySum * this.neongridConfig.glowIntensity, 0.1, 1);

      this.context.globalAlpha = alpha;
      this.context.strokeStyle = colors[i % colors.length];
      this.context.shadowColor = colors[i % colors.length];
      this.context.shadowBlur = energySum * 10;

      this.context.beginPath();
      this.context.moveTo(x, 0);
      this.context.lineTo(x, this.height);
      this.context.stroke();
    }

    this.context.shadowBlur = 0;
    this.context.globalCompositeOperation = 'source-over';
  }

  /**
   * Draw NeonGrid nodes
   */
  private drawGridNodes(colors: string[], customization: VisualizationCustomization): void {
    this.gridNodes.forEach((node, index) => {
      if (node.energy > 0.1) {
        const size = this.neongridConfig.nodeSize * node.energy * customization.scale;
        const alpha = clamp(node.energy * this.neongridConfig.glowIntensity, 0.2, 1);
        const color = colors[index % colors.length];

        this.context.globalAlpha = alpha;
        this.context.fillStyle = color;
        this.context.shadowColor = color;
        this.context.shadowBlur = size * 3;

        this.context.beginPath();
        this.context.arc(node.x, node.y, size, 0, Math.PI * 2);
        this.context.fill();
      }
    });

    this.context.shadowBlur = 0;
  }

  /**
   * Get row energy sum for grid
   */
  private getRowEnergy(row: number, cols: number): number {
    let sum = 0;
    for (let i = 0; i <= cols; i++) {
      const index = row * (cols + 1) + i;
      if (index < this.gridNodes.length) {
        sum += this.gridNodes[index].energy;
      }
    }
    return sum / (cols + 1);
  }

  /**
   * Get column energy sum for grid
   */
  private getColumnEnergy(col: number, rows: number): number {
    let sum = 0;
    const cols = Math.ceil(this.width / this.neongridConfig.gridSize);

    for (let j = 0; j <= rows; j++) {
      const index = j * (cols + 1) + col;
      if (index < this.gridNodes.length) {
        sum += this.gridNodes[index].energy;
      }
    }
    return sum / (rows + 1);
  }

  /**
   * Get color palette based on selection
   */
  private getColorPalette(palette: string): string[] {
    return this.colorPalettes[palette as keyof typeof this.colorPalettes] || this.colorPalettes.blue;
  }

  /**
   * Set visualization style
   */
  setStyle(style: VisualizationStyle): void {
    this.currentStyle = style;
    this.initializePatterns(); // Reinitialize for new style
  }

  /**
   * Resize canvas
   */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.setupCanvas();
    this.initializePatterns();
  }

  /**
   * Export canvas as image
   */
  async exportImage(options: ExportOptions): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to export canvas as image'));
          }
        },
        `image/${options.format}`,
        options.quality
      );
    });
  }

  /**
   * Clear canvas
   */
  clear(): void {
    this.context.clearRect(0, 0, this.width, this.height);
    this.context.fillStyle = '#000000';
    this.context.fillRect(0, 0, this.width, this.height);
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMonitor.getMetrics(),
      fps: this.fpsMonitor.getAverageFPS()
    };
  }

  /**
   * Destroy renderer and cleanup resources
   */
  destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    this.particles = [];
    this.trails = [];
    this.gridNodes = [];
    this.performanceMonitor.clear();
    this.fpsMonitor.reset();

    console.log('Canvas renderer destroyed');
  }
}

// Helper interfaces for internal use
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  color: { r: number; g: number; b: number };
}

interface TrailPoint {
  x: number;
  y: number;
  life: number;
  color: { r: number; g: number; b: number };
  time: number;
}

interface GridNode {
  x: number;
  y: number;
  energy: number;
  phase: number;
}