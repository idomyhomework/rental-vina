// --- CARD — UI COMPONENT ---

import { cn } from "@/utils/cn";

// --- Props ---

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

// --- Components ---

// → Airbnb: 14px radius, 1px hairline border, single shadow tier on hover
export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-hairline bg-white p-6",
        "shadow-card transition-shadow duration-200",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return <div className={cn("mb-4", className)}>{children}</div>;
}

export function CardTitle({ children, className }: CardProps) {
  return (
    <h3 className={cn("text-lg font-semibold text-ink", className)}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className }: CardProps) {
  return <div className={cn(className)}>{children}</div>;
}
