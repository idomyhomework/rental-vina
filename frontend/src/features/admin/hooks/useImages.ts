// --- PROPERTY IMAGES — HOOKS (TanStack Query, admin client) ---

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { api } from "@/lib/api/client";
import type { ImageReorder, MessageResponse, PropertyImage } from "../types";

// --- Upload images ---

export function useUploadImages(propertyId: string) {
  const queryClient = useQueryClient();

  return useMutation<PropertyImage[], Error, File[]>({
    mutationFn: (files) => {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      return api.upload(`/admin/properties/${propertyId}/images`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-properties", propertyId],
      });
      toast.success("Фото загружены");
    },
    onError: () => toast.error("Не удалось загрузить фото"),
  });
}

// --- Reorder images ---

export function useReorderImages(propertyId: string) {
  const queryClient = useQueryClient();

  return useMutation<PropertyImage[], Error, ImageReorder>({
    mutationFn: (body) =>
      api.patch(`/admin/properties/${propertyId}/images`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-properties", propertyId],
      });
      toast.success("Порядок обновлён");
    },
    onError: () => toast.error("Не удалось изменить порядок"),
  });
}

// --- Delete image ---

export function useDeleteImage(propertyId: string) {
  const queryClient = useQueryClient();

  return useMutation<MessageResponse, Error, string>({
    mutationFn: (imageId) =>
      api.delete(`/admin/properties/${propertyId}/images/${imageId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-properties", propertyId],
      });
      toast.success("Фото удалено");
    },
    onError: () => toast.error("Не удалось удалить фото"),
  });
}
