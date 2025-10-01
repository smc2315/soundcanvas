"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Home, Gallery, User, Plus, Mic } from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
  showNavigation?: boolean;
  webViewMode?: boolean;
  safeAreaInsets?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string | number;
  disabled?: boolean;
}

const navigationItems: NavigationItem[] = [
  {
    id: "home",
    label: "Home",
    icon: <Home className="w-5 h-5" />,
    href: "/",
  },
  {
    id: "create",
    label: "Create",
    icon: <Plus className="w-6 h-6" />,
    href: "/create",
  },
  {
    id: "gallery",
    label: "Gallery",
    icon: <Gallery className="w-5 h-5" />,
    href: "/gallery",
  },
  {
    id: "profile",
    label: "Profile",
    icon: <User className="w-5 h-5" />,
    href: "/profile",
  },
];

export function AppShell({
  children,
  showNavigation = true,
  webViewMode = false,
  safeAreaInsets,
}: AppShellProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = React.useState(true);
  const [lastScrollY, setLastScrollY] = React.useState(0);

  // Hide/show navigation on scroll (mobile optimization)
  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down and past threshold
        setIsVisible(false);
      } else {
        // Scrolling up
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    // Only enable auto-hide on mobile
    if (window.innerWidth < 768) {
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [lastScrollY]);

  const safeArea = safeAreaInsets || {
    top: webViewMode ? 44 : 0,
    bottom: webViewMode ? 34 : 0,
    left: 0,
    right: 0,
  };

  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-br from-[var(--color-primary-bg-start)] to-[var(--color-primary-bg-end)]",
        "relative overflow-x-hidden"
      )}
      style={{
        paddingTop: safeArea.top,
        paddingBottom: showNavigation ? (safeArea.bottom + 80) : safeArea.bottom,
        paddingLeft: safeArea.left,
        paddingRight: safeArea.right,
      }}
    >
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className={cn(
          "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4",
          "z-[var(--z-skip-link)] bg-[var(--color-accent-neon-blue)] text-[var(--color-primary-bg-start)]",
          "px-4 py-2 rounded-lg font-medium text-sm"
        )}
      >
        Skip to main content
      </a>

      {/* Header for WebView mode */}
      {webViewMode && (
        <header
          className={cn(
            "fixed top-0 left-0 right-0 z-[var(--z-banner)]",
            "bg-[var(--color-primary-surface-overlay)] backdrop-blur-md",
            "border-b border-[var(--color-primary-border-default)]",
            "px-4 flex items-center justify-center"
          )}
          style={{ height: safeArea.top }}
        >
          <h1 className="text-lg font-semibold text-[var(--color-primary-text-primary)]">
            SoundCanvas
          </h1>
        </header>
      )}

      {/* Main content area */}
      <main
        id="main-content"
        className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        role="main"
      >
        {children}
      </main>

      {/* Bottom Navigation */}
      {showNavigation && (
        <nav
          className={cn(
            "fixed bottom-0 left-0 right-0 z-[var(--z-docked)]",
            "bg-[var(--color-primary-surface-overlay)] backdrop-blur-md",
            "border-t border-[var(--color-primary-border-default)]",
            "transition-transform duration-300 ease-in-out",
            isVisible ? "translate-y-0" : "translate-y-full",
            "safe-bottom"
          )}
          role="navigation"
          aria-label="Main navigation"
        >
          <div className="flex items-center justify-around px-2 py-2">
            {navigationItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              const isCreateButton = item.id === "create";

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "relative flex flex-col items-center justify-center",
                    "min-w-[var(--size-touch-minimum)] min-h-[var(--size-touch-minimum)]",
                    "px-3 py-2 rounded-lg transition-all duration-200",
                    "group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-neon-blue)]",
                    isCreateButton && [
                      "bg-[var(--color-accent-neon-blue)] text-[var(--color-primary-bg-start)]",
                      "hover:bg-[var(--color-accent-neon-purple)] active:scale-95",
                      "shadow-lg hover:shadow-xl glow-blue",
                      "-mt-2 rounded-full w-14 h-14"
                    ],
                    !isCreateButton && [
                      isActive
                        ? "text-[var(--color-accent-neon-blue)] bg-[var(--color-primary-surface-glass)]"
                        : "text-[var(--color-primary-text-secondary)] hover:text-[var(--color-primary-text-primary)] hover:bg-[var(--color-primary-surface-glass)]"
                    ],
                    item.disabled && "opacity-50 pointer-events-none"
                  )}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                  aria-disabled={item.disabled}
                >
                  {/* Icon */}
                  <span
                    className={cn(
                      "flex items-center justify-center transition-transform duration-200",
                      "group-active:scale-90",
                      isCreateButton ? "mb-0" : "mb-1"
                    )}
                  >
                    {item.icon}
                  </span>

                  {/* Label - hidden for create button */}
                  {!isCreateButton && (
                    <span className="text-xs font-medium leading-none">
                      {item.label}
                    </span>
                  )}

                  {/* Badge */}
                  {item.badge && (
                    <span
                      className={cn(
                        "absolute -top-1 -right-1",
                        "bg-[var(--color-semantic-error)] text-white",
                        "text-xs font-bold rounded-full",
                        "min-w-5 h-5 flex items-center justify-center",
                        "animate-pulse"
                      )}
                      aria-label={`${item.badge} notifications`}
                    >
                      {typeof item.badge === "number" && item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}

                  {/* Active indicator */}
                  {isActive && !isCreateButton && (
                    <div
                      className={cn(
                        "absolute bottom-0 left-1/2 -translate-x-1/2",
                        "w-1 h-1 bg-[var(--color-accent-neon-blue)] rounded-full"
                      )}
                      aria-hidden="true"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Safe area bottom padding for devices with home indicator */}
          <div
            className="bg-[var(--color-primary-surface-overlay)]"
            style={{ height: safeArea.bottom }}
          />
        </nav>
      )}

      {/* Floating Record Button (alternative design) */}
      {/* Uncomment if you prefer a floating record button instead of bottom nav create */}
      {/*
      <button
        className={cn(
          "fixed bottom-6 right-6 z-[var(--z-docked)]",
          "w-14 h-14 rounded-full",
          "bg-[var(--color-semantic-error)] text-white",
          "shadow-lg hover:shadow-xl transition-all duration-300",
          "active:scale-95 glow-pink hover:glow-orange",
          "flex items-center justify-center",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-semantic-error)]"
        )}
        aria-label="Start recording"
      >
        <Mic className="w-6 h-6" />
      </button>
      */}
    </div>
  );
}

// Loading component for AppShell
export function AppShellSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-primary-bg-start)] to-[var(--color-primary-bg-end)]">
      <div className="animate-pulse">
        {/* Content skeleton */}
        <div className="p-4 space-y-4">
          <div className="h-8 bg-[var(--color-primary-surface-default)] rounded-lg w-3/4" />
          <div className="h-4 bg-[var(--color-primary-surface-default)] rounded w-1/2" />
          <div className="space-y-2">
            <div className="h-4 bg-[var(--color-primary-surface-default)] rounded" />
            <div className="h-4 bg-[var(--color-primary-surface-default)] rounded w-5/6" />
            <div className="h-4 bg-[var(--color-primary-surface-default)] rounded w-4/6" />
          </div>
        </div>

        {/* Bottom navigation skeleton */}
        <div className="fixed bottom-0 left-0 right-0 bg-[var(--color-primary-surface-overlay)] border-t border-[var(--color-primary-border-default)]">
          <div className="flex items-center justify-around px-2 py-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center justify-center p-3"
              >
                <div className="w-5 h-5 bg-[var(--color-primary-surface-default)] rounded mb-1" />
                <div className="w-8 h-3 bg-[var(--color-primary-surface-default)] rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Error boundary for AppShell
export function AppShellError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("AppShell error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-primary-bg-start)] to-[var(--color-primary-bg-end)] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-[var(--color-primary-text-primary)] mb-4">
          Something went wrong!
        </h2>
        <p className="text-[var(--color-primary-text-secondary)] mb-6">
          We encountered an error while loading the app. Please try again.
        </p>
        <button
          onClick={reset}
          className={cn(
            "bg-[var(--color-accent-neon-blue)] text-[var(--color-primary-bg-start)]",
            "px-6 py-3 rounded-lg font-medium",
            "hover:bg-[var(--color-accent-neon-purple)] transition-all duration-200",
            "glow-blue hover:glow-purple"
          )}
        >
          Try again
        </button>
      </div>
    </div>
  );
}