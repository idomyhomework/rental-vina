# PLAN.md — Frontend Implementation Plan

Maps each ROADMAP step to concrete frontend tasks. Check off items as they're completed.

---

## Key Concepts for a Next.js Beginner

| Concept | What it means |
|---|---|
| **App Router** | Files inside `src/app/` become URL routes automatically. `src/app/about/page.tsx` = `/about` |
| **Server Component** | Default in Next.js. Runs on the server, can `await fetch()`, good for SEO. Cannot use `useState`, `onClick`, etc. |
| **Client Component** | Add `"use client"` at top. Runs in browser. Needed for interactivity (forms, buttons, state). |
| **Layout** | `layout.tsx` wraps all pages in its folder. Root layout wraps the entire app. |
| **`[param]`** | Dynamic route segment. `[locale]` in the folder name means the URL locale (es, ru, en, uk) is passed as a param. |
| **`(group)`** | Route group — organizes files without affecting the URL. `(public)` and `(admin)` share the layout but keep code separate. |
| **Middleware** | `middleware.ts` runs before every request. We use it for locale detection + admin auth guard. |

---

## Phase F1 — Project Setup & Foundations (ROADMAP 1.1)

**Goal:** Install all dependencies, configure tools, create the folder structure.

- [x] Install core dependencies:
  - `pnpm add next-intl @tanstack/react-query zod react-hook-form @hookform/resolvers clsx tailwind-merge`
  - `pnpm add -D @tailwindcss/forms @tailwindcss/typography`
- [x] Create folder structure:
  ```
  src/
  ├── app/
  │   ├── [locale]/
  │   │   ├── (public)/
  │   │   ├── (admin)/admin/
  │   │   └── layout.tsx
  │   ├── providers.tsx
  │   ├── sitemap.ts
  │   └── robots.ts
  ├── components/
  │   ├── ui/
  │   └── layout/
  ├── features/
  ├── context/
  ├── hooks/
  ├── lib/
  │   ├── api/
  │   └── seo/
  ├── i18n/
  ├── messages/
  ├── utils/
  ├── types/
  └── styles/globals.css
  ```
- [x] Move root layout to `src/app/[locale]/layout.tsx` (locale-aware). Keep root `src/app/layout.tsx` as a thin wrapper.
- [x] Create `src/app/providers.tsx` — `"use client"` wrapper with `QueryClientProvider` (TanStack Query)
- [x] Create `src/lib/api/client.ts` — typed fetch wrapper for FastAPI. Two flavors: Server Components (cookie forwarding) and Client Components.
- [x] Create `src/utils/cn.ts` — `clsx` + `tailwind-merge` helper
- [x] Create `.env` (gitignored) + `.env.example` with `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `NEXT_PUBLIC_SITE_URL`
- [x] Update `tailwind.config.js` — add `@tailwindcss/forms` and `@tailwindcss/typography` plugins
- [x] Verify: `pnpm build` passes without errors

---

## Phase F2 — Admin Auth & Layout (ROADMAP 1.3)

**Goal:** Build the admin login page and protect admin routes. Russian-only UI.

**Depends on backend:** Phase 4 (Auth + admin guard) — `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`.

- [ ] Create `src/context/AuthContext.tsx` — `"use client"` Context holding user state (email, role, isAdmin). Exposes `login()`, `logout()`, `user`, `isLoading`.
- [ ] Create `src/features/auth/components/LoginForm.tsx` — `"use client"`. Email + password form with `react-hook-form` + `zod`. Calls `POST /auth/login`.
- [ ] Create admin login page: `src/app/[locale]/(admin)/admin/login/page.tsx`
- [ ] Create admin layout: `src/app/[locale]/(admin)/admin/layout.tsx` — sidebar nav (Russian labels: Объекты, Запросы, Комментарии, Подписчики, Блог), top bar with user + logout.
- [ ] Create admin dashboard: `src/app/[locale]/(admin)/admin/page.tsx` — stats placeholder
- [ ] Create `middleware.ts` — intercepts `/*/admin/*` routes, checks auth cookie, redirects to login if missing
- [ ] Build basic UI components: `Button`, `Input`, `Card`

---

## Phase F3 — Admin CRUD (ROADMAP 1.4)

**Goal:** Admin property management — create, edit, list, delete properties with image upload. All in Russian.

**Depends on backend:** Phase 5 (Admin CRUD endpoints).

- [ ] Create TanStack Query hooks in `src/features/admin/hooks/`:
  - `useProperties()`, `useProperty(id)`, `useCreateProperty()`, `useUpdateProperty()`, `useDeleteProperty()`
  - `useUploadImages()`, `useAmenities()`, `useCreateAmenity()`
- [ ] Admin pages:
  - `admin/properties/page.tsx` — table with status badge, edit/delete actions
  - `admin/properties/new/page.tsx` — create form (all fields, RU translation tab)
  - `admin/properties/[id]/edit/page.tsx` — edit form, image upload/reorder
  - `admin/amenities/page.tsx` — amenity management
- [ ] Build UI components: `Table`, `Badge`, `ImageUploader`, `Tabs`, `Select`, `Textarea`, `Modal`/`Dialog`
- [ ] Verify: can create, edit, list, delete a property through admin UI

---

## Phase F4 — Public Catalog & Property Detail (ROADMAP 2)

**Goal:** Public-facing property pages as **Server Components** (SSR for SEO).

**Depends on backend:** Phase 6 (Public read endpoints).

- [ ] Catalog page: `src/app/[locale]/(public)/catalog/page.tsx` — Server Component, fetches properties server-side, renders grid of `PropertyCard`
- [ ] `PropertyCard` component — photo (next/image), title, location pill, bed/guest icons, price, long-stay badge, save-heart
- [ ] Property detail page: `src/app/[locale]/(public)/catalog/[slug]/page.tsx` — Server Component, fetches by slug. Gallery, description, amenities, map, placeholders for inquiry form and comments.
- [ ] `FilterBar` component — `"use client"`. Dropdowns that update URL search params.
- [ ] Sales pages: same pattern under `(public)/sales/`, `kind=sale`, sale_price display
- [ ] Home page: `src/app/[locale]/(public)/page.tsx` — hero + search, featured properties, services teaser, newsletter placeholder
- [ ] Build components: `Gallery`, `AmenityList`, `LocationPill`, `PriceBadge`
- [ ] Verify: published properties appear in catalog. View source shows full HTML (SSR working).

---

## Phase F5 — Internationalization (ROADMAP 3)

**Goal:** Public site in 4 languages (ES default, RU, UK, EN). Admin stays Russian-only.

- [ ] Configure next-intl: `src/i18n/config.ts` (locales, default), `src/i18n/request.ts`
- [ ] Update `middleware.ts` — locale detection + prefix routing (`/es/`, `/ru/`, `/en/`, `/uk/`)
- [ ] Create message catalogs: `src/messages/{es,ru,en,uk}.json` — all UI strings
- [ ] Update all public pages to use `useTranslations()` instead of hardcoded strings
- [ ] Build `LanguageSwitcher` component — navigates to equivalent URL in other locale (maps translated slugs)
- [ ] Add translation tabs in admin property edit form (ES/RU/UK/EN tabs for title, slug, description, meta)
- [ ] Emit `hreflang` via `generateMetadata` on every public page, including `x-default` → `es`
- [ ] Verify: switching languages changes URL and content. View source shows `hreflang` links.

---

## Phase F6 — Forms + Anti-spam (ROADMAP 4)

**Goal:** Contact and inquiry forms with Cloudflare Turnstile protection.

**Depends on backend:** Phase 8 (Inquiries + anti-spam endpoints).

- [ ] Install: `pnpm add react-turnstile`
- [ ] Inquiry form on property detail — `"use client"`. Fields: name, email, phone, message, check-in, check-out, guests. Hidden honeypot + timestamp. Turnstile widget.
- [ ] Contact page: `src/app/[locale]/(public)/contact/page.tsx` — general inquiry form
- [ ] Admin inquiries page: `admin/inquiries/page.tsx` — inbox with status (new/replied/closed), mark as read
- [ ] Build components: `TurnstileWidget`, `FormField`, `DatePicker`
- [ ] Verify: form submits → appears in admin. Turnstile blocks bots.

---

## Phase F7 — Availability Calendar (ROADMAP 5)

**Goal:** Show busy/free days on property detail. Guest picks dates for their inquiry.

**Depends on backend:** Phase 9 (Availability endpoints).

- [ ] Install: `pnpm add react-day-picker date-fns`
- [ ] `AvailabilityCalendar` component — `"use client"`. Fetches busy blocks, renders month view with blocked days disabled.
- [ ] Integrate with inquiry form — selected date range populates check-in/check-out fields.
- [ ] Admin availability manager: `admin/properties/[id]/availability/page.tsx` — add/remove blocked ranges, visual calendar.
- [ ] Verify: blocked dates disabled. Guest picks free dates → inquiry includes range.

---

## Phase F8 — User Accounts + Comments (ROADMAP 6)

**Goal:** User registration/login, comments with star ratings, admin moderation.

**Depends on backend:** Phase 10 (Comments endpoints).

- [ ] Auth pages: `(public)/auth/login/page.tsx`, `register/page.tsx`, `verify/page.tsx`
- [ ] `CommentForm` component — `"use client"`. Text + star rating (1-5). Requires login.
- [ ] `CommentList` component — Server Component on property detail. Approved comments only.
- [ ] `StarRating` component — interactive (form) and display (read-only) variants
- [ ] Admin moderation page: `admin/comments/page.tsx` — pending comments, approve/reject
- [ ] Aggregate rating display on property cards and detail pages

---

## Phase F9 — Email Subscriptions (ROADMAP 7)

**Depends on backend:** Phase 11 (Subscriber endpoints).

- [ ] `NewsletterForm` component — email input + Turnstile. Used on home page and footer.
- [ ] Confirm/unsubscribe pages: `(public)/confirm/[token]/page.tsx`, `(public)/unsubscribe/[token]/page.tsx`
- [ ] Admin subscribers page: `admin/subscribers/page.tsx` — list, broadcast composer

---

## Phase F10 — Blog (ROADMAP 8)

**Depends on backend:** Phase 12 (Posts endpoints).

- [ ] Blog listing: `(public)/blog/page.tsx` — Server Component, card grid
- [ ] Blog post: `(public)/blog/[slug]/page.tsx` — Server Component, full post
- [ ] Admin blog editor: `admin/posts/page.tsx`, `admin/posts/new/page.tsx`, `admin/posts/[id]/edit/page.tsx`

---

## Phase F11 — SEO & Performance (ROADMAP 8)

- [ ] `generateMetadata` on every public page — title, description, canonical, `alternates.languages`
- [ ] `src/app/sitemap.ts` — dynamic sitemap (published properties + posts x 4 locales)
- [ ] `src/app/robots.ts` — allow all, point to sitemap
- [ ] JSON-LD structured data (Server Components): `VacationRental`, `Product`+`Offer`, `AggregateRating`, `BreadcrumbList`, `Organization`/`LocalBusiness`
- [ ] Image optimization — all images via `next/image` + Cloudinary loader (AVIF/WebP, responsive)
- [ ] Core Web Vitals audit — fix layout shift, lazy load below-fold images

---

## Phase F12 — GDPR & Launch (ROADMAP 9-10)

- [ ] Cookie consent banner component
- [ ] Legal pages: Privacy Policy, Aviso Legal (translated)
- [ ] Analytics — Plausible script in layout
- [ ] Vercel deployment — connect repo, set env vars, verify build
- [ ] Domain setup — point `alquileresturisticosvinaros.com` to Vercel

---

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Next.js 16 has breaking API changes vs docs | High | Read `node_modules/next/dist/docs/` before writing code |
| Backend not ready when frontend phase needs it | Medium | Build UI with mock data first, wire to real API when backend catches up |
| i18n adds complexity to every page | Medium | Start without i18n (admin), add to public pages in a single focused phase |
| Image-heavy site hurts performance | Medium | Cloudinary transforms + next/image from the start |

---

## Build Order Summary

| Phase | ROADMAP | Backend Dependency | Core Concept |
|---|---|---|---|
| F1 Setup | 1.1 | Phase 1 (health) | Folder structure, dependencies |
| F2 Admin auth | 1.3 | Phase 4 (auth) | JWT cookies, middleware, Context |
| F3 Admin CRUD | 1.4 | Phase 5 (admin CRUD) | TanStack Query, forms, uploads |
| F4 Public pages | 2 | Phase 6 (public endpoints) | Server Components, SSR, URL filters |
| F5 i18n | 3 | — | next-intl, hreflang, locale routing |
| F6 Forms + spam | 4 | Phase 8 (inquiries) | Turnstile, honeypot, react-hook-form |
| F7 Calendar | 5 | Phase 9 (availability) | react-day-picker, date ranges |
| F8 Users + comments | 6 | Phase 10 (comments) | User auth flow, star ratings |
| F9 Subscriptions | 7 | Phase 11 (subscribers) | Double opt-in UX |
| F10 Blog | 8 | Phase 12 (posts) | MDX rendering |
| F11 SEO | 8 | — | Metadata, JSON-LD, sitemap |
| F12 GDPR + launch | 9-10 | — | Legal compliance, deployment |

---

## Current Status

**Completed:** Next.js scaffold with Tailwind + fonts configured
**Next:** Phase F1 (project setup & foundations)
