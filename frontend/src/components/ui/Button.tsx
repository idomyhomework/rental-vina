// --- BUTTON — UI COMPONENT ---

"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

// --- Variants ---

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

// → Airbnb: primary = brand fill, secondary = white + ink outline, ghost = text-only underline
const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-sea text-white hover:bg-sea/90",
  secondary:
    "bg-white text-ink border border-ink hover:bg-surface-soft",
  ghost: "text-ink hover:bg-surface-soft",
  danger: "bg-coral text-white hover:bg-coral-dark",
};

// → Airbnb: md = 48px height (14px × 24px padding), sm = 36px, lg = 56px
const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-12 px-6 text-base",
  lg: "h-14 px-8 text-base",
};

// --- Props ---

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

// --- Component ---

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          // → Airbnb: 8px radius, weight 500, focus = 2px ink outline (no ring)
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium",
          "transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-1",
          "disabled:pointer-events-none disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
