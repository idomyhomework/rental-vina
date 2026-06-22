// --- INPUT — UI COMPONENT ---

"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

// --- Props ---

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

// --- Component ---

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="mb-3">
        {label && (
          <label
            htmlFor={id}
            className="mb-1.5 block text-sm font-medium text-muted"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            // → Airbnb text-input: 56px height, 8px radius, 1px hairline border
            "block h-14 w-full rounded-lg border px-3 text-base text-ink",
            "placeholder:text-muted",
            "transition-all duration-150",
            // → Airbnb focus: 2px ink border, no ring/glow
            "focus:outline-none focus:border-ink focus:border-2 focus:px-[11px]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-coral focus:border-coral"
              : "border-hairline hover:border-ink/40",
            className,
          )}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${id}-error`} className="mt-1.5 text-sm text-coral" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
