// --- PROPERTY — PUBLIC TYPES ---

// --- Location ---
export interface LocationPublic {
  id: string;
  slug: string;
  name: string;
}

// --- Amenity ---
export interface AmenityPublic {
  id: string;
  icon: string | null;
  name: string;
}

// --- Image ---
export interface PropertyImage {
  id: string;
  url: string;
  position: number;
  is_main: boolean;
}

// --- Catalog item ---
export interface PropertyListItem {
  id: string;
  kind: "rental" | "sale";
  title: string | null;
  slug: string | null;
  description: string | null;
  bedrooms: number | null;
  guests: number | null;
  price_per_night: number | null;
  sale_price: number | null;
  sale_price_discounted: number | null;
  main_image_url: string | null; // → just one URL, not the full images array
  location: LocationPublic | null;
}

// --- Detail ---
export interface PropertyDetail {
  id: string;
  kind: "rental" | "sale";
  title: string | null;
  slug: string | null;
  description: string | null;
  bedrooms: number | null;
  guests: number | null;
  price_per_night: number | null;
  sale_price: number | null;
  sale_price_discounted: number | null;
  location: LocationPublic | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
  updated_at: string;
  meta_title: string | null;
  meta_description: string | null;
  images: PropertyImage[];
  amenities: AmenityPublic[];
}

// --- Pagination ---
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// --- Filters ---
export interface PropertyFilterParams {
  locale?: string;
  kind?: "rental" | "sale";
  page?: number;
  limit?: number;
  location_id?: string;
  bedrooms?: number;
  guests?: number;
  min_price?: number;
  max_price?: number;
}
