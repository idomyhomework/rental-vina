# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

---

## Project Overview

**Alquileres Vinaròs** — a multilingual vacation-rental and property-sales website for Vinaròs & Peñíscola (Costa del Azahar).

- **Booking model:** inquiry-only. Guests pick dates on an availability calendar and submit a request; the owner confirms manually. **No online payments in v1.**
- **Languages:** Russian (default), Spanish, Ukrainian, English.
- **Core jobs:** browse rentals & sales, see availability, send inquiries, register and leave moderated comments/reviews, subscribe to offers. Admins manage everything via an admin panel.
- **Hard requirements:** strong SEO, cloud Postgres from day 1, anti-spam on every public form, mobile-first polished design, GDPR compliance (EU business).

---

## Architecture

Two services in a monorepo:

```
Next.js (React+TS, App Router)  ──HTTP/JSON──▶  FastAPI (async)  ──▶  PostgreSQL (Neon, async)
        SSR for SEO                                   ├──▶ Resend (email)
        React + TanStack Query (client)               ├──▶ Cloudflare Turnstile (anti-spam)
                                                      ├──▶ Upstash Redis (rate limit)
                                                      └──▶ Cloudinary (images)
```

- **Next.js is the rendering/SEO layer; FastAPI is the source of truth and the authorization gatekeeper.** There is no DB-level RLS — every endpoint enforces access rules in FastAPI dependencies.
- The frontend never talks to the database directly; it only calls the FastAPI API.
- **Database is cloud (Neon) from commit #1.** `DATABASE_URL` points at the cloud DB on every machine, so switching devices needs no DB changes. `docker-compose` may run the app services locally, but the DB of record is the cloud instance.

---

## Package Manager

- Always use **pnpm** (never npm or yarn).
- `pnpm install` · `pnpm add <pkg>` · `pnpm add -D <pkg>` · `pnpm <script>`

---

## Frontend

### Framework & Language

- **Next.js (App Router) + React + TypeScript.** Functional components and hooks only.
- Avoid `any`. Type every prop, hook return, and API response.
- **Server Components by default; add `"use client"` only when a component needs interactivity, state, or browser APIs.**

### Data fetching — the SEO-critical rule

- **Public, crawlable pages** (home, catalog, property detail, sales, blog, area guide) fetch data in **Server Components** (server-side `fetch` to FastAPI) so search engines receive full HTML. Do **not** turn these into client-side fetches.
- **Client interactivity** (live filters, save-heart, inquiry/comment forms, auth session, the admin panel) lives in **Client Components** (`"use client"`).
- Rule of thumb: if it must be indexed, render it on the server; if it only reacts to the user, handle it on the client.

### State Management (no Redux)

- **Public interactivity → plain React.** `useState` / `useReducer` for local UI state; **React Context** only for cross-cutting client state (e.g. the auth session). No global store.
- **Admin CRUD → TanStack Query (React Query).** Use it for all admin data fetching and mutations — it gives caching, refetching, and cache invalidation after create/update/delete. The query client is mounted in a client `src/app/providers.tsx` used by the root layout.
- A shared typed **API client** (`src/lib/api/`) wraps `fetch` to FastAPI; TanStack Query hooks call into it. Keep ephemeral UI state local — do not lift everything into Context.

### Styling

- **Tailwind CSS v3** for all styling. No custom CSS files unless strictly necessary.
- **Mobile-first**: design at the smallest breakpoint, then scale up with `sm:` `md:` `lg:`.
- Use `clsx` / `tailwind-merge` for conditional classes.
- Extend the theme (colors, fonts, spacing) in `tailwind.config.ts` — avoid arbitrary values. See **Design System** below.

### i18n

- **next-intl** with a `[locale]` route segment. Locales: `ru` (default), `es`, `en`, `uk`. Middleware handles locale routing.
- **UI strings** live in `src/messages/{locale}.json`.
- **Content** (property titles, descriptions, slugs, blog) is translated in the database, not in catalogs — fetch the right locale from the API.
- Emit `hreflang` alternates for all 4 locales **+ `x-default`** on every page.
- The language switcher navigates to the _equivalent localized URL_ (same property, translated slug), not just home.

### SEO (Next.js handles this natively)

- Per-route, per-locale metadata via `generateMetadata` (title, description, canonical, `alternates.languages` for hreflang).
- `app/sitemap.ts` (every published property/post × locale) and `app/robots.ts`.
- **JSON-LD** structured data in Server Components: `VacationRental`/`LodgingBusiness`, `Product`+`Offer`, `AggregateRating`, `BreadcrumbList`, `Organization`/`LocalBusiness`, `FAQPage`.
- Images via `next/image` + Cloudinary (AVIF/WebP, responsive). Protect Core Web Vitals; avoid layout shift.

---

## Backend

### Framework & Language

- **Python 3.12 + FastAPI**, fully **async** (`async def` for all routes and services).
- Separation: `routers/` (HTTP), `services/` (business logic), `models/` (ORM), `schemas/` (Pydantic), `core/` (config, security, deps).
- **Pydantic v2** for all request/response schemas and validation.
- Keep business logic **out of routers** — delegate to services.

### API Conventions

- RESTful, consistently named routes. Correct HTTP status codes.
- Every endpoint declares a Pydantic `response_model`.
- Use `Depends()` for shared logic: DB session, current user, admin guard, Turnstile check, rate limit.
- Public read endpoints return only `status='published'`. Mutations on listings/posts/availability require the admin dependency.

### Auth & Authorization

- JWT auth (via **fastapi-users** or a custom `core/security.py`). Tokens delivered as **httpOnly cookies**.
- `get_current_user` and `require_admin` dependencies guard protected routers. Admin routes live under `/admin/*`.
- CORS is locked to `FRONTEND_ORIGIN` only.
- On the Next.js side, a `middleware.ts` guards `/[locale]/admin/*`; Server Components forward the auth cookie when calling FastAPI.

### Anti-spam (applied to contact, inquiry, comment, subscribe)

1. Verify **Cloudflare Turnstile** token server-side (httpx) before any write.
2. **Honeypot** field — if filled, drop silently.
3. **Time-to-submit** check — reject sub-2-second submissions.
4. **Rate limit** by IP with **slowapi** + Redis (e.g. 5 inquiries / 10 min).

### Email (Resend)

- Transactional (inquiry confirmations, email verification) sent from services via httpx.
- Newsletter uses **double opt-in**: subscribe → `pending` + confirm email → confirm endpoint sets `confirmed`. Only confirmed addresses receive broadcasts. Every email carries a tokenized unsubscribe link.

---

## Database

- **PostgreSQL** (cloud: Neon, EU region).
- **SQLAlchemy 2.0 async** ORM with **asyncpg** driver; connection pooling via `AsyncEngine`.
- Models in `models/`, Pydantic schemas in `schemas/` (kept separate).
- **All** schema changes go through **Alembic** migrations — never alter the DB directly.

### Core entities

`users`, `properties` (`kind`: rental|sale), `property_translations` (per-locale title/slug/description/meta), `property_images`, `amenities` + `amenity_translations` + `property_amenities`, `availability_blocks` (admin-managed busy ranges, no overlaps per property), `inquiries` (with optional check-in/out + guests), `comments` (optional 1–5★, moderated), `subscribers` (double opt-in), `posts` + `post_translations` (blog/guides).

---

## Project Conventions

### General

- TypeScript on the frontend (no `any`); Python type hints on every backend signature.
- Small, focused functions and components. Business logic stays in services/slices, not handlers/views.

### Naming

- Frontend: `camelCase` (vars/functions), `PascalCase` (components/types).
- Backend: `snake_case` everywhere. Database: `snake_case` tables/columns.

### Environment Variables

- Secrets in `.env` (never committed).
- Frontend: client-exposed vars use the **`NEXT_PUBLIC_`** prefix; server-only vars have no prefix and are read in Server Components / route handlers.
- Backend loads via **pydantic-settings** (`BaseSettings`).

### Linting & Formatting

- Frontend: **ESLint** (`next lint`) + **Prettier**. Backend: **Ruff** (lint + format). Run before committing.

### Testing

- Backend: **pytest** (cover availability-overlap logic, auth, anti-spam, double opt-in tokens).
- Frontend: **Vitest** + React Testing Library for critical components/hooks.

---

## Folder Structure

```
root/
├── frontend/                        # Next.js (App Router) + TypeScript
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   │   ├── [locale]/
│   │   │   │   ├── (public)/        # home, catalog, catalog/[slug], sales,
│   │   │   │   │                    #   about, blog, contact  (Server Components)
│   │   │   │   ├── (admin)/admin/   # role-gated (Client Components)
│   │   │   │   └── layout.tsx
│   │   │   ├── providers.tsx        # 'use client' — TanStack Query + i18n providers
│   │   │   ├── sitemap.ts
│   │   │   └── robots.ts
│   │   ├── assets/                  # images, fonts (Fraunces, Plus Jakarta Sans), icons
│   │   ├── components/
│   │   │   ├── ui/                  # Button, Input, Modal, Calendar…
│   │   │   └── layout/              # Header, Footer, LanguageSwitcher…
│   │   ├── features/                # feature modules (see list below)
│   │   │   └── <feature>/
│   │   │       ├── components/
│   │   │       ├── hooks/           # TanStack Query hooks (admin) / React hooks
│   │   │       └── types.ts
│   │   ├── context/                 # React Context providers (e.g. auth session)
│   │   ├── hooks/                   # shared hooks
│   │   ├── lib/
│   │   │   ├── api/                 # typed fetch client → FastAPI (client + server)
│   │   │   └── seo/                 # metadata / JSON-LD builders
│   │   ├── i18n/                    # next-intl config
│   │   ├── messages/               # es/ru/en/uk.json
│   │   ├── utils/                   # pure helpers
│   │   ├── types/                   # global types
│   │   └── styles/globals.css       # Tailwind base only
│   ├── middleware.ts                # locale routing + admin guard
│   ├── .env
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── next.config.js
│   └── package.json
│
├── backend/                         # FastAPI
│   ├── app/
│   │   ├── main.py                  # app instance, CORS, middleware, router mount
│   │   ├── core/                    # config.py, security.py, dependencies.py
│   │   ├── db/                      # base.py, session.py (async engine), init_db.py
│   │   ├── models/                  # SQLAlchemy models
│   │   ├── schemas/                 # Pydantic schemas
│   │   ├── routers/                 # one per resource (see list below)
│   │   ├── services/                # business logic (email, turnstile, ratelimit, availability)
│   │   └── utils/
│   ├── alembic/                     # migrations (versions/, env.py)
│   ├── tests/                       # conftest.py + per-feature tests
│   ├── .env
│   ├── alembic.ini
│   ├── pyproject.toml               # Ruff, pytest config
│   └── requirements.txt
│
├── CLAUDE.md
├── .gitignore
└── docker-compose.yml               # backend + frontend (+ optional local Postgres)
```

### Feature modules (frontend `features/`)

`properties`, `sales`, `catalog`, `propertyDetail`, `availability`, `inquiries`, `auth`, `comments`, `subscribers`, `blog`, `admin`.

### Resource routers (backend `routers/`)

`properties`, `sales`, `amenities`, `availability`, `inquiries`, `auth`, `comments`, `subscribers`, `posts`, `admin`.

---

## Design System (set tokens in `tailwind.config.ts`)

- **Colors:** `ink #211E1B`, `sand #FBF7F2`, `sea #0E6B73`, `coral #EA5A41` (accent), `coral-dark #C8462E`, `coral-soft #FCEBE5`, `line #ECE5DC`.
- **Fonts:** display **Fraunces** (headlines only), body/UI **Plus Jakarta Sans** (load via `next/font`).
- **Components:** rounded photo cards w/ hover zoom, location pill, save-heart, icon meta (guests/bedrooms), "from X€/night" price, long-stay badge.
- Accessibility floor: visible focus states, reduced-motion respected, alt text, keyboard-navigable calendar and forms. Tap targets ≥44px.

---

## Security & GDPR

- Service/DB credentials are backend-only; JWT in httpOnly cookies; HTTPS; CORS pinned to the frontend origin.
- Authorization enforced in FastAPI dependencies (deny by default).
- Cookie consent banner; Privacy Policy + Aviso legal pages (required in Spain).
- Double opt-in email; data-deletion path for users and subscribers.
- Validate every input on both sides: **zod** (frontend) + **Pydantic** (backend).

---

## Environment Variables

```
# ── Frontend (.env) ──
NEXT_PUBLIC_API_BASE_URL=             # FastAPI URL (client + server)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
NEXT_PUBLIC_SITE_URL=https://www.alquileresturisticosvinaros.com
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=

# ── Backend (.env, pydantic-settings) ──
DATABASE_URL=                         # Neon (async: postgresql+asyncpg://…)
JWT_SECRET=
ACCESS_TOKEN_EXPIRE_MINUTES=
FRONTEND_ORIGIN=                      # CORS allow-list
RESEND_API_KEY=
EMAIL_FROM="Alquileres Vinaròs <hola@alquileresturisticosvinaros.com>"
TURNSTILE_SECRET_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
CLOUDINARY_URL=
```

---

## Common Commands

### Frontend

```bash
pnpm dev          # next dev
pnpm build        # next build
pnpm start        # next start (production)
pnpm lint         # next lint
pnpm type-check   # tsc --noEmit
pnpm test         # Vitest
```

### Backend

```bash
uvicorn app.main:app --reload                 # dev server
alembic upgrade head                          # apply migrations
alembic revision --autogenerate -m "message"  # new migration
ruff check . && ruff format .                 # lint + format
pytest                                        # run tests
```

### Database

```bash
alembic history       # migration history
alembic downgrade -1  # roll back one migration
```

---

## Comments

Use a **three-tier** comment system with short dividers. Apply these to components, hooks, functions, route handlers, services, models, schemas, and dependencies — on both frontend and backend.

### Tier 1 — Banner (top of file)

Title in **UPPERCASE**. One per file.

**TypeScript / TSX**

```tsx
// --- PROPERTY DETAIL — VIEW ---
```

**Python**

```python
# --- INQUIRIES — SERVICE ---
```

### Tier 2 — Divider (section within a file)

Title in **sentence case**.

**TypeScript / TSX**

```tsx
// --- Derived state ---
```

**Python**

```python
# --- Spam checks ---
```

### Tier 3 — Inline note (single line, explains a decision)

Prefix with `→`. Keep it short.

**TypeScript / TSX**

```tsx
// → only published properties reach the client
```

**Python**

```python
# → reject submissions faster than 2 seconds
```

### Worked examples

**Server Component page (TSX)**

```tsx
// --- PROPERTY DETAIL — PAGE (Server Component, SEO-critical) ---

import { getProperty } from "@/lib/api/properties";
import { buildPropertyJsonLd } from "@/lib/seo/jsonld";

// --- Params ---
interface PageProps {
  params: { locale: string; slug: string };
}

// --- Page ---
export default async function PropertyPage({ params }: PageProps) {
  // --- Server-side fetch (crawlable) ---
  const property = await getProperty(params.slug, params.locale);

  // → JSON-LD is rendered server-side so Google sees the structured data
  const jsonLd = buildPropertyJsonLd(property);

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* … */}
    </article>
  );
}
```

**TanStack Query mutation hook (TS, admin client)**

```tsx
// --- INQUIRIES — HOOKS (TanStack Query, admin client) ---

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { InquiryCreate, Inquiry } from "./types";

// --- Create inquiry ---
export function useCreateInquiry() {
  const queryClient = useQueryClient();

  return useMutation<Inquiry, Error, InquiryCreate>({
    mutationFn: (body) => api.post("/inquiries", body),
    // → refresh the owner's inbox list after a successful submit
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inquiries"] }),
  });
}
```

**FastAPI router (Python)**

```python
# --- INQUIRIES — ROUTER ---

from fastapi import APIRouter, Depends

from app.schemas.inquiry import InquiryCreate, InquiryRead
from app.services import inquiry as inquiry_service
from app.core.dependencies import verify_turnstile, rate_limit

router = APIRouter(prefix="/inquiries", tags=["inquiries"])


# --- Create inquiry ---
@router.post("", response_model=InquiryRead, status_code=201)
async def create_inquiry(
    payload: InquiryCreate,
    _spam=Depends(verify_turnstile),   # → blocks bots before any DB write
    _limit=Depends(rate_limit),
):
    # --- Persist + notify owner ---
    return await inquiry_service.create(payload)
```

Use the same banners/dividers for **TanStack Query hooks, Context providers, SQLAlchemy models, Pydantic schemas, Alembic migrations, Server Components, and dependencies**. Every constraint or non-obvious rule gets a Tier-3 `→` note explaining _why_.
