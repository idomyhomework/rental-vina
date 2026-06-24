// --- ADMIN CREATE PROPERTY — PAGE ---

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { PropertyForm, type PropertyFormData } from "@/features/admin/components/PropertyForm";
import { useCreateProperty } from "@/features/admin/hooks/useProperties";

// --- Page ---

export default function AdminCreatePropertyPage() {
  const router = useRouter();
  const createMutation = useCreateProperty();

  const handleSubmit = async (data: PropertyFormData) => {
    try {
      const property = await createMutation.mutateAsync({
        kind: data.kind,
        bedrooms: data.bedrooms,
        guests: data.guests,
        price_per_night: data.price_per_night,
        sale_price: data.sale_price,
        sale_price_discounted: data.sale_price_discounted,
        location_id: data.location_id || undefined,
        lat: data.lat,
        lng: data.lng,
        translations: data.translations,
        amenity_ids: data.amenity_ids,
      });

      // → redirect to edit page for image upload
      router.push(`/ru/admin/properties/${property.id}/edit`);
    } catch {
      // → toast fires from hook onError; stay on page so user can retry
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/ru/admin/properties"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:border-ink/40 hover:text-ink"
          aria-label="Назад к списку объектов"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h2 className="text-[22px] font-medium text-ink">Новый объект</h2>
      </div>

      <Card className="p-6">
        <PropertyForm
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
        />
      </Card>
    </div>
  );
}
