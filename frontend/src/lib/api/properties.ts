// --- PROPERTIES — SERVER API ---

import { serverApi } from "./client";
import type {
  PaginatedResponse,
  PropertyListItem,
  PropertyFilterParams,
  PropertyDetail,
} from "@/types/property";

// --- Catalog ---
export async function getProperties(
  filters: PropertyFilterParams = {},
): Promise<PaginatedResponse<PropertyListItem>> {
  const params = new URLSearchParams();
  if (filters.locale) params.set("locale", filters.locale);
  if (filters.kind) params.set("kind", filters.kind);
  if (filters.page) params.set("page", filters.page.toString());
  if (filters.limit) params.set("limit", filters.limit.toString());
  if (filters.location_id) params.set("location_id", filters.location_id);
  if (filters.bedrooms) params.set("bedrooms", filters.bedrooms.toString());
  if (filters.guests) params.set("guests", filters.guests.toString());
  if (filters.min_price) params.set("min_price", filters.min_price.toString());
  if (filters.max_price) params.set("max_price", filters.max_price.toString());

  const query = params.toString();
  const url = `/properties${query ? `?${query}` : ""}`;
  return serverApi<PaginatedResponse<PropertyListItem>>(url);
}

// --- Detail ---
export async function getPropertyBySlug(
  slug: string,
  locale: string,
): Promise<PropertyDetail> {
  const url = `properties/${slug}?locale=${locale}`;
  return serverApi<PropertyDetail>(url);
}
