// --- LOCATIONS — HOOKS (TanStack Query, admin client) ---

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { api } from "@/lib/api/client";
import type {
  Location,
  LocationCreate,
  LocationUpdate,
  MessageResponse,
  PaginatedResponse,
} from "../types";

// --- List locations ---

export function useLocations(page = 1, limit = 50) {
  return useQuery<PaginatedResponse<Location>>({
    queryKey: ["admin-locations", page, limit],
    queryFn: () => api.get(`/admin/locations?page=${page}&limit=${limit}`),
  });
}

// --- Create location ---

export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation<Location, Error, LocationCreate>({
    mutationFn: (body) => api.post("/admin/locations", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-locations"] });
      toast.success("Локация создана");
    },
    onError: () => toast.error("Не удалось создать локацию"),
  });
}

// --- Update location ---

export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation<Location, Error, { id: string; body: LocationUpdate }>({
    mutationFn: ({ id, body }) => api.patch(`/admin/locations/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-locations"] });
      toast.success("Локация обновлена");
    },
    onError: () => toast.error("Не удалось обновить локацию"),
  });
}

// --- Delete location ---

export function useDeleteLocation() {
  const queryClient = useQueryClient();

  return useMutation<MessageResponse, Error, string>({
    mutationFn: (id) => api.delete(`/admin/locations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-locations"] });
      toast.success("Локация удалена");
    },
    onError: () => toast.error("Не удалось удалить локацию"),
  });
}
