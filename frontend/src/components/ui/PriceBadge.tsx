// --- PRICE BADGE — UI COMPONENT
import { cn } from "@/utils/cn";

interface PriceBadgeProps {
  pricePerNight: number | null;
  className?: string;
}

export function PriceBadge({ pricePerNight, className }: PriceBadgeProps) {
  if (pricePerNight === null) {
    return (
      <span className={cn("text-sm text-muted", className)}>
        Цена по запросу
      </span>
    );
  } else {
    return (
      <span className={cn("text-sm text-ink", className)}>
        <span className="font-semibold">{pricePerNight}€</span>
        <span className="text-muted"> / ночь</span>
      </span>
    );
  }
}
