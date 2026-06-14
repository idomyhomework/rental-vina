# Alquileres Vinaròs — Technical Specification & Build Plan (v2)

A vacation-rental and property-sales website for Vinaròs & Peñíscola (Costa del Azahar). This document is the single source of truth for the build, written to be handed to **Claude Code** one phase at a time.

> **Stack (v2):** **FastAPI** backend (Python) · **React + TypeScript** frontend via **Next.js** (server-rendered for SEO) · **PostgreSQL**. Owner is a solo builder using Claude Code. **Booking model:** inquiry-only (guest requests dates, owner confirms manually — no online payment yet).

---

## 0. Important architecture note (read first)

Your requirements include **strong SEO** *and* **React + TypeScript on the front** *and* a **FastAPI backend**. A plain client-side React SPA (Vite) renders an empty page that JS fills in later — bad for SEO. To satisfy all three constraints at once:

- The frontend is **Next.js**, which *is* React + TypeScript, but **server-renders** pages so crawlers get full HTML.
- **FastAPI** is the API/business-logic layer (CRUD, auth, email, anti-spam, availability). Next.js calls it server-side to render pages, and client-side for interactivity.
- This is a clean two-service split, not a monolith.

> If you ever decide you'd rather a **Vite SPA** (simpler, no Node server), keep it — but accept weaker SEO and add prerendering for marketing pages. The rest of this spec is written for the Next.js + FastAPI default.

---

## 1. Goals & scope

**In scope (v1):**
1. Public multilingual site (ES / RU / EN / UK): home, rental catalog, property detail, sales catalog, area guide, contact, blog.
2. Admin panel with full CRUD for rentals, sales, images, availability, inquiries, comments, subscribers.
3. Availability calendar per property (busy/free days) feeding an **inquiry** with dates (no payment).
4. User registration/login + comments & star reviews under properties (moderated).
5. Email subscriptions with double opt-in; admin "best offers" broadcasts.
6. Anti-spam on all public forms.
7. Strong technical + local + multilingual SEO.
8. Cloud Postgres from commit #1; mobile-first, polished design.

**Out of scope for v1 (see §16):** online payments/deposits, channel-manager/iCal sync with Airbnb & Booking, multi-currency checkout, native app.

**Non-negotiables:** cloud DB from day 1, every public page server-rendered & crawlable, GDPR-compliant (EU business).

---

## 2. Tech stack

### Backend (FastAPI)
| Concern | Choice | Why |
|---|---|---|
| Framework | **FastAPI** (Python 3.12), **Uvicorn**/Gunicorn | Async, typed, auto-generates OpenAPI (→ typed frontend client). |
| ORM | **SQLAlchemy 2.0** | Mature, async-capable, pairs with Alembic. |
| Migrations | **Alembic** | Version-controlled schema = reproducible across devices. |
| Schemas/validation | **Pydantic v2** | Request/response models, validation. |
| Auth | **fastapi-users** (JWT) | Registration, login, email verification, password reset out of the box. |
| Rate limiting | **slowapi** (+ Redis/Upstash) | Throttle public forms. |
| HTTP client | **httpx** | Call Turnstile + Resend APIs. |
| Tests | **pytest** | Cover availability overlap, auth, anti-spam. |

### Frontend (React + TypeScript)
| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | React + TS with SSR/SSG for SEO. |
| Styling | **Tailwind CSS + shadcn/ui** | Mobile-first, accessible Radix components. |
| i18n | **next-intl** | Localized routes + hreflang for 4 languages. |
| State / data | **Server Components** (public, SSR) + **React hooks/Context** (public interactivity) + **TanStack Query** (admin CRUD) | Server Components render public pages for SEO; plain React for public interactivity; TanStack Query for admin caching/mutations. No Redux. |
| Forms | **react-hook-form + zod** | Typed, validated forms. |
| API types | **openapi-typescript** | Generate a typed client from FastAPI's OpenAPI schema. |
| Calendar | **react-day-picker** | Range selection, disabled busy days. |

### Infrastructure
| Concern | Choice | Why |
|---|---|---|
| Database | **PostgreSQL on Neon** (EU region) | Serverless, cloud from day 1, branching, great free tier. *(Railway/Render Postgres also fine.)* |
| Backend host | **Render** (or Railway / Fly.io) | Easy Python deploys, EU region. |
| Frontend host | **Vercel** | Zero-config Next.js, global CDN, previews. |
| Image storage | **Cloudinary** (or Cloudflare R2 / S3) | On-the-fly resize/AVIF/WebP for your heavy photos. |
| Email | **Resend** | Transactional + broadcasts (call via httpx). |
| Anti-spam | **Cloudflare Turnstile** + honeypot + slowapi | Invisible, free, EU-friendly. |
| Analytics | **Plausible** (or GA4) | Cookieless = lighter GDPR burden. |

> **Region:** put Neon, Render and Vercel functions in an **EU region** (GDPR + latency to Spain).

---

## 3. Architecture

```
Browser
   │
   ▼
Next.js (React+TS) on Vercel ── SSR/SSG, hreflang, JSON-LD, sitemap
   │   (server-side fetch for SEO; client fetch for interactivity)
   ▼
FastAPI (Python) on Render ── REST/JSON API, JWT auth (fastapi-users)
   │
   ├──▶ PostgreSQL (Neon)        SQLAlchemy + Alembic
   ├──▶ Cloudinary / R2          property images
   ├──▶ Resend                   transactional + broadcast email
   ├──▶ Cloudflare Turnstile     verify form tokens
   └──▶ Redis (Upstash)          rate limiting (slowapi)
```

- **CORS:** FastAPI allows the Next.js origin only.
- **Auth flow:** fastapi-users issues JWT; Next.js stores it in an **httpOnly cookie** and forwards it to FastAPI on protected calls.
- **Type safety across the boundary:** generate a TS client from FastAPI's `/openapi.json` so frontend and backend never drift.

---

## 4. Cloud accounts to create (before Phase 0)

1. **Neon** Postgres project (EU) → `DATABASE_URL`.
2. **Render** (or Railway/Fly) for the FastAPI service.
3. **Vercel** for the Next.js frontend.
4. **Resend** + verify sending domain (SPF/DKIM/DMARC).
5. **Cloudflare Turnstile** → site key + secret.
6. **Upstash Redis** (rate limiting).
7. **Cloudinary** (image transforms).
8. Keep the existing domain **alquileresturisticosvinaros.com** (it has SEO history — don't change it).

All have free tiers sufficient for development and early production.

---

## 5. Data model (PostgreSQL)

Translatable content is split into a base table + a `*_translations` table keyed by `locale` (`es` default, `ru`, `en`, `uk`). Define these as SQLAlchemy models; generate Alembic migrations (never hand-edit the DB).

```
users                          -- managed by fastapi-users
  id              uuid pk
  email           text unique
  hashed_password text
  is_active       bool
  is_verified     bool
  role            enum('user','admin') default 'user'
  display_name    text null
  created_at      timestamptz default now()

properties
  id              uuid pk
  kind            enum('rental','sale')
  status          enum('draft','published','archived') default 'draft'
  location        enum('vinaros','peniscola', ...)
  max_guests      int
  bedrooms        int
  bathrooms       int
  area_m2         int null
  summer_price_min int null     -- rentals, per night
  summer_price_max int null
  monthly_price   int null      -- rentals, long stay
  sale_price      int null      -- sales only
  latitude        numeric null
  longitude       numeric null
  featured        bool default false
  created_at      timestamptz default now()
  updated_at      timestamptz default now()

property_translations
  id, property_id fk, locale, title, slug, description,
  meta_title null, meta_description null
  unique(property_id, locale)
  unique(locale, slug)

property_images
  id, property_id fk, url, alt null, sort_order int default 0, is_main bool

amenities (id, key unique)
amenity_translations (id, amenity_id fk, locale, name)
property_amenities (property_id fk, amenity_id fk)

availability_blocks            -- admin marks busy/blocked ranges
  id, property_id fk, start_date date, end_date date,
  reason enum('booked','blocked','maintenance') default 'booked'
  -- no overlapping ranges per property (enforce in app; consider a GiST exclusion constraint)

inquiries                      -- guest "request to book" / contact
  id, property_id fk null, name, email, phone null, message,
  check_in date null, check_out date null, guests int null,
  locale, status enum('new','replied','closed') default 'new',
  source_ip inet null, created_at timestamptz default now()

comments                       -- comment + optional star review
  id, property_id fk, user_id fk, rating int null (1..5), body,
  status enum('pending','approved','rejected') default 'pending',
  created_at timestamptz default now()

subscribers                    -- newsletter, double opt-in
  id, email unique, locale default 'es',
  status enum('pending','confirmed','unsubscribed') default 'pending',
  confirm_token, unsubscribe_token, confirmed_at null, created_at default now()

posts (id, status, cover_image null, published_at null)
post_translations (id, post_id fk, locale, title, slug, excerpt, body_mdx, meta_title, meta_description)
```

### Authorization (enforced in FastAPI — there is no Supabase RLS now)
Because FastAPI connects with a single DB role, **the API is the gatekeeper**. Use FastAPI dependencies:
- Public GET endpoints return only `status='published'` rows.
- Create/update/delete on properties, sales, posts, availability → require `role='admin'`.
- Comments: authenticated users may POST; public GET returns only `approved`; admin changes status.
- Inquiries/subscribers: write only after Turnstile passes; never publicly listable.
- Admin endpoints live under `/admin/*` and require an admin-role dependency on the router.

---

## 6. Internationalization (4 languages)

- Locales: `es` (default), `ru`, `en`, `uk`. Routes `/[locale]/...` (recommend explicit `/es`).
- **UI strings** → next-intl catalogs (`/messages/*.json`).
- **Content** (titles, descriptions, slugs, blog) → `*_translations` tables; admin form has a **tab per language** for every listing/post.
- Language switcher maps to the *equivalent localized URL* (same property, translated slug).
- Emit `hreflang` for all four locales **+ `x-default`** on every page.
- Missing-translation fallback: content falls back to `es`; UI stays in requested locale.

---

## 7. Feature specifications

### 7.1 Public site (Next.js, SSR)
- **Home:** hero + search bar (destination/guests/bedrooms), featured rentals, services, area teaser, newsletter signup, contact (per approved mockup).
- **Rental catalog:** filterable grid (location, guests, bedrooms, price); filters in URL query (shareable/crawlable); server-rendered.
- **Property detail:** gallery + lightbox, description, amenities, map, availability calendar, inquiry form with dates, comments/reviews, full JSON-LD.
- **Sales catalog + detail:** `kind='sale'`, sale fields, lead form.
- **Area guide / blog:** evergreen + localized SEO content.
- **Contact:** general inquiry form.

### 7.2 Availability calendar (inquiry flow)
- Detail page fetches `availability_blocks` from FastAPI; `react-day-picker` renders busy days **disabled**.
- Guest picks check-in/out + guests → POST `/inquiries` (with dates) after Turnstile.
- **No auto-blocking.** Owner reviews in admin, then optionally creates an `availability_block`.
- FastAPI enforces **no overlapping blocks** per property (validation + ideally a GiST exclusion constraint on `daterange`).

### 7.3 Auth, comments & reviews
- **fastapi-users**: email/password + verification; JWT. (Google OAuth optional later.)
- Logged-in users POST a comment + optional 1–5★ rating; default `pending`; admin moderates; only `approved` shown.
- Approved ratings aggregate to the property's `AggregateRating` (SEO stars).

### 7.4 Email subscriptions (double opt-in)
- Signup → insert `pending` subscriber → FastAPI sends confirm email (Resend) with tokenized link → confirm endpoint sets `confirmed`.
- Only confirmed addresses receive offers. Every email has a tokenized **unsubscribe** link.
- Admin broadcast screen: compose subject/body, choose locale(s), send to confirmed subscribers of that locale; log sends.

### 7.5 Admin panel (Next.js, role-gated; FastAPI `/admin/*`)
CRUD/management for: rentals & sales (all fields × 4 languages, image upload/reorder/main), amenities, availability blocks (calendar), inquiries inbox (status + reply), comment moderation, subscribers + broadcasts, blog posts. Every admin route guarded server-side by an admin-role check — not just a hidden link.

### 7.6 Anti-spam (fixes your bot problem)
Applied to **contact, inquiry, comment, subscribe** endpoints in FastAPI:
1. **Cloudflare Turnstile** — verify token server-side (httpx) before any write.
2. **Honeypot** hidden field — if filled, drop silently.
3. **Time-to-submit** — reject sub-2-second submissions.
4. **Rate limit** by IP via slowapi + Redis (e.g. 5 inquiries / 10 min).
5. Optional content heuristics (link count, language mismatch) → flag.

---

## 8. SEO plan

**Realistic targeting.** Topping broad national terms ("alquileres turísticos", "alquileres para verano") against Airbnb/Booking/portals isn't achievable for a ~20-property site. Win **local + long-tail + RU/UK**:
- **Primary:** `alquileres turísticos vinaros`, `alquiler vacacional peñiscola`, `apartamentos verano costa azahar`, `alquiler larga estancia vinaros`, + RU/UK equivalents (*аренда жилья Винарос/Пеньискола*).
- **Local:** Google Business Profile + consistent NAP + embedded map + citations.

**Technical (Next.js handles this — a SPA would not):**
- SSR every public page; semantic HTML; one `<h1>`/page.
- Per-page/per-locale metadata (Metadata API); canonical URLs.
- `hreflang` (all locales + `x-default`).
- Dynamic `sitemap.xml` (properties/posts × locales) + `robots.txt`.
- **JSON-LD:** `VacationRental`/`LodgingBusiness` per property, `Product`+`Offer`, `AggregateRating`, `BreadcrumbList`, `Organization`/`LocalBusiness`, `FAQPage`.
- **Performance = ranking:** Next/Image + Cloudinary (AVIF/WebP, responsive), lazy load, no layout shift; green mobile Core Web Vitals.
- Localized friendly slugs.

**Content:** localized blog/area guides are the real ranking engine; link them to listings.

---

## 9. Design system (from approved mockup)

- **Colors:** ink `#211E1B`, warm bg `#FBF7F2`, sea `#0E6B73`, accent coral/azahar `#EA5A41` (dark `#C8462E`), soft `#FCEBE5`, line `#ECE5DC`.
- **Type:** display **Fraunces** (headlines), UI/body **Plus Jakarta Sans**.
- **Components:** rounded photo cards w/ hover zoom, location pill, save-heart, icon meta, "from X€/night" price, long-stay badge.
- **Mobile-first:** design at ~375px first; sticky compact header; tap targets ≥44px.
- **A11y floor:** visible focus, reduced-motion, alt text, keyboard-navigable calendar/forms.

---

## 10. Security, privacy & GDPR

- Secrets in env/host settings; FastAPI DB creds + service keys server-only.
- Authorization enforced in FastAPI dependencies (deny by default).
- JWT in **httpOnly** cookies; CORS locked to the frontend origin; HTTPS only.
- Cookie consent banner (lighter if Plausible). Privacy policy + Aviso legal pages (required in Spain).
- Double opt-in email; data-deletion path for users and subscribers.
- Validate every input: **Pydantic** (backend) + **zod** (frontend).

---

## 11. Project structure (monorepo)

```
/backend                      # FastAPI
  /app
    main.py                   # app + CORS + routers
    /core                     # config, security, deps
    /models                  # SQLAlchemy models
    /schemas                 # Pydantic
    /routers                 # properties, sales, inquiries, comments,
                             #   subscribers, auth, admin, availability
    /services                # email, turnstile, ratelimit, images
  /alembic                   # migrations
  pyproject.toml

/frontend                     # Next.js (React + TS)
  /app/[locale]
    /(public)/...            # home, catalog, [slug], sales, about, blog, contact
    /(admin)/admin/...       # role-gated
    sitemap.ts  robots.ts
  /components                # shadcn ui, cards, calendar, forms
  /lib                       # api client (generated), auth, seo helpers
  /messages                  # es/ru/en/uk.json
  /i18n
```

Generate the frontend API client from the backend: `npx openapi-typescript http://localhost:8000/openapi.json -o frontend/lib/api-types.ts`.

---

## 12. Build roadmap (give Claude Code one phase at a time)

Each phase is a **vertical slice** that ends deployable. Don't skip ahead.

- **Phase 0 — Foundation.** Scaffold FastAPI (+ SQLAlchemy + Alembic + Neon + `/health`) and deploy to Render; scaffold Next.js (+ Tailwind + shadcn) and deploy to Vercel; wire CORS so the frontend reads `/health`. *Outcome: two live URLs + cloud DB from day 1.*
- **Phase 1 — Data + rentals (ES only).** Models + migrations + seed real listings; FastAPI CRUD-read endpoints; Next.js catalog grid + property detail + gallery; generate the TS API client.
- **Phase 2 — i18n.** 4-locale routing, message catalogs, translation tables, language switcher, hreflang, localized slugs.
- **Phase 3 — Admin + auth + CRUD.** fastapi-users (admin role); admin UI for rentals & sales with 4-language tabs; image upload/reorder.
- **Phase 4 — Forms + anti-spam.** Contact + inquiry endpoints, Turnstile + honeypot + slowapi, admin inquiries inbox. *(Fixes spam.)*
- **Phase 5 — Availability calendar.** Blocks model + admin calendar + guest date-range picker → inquiry with dates.
- **Phase 6 — Users + comments/reviews.** User signup/login, post + moderate comments/ratings, aggregate rating.
- **Phase 7 — Email subscriptions.** Double opt-in, confirm/unsubscribe, admin broadcasts.
- **Phase 8 — SEO + performance.** JSON-LD, sitemap, robots, metadata, image optimization, blog.
- **Phase 9 — Launch.** GDPR (consent, legal pages), analytics, Google Business Profile, 301-redirect old URLs, submit sitemap to Search Console.

---

## 13. Environment variables

```
# --- Backend (FastAPI) ---
DATABASE_URL=                        # Neon Postgres
JWT_SECRET=
ACCESS_TOKEN_EXPIRE_MINUTES=
FRONTEND_ORIGIN=https://www.alquileresturisticosvinaros.com   # CORS
RESEND_API_KEY=
EMAIL_FROM="Alquileres Vinaròs <hola@alquileresturisticosvinaros.com>"
TURNSTILE_SECRET_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
CLOUDINARY_URL=

# --- Frontend (Next.js) ---
NEXT_PUBLIC_API_BASE_URL=            # FastAPI URL
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
NEXT_PUBLIC_SITE_URL=https://www.alquileresturisticosvinaros.com
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=
```

---

## 14. Working effectively with Claude Code

- Keep this file as `SPEC.md` in the repo root.
- Build **one phase per session**; for full-stack slices, do the **FastAPI endpoint and the Next.js consumer together**.
- Always generate **Alembic migrations** for schema changes (never hand-edit the DB) — this is what keeps every device in sync.
- Regenerate the **TS API client** whenever the backend schema changes.
- Enforce **Pydantic + zod** on every endpoint/form; add **pytest** for availability overlap, auth, and anti-spam.
- Commit per working slice; use Vercel/Render preview deploys to verify on a real phone.

---

## 15. Open decisions to confirm

1. **Frontend rendering:** ✅ **Decided — Next.js (App Router, SSR)** for SEO. Public pages render in Server Components; public interactivity uses plain React (hooks + Context); admin CRUD uses TanStack Query. No Redux.
2. Default locale URL: `/` vs explicit `/es` (recommend `/es`).
3. Reviews: any logged-in user (moderated) vs only after a confirmed stay? (v1: any, moderated.)
4. Backend host: Render vs Railway vs Fly.io.
5. Image host: Cloudinary vs Cloudflare R2.
6. Analytics: Plausible (cookieless) vs GA4.

---

## 16. Future enhancements (post-v1)

- **Online deposits** via Stripe (inquiries → confirmed paid bookings).
- **Channel manager / iCal sync** with Airbnb & Booking (prevent double bookings).
- Multi-currency display; owner/co-host portal; saved wishlists; PWA; WhatsApp deep links prefilled with the property name; automated "new offers" digest.

---

*End of specification (v2). Start at Phase 0.*
