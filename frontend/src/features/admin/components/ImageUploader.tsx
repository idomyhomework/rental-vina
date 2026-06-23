// --- IMAGE UPLOADER — ADMIN FEATURE ---

"use client";

import { useCallback, useRef, useState } from "react";
import { Star, X } from "lucide-react";

import { useUploadImages, useReorderImages, useDeleteImage } from "../hooks/useImages";
import type { PropertyImage } from "../types";

// --- Constants ---

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// --- Props ---

interface ImageUploaderProps {
  propertyId: string;
  images: PropertyImage[];
}

// --- Component ---

export function ImageUploader({ propertyId, images }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadMutation = useUploadImages(propertyId);
  const reorderMutation = useReorderImages(propertyId);
  const deleteMutation = useDeleteImage(propertyId);

  // --- File validation ---

  const validateFiles = (files: File[]): File[] => {
    const valid: File[] = [];
    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(`${file.name}: неподдерживаемый формат`);
        return [];
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`${file.name}: файл слишком большой (макс. 10 МБ)`);
        return [];
      }
      valid.push(file);
    }
    return valid;
  };

  // --- Upload handler ---

  const handleUpload = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return;
      setError(null);

      const validated = validateFiles(Array.from(files));
      if (validated.length === 0) return;

      uploadMutation.mutate(validated);
    },
    [uploadMutation],
  );

  // --- Drag & drop ---

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleUpload(e.dataTransfer.files);
    },
    [handleUpload],
  );

  // --- Reorder ---

  const moveImage = useCallback(
    (index: number, direction: -1 | 1) => {
      const sorted = [...images].sort((a, b) => a.position - b.position);
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= sorted.length) return;

      const reordered = [...sorted];
      [reordered[index], reordered[newIndex]] = [
        reordered[newIndex],
        reordered[index],
      ];

      reorderMutation.mutate({
        ordered_ids: reordered.map((img) => img.id),
        main_image_id: reordered.find((img) => img.is_main)?.id,
      });
    },
    [images, reorderMutation],
  );

  // --- Set main ---

  const setMainImage = useCallback(
    (imageId: string) => {
      const sorted = [...images].sort((a, b) => a.position - b.position);
      reorderMutation.mutate({
        ordered_ids: sorted.map((img) => img.id),
        main_image_id: imageId,
      });
    },
    [images, reorderMutation],
  );

  const sorted = [...images].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted">Фотографии</h3>

      {/* --- Drop zone --- */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-card border-2 border-dashed p-8 text-center transition-colors ${
          dragOver
            ? "border-sea bg-sea/5"
            : "border-hairline hover:border-ink/40"
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        aria-label="Загрузить фотографии"
      >
        <p className="text-sm text-muted">
          {uploadMutation.isPending
            ? "Загрузка..."
            : "Перетащите фото сюда или нажмите для выбора"}
        </p>
        <p className="mt-1 text-xs text-muted">
          JPEG, PNG, WebP, AVIF — до 10 МБ
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>

      {error && (
        <p className="text-sm text-coral" role="alert">
          {error}
        </p>
      )}

      {/* --- Image grid --- */}
      {sorted.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {sorted.map((image, index) => (
            <div
              key={image.id}
              className="group relative overflow-hidden rounded-lg border border-hairline"
            >
              <img
                src={image.url}
                alt={`Фото ${index + 1}`}
                className="aspect-[4/3] w-full object-cover"
              />

              {/* --- Main badge --- */}
              {image.is_main && (
                <span className="absolute left-2 top-2 rounded-full bg-sea px-2 py-0.5 text-xs font-medium text-white">
                  Главное
                </span>
              )}

              {/* --- Position number --- */}
              <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-xs font-medium text-white">
                {index + 1}
              </span>

              {/* --- Actions overlay --- */}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveImage(index, -1)}
                    disabled={index === 0}
                    className="rounded bg-white/80 px-1.5 py-0.5 text-xs disabled:opacity-30"
                    aria-label="Переместить влево"
                  >
                    &larr;
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(index, 1)}
                    disabled={index === sorted.length - 1}
                    className="rounded bg-white/80 px-1.5 py-0.5 text-xs disabled:opacity-30"
                    aria-label="Переместить вправо"
                  >
                    &rarr;
                  </button>
                  {!image.is_main && (
                    <button
                      type="button"
                      onClick={() => setMainImage(image.id)}
                      className="rounded bg-white/80 px-1.5 py-0.5 text-xs text-sea"
                      aria-label="Сделать главным"
                    >
                      <Star className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(image.id)}
                  className="rounded bg-coral/80 px-1.5 py-0.5 text-xs text-white hover:bg-coral"
                  aria-label="Удалить фото"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
