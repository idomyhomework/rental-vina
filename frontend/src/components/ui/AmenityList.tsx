// --- AMENITY LIST — UI COMPONENT
import { Check } from "lucide-react";
import type { AmenityPublic } from "@/types/property";

interface AmenityListProps {
  amenities: AmenityPublic[];
}

export function AmenityList({ amenities }: AmenityListProps) {
  if (amenities.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-col">
      {amenities.map((amenity) => (
        <li
          key={amenity.id}
          className="flex items-center gap-3 py-3 text-base text-ink"
        >
          <Check className="h-5 w-5 text-sea" />
          {amenity.name}
        </li>
      ))}
    </ul>
  );
}
