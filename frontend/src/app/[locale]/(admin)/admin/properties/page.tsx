// --- ADMIN PROPERTIES LIST — PAGE ---

"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { useProperties, useDeleteProperty } from "@/features/admin/hooks/useProperties";
import type { Property, PropertyKind, PropertyStatus } from "@/features/admin/types";

// --- Helpers ---

function getTitle(property: Property) {
  const ru = property.translations.find((t) => t.locale === "ru");
  return ru?.title ?? property.translations[0]?.title ?? "—";
}

function getLocationName(property: Property) {
  if (!property.location) return "—";
  const ru = property.location.translations.find((t) => t.locale === "ru");
  return ru?.name ?? property.location.slug;
}

function getPrice(property: Property) {
  if (property.kind === "rental" && property.price_per_night != null) {
    return `${property.price_per_night} €/ночь`;
  }
  if (property.kind === "sale" && property.sale_price != null) {
    return `${property.sale_price.toLocaleString("ru")} €`;
  }
  return "—";
}

function getMainImage(property: Property) {
  const main = property.images.find((img) => img.is_main);
  return main?.url ?? property.images[0]?.url;
}

// --- Page ---

export default function AdminPropertiesPage() {
  const [page, setPage] = useState(1);
  const [kindFilter, setKindFilter] = useState<PropertyKind | "">("");
  const [statusFilter, setStatusFilter] = useState<PropertyStatus | "">("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useProperties({
    page,
    limit: 20,
    kind: kindFilter || undefined,
    status: statusFilter || undefined,
  });

  const deleteMutation = useDeleteProperty();

  const properties = data?.items ?? [];
  const totalPages = data?.pages ?? 0;

  // --- Delete handler ---

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
        <h2 className="text-[22px] font-medium text-ink">Объекты</h2>
        <Link href="/ru/admin/properties/new">
          <Button>+ Добавить</Button>
        </Link>
      </div>

      {/* --- Filters --- */}
      <div className="flex flex-wrap gap-3">
        <div className="w-40">
          <Select
            id="kind-filter"
            value={kindFilter}
            onChange={(e) => {
              setKindFilter(e.target.value as PropertyKind | "");
              setPage(1);
            }}
          >
            <option value="">Все типы</option>
            <option value="rental">Аренда</option>
            <option value="sale">Продажа</option>
          </Select>
        </div>
        <div className="w-40">
          <Select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as PropertyStatus | "");
              setPage(1);
            }}
          >
            <option value="">Все статусы</option>
            <option value="draft">Черновик</option>
            <option value="published">Опубликован</option>
          </Select>
        </div>
      </div>

      {/* --- Table --- */}
      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted">Загрузка...</p>
      ) : properties.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">
          Объекты не найдены
        </p>
      ) : (
        <>
          <Table>
            <Thead>
              <Tr>
                <Th className="w-16">Фото</Th>
                <Th>Название</Th>
                <Th>Тип</Th>
                <Th>Статус</Th>
                <Th>Локация</Th>
                <Th>Цена</Th>
                <Th className="w-28">Действия</Th>
              </Tr>
            </Thead>
            <Tbody>
              {properties.map((property) => (
                <Tr key={property.id}>
                  <Td>
                    {getMainImage(property) ? (
                      <img
                        src={getMainImage(property)}
                        alt=""
                        className="h-10 w-14 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-14 items-center justify-center rounded bg-surface-soft text-xs text-muted">
                        —
                      </div>
                    )}
                  </Td>
                  <Td className="font-medium">{getTitle(property)}</Td>
                  <Td>
                    <Badge variant={property.kind === "rental" ? "default" : "success"}>
                      {property.kind === "rental" ? "Аренда" : "Продажа"}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge
                      variant={
                        property.status === "published" ? "success" : "warning"
                      }
                    >
                      {property.status === "published"
                        ? "Опубликован"
                        : "Черновик"}
                    </Badge>
                  </Td>
                  <Td>{getLocationName(property)}</Td>
                  <Td>{getPrice(property)}</Td>
                  <Td>
                    <div className="flex gap-2">
                      <Link href={`/ru/admin/properties/${property.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          Изм.
                        </Button>
                      </Link>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteId(property.id)}
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

      {/* --- Delete confirmation --- */}
      <Modal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Удалить объект?"
      >
        <p className="mb-4 text-sm text-muted">
          Это действие необратимо. Все фотографии и переводы будут удалены.
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
