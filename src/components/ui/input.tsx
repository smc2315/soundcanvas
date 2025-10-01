import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-[var(--color-primary-border-default)] bg-[var(--color-primary-surface-elevated)] px-3 py-2 text-sm text-[var(--color-primary-text-primary)] ring-offset-[var(--color-primary-surface-default)] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--color-primary-text-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-neon-blue)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
