// --- LOCATION PILL — UI COMPONENT ---
import { MapPin } from "lucide-react";
import { cn } from "@/utils/cn";

interface LocationPillProps {
  name: string;
  className?: string;
}

export function LocationPill({ name, className }: LocationPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-surface-soft px-2.5 py-0.5 text-xs font-medium text-muted",
        className,
      )}
    >
      <MapPin className="h-3 w-3" />
      {name}
    </span>
  );
}
