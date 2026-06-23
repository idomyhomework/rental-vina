// --- TEXTAREA — UI COMPONENT ---

"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

// --- Props ---

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

// --- Component ---

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
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
        <textarea
          ref={ref}
          id={id}
          className={cn(
            "block w-full rounded-lg border px-3 py-3 text-base text-ink",
            "placeholder:text-muted",
            "transition-all duration-150",
            "focus:outline-none focus:border-ink focus:border-2 focus:px-[11px] focus:py-[11px]",
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

Textarea.displayName = "Textarea";
