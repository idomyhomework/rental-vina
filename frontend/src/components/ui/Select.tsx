// --- SELECT — UI COMPONENT ---

"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

// --- Props ---

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

// --- Component ---

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, required, children, ...props }, ref) => {
    return (
      <div className="mb-3">
        {label && (
          <label
            htmlFor={id}
            className="mb-1.5 block text-sm font-medium text-muted"
          >
            {label}
            {required && <span className="ml-0.5 text-coral" aria-hidden="true">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            "block h-14 w-full rounded-lg border bg-white px-3 text-base text-ink",
            "transition-all duration-150",
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
        >
          {children}
        </select>
        {error && (
          <p id={`${id}-error`} className="mt-1.5 text-sm text-coral" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";
