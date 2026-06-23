// --- ADMIN LOCATIONS — PAGE ---

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
  useLocations,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
} from "@/features/admin/hooks/useLocations";
import type { Location } from "@/features/admin/types";

// --- Locale labels ---

const LOCALE_LABELS: Record<string, string> = {
  ru: "RU",
  es: "ES",
  en: "EN",
  ua: "UA",
};

// --- Validation ---

const locationSchema = z.object({
  slug: z
    .string()
    .min(1, "Обязательно")
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Только латиница, цифры и дефисы"),
  name_ru: z.string().min(1, "Обязательно"),
  name_es: z.string().optional().or(z.literal("")),
  name_en: z.string().optional().or(z.literal("")),
  name_uk: z.string().optional().or(z.literal("")),
});

type LocationFormData = z.infer<typeof locationSchema>;

// --- Helpers ---

function getName(location: Location) {
  const ru = location.translations.find((t) => t.locale === "ru");
  return ru?.name ?? location.translations[0]?.name ?? "—";
}

function toFormData(location: Location): LocationFormData {
  return {
    slug: location.slug,
    name_ru: location.translations.find((t) => t.locale === "ru")?.name ?? "",
    name_es: location.translations.find((t) => t.locale === "es")?.name ?? "",
    name_en: location.translations.find((t) => t.locale === "en")?.name ?? "",
    name_uk: location.translations.find((t) => t.locale === "ua")?.name ?? "",
  };
}

function toPayload(data: LocationFormData) {
  const translations: { locale: "ru" | "es" | "en" | "ua"; name: string }[] = [
    { locale: "ru", name: data.name_ru },
  ];
  if (data.name_es) translations.push({ locale: "es", name: data.name_es });
  if (data.name_en) translations.push({ locale: "en", name: data.name_en });
  if (data.name_uk) translations.push({ locale: "ua", name: data.name_uk });

  return { slug: data.slug, translations };
}

// --- Form fields (extracted to avoid re-creation during render) ---

function LocationFields({
  form,
}: {
  form: ReturnType<typeof useForm<LocationFormData>>;
}) {
  return (
    <div className="space-y-3">
      <Input
        id="slug"
        label="Slug (URL)"
        placeholder="vinaros-center"
        error={form.formState.errors.slug?.message}
        {...form.register("slug")}
      />
      {(["ru", "es", "en", "ua"] as const).map((locale) => (
        <Input
          key={locale}
          id={`name_${locale}`}
          label={`Название (${LOCALE_LABELS[locale]})`}
          error={
            form.formState.errors[
              `name_${locale}` as keyof LocationFormData
            ]?.message
          }
          {...form.register(`name_${locale}` as keyof LocationFormData)}
        />
      ))}
    </div>
  );
}

// --- Page ---

export default function AdminLocationsPage() {
  const [page, setPage] = useState(1);
  const [editLocation, setEditLocation] = useState<Location | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useLocations(page);
  const createMutation = useCreateLocation();
  const updateMutation = useUpdateLocation();
  const deleteMutation = useDeleteLocation();

  const locations = data?.items ?? [];
  const totalPages = data?.pages ?? 0;

  // --- Create form ---

  const createForm = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: { slug: "", name_ru: "", name_es: "", name_en: "", name_uk: "" },
  });

  const handleCreate = async (formData: LocationFormData) => {
    await createMutation.mutateAsync(toPayload(formData));
    createForm.reset();
    setShowCreate(false);
  };

  // --- Edit form ---

  const editForm = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
  });

  const openEdit = (location: Location) => {
    setEditLocation(location);
    editForm.reset(toFormData(location));
  };

  const handleEdit = async (formData: LocationFormData) => {
    if (!editLocation) return;
    await updateMutation.mutateAsync({
      id: editLocation.id,
      body: toPayload(formData),
    });
    setEditLocation(null);
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
        <h2 className="text-[22px] font-medium text-ink">Локации</h2>
        <Button onClick={() => setShowCreate(true)}>+ Добавить</Button>
      </div>

      {/* --- Table --- */}
      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted">Загрузка...</p>
      ) : locations.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">
          Локации не найдены
        </p>
      ) : (
        <>
          <Table>
            <Thead>
              <Tr>
                <Th>Slug</Th>
                <Th>Название</Th>
                <Th className="w-28">Действия</Th>
              </Tr>
            </Thead>
            <Tbody>
              {locations.map((location) => (
                <Tr key={location.id}>
                  <Td className="font-mono text-xs">{location.slug}</Td>
                  <Td className="font-medium">{getName(location)}</Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(location)}
                      >
                        Изм.
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteId(location.id)}
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
        title="Новая локация"
      >
        <form onSubmit={createForm.handleSubmit(handleCreate)}>
          <LocationFields form={createForm} />
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
        isOpen={editLocation !== null}
        onClose={() => setEditLocation(null)}
        title="Редактировать локацию"
      >
        <form onSubmit={editForm.handleSubmit(handleEdit)}>
          <LocationFields form={editForm} />
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setEditLocation(null)}>
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
        title="Удалить локацию?"
      >
        <p className="mb-4 text-sm text-muted">
          Объекты, привязанные к этой локации, потеряют привязку.
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
