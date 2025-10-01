"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Upload,
  Mic,
  Play,
  Pause,
  Volume2,
  Zap,
  Palette,
  Share2,
  Download,
  Sparkles,
  Music,
  Waves,
  Grid3X3,
  CircleDot,
  Droplets,
  ImageIcon,
} from "lucide-react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

function FeatureCard({ icon, title, description, color }: FeatureCardProps) {
  return (
    <Card
      className={cn(
        "p-6 bg-[var(--color-primary-surface-elevated)] border-[var(--color-primary-border-default)]",
        "hover:border-[var(--color-primary-border-focus)] transition-all duration-300",
        "group cursor-pointer"
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-lg flex items-center justify-center mb-4",
        "transition-all duration-300 group-hover:scale-110",
        color
      )}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-primary-text-primary)] mb-2">
        {title}
      </h3>
      <p className="text-[var(--color-primary-text-secondary)] leading-relaxed">
        {description}
      </p>
    </Card>
  );
}

function HeroSection() {
  const router = useRouter();

  return (
    <section className="relative py-16 sm:py-24 lg:py-32 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated grid */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-12 gap-4 h-full w-full">
            {Array.from({ length: 48 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "border border-[var(--color-accent-neon-blue)] rounded",
                  "animate-pulse"
                )}
                style={{
                  animationDelay: `${(i * 100)}ms`,
                  animationDuration: "3s",
                }}
              />
            ))}
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-4 h-4 bg-[var(--color-accent-neon-purple)] rounded-full animate-bounce opacity-60" />
        <div className="absolute top-40 right-20 w-3 h-3 bg-[var(--color-accent-neon-pink)] rounded-full animate-pulse opacity-40" />
        <div className="absolute bottom-32 left-20 w-5 h-5 bg-[var(--color-accent-neon-green)] rounded-full animate-bounce opacity-50" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
        {/* Hero Badge */}
        <div className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8",
          "bg-[var(--color-primary-surface-glass)] border border-[var(--color-primary-border-default)]",
          "text-[var(--color-accent-neon-blue)] text-sm font-medium"
        )}>
          <Sparkles className="w-4 h-4" />
          Transform Audio into Art
        </div>

        {/* Main Heading */}
        <h1 className={cn(
          "text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6",
          "bg-gradient-to-r from-[var(--color-primary-text-primary)] via-[var(--color-accent-neon-blue)] to-[var(--color-accent-neon-purple)]",
          "bg-clip-text text-transparent"
        )}>
          Sound
          <span className="text-[var(--color-accent-neon-blue)]">Canvas</span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl sm:text-2xl text-[var(--color-primary-text-secondary)] mb-8 max-w-3xl mx-auto leading-relaxed">
          Create stunning visual patterns from your audio files using advanced FFT analysis
          and artistic rendering. Upload, visualize, and share your sound art.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Button
            size="lg"
            variant="primary"
            onClick={() => router.push("/create")}
            className="w-full sm:w-auto min-w-48"
          >
            <Upload className="w-5 h-5 mr-2" />
            Create Visualization
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push("/gallery")}
            className="w-full sm:w-auto min-w-48"
          >
            <ImageIcon className="w-5 h-5 mr-2" />
            Explore Gallery
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto">
          {[
            { label: "Visualizations Created", value: "10K+" },
            { label: "Artists Active", value: "2.5K+" },
            { label: "Styles Available", value: "3" },
            { label: "Export Formats", value: "PNG" },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl font-bold text-[var(--color-accent-neon-blue)] mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-[var(--color-primary-text-tertiary)]">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: <Zap className="w-6 h-6 text-[var(--color-accent-neon-blue)]" />,
      title: "Real-time FFT Analysis",
      description: "Advanced frequency analysis processes your audio with sub-100ms latency for responsive visualizations.",
      color: "bg-[var(--color-accent-glow-blue)]",
    },
    {
      icon: <Palette className="w-6 h-6 text-[var(--color-accent-neon-purple)]" />,
      title: "Artistic Styles",
      description: "Three unique visualization patterns: Mandala symmetry, InkFlow organics, and NeonGrid geometrics.",
      color: "bg-[var(--color-accent-glow-purple)]",
    },
    {
      icon: <Download className="w-6 h-6 text-[var(--color-accent-neon-pink)]" />,
      title: "High-Quality Export",
      description: "Export your creations as high-resolution PNG files up to 2048x2048 pixels with frame overlays.",
      color: "bg-[var(--color-accent-glow-pink)]",
    },
    {
      icon: <Share2 className="w-6 h-6 text-[var(--color-accent-neon-green)]" />,
      title: "Share & Discover",
      description: "Share your visualizations with the community and discover amazing creations from other artists.",
      color: "bg-[var(--color-accent-glow-green)]",
    },
    {
      icon: <Mic className="w-6 h-6 text-[var(--color-accent-neon-orange)]" />,
      title: "Multiple Input Methods",
      description: "Record directly from your microphone or upload audio files in MP3, WAV, M4A, and OGG formats.",
      color: "bg-[var(--color-accent-glow-orange)]",
    },
    {
      icon: <Music className="w-6 h-6 text-[var(--color-accent-neon-blue)]" />,
      title: "Mobile Optimized",
      description: "Responsive design works seamlessly on mobile devices with touch-optimized controls and performance.",
      color: "bg-[var(--color-accent-glow-blue)]",
    },
  ];

  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-primary-text-primary)] mb-4">
            Powerful Features
          </h2>
          <p className="text-lg text-[var(--color-primary-text-secondary)] max-w-2xl mx-auto">
            Everything you need to create stunning audio visualizations with professional results.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

function VisualizationStylesSection() {
  const styles = [
    {
      name: "Mandala",
      description: "Circular, symmetrical patterns based on frequency data with sacred geometry principles.",
      icon: <CircleDot className="w-8 h-8" />,
      color: "text-[var(--color-accent-neon-blue)]",
      features: ["8-fold symmetry", "Radial patterns", "Center energy focus"],
    },
    {
      name: "InkFlow",
      description: "Organic, fluid patterns resembling ink dispersions in water with particle physics.",
      icon: <Droplets className="w-8 h-8" />,
      color: "text-[var(--color-accent-neon-purple)]",
      features: ["Particle system", "Viscosity effects", "Organic movement"],
    },
    {
      name: "NeonGrid",
      description: "Geometric grid patterns with neon-like glowing effects and pulsating nodes.",
      icon: <Grid3X3 className="w-8 h-8" />,
      color: "text-[var(--color-accent-neon-pink)]",
      features: ["Grid topology", "Glow effects", "Node pulsation"],
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-[var(--color-primary-surface-default)]/30">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-primary-text-primary)] mb-4">
            Visualization Styles
          </h2>
          <p className="text-lg text-[var(--color-primary-text-secondary)] max-w-2xl mx-auto">
            Three distinct artistic approaches to transform your audio into visual masterpieces.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {styles.map((style, index) => (
            <Card
              key={index}
              className={cn(
                "p-8 bg-[var(--color-primary-surface-elevated)] border-[var(--color-primary-border-default)]",
                "hover:border-[var(--color-primary-border-focus)] transition-all duration-300",
                "text-center group cursor-pointer"
              )}
            >
              <div className={cn(
                "w-16 h-16 rounded-full bg-[var(--color-primary-surface-glass)] flex items-center justify-center mb-6 mx-auto",
                "transition-all duration-300 group-hover:scale-110",
                style.color
              )}>
                {style.icon}
              </div>

              <h3 className="text-xl font-semibold text-[var(--color-primary-text-primary)] mb-3">
                {style.name}
              </h3>

              <p className="text-[var(--color-primary-text-secondary)] mb-6 leading-relaxed">
                {style.description}
              </p>

              <ul className="space-y-2">
                {style.features.map((feature, featureIndex) => (
                  <li
                    key={featureIndex}
                    className="text-sm text-[var(--color-primary-text-tertiary)] flex items-center justify-center gap-2"
                  >
                    <div className={cn("w-1 h-1 rounded-full", style.color)} />
                    {feature}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function CallToActionSection() {
  const router = useRouter();

  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-4xl mx-auto text-center px-4">
        <div className={cn(
          "bg-gradient-to-r from-[var(--color-accent-neon-blue)]/10 via-[var(--color-accent-neon-purple)]/10 to-[var(--color-accent-neon-pink)]/10",
          "rounded-2xl p-8 sm:p-12 border border-[var(--color-primary-border-default)]"
        )}>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-primary-text-primary)] mb-4">
            Ready to Create Your First Visualization?
          </h2>
          <p className="text-lg text-[var(--color-primary-text-secondary)] mb-8 max-w-2xl mx-auto">
            Upload your audio file or record directly in your browser.
            Transform sound into art in seconds with SoundCanvas.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              variant="primary"
              onClick={() => router.push("/create")}
              className="w-full sm:w-auto min-w-48"
            >
              <Upload className="w-5 h-5 mr-2" />
              Start Creating
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => router.push("/gallery")}
              className="w-full sm:w-auto min-w-48"
            >
              <Waves className="w-5 h-5 mr-2" />
              View Examples
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <VisualizationStylesSection />
      <CallToActionSection />
    </div>
  );
}