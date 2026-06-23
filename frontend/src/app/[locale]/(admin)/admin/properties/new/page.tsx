// --- ADMIN CREATE PROPERTY — PAGE ---

"use client";

import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { PropertyForm, type PropertyFormData } from "@/features/admin/components/PropertyForm";
import { useCreateProperty } from "@/features/admin/hooks/useProperties";

// --- Page ---

export default function AdminCreatePropertyPage() {
  const router = useRouter();
  const createMutation = useCreateProperty();

  const handleSubmit = async (data: PropertyFormData) => {
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
  };

  return (
    <div className="space-y-6">
      <h2 className="text-[22px] font-medium text-ink">Новый объект</h2>

      <Card className="p-6">
        <PropertyForm
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
        />
      </Card>
    </div>
  );
}
