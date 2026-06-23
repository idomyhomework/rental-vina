// --- AMENITIES — HOOKS (TanStack Query, admin client) ---

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type {
  Amenity,
  AmenityCreate,
  AmenityUpdate,
  MessageResponse,
  PaginatedResponse,
} from "../types";

// --- List amenities ---

export function useAmenities(page = 1, limit = 50) {
  return useQuery<PaginatedResponse<Amenity>>({
    queryKey: ["admin-amenities", page, limit],
    queryFn: () => api.get(`/admin/amenities?page=${page}&limit=${limit}`),
  });
}

// --- Create amenity ---

export function useCreateAmenity() {
  const queryClient = useQueryClient();

  return useMutation<Amenity, Error, AmenityCreate>({
    mutationFn: (body) => api.post("/admin/amenities", body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-amenities"] }),
  });
}

// --- Update amenity ---

export function useUpdateAmenity() {
  const queryClient = useQueryClient();

  return useMutation<Amenity, Error, { id: string; body: AmenityUpdate }>({
    mutationFn: ({ id, body }) => api.patch(`/admin/amenities/${id}`, body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-amenities"] }),
  });
}

// --- Delete amenity ---

export function useDeleteAmenity() {
  const queryClient = useQueryClient();

  return useMutation<MessageResponse, Error, string>({
    mutationFn: (id) => api.delete(`/admin/amenities/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-amenities"] }),
  });
}
