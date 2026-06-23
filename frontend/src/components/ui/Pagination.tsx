// --- PAGINATION — UI COMPONENT ---

"use client";

import { cn } from "@/utils/cn";

// --- Props ---

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// --- Component ---

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  // → show at most 5 page buttons centered around current page
  const getPageNumbers = (): number[] => {
    const pages: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    const adjustedStart = Math.max(1, end - 4);

    for (let i = adjustedStart; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav
      aria-label="Навигация по страницам"
      className="flex items-center justify-center gap-1 pt-4"
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={cn(
          "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "hover:bg-surface-soft text-muted",
        )}
        aria-label="Предыдущая страница"
      >
        &larr;
      </button>

      {pageNumbers.map((num) => (
        <button
          key={num}
          type="button"
          onClick={() => onPageChange(num)}
          className={cn(
            "min-w-[36px] rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            num === page
              ? "bg-ink text-white"
              : "text-muted hover:bg-surface-soft",
          )}
          aria-current={num === page ? "page" : undefined}
        >
          {num}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={cn(
          "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "hover:bg-surface-soft text-muted",
        )}
        aria-label="Следующая страница"
      >
        &rarr;
      </button>
    </nav>
  );
}
