// --- ADMIN EDIT PROPERTY — PAGE ---

"use client";

import { use } from "react";

import { Card } from "@/components/ui/Card";
import { PropertyForm, type PropertyFormData } from "@/features/admin/components/PropertyForm";
import { ImageUploader } from "@/features/admin/components/ImageUploader";
import { useProperty, useUpdateProperty } from "@/features/admin/hooks/useProperties";

// --- Props ---

interface EditPropertyPageProps {
  params: Promise<{ id: string }>;
}

// --- Page ---

export default function AdminEditPropertyPage({ params }: EditPropertyPageProps) {
  const { id } = use(params);
  const { data: property, isLoading } = useProperty(id);
  const updateMutation = useUpdateProperty(id);

  const handleSubmit = async (data: PropertyFormData) => {
    await updateMutation.mutateAsync({
      kind: data.kind,
      status: data.status,
      bedrooms: data.bedrooms ?? null,
      guests: data.guests ?? null,
      price_per_night: data.price_per_night ?? null,
      sale_price: data.sale_price ?? null,
      sale_price_discounted: data.sale_price_discounted ?? null,
      location_id: data.location_id || null,
      lat: data.lat ?? null,
      lng: data.lng ?? null,
      translations: data.translations,
      amenity_ids: data.amenity_ids,
    });
  };

  if (isLoading) {
    return (
      <p className="py-12 text-center text-sm text-muted">Загрузка...</p>
    );
  }

  if (!property) {
    return (
      <p className="py-12 text-center text-sm text-muted">
        Объект не найден
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-[22px] font-medium text-ink">
        Редактировать объект
      </h2>

      <Card className="p-6">
        <PropertyForm
          defaultValues={property}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
          showStatus
        />
      </Card>

      <Card className="p-6">
        <ImageUploader propertyId={id} images={property.images} />
      </Card>
    </div>
  );
}
