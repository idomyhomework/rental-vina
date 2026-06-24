// --- ADMIN EDIT PROPERTY — PAGE ---

"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
    try {
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
    } catch {
      // → toast fires from hook onError
    }
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
      <div className="flex items-center gap-3">
        <Link
          href="/ru/admin/properties"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:border-ink/40 hover:text-ink"
          aria-label="Назад к списку объектов"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h2 className="text-[22px] font-medium text-ink">
          Редактировать объект
        </h2>
      </div>

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
