// --- PROPERTY FORM — ADMIN FEATURE ---

"use client";

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/Tabs";
import { slugify } from "@/utils/slugify";
import { useLocations } from "../hooks/useLocations";
import { useAmenities } from "../hooks/useAmenities";
import type { Property, PropertyKind } from "../types";

// --- Locale labels ---

const LOCALE_LABELS: Record<string, string> = {
  ru: "Русский",
  es: "Español",
  en: "English",
  ua: "Українська",
};

const LOCALES = ["ru", "es", "en", "ua"] as const;

// --- Validation schema ---

const translationSchema = z.object({
  locale: z.enum(["ru", "es", "en", "ua"]),
  title: z.string().min(1, "Заголовок обязателен").max(300),
  slug: z
    .string()
    .max(300)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Только латиница, цифры и дефисы"),
  description: z.string().max(50_000).optional().or(z.literal("")),
  meta_title: z.string().max(200).optional().or(z.literal("")),
  meta_description: z.string().max(500).optional().or(z.literal("")),
});

const propertyFormSchema = z.object({
  kind: z.enum(["rental", "sale"]),
  status: z.enum(["draft", "published"]).optional(),
  bedrooms: z.coerce.number().int().min(0).max(100).optional(),
  guests: z.coerce.number().int().min(1).max(500).optional(),
  price_per_night: z.coerce.number().min(0).optional(),
  sale_price: z.coerce.number().int().min(0).optional(),
  sale_price_discounted: z.coerce.number().int().min(0).optional(),
  location_id: z.string().optional().or(z.literal("")),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  translations: z.array(translationSchema).min(1, "Хотя бы один перевод"),
  amenity_ids: z.array(z.string()).optional(),
});

export type PropertyFormData = z.infer<typeof propertyFormSchema>;

// --- Props ---

interface PropertyFormProps {
  defaultValues?: Property;
  onSubmit: (data: PropertyFormData) => Promise<void>;
  isSubmitting: boolean;
  showStatus?: boolean;
}

// --- Component ---

export function PropertyForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  showStatus = false,
}: PropertyFormProps) {
  const { data: locationsData } = useLocations();
  const { data: amenitiesData } = useAmenities();

  const locations = locationsData?.items ?? [];
  const amenities = amenitiesData?.items ?? [];

  // --- Form setup ---

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PropertyFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(propertyFormSchema) as any,
    defaultValues: defaultValues
      ? {
          kind: defaultValues.kind,
          status: defaultValues.status,
          bedrooms: defaultValues.bedrooms ?? undefined,
          guests: defaultValues.guests ?? undefined,
          price_per_night: defaultValues.price_per_night ?? undefined,
          sale_price: defaultValues.sale_price ?? undefined,
          sale_price_discounted:
            defaultValues.sale_price_discounted ?? undefined,
          location_id: defaultValues.location_id ?? "",
          lat: defaultValues.lat ?? undefined,
          lng: defaultValues.lng ?? undefined,
          translations: defaultValues.translations.map((t) => ({
            locale: t.locale,
            title: t.title,
            slug: t.slug,
            description: t.description ?? "",
            meta_title: t.meta_title ?? "",
            meta_description: t.meta_description ?? "",
          })),
          amenity_ids: defaultValues.amenities.map((a) => a.id),
        }
      : {
          kind: "rental" as PropertyKind,
          translations: [
            {
              locale: "ru" as const,
              title: "",
              slug: "",
              description: "",
              meta_title: "",
              meta_description: "",
            },
          ],
          amenity_ids: [],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "translations",
  });

  const kind = watch("kind");

  // --- Auto-slug from title ---

  const watchedTranslations = watch("translations");

  useEffect(() => {
    watchedTranslations.forEach((t, index) => {
      if (t.title && !defaultValues) {
        const generatedSlug = slugify(t.title);
        const currentSlug = watchedTranslations[index].slug;
        if (!currentSlug || currentSlug === slugify(t.title.slice(0, -1))) {
          setValue(`translations.${index}.slug`, generatedSlug);
        }
      }
    });
  }, [watchedTranslations, setValue, defaultValues]);

  // --- Add locale tab ---

  const usedLocales = fields.map((f) => f.locale);
  const availableLocales = LOCALES.filter((l) => !usedLocales.includes(l));

  const addLocale = (locale: string) => {
    append({
      locale: locale as (typeof LOCALES)[number],
      title: "",
      slug: "",
      description: "",
      meta_title: "",
      meta_description: "",
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* --- Basic fields --- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Select id="kind" label="Тип" error={errors.kind?.message} {...register("kind")}>
          <option value="rental">Аренда</option>
          <option value="sale">Продажа</option>
        </Select>

        {showStatus && (
          <Select
            id="status"
            label="Статус"
            error={errors.status?.message}
            {...register("status")}
          >
            <option value="draft">Черновик</option>
            <option value="published">Опубликован</option>
          </Select>
        )}

        <Input
          id="bedrooms"
          type="number"
          label="Спален"
          error={errors.bedrooms?.message}
          {...register("bedrooms")}
        />

        <Input
          id="guests"
          type="number"
          label="Гостей"
          error={errors.guests?.message}
          {...register("guests")}
        />

        {kind === "rental" && (
          <Input
            id="price_per_night"
            type="number"
            step="0.01"
            label="Цена за ночь (€)"
            error={errors.price_per_night?.message}
            {...register("price_per_night")}
          />
        )}

        {kind === "sale" && (
          <>
            <Input
              id="sale_price"
              type="number"
              label="Цена продажи (€)"
              error={errors.sale_price?.message}
              {...register("sale_price")}
            />
            <Input
              id="sale_price_discounted"
              type="number"
              label="Цена со скидкой (€)"
              error={errors.sale_price_discounted?.message}
              {...register("sale_price_discounted")}
            />
          </>
        )}

        <Select
          id="location_id"
          label="Локация"
          error={errors.location_id?.message}
          {...register("location_id")}
        >
          <option value="">— Не выбрана —</option>
          {locations.map((loc) => {
            const name =
              loc.translations.find((t) => t.locale === "ru")?.name ??
              loc.slug;
            return (
              <option key={loc.id} value={loc.id}>
                {name}
              </option>
            );
          })}
        </Select>

        <Input
          id="lat"
          type="number"
          step="any"
          label="Широта"
          error={errors.lat?.message}
          {...register("lat")}
        />

        <Input
          id="lng"
          type="number"
          step="any"
          label="Долгота"
          error={errors.lng?.message}
          {...register("lng")}
        />
      </div>

      {/* --- Amenities --- */}
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-muted">
          Удобства
        </legend>
        <div className="flex flex-wrap gap-3">
          {amenities.map((amenity) => {
            const name =
              amenity.translations.find((t) => t.locale === "ru")?.name ??
              amenity.icon ??
              amenity.id;
            return (
              <label
                key={amenity.id}
                className="flex items-center gap-2 text-sm text-ink"
              >
                <input
                  type="checkbox"
                  value={amenity.id}
                  className="rounded border-hairline text-sea focus:ring-sea"
                  {...register("amenity_ids")}
                />
                {amenity.icon && (
                  <span className="text-muted">{amenity.icon}</span>
                )}
                {name}
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* --- Translations (tabbed) --- */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted">Переводы</h3>
          {availableLocales.length > 0 && (
            <select
              className="rounded border border-hairline px-2 py-1 text-xs text-muted"
              value=""
              onChange={(e) => {
                if (e.target.value) addLocale(e.target.value);
                e.target.value = "";
              }}
              aria-label="Добавить язык"
            >
              <option value="">+ Добавить язык</option>
              {availableLocales.map((l) => (
                <option key={l} value={l}>
                  {LOCALE_LABELS[l]}
                </option>
              ))}
            </select>
          )}
        </div>

        {errors.translations?.message && (
          <p className="mb-2 text-sm text-coral" role="alert">
            {errors.translations.message}
          </p>
        )}

        {fields.length > 0 && (
          <Tabs defaultTab={fields[0].locale}>
            <TabList>
              {fields.map((field, index) => (
                <Tab key={field.id} id={field.locale}>
                  {LOCALE_LABELS[field.locale]}
                  {fields.length > 1 && (
                    <button
                      type="button"
                      className="ml-1.5 text-muted hover:text-coral"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(index);
                      }}
                      aria-label={`Удалить ${LOCALE_LABELS[field.locale]}`}
                    >
                      &times;
                    </button>
                  )}
                </Tab>
              ))}
            </TabList>

            {fields.map((field, index) => (
              <TabPanel key={field.id} id={field.locale}>
                <input
                  type="hidden"
                  {...register(`translations.${index}.locale`)}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    id={`title-${field.locale}`}
                    label="Заголовок"
                    error={errors.translations?.[index]?.title?.message}
                    {...register(`translations.${index}.title`)}
                  />
                  <Input
                    id={`slug-${field.locale}`}
                    label="URL-slug"
                    error={errors.translations?.[index]?.slug?.message}
                    {...register(`translations.${index}.slug`)}
                  />
                </div>

                <Textarea
                  id={`description-${field.locale}`}
                  label="Описание"
                  rows={6}
                  error={errors.translations?.[index]?.description?.message}
                  {...register(`translations.${index}.description`)}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    id={`meta_title-${field.locale}`}
                    label="SEO Title"
                    error={errors.translations?.[index]?.meta_title?.message}
                    {...register(`translations.${index}.meta_title`)}
                  />
                  <Input
                    id={`meta_description-${field.locale}`}
                    label="SEO Description"
                    error={
                      errors.translations?.[index]?.meta_description?.message
                    }
                    {...register(`translations.${index}.meta_description`)}
                  />
                </div>
              </TabPanel>
            ))}
          </Tabs>
        )}
      </div>

      {/* --- Submit --- */}
      <div className="flex justify-end gap-3 border-t border-hairline pt-4">
        <Button type="submit" isLoading={isSubmitting}>
          {defaultValues ? "Сохранить" : "Создать"}
        </Button>
      </div>
    </form>
  );
}
