import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-neon-blue)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--color-accent-neon-blue)] text-white hover:bg-[var(--color-accent-neon-blue)]/80",
        secondary:
          "border-transparent bg-[var(--color-primary-surface-elevated)] text-[var(--color-primary-text-secondary)] hover:bg-[var(--color-primary-surface-elevated)]/80",
        destructive:
          "border-transparent bg-[var(--color-semantic-error)] text-white hover:bg-[var(--color-semantic-error)]/80",
        outline: "text-[var(--color-primary-text-primary)] border-[var(--color-primary-border-default)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }