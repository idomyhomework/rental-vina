// --- ADMIN — TYPES ---

// --- Enums ---

export type PropertyKind = "rental" | "sale";
export type PropertyStatus = "draft" | "published";
export type Locale = "ru" | "es" | "en" | "ua";

// --- Pagination ---

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// --- Location ---

export interface LocationTranslation {
  id: string;
  locale: Locale;
  name: string;
}

export interface Location {
  id: string;
  slug: string;
  translations: LocationTranslation[];
}

export interface LocationTranslationIn {
  locale: Locale;
  name: string;
}

export interface LocationCreate {
  slug: string;
  translations: LocationTranslationIn[];
}

export interface LocationUpdate {
  slug?: string;
  translations?: LocationTranslationIn[];
}

// --- Amenity ---

export interface AmenityTranslation {
  id: string;
  locale: Locale;
  name: string;
}

export interface Amenity {
  id: string;
  icon: string | null;
  translations: AmenityTranslation[];
}

export interface AmenityTranslationIn {
  locale: Locale;
  name: string;
}

export interface AmenityCreate {
  icon?: string;
  translations: AmenityTranslationIn[];
}

export interface AmenityUpdate {
  icon?: string;
  translations?: AmenityTranslationIn[];
}

// --- Property Image ---

export interface PropertyImage {
  id: string;
  url: string;
  public_id: string | null;
  position: number;
  is_main: boolean;
}

export interface ImageReorder {
  ordered_ids: string[];
  main_image_id?: string;
}

// --- Property Translation ---

export interface PropertyTranslation {
  id: string;
  locale: Locale;
  title: string;
  slug: string;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
}

export interface PropertyTranslationIn {
  locale: Locale;
  title: string;
  slug: string;
  description?: string;
  meta_title?: string;
  meta_description?: string;
}

// --- Property ---

export interface Property {
  id: string;
  kind: PropertyKind;
  status: PropertyStatus;
  bedrooms: number | null;
  guests: number | null;
  price_per_night: number | null;
  sale_price: number | null;
  sale_price_discounted: number | null;
  location_id: string | null;
  location: Location | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
  updated_at: string;
  translations: PropertyTranslation[];
  images: PropertyImage[];
  amenities: Amenity[];
}

export interface PropertyCreate {
  kind: PropertyKind;
  bedrooms?: number;
  guests?: number;
  price_per_night?: number;
  sale_price?: number;
  sale_price_discounted?: number;
  location_id?: string;
  lat?: number;
  lng?: number;
  translations: PropertyTranslationIn[];
  amenity_ids?: string[];
}

export interface PropertyUpdate {
  kind?: PropertyKind;
  status?: PropertyStatus;
  bedrooms?: number | null;
  guests?: number | null;
  price_per_night?: number | null;
  sale_price?: number | null;
  sale_price_discounted?: number | null;
  location_id?: string | null;
  lat?: number | null;
  lng?: number | null;
  translations?: PropertyTranslationIn[];
  amenity_ids?: string[];
}

// --- Filters ---

export interface PropertyListParams {
  page?: number;
  limit?: number;
  kind?: PropertyKind;
  status?: PropertyStatus;
}

// --- Message response ---

export interface MessageResponse {
  message: string;
}
