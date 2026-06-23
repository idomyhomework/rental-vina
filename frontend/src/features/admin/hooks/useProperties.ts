// --- PROPERTIES — HOOKS (TanStack Query, admin client) ---

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type {
  PaginatedResponse,
  Property,
  PropertyCreate,
  PropertyListParams,
  PropertyUpdate,
  MessageResponse,
} from "../types";

// --- List properties ---

export function useProperties(params: PropertyListParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.kind) searchParams.set("kind", params.kind);
  if (params.status) searchParams.set("status", params.status);

  const query = searchParams.toString();
  const path = `/admin/properties${query ? `?${query}` : ""}`;

  return useQuery<PaginatedResponse<Property>>({
    queryKey: ["admin-properties", params],
    queryFn: () => api.get(path),
  });
}

// --- Single property ---

export function useProperty(id: string) {
  return useQuery<Property>({
    queryKey: ["admin-properties", id],
    queryFn: () => api.get(`/admin/properties/${id}`),
    enabled: !!id,
  });
}

// --- Create property ---

export function useCreateProperty() {
  const queryClient = useQueryClient();

  return useMutation<Property, Error, PropertyCreate>({
    mutationFn: (body) => api.post("/admin/properties", body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] }),
  });
}

// --- Update property ---

export function useUpdateProperty(id: string) {
  const queryClient = useQueryClient();

  return useMutation<Property, Error, PropertyUpdate>({
    mutationFn: (body) => api.patch(`/admin/properties/${id}`, body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] }),
  });
}

// --- Delete property ---

export function useDeleteProperty() {
  const queryClient = useQueryClient();

  return useMutation<MessageResponse, Error, string>({
    mutationFn: (id) => api.delete(`/admin/properties/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] }),
  });
}
