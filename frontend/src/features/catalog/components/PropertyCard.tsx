// --- PROPERTY CARD — CATALOG (Server Component) ---

import type { PropertyListItem } from "@/types/property";
import Link from "next/link";
import Image from "next/image";
import { BedDouble, Users } from "lucide-react";
import { LocationPill } from "@/components/ui/LocationPill";
import { PriceBadge } from "@/components/ui/PriceBadge";

interface PropertyCardProps {
  property: PropertyListItem;
  locale: string;
}

export function PropertyCard({ property, locale }: PropertyCardProps) {
  return (
    <Link href={`/${locale}/catalog/${property.slug}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-surface-soft">
        {/* --- Photo --- */}
        <Image
          src={property.main_image_url ?? ""}
          alt={property.title ?? ""}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      </div>
      {/* --- Meta --- */}
      <div className="mt-3 flex flex-col gap-1.5">
        <h3 className="text-base font-semibold text-ink">{property.title}</h3>
        {property.location && <LocationPill name={property.location.name} />}
        {/* → bed / guest icons in muted body-sm */}
        <div className="flex items-center gap-4 text-sm text-muted">
          {property.bedrooms !== null && (
            <span className="flex items-center gap-1">
              <BedDouble className="h-4 w-4" />
              {property.bedrooms}
            </span>
          )}
          {property.guests !== null && (
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {property.guests}
            </span>
          )}
        </div>

        <PriceBadge pricePerNight={property.price_per_night} />
      </div>
    </Link>
  );
}
