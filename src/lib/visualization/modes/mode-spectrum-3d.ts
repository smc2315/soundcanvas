/**
 * Spectrum 3D Visualization Mode
 * Three.js-based 3D frequency spectrum visualization with terrain-like representation
 */

import * as THREE from 'three'
import { BaseVisualizer, AudioFeatures, RenderFrame, VisualizationMode, VisualParams } from '../core/types'
import { PaletteGenerator } from '../core/palettes'
import { AudioMapper } from '../core/mapping'
import { SeededRNG } from '../core/rng'

interface Spectrum3DParams extends VisualParams {
  // Terrain parameters
  terrainResolution: number
  terrainDepth: number
  heightScale: number
  smoothness: number

  // Camera parameters
  cameraDistance: number
  cameraHeight: number
  rotationSpeed: number
  autoRotate: boolean

  // Visual effects
  wireframe: boolean
  showParticles: boolean
  bloomIntensity: number
  fogDensity: number

  // Audio mapping
  bassHeightMultiplier: number
  midDetailLevel: number
  trebleSparkles: number
}

export class Spectrum3DVisualizer extends BaseVisualizer {
  readonly id = 'spectrum-3d'
  readonly label = 'Spectrum 3D'
  readonly mode: VisualizationMode = {
    id: this.id,
    label: this.label,
    description: 'Three.js-based 3D frequency spectrum with terrain-like visualization',
    category: 'data',
    tags: ['3d', 'spectrum', 'terrain', 'realtime'],
    previewImage: '/previews/spectrum-3d.png',
    supportsRealtime: true,
    supportsOffline: true,
    supportsVideo: true,
    supports3D: true,
    defaultParams: {
      palette: {
        id: 'ocean',
        name: 'Ocean Depths',
        colors: ['#003f5c', '#2f4b7c', '#665191', '#a05195', '#d45087'],
        temperature: 'cool',
        mood: 'calm'
      },
      gradients: {} as any, // Will be populated in init()
      opacity: 0.8,
      brightness: 1.0,
      contrast: 1.2,
      saturation: 1.1,
      motionIntensity: 0.7,
      smoothing: 0.85,
      responsiveness: 0.8,

      // Spectrum 3D specific
      terrainResolution: 128,
      terrainDepth: 64,
      heightScale: 50,
      smoothness: 0.7,
      cameraDistance: 150,
      cameraHeight: 80,
      rotationSpeed: 0.3,
      autoRotate: true,
      wireframe: false,
      showParticles: true,
      bloomIntensity: 1.2,
      fogDensity: 0.01,
      bassHeightMultiplier: 2.0,
      midDetailLevel: 1.0,
      trebleSparkles: 0.8
    } as Spectrum3DParams,
    parameterSchema: [
      {
        key: 'terrainResolution',
        label: 'Terrain Resolution',
        type: 'range',
        default: 128,
        min: 64,
        max: 256,
        step: 32,
        category: 'Terrain'
      },
      {
        key: 'heightScale',
        label: 'Height Scale',
        type: 'range',
        default: 50,
        min: 10,
        max: 200,
        step: 5,
        category: 'Terrain'
      },
      {
        key: 'autoRotate',
        label: 'Auto Rotate',
        type: 'boolean',
        default: true,
        category: 'Camera'
      },
      {
        key: 'wireframe',
        label: 'Wireframe Mode',
        type: 'boolean',
        default: false,
        category: 'Visual'
      },
      {
        key: 'showParticles',
        label: 'Show Particles',
        type: 'boolean',
        default: true,
        category: 'Effects'
      }
    ],
    audioMapping: {
      energy: [
        { target: 'heightScale', range: [20, 100], curve: 'exponential', smoothing: 0.8 },
        { target: 'bloomIntensity', range: [0.5, 2.0], curve: 'linear', smoothing: 0.7 }
      ],
      brightness: [
        { target: 'brightness', range: [0.5, 1.5], curve: 'linear', smoothing: 0.8 }
      ],
      onset: [
        { trigger: 'cameraShake', threshold: 0.7, cooldown: 0.5 },
        { trigger: 'particleBurst', threshold: 0.8, cooldown: 0.3 }
      ],
      pitch: [
        { target: 'rotationSpeed', range: [0.1, 1.0], freqRange: [80, 800] }
      ]
    }
  }

  // Three.js components
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private webglCanvas: HTMLCanvasElement
  private terrain: THREE.Mesh
  private terrainGeometry: THREE.PlaneGeometry
  private terrainMaterial: THREE.ShaderMaterial
  private particleSystem: THREE.Points
  private composer: any // EffectComposer for post-processing

  // Audio processing
  private frequencyData: Uint8Array = new Uint8Array(256)
  private smoothedFrequencyData: Float32Array = new Float32Array(256)
  private audioMapper: AudioMapper
  private paletteGenerator: PaletteGenerator
  private rng: SeededRNG

  // Animation state
  private time = 0
  private cameraAngle = 0

  constructor() {
    super()
    this.rng = new SeededRNG(Date.now())
    this.paletteGenerator = new PaletteGenerator(this.rng.getSeed())
    this.audioMapper = new AudioMapper(this.mode.audioMapping)
  }

  protected async initializeMode(): Promise<void> {
    await this.initThreeJS()
    await this.createTerrain()
    await this.createParticleSystem()
    await this.setupPostProcessing()
    await this.setupLighting()
  }

  private async initThreeJS(): Promise<void> {
    // Create scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x000510)

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.config.width / this.config.height,
      0.1,
      1000
    )

    // Create a separate WebGL canvas to avoid context conflicts
    const webglCanvas = document.createElement('canvas')
    webglCanvas.width = this.config.width * this.config.pixelRatio
    webglCanvas.height = this.config.height * this.config.pixelRatio

    // Create renderer with separate canvas
    this.renderer = new THREE.WebGLRenderer({
      canvas: webglCanvas,
      antialias: true,
      alpha: false
    })
    this.renderer.setSize(this.config.width, this.config.height, false)
    this.renderer.setPixelRatio(this.config.pixelRatio)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0

    // Store WebGL canvas reference
    this.webglCanvas = webglCanvas

    // Add fog
    this.scene.fog = new THREE.Fog(0x000510, 50, 500)
  }

  private async createTerrain(): Promise<void> {
    const params = this.params as Spectrum3DParams
    const resolution = params.terrainResolution

    // Create terrain geometry
    this.terrainGeometry = new THREE.PlaneGeometry(
      200, 200, resolution - 1, params.terrainDepth - 1
    )
    this.terrainGeometry.rotateX(-Math.PI / 2)

    // Create custom shader material
    this.terrainMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        heightScale: { value: params.heightScale },
        audioData: { value: new THREE.DataTexture(
          new Uint8Array(resolution * 4),
          resolution, 1,
          THREE.RGBAFormat
        )},
        palette: { value: this.createPaletteTexture() },
        wireframe: { value: params.wireframe ? 1.0 : 0.0 }
      },
      vertexShader: this.getVertexShader(),
      fragmentShader: this.getFragmentShader(),
      wireframe: params.wireframe,
      transparent: true
    })

    this.terrain = new THREE.Mesh(this.terrainGeometry, this.terrainMaterial)
    this.scene.add(this.terrain)
  }

  private async createParticleSystem(): Promise<void> {
    const particleCount = 5000
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 400
      positions[i * 3 + 1] = Math.random() * 200
      positions[i * 3 + 2] = (Math.random() - 0.5) * 400

      colors[i * 3] = Math.random()
      colors[i * 3 + 1] = Math.random()
      colors[i * 3 + 2] = Math.random()

      sizes[i] = Math.random() * 2 + 1
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const material = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    })

    this.particleSystem = new THREE.Points(geometry, material)
    this.scene.add(this.particleSystem)
  }

  private async setupPostProcessing(): Promise<void> {
    // This would set up post-processing effects like bloom
    // For now, we'll skip the complex post-processing setup
    // In a full implementation, you'd use THREE.EffectComposer
  }

  private async setupLighting(): Promise<void> {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3)
    this.scene.add(ambientLight)

    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(50, 100, 50)
    directionalLight.castShadow = true
    this.scene.add(directionalLight)

    // Point lights for dynamic effects
    const pointLight1 = new THREE.PointLight(0x00ff88, 1, 100)
    pointLight1.position.set(0, 50, 0)
    this.scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0xff0088, 1, 100)
    pointLight2.position.set(-50, 30, 50)
    this.scene.add(pointLight2)
  }

  public update(features: AudioFeatures): void {
    // Map audio features to visual parameters
    const mappedParams = this.audioMapper.mapFeatures(features, this.params)
    this.updateParams(mappedParams)

    // Update frequency data
    if (features.frequencyData) {
      this.frequencyData = features.frequencyData
      this.smoothFrequencyData()
    }
  }

  public renderFrame(frame: RenderFrame): void {
    this.time += 1 / 60 // Assume 60 FPS
    const params = this.params as Spectrum3DParams

    // Update terrain with audio data
    this.updateTerrainAudio()

    // Update camera
    this.updateCamera(params)

    // Update particles
    this.updateParticles(params)

    // Update shader uniforms
    this.updateShaderUniforms(params)

    // Render the scene to WebGL canvas
    this.renderer.render(this.scene, this.camera)

    // Copy WebGL canvas to main canvas
    if (this.ctx && this.webglCanvas) {
      this.ctx.clearRect(0, 0, this.config.width, this.config.height)
      this.ctx.drawImage(this.webglCanvas, 0, 0, this.config.width, this.config.height)
    }
  }

  private smoothFrequencyData(): void {
    const smoothing = (this.params as Spectrum3DParams).smoothness
    for (let i = 0; i < this.frequencyData.length; i++) {
      this.smoothedFrequencyData[i] =
        this.smoothedFrequencyData[i] * smoothing +
        (this.frequencyData[i] / 255) * (1 - smoothing)
    }
  }

  private updateTerrainAudio(): void {
    const resolution = (this.params as Spectrum3DParams).terrainResolution
    const audioTexture = this.terrainMaterial.uniforms.audioData.value as THREE.DataTexture

    // Update audio data texture
    const data = new Uint8Array(resolution * 4)
    for (let i = 0; i < resolution; i++) {
      const freqIndex = Math.floor((i / resolution) * this.smoothedFrequencyData.length)
      const value = this.smoothedFrequencyData[freqIndex] || 0

      data[i * 4] = Math.floor(value * 255)
      data[i * 4 + 1] = Math.floor(value * 255)
      data[i * 4 + 2] = Math.floor(value * 255)
      data[i * 4 + 3] = 255
    }

    audioTexture.image.data = data
    audioTexture.needsUpdate = true
  }

  private updateCamera(params: Spectrum3DParams): void {
    if (params.autoRotate) {
      this.cameraAngle += params.rotationSpeed * 0.01
    }

    this.camera.position.x = Math.cos(this.cameraAngle) * params.cameraDistance
    this.camera.position.y = params.cameraHeight
    this.camera.position.z = Math.sin(this.cameraAngle) * params.cameraDistance

    this.camera.lookAt(0, 0, 0)
  }

  private updateParticles(params: Spectrum3DParams): void {
    if (!params.showParticles) {
      this.particleSystem.visible = false
      return
    }

    this.particleSystem.visible = true
    const positions = this.particleSystem.geometry.attributes.position
    const colors = this.particleSystem.geometry.attributes.color

    // Animate particles based on audio
    for (let i = 0; i < positions.count; i++) {
      const freqIndex = Math.floor((i / positions.count) * this.smoothedFrequencyData.length)
      const audioValue = this.smoothedFrequencyData[freqIndex] || 0

      // Update particle colors based on audio
      colors.setXYZ(i,
        audioValue * params.trebleSparkles,
        audioValue * 0.5,
        1.0 - audioValue * 0.5
      )
    }

    colors.needsUpdate = true
    this.particleSystem.rotation.y += 0.001
  }

  private updateShaderUniforms(params: Spectrum3DParams): void {
    this.terrainMaterial.uniforms.time.value = this.time
    this.terrainMaterial.uniforms.heightScale.value = params.heightScale
    this.terrainMaterial.uniforms.wireframe.value = params.wireframe ? 1.0 : 0.0
  }

  private createPaletteTexture(): THREE.DataTexture {
    const palette = this.params.palette
    const data = new Uint8Array(palette.colors.length * 4)

    palette.colors.forEach((color, i) => {
      const rgb = this.hexToRgb(color)
      data[i * 4] = rgb.r
      data[i * 4 + 1] = rgb.g
      data[i * 4 + 2] = rgb.b
      data[i * 4 + 3] = 255
    })

    return new THREE.DataTexture(data, palette.colors.length, 1, THREE.RGBAFormat)
  }

  private hexToRgb(hex: string): { r: number, g: number, b: number } {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b }
  }

  private getVertexShader(): string {
    return `
      uniform float time;
      uniform float heightScale;
      uniform sampler2D audioData;

      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      varying float vAudioValue;
      varying float vDisplacement;
      varying vec3 vWorldPosition;

      // Noise function for organic terrain
      float noise(vec3 pos) {
        return fract(sin(dot(pos, vec3(12.9898, 78.233, 45.543))) * 43758.5453);
      }

      float fbm(vec3 pos) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;

        for(int i = 0; i < 4; i++) {
          value += amplitude * noise(pos * frequency);
          amplitude *= 0.5;
          frequency *= 2.0;
        }
        return value;
      }

      void main() {
        vUv = uv;
        vPosition = position;

        // Sample audio data with smoothing
        float audioValue = texture2D(audioData, vec2(uv.x, 0.0)).r;
        float audioSmooth = mix(
          texture2D(audioData, vec2(max(0.0, uv.x - 0.01), 0.0)).r,
          mix(audioValue, texture2D(audioData, vec2(min(1.0, uv.x + 0.01), 0.0)).r, 0.5),
          0.5
        );
        vAudioValue = audioSmooth;

        // Apply height displacement with audio
        vec3 newPosition = position;
        float displacement = audioSmooth * heightScale;

        // Add fractal noise for organic terrain
        float organicNoise = fbm(vec3(position.x * 0.02, position.z * 0.02, time * 0.1));
        displacement += organicNoise * 8.0;

        // Add wave motion with audio-reactive amplitude
        float waveAmplitude = 2.0 + audioSmooth * 5.0;
        displacement += sin(position.x * 0.1 + time * 0.5) * waveAmplitude;
        displacement += cos(position.z * 0.1 + time * 0.3) * waveAmplitude * 0.5;

        // Add ripple effects
        float centerDist = length(position.xz);
        displacement += sin(centerDist * 0.05 - time * 2.0) * audioSmooth * 3.0;

        newPosition.y += displacement;
        vDisplacement = displacement;
        vWorldPosition = (modelMatrix * vec4(newPosition, 1.0)).xyz;

        // Calculate enhanced normal for better lighting
        float epsilon = 2.0;
        vec3 tangentX = vec3(epsilon, 0.0, 0.0);
        vec3 tangentZ = vec3(0.0, 0.0, epsilon);

        float heightL = texture2D(audioData, vec2(max(0.0, uv.x - 0.01), 0.0)).r * heightScale;
        float heightR = texture2D(audioData, vec2(min(1.0, uv.x + 0.01), 0.0)).r * heightScale;
        float heightD = audioSmooth * heightScale;
        float heightU = audioSmooth * heightScale;

        tangentX.y = heightR - heightL;
        tangentZ.y = heightU - heightD;

        vNormal = normalize(cross(tangentX, tangentZ));

        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      }
    `
  }

  private getFragmentShader(): string {
    return `
      uniform float time;
      uniform sampler2D palette;
      uniform float wireframe;

      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      varying float vAudioValue;
      varying float vDisplacement;
      varying vec3 vWorldPosition;

      // Enhanced noise functions
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise2D(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);

        return mix(
          mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      vec3 getEnhancedColor(float audioValue, vec3 worldPos) {
        // Multi-layer color sampling
        vec3 baseColor = texture2D(palette, vec2(audioValue, 0.0)).rgb;
        vec3 detailColor = texture2D(palette, vec2(audioValue * 0.5 + 0.25, 0.0)).rgb;

        // Frequency-based color modulation
        float freqMod = sin(audioValue * 10.0 + time) * 0.5 + 0.5;
        vec3 color = mix(baseColor, detailColor, freqMod * 0.3);

        // Add iridescent effect based on viewing angle
        vec3 viewDir = normalize(cameraPosition - worldPos);
        float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 2.0);
        color += fresnel * vec3(0.3, 0.6, 1.0) * audioValue;

        return color;
      }

      void main() {
        // Enhanced color calculation
        vec3 color = getEnhancedColor(vAudioValue, vWorldPosition);

        // Advanced shimmer with audio reactivity
        float shimmerFreq = 0.05 + vAudioValue * 0.1;
        float shimmer = sin(vPosition.x * shimmerFreq + time * 2.0) *
                       cos(vPosition.z * shimmerFreq * 0.7 + time * 1.5) * 0.15 + 0.85;
        color *= shimmer;

        // Enhanced lighting with multiple light sources
        vec3 lightDir1 = normalize(vec3(1.0, 1.0, 1.0));
        vec3 lightDir2 = normalize(vec3(-0.5, 0.8, -0.2));
        vec3 lightDir3 = normalize(vec3(0.0, -1.0, 0.5));

        float lighting1 = max(0.0, dot(normalize(vNormal), lightDir1)) * 0.6;
        float lighting2 = max(0.0, dot(normalize(vNormal), lightDir2)) * 0.3;
        float lighting3 = max(0.0, dot(normalize(vNormal), lightDir3)) * 0.2;

        float totalLighting = lighting1 + lighting2 + lighting3 + 0.3; // Ambient
        color *= totalLighting;

        // Specular highlights
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        vec3 reflectDir = reflect(-lightDir1, normalize(vNormal));
        float specular = pow(max(0.0, dot(viewDir, reflectDir)), 32.0);
        color += specular * vec3(1.0, 1.0, 1.0) * vAudioValue * 0.5;

        // Energy-based glow with color variation
        vec3 glowColor = mix(
          vec3(0.2, 0.4, 0.8),
          vec3(0.8, 0.4, 0.2),
          sin(time + vAudioValue * 5.0) * 0.5 + 0.5
        );
        color += vAudioValue * glowColor * 0.4;

        // Height-based color mixing
        float heightFactor = (vDisplacement + 20.0) / 40.0;
        vec3 heightColor = mix(vec3(0.1, 0.2, 0.8), vec3(1.0, 0.8, 0.2), heightFactor);
        color = mix(color, heightColor, 0.2);

        // Atmospheric scattering effect
        float distance = length(vWorldPosition - cameraPosition);
        float scatter = exp(-distance * 0.01);
        color = mix(vec3(0.1, 0.1, 0.2), color, scatter);

        // Noise-based detail
        float detailNoise = noise2D(vUv * 20.0 + time * 0.1);
        color += (detailNoise - 0.5) * 0.05 * vAudioValue;

        // Edge enhancement for wireframe mode
        if (wireframe > 0.5) {
          float edge = abs(fract(vUv.x * 100.0) - 0.5) + abs(fract(vUv.y * 100.0) - 0.5);
          edge = smoothstep(0.4, 0.5, edge);
          color = mix(color * 0.3, color, edge);
        }

        // Final alpha with audio reactivity
        float alpha = 0.8 + vAudioValue * 0.2;
        gl_FragColor = vec4(color, alpha);
      }
    `
  }

  public dispose(): void {
    if (this.renderer) {
      this.renderer.dispose()
    }
    if (this.terrainGeometry) {
      this.terrainGeometry.dispose()
    }
    if (this.terrainMaterial) {
      this.terrainMaterial.dispose()
    }
    this.scene?.clear()
    super.dispose()
  }
}