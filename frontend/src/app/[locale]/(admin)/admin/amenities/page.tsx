// --- ADMIN AMENITIES — PAGE ---

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import {
  useAmenities,
  useCreateAmenity,
  useUpdateAmenity,
  useDeleteAmenity,
} from "@/features/admin/hooks/useAmenities";
import type { Amenity } from "@/features/admin/types";

// --- Locale labels ---

const LOCALE_LABELS: Record<string, string> = {
  ru: "RU",
  es: "ES",
  en: "EN",
  ua: "UA",
};

// --- Validation ---

const amenitySchema = z.object({
  icon: z.string().max(100).optional().or(z.literal("")),
  name_ru: z.string().min(1, "Обязательно"),
  name_es: z.string().optional().or(z.literal("")),
  name_en: z.string().optional().or(z.literal("")),
  name_uk: z.string().optional().or(z.literal("")),
});

type AmenityFormData = z.infer<typeof amenitySchema>;

// --- Helpers ---

function getName(amenity: Amenity) {
  const ru = amenity.translations.find((t) => t.locale === "ru");
  return ru?.name ?? amenity.translations[0]?.name ?? "—";
}

function toFormData(amenity: Amenity): AmenityFormData {
  return {
    icon: amenity.icon ?? "",
    name_ru: amenity.translations.find((t) => t.locale === "ru")?.name ?? "",
    name_es: amenity.translations.find((t) => t.locale === "es")?.name ?? "",
    name_en: amenity.translations.find((t) => t.locale === "en")?.name ?? "",
    name_uk: amenity.translations.find((t) => t.locale === "ua")?.name ?? "",
  };
}

function toPayload(data: AmenityFormData) {
  const translations: { locale: "ru" | "es" | "en" | "ua"; name: string }[] = [
    { locale: "ru", name: data.name_ru },
  ];
  if (data.name_es) translations.push({ locale: "es", name: data.name_es });
  if (data.name_en) translations.push({ locale: "en", name: data.name_en });
  if (data.name_uk) translations.push({ locale: "ua", name: data.name_uk });

  return {
    icon: data.icon || undefined,
    translations,
  };
}

// --- Form fields (extracted to avoid re-creation during render) ---

function AmenityFields({
  form,
}: {
  form: ReturnType<typeof useForm<AmenityFormData>>;
}) {
  return (
    <div className="space-y-3">
      <Input
        id="icon"
        label="Иконка (код)"
        placeholder="wifi"
        error={form.formState.errors.icon?.message}
        {...form.register("icon")}
      />
      {(["ru", "es", "en", "ua"] as const).map((locale) => (
        <Input
          key={locale}
          id={`name_${locale}`}
          label={`Название (${LOCALE_LABELS[locale]})`}
          required={locale === "ru"}
          error={
            form.formState.errors[
              `name_${locale}` as keyof AmenityFormData
            ]?.message
          }
          {...form.register(`name_${locale}` as keyof AmenityFormData)}
        />
      ))}
    </div>
  );
}

// --- Page ---

export default function AdminAmenitiesPage() {
  const [page, setPage] = useState(1);
  const [editAmenity, setEditAmenity] = useState<Amenity | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useAmenities(page);
  const createMutation = useCreateAmenity();
  const updateMutation = useUpdateAmenity();
  const deleteMutation = useDeleteAmenity();

  const amenities = data?.items ?? [];
  const totalPages = data?.pages ?? 0;

  // --- Create form ---

  const createForm = useForm<AmenityFormData>({
    resolver: zodResolver(amenitySchema),
    defaultValues: { icon: "", name_ru: "", name_es: "", name_en: "", name_uk: "" },
  });

  const handleCreate = async (formData: AmenityFormData) => {
    await createMutation.mutateAsync(toPayload(formData));
    createForm.reset();
    setShowCreate(false);
  };

  // --- Edit form ---

  const editForm = useForm<AmenityFormData>({
    resolver: zodResolver(amenitySchema),
  });

  const openEdit = (amenity: Amenity) => {
    setEditAmenity(amenity);
    editForm.reset(toFormData(amenity));
  };

  const handleEdit = async (formData: AmenityFormData) => {
    if (!editAmenity) return;
    await updateMutation.mutateAsync({
      id: editAmenity.id,
      body: toPayload(formData),
    });
    setEditAmenity(null);
  };

  // --- Delete ---

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSuccess: () => setDeleteId(null),
    });
  };

  return (
    <div className="space-y-6">
      {/* --- Header --- */}
      <div className="flex items-center justify-between">
        <h2 className="text-[22px] font-medium text-ink">Удобства</h2>
        <Button onClick={() => setShowCreate(true)}>+ Добавить</Button>
      </div>

      {/* --- Table --- */}
      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted">Загрузка...</p>
      ) : amenities.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">
          Удобства не найдены
        </p>
      ) : (
        <>
          <Table>
            <Thead>
              <Tr>
                <Th className="w-16">Иконка</Th>
                <Th>Название</Th>
                <Th className="w-28">Действия</Th>
              </Tr>
            </Thead>
            <Tbody>
              {amenities.map((amenity) => (
                <Tr key={amenity.id}>
                  <Td>{amenity.icon ?? "—"}</Td>
                  <Td className="font-medium">{getName(amenity)}</Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(amenity)}
                      >
                        Изм.
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteId(amenity.id)}
                      >
                        Уд.
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      {/* --- Create modal --- */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Новое удобство"
      >
        <form onSubmit={createForm.handleSubmit(handleCreate)}>
          <AmenityFields form={createForm} />
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Отмена
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Создать
            </Button>
          </div>
        </form>
      </Modal>

      {/* --- Edit modal --- */}
      <Modal
        isOpen={editAmenity !== null}
        onClose={() => setEditAmenity(null)}
        title="Редактировать удобство"
      >
        <form onSubmit={editForm.handleSubmit(handleEdit)}>
          <AmenityFields form={editForm} />
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setEditAmenity(null)}>
              Отмена
            </Button>
            <Button type="submit" isLoading={updateMutation.isPending}>
              Сохранить
            </Button>
          </div>
        </form>
      </Modal>

      {/* --- Delete confirmation --- */}
      <Modal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Удалить удобство?"
      >
        <p className="mb-4 text-sm text-muted">
          Удобство будет удалено из всех объектов.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>
            Отмена
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            isLoading={deleteMutation.isPending}
          >
            Удалить
          </Button>
        </div>
      </Modal>
    </div>
  );
}
