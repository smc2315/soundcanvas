"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-primary-surface-elevated)] text-[var(--color-primary-text-primary)] hover:bg-[var(--color-primary-surface-glass)] border border-[var(--color-primary-border-default)] hover:border-[var(--color-primary-border-focus)]",
        primary:
          "bg-[var(--color-accent-neon-blue)] text-[var(--color-primary-bg-start)] hover:bg-[var(--color-accent-neon-purple)] glow-blue hover:glow-purple font-semibold",
        secondary:
          "bg-[var(--color-accent-neon-purple)] text-[var(--color-primary-text-primary)] hover:bg-[var(--color-accent-neon-pink)] glow-purple hover:glow-pink font-semibold",
        ghost:
          "text-[var(--color-primary-text-primary)] hover:bg-[var(--color-primary-surface-glass)] hover:text-[var(--color-accent-neon-blue)]",
        destructive:
          "bg-[var(--color-semantic-error)] text-[var(--color-primary-text-primary)] hover:bg-red-600 font-medium",
        outline:
          "border border-[var(--color-primary-border-default)] bg-transparent text-[var(--color-primary-text-primary)] hover:bg-[var(--color-primary-surface-glass)] hover:border-[var(--color-accent-neon-blue)] hover:text-[var(--color-accent-neon-blue)]",
        success:
          "bg-[var(--color-semantic-success)] text-[var(--color-primary-bg-start)] hover:bg-green-600 font-medium",
        warning:
          "bg-[var(--color-semantic-warning)] text-[var(--color-primary-bg-start)] hover:bg-yellow-600 font-medium",
        link: "text-[var(--color-accent-neon-blue)] underline-offset-4 hover:underline hover:text-[var(--color-accent-neon-purple)]",
      },
      size: {
        default: "h-10 px-4 py-2 min-w-[var(--size-touch-minimum)]",
        sm: "h-8 rounded-md px-3 text-xs min-w-[var(--size-button-small)]",
        lg: "h-12 rounded-lg px-6 text-base min-w-[var(--size-touch-large)]",
        xl: "h-14 rounded-xl px-8 text-lg min-w-16",
        icon: "h-10 w-10 rounded-lg min-w-[var(--size-touch-minimum)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || loading;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        data-slot="button"
        {...props}
      >
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
        )}
        {children}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
