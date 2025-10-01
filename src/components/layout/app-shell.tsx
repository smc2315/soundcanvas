'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  ImageIcon,
  User,
  Plus,
  Volume2,
  Settings,
  Menu,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: React.ReactNode
}

interface NavItem {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  badge?: number
}

const navigationItems: NavItem[] = [
  {
    id: 'home',
    label: '홈',
    href: '/',
    icon: Home
  },
  {
    id: 'gallery',
    label: '갤러리',
    href: '/gallery',
    icon: ImageIcon
  },
  {
    id: 'create',
    label: '만들기',
    href: '/create',
    icon: Plus
  },
  {
    id: 'works',
    label: '내 작품',
    href: '/works',
    icon: User
  }
]

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [navVisible, setNavVisible] = useState(true)

  // Handle scroll behavior for navigation auto-hide
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Show/hide navigation based on scroll direction
      if (currentScrollY > 100) {
        setScrolled(true)
        if (currentScrollY > lastScrollY && currentScrollY > 200) {
          setNavVisible(false) // Hide when scrolling down
        } else if (currentScrollY < lastScrollY) {
          setNavVisible(true) // Show when scrolling up
        }
      } else {
        setScrolled(false)
        setNavVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  const getCurrentNavItem = () => {
    return navigationItems.find(item => {
      if (item.href === '/') {
        return pathname === '/'
      }
      return pathname.startsWith(item.href)
    })
  }

  const currentNavItem = getCurrentNavItem()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-primary-bg-start)] to-[var(--color-primary-bg-end)] relative">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[var(--z-skip-link)] bg-[var(--color-accent-neon-blue)] text-[var(--color-primary-bg-start)] px-4 py-2 rounded-md font-medium transition-all duration-200"
      >
        메인 콘텐츠로 건너뛰기
      </a>

      {/* Top Header (Mobile) */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-[var(--z-sticky)] bg-[var(--color-primary-surface-overlay)] backdrop-blur-lg border-b border-[var(--color-primary-border-default)]">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-2 text-[var(--color-primary-text-primary)] font-bold text-lg font-[var(--font-family-heading)]"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-accent-neon-blue)] to-[var(--color-accent-neon-purple)] flex items-center justify-center">
              <Volume2 size={16} className="text-white" />
            </div>
            <span>SoundCanvas</span>
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-[var(--color-primary-text-primary)] hover:bg-[var(--color-primary-surface-glass)] rounded-lg transition-colors"
            aria-label={isMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Overlay Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-[var(--z-overlay)] bg-[var(--color-primary-surface-overlay)] backdrop-blur-lg"
          >
            <div className="flex flex-col items-center justify-center h-full space-y-8">
              {navigationItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center space-y-2 p-4 rounded-xl transition-all duration-300",
                      currentNavItem?.id === item.id
                        ? "text-[var(--color-accent-neon-blue)] glow-blue"
                        : "text-[var(--color-primary-text-secondary)] hover:text-[var(--color-accent-neon-purple)]"
                    )}
                  >
                    <item.icon size={32} />
                    <span className="text-lg font-medium">{item.label}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main
        id="main-content"
        className="pt-14 md:pt-0 pb-20 md:pb-0 min-h-screen"
        role="main"
        aria-label="메인 콘텐츠"
      >
        {children}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <AnimatePresence>
        {navVisible && (
          <motion.nav
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-[var(--z-docked)] bg-[var(--color-primary-surface-overlay)] backdrop-blur-lg border-t border-[var(--color-primary-border-default)]"
            role="navigation"
            aria-label="메인 네비게이션"
          >
            <div className="flex items-center justify-around px-2 py-2 safe-area-bottom">
              {navigationItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center px-2 py-2 rounded-xl transition-all duration-300 min-w-[var(--size-touch-minimum)] min-h-[var(--size-touch-minimum)]",
                    item.id === 'create' && "relative",
                    currentNavItem?.id === item.id
                      ? "text-[var(--color-accent-neon-blue)]"
                      : "text-[var(--color-primary-text-secondary)] hover:text-[var(--color-accent-neon-purple)]"
                  )}
                  aria-label={item.label}
                  aria-current={currentNavItem?.id === item.id ? 'page' : undefined}
                >
                  {/* Special styling for create button */}
                  {item.id === 'create' ? (
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent-neon-blue)] to-[var(--color-accent-neon-purple)] rounded-full glow-blue" />
                      <div className="relative w-12 h-12 bg-gradient-to-br from-[var(--color-accent-neon-blue)] to-[var(--color-accent-neon-purple)] rounded-full flex items-center justify-center">
                        <item.icon size={20} className="text-white" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <item.icon
                        size={20}
                        className={cn(
                          "mb-1",
                          currentNavItem?.id === item.id && "glow-blue"
                        )}
                      />
                      <span className="text-xs font-medium">{item.label}</span>
                      {item.badge && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--color-semantic-error)] rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-white">{item.badge}</span>
                        </div>
                      )}
                    </>
                  )}
                </Link>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar (Hidden for now, could be added later) */}
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:flex-col lg:bg-[var(--color-primary-surface-default)] lg:border-r lg:border-[var(--color-primary-border-default)]">
        {/* Desktop navigation would go here */}
      </aside>

      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none z-[-1] opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, var(--color-accent-neon-blue) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, var(--color-accent-neon-purple) 0%, transparent 50%),
            radial-gradient(circle at 75% 25%, var(--color-accent-neon-pink) 0%, transparent 50%),
            radial-gradient(circle at 25% 75%, var(--color-accent-neon-green) 0%, transparent 50%)
          `,
          backgroundSize: '100% 100%'
        }} />
      </div>
    </div>
  )
}

// Safe area utility component for iOS devices
export function SafeAreaView({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("safe-area-inset", className)}>
      {children}
    </div>
  )
}

// Page layout component
export function PageLayout({
  children,
  title,
  description,
  className
}: {
  children: React.ReactNode
  title?: string
  description?: string
  className?: string
}) {
  return (
    <div className={cn("min-h-screen p-4 md:p-6 lg:p-8", className)}>
      {(title || description) && (
        <header className="mb-8">
          {title && (
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-primary-text-primary)] font-[var(--font-family-heading)] mb-2">
              {title}
            </h1>
          )}
          {description && (
            <p className="text-[var(--color-primary-text-secondary)] text-lg max-w-2xl">
              {description}
            </p>
          )}
        </header>
      )}
      {children}
    </div>
  )
}