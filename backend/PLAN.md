# PLAN.md — Backend Implementation Plan

Maps each ROADMAP step to concrete backend tasks. Check off items as they're completed.

---

## Phase 1 — Skeleton & Config (ROADMAP 1.1)

- [x] Directory structure: `app/core/`, `app/db/`, `app/models/`, `app/schemas/`, `app/routers/`, `app/services/`, `app/utils/`, `tests/`
- [x] `requirements.txt` — all dependencies
- [x] `pyproject.toml` — Ruff + pytest config
- [x] `app/core/config.py` — `Settings(BaseSettings)` with all env vars
- [x] `app/db/base.py` — SQLAlchemy `DeclarativeBase`
- [x] `app/db/session.py` — async engine + session factory + `get_db`
- [x] `app/core/dependencies.py` — re-exports `get_db`
- [x] `app/main.py` — FastAPI app, CORS, `GET /health`
- [x] `.env.example` + `.env` (gitignored)
- [x] `.gitignore` updated
- [ ] Verify end-to-end health check from frontend (`next dev` calls `/health`)

---

## Phase 2 — Models & First Migration (ROADMAP 1.2)

SQLAlchemy 2.0 async models. All entities support translations from day one.

- [x] `app/models/user.py` — `users` (id, email, hashed_password, role enum, created_at)
- [x] `app/models/property.py` — `properties` (id, kind enum, status enum, bedrooms, guests, price_per_night, sale_price, location, lat, lng, created_at, updated_at)
- [x] `app/models/property_translation.py` — `property_translations` (property_id, locale, title, slug, description, meta_title, meta_description). Unique on (property_id, locale) and (locale, slug)
- [x] `app/models/property_image.py` — `property_images` (property_id, url, public_id, position, is_main)
- [x] `app/models/amenity.py` — `amenities` + `amenity_translations` + `property_amenities` join table
- [x] `app/models/__init__.py` — re-export all models so Alembic sees them
- [x] `alembic.ini` — config pointing at `DATABASE_URL`
- [x] `alembic/env.py` — async Alembic env importing `Base.metadata`
- [x] Generate first migration: `alembic revision --autogenerate -m "initial tables"`
- [x] Apply to Neon: `alembic upgrade head`

---

## Phase 3 — Pydantic Schemas (ROADMAP 1.2)

Request/response schemas, separate from ORM models.

- [ ] `app/schemas/user.py` — UserCreate, UserRead, UserUpdate
- [ ] `app/schemas/property.py` — PropertyCreate, PropertyRead, PropertyUpdate, PropertyList + translation sub-schemas
- [ ] `app/schemas/amenity.py` — AmenityCreate, AmenityRead + translations
- [ ] `app/schemas/common.py` — PaginatedResponse, MessageResponse

---

## Phase 4 — Auth & Admin Guard (ROADMAP 1.3)

JWT in httpOnly cookies, admin role enforcement.

- [ ] `app/core/security.py` — JWT create/decode, password hashing (passlib bcrypt)
- [ ] `app/core/dependencies.py` — add `get_current_user`, `require_admin`
- [ ] `app/services/auth_service.py` — register, login, get current user
- [ ] `app/routers/auth.py` — `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- [ ] `app/main.py` — mount auth router
- [ ] Seed first admin user (CLI command or init script)
- [ ] Test: register -> login -> access `/auth/me` -> reject without cookie

---

## Phase 5 — Admin CRUD (ROADMAP 1.4)

Full create/read/update/delete for properties and amenities behind `require_admin`.

- [ ] `app/services/property_service.py` — CRUD + image management + translation upsert
- [ ] `app/services/amenity_service.py` — CRUD + translations
- [ ] `app/routers/admin.py` — admin-only router prefix `/admin`
  - [ ] `POST /admin/properties` — create property with translations
  - [ ] `GET /admin/properties` — list all (drafts + published)
  - [ ] `GET /admin/properties/{id}` — detail with translations + images
  - [ ] `PATCH /admin/properties/{id}` — update property + translations
  - [ ] `DELETE /admin/properties/{id}` — soft delete or remove
  - [ ] `POST /admin/properties/{id}/images` — upload (Cloudinary)
  - [ ] `PATCH /admin/properties/{id}/images` — reorder, set main
  - [ ] `DELETE /admin/properties/{id}/images/{image_id}` — remove
  - [ ] `GET /admin/amenities` — list
  - [ ] `POST /admin/amenities` — create with translations
  - [ ] `PATCH /admin/amenities/{id}` — update
  - [ ] `DELETE /admin/amenities/{id}` — remove
- [ ] `app/main.py` — mount admin router

---

## Phase 6 — Public Read Endpoints (ROADMAP 2)

Public routes return only `status='published'`, locale-filtered.

- [ ] `app/routers/properties.py`
  - [ ] `GET /properties?locale=&kind=rental&page=&limit=&bedrooms=&guests=&min_price=&max_price=` — paginated catalog
  - [ ] `GET /properties/{slug}?locale=` — detail by translated slug
- [ ] `app/routers/sales.py` — same pattern, `kind=sale`
- [ ] `app/routers/amenities.py` — `GET /amenities?locale=`
- [ ] `app/services/property_service.py` — add public query methods (published-only, locale join)
- [ ] `app/main.py` — mount public routers

---

## Phase 7 — Internationalization Support (ROADMAP 3)

Backend already supports translations from Phase 2. This phase adds:

- [ ] Translation tab endpoints for admin: upsert translations per locale (ES/RU/UK/EN)
- [ ] `GET /properties/{slug}?locale=` returns correct translation or fallback
- [ ] Slug uniqueness per locale enforced at DB level

---

## Phase 8 — Inquiries + Anti-Spam (ROADMAP 4)

- [ ] `app/models/inquiry.py` — `inquiries` (name, email, phone, message, property_id, check_in, check_out, guests, locale, ip, created_at, is_read)
- [ ] `app/schemas/inquiry.py` — InquiryCreate (+ turnstile_token, honeypot field), InquiryRead
- [ ] `app/services/turnstile.py` — verify token via httpx to Cloudflare
- [ ] `app/services/rate_limit.py` — slowapi + Upstash Redis
- [ ] `app/core/dependencies.py` — add `verify_turnstile`, `check_honeypot`, `check_time_to_submit`, `rate_limit`
- [ ] `app/routers/inquiries.py` — `POST /inquiries` (all anti-spam deps)
- [ ] `app/routers/admin.py` — add `GET /admin/inquiries`, `PATCH /admin/inquiries/{id}/read`
- [ ] Alembic migration for `inquiries` table

---

## Phase 9 — Availability Calendar (ROADMAP 5)

- [ ] `app/models/availability.py` — `availability_blocks` (property_id, start_date, end_date). No overlaps per property
- [ ] `app/schemas/availability.py` — AvailabilityBlockCreate, AvailabilityBlockRead
- [ ] `app/services/availability_service.py` — create with overlap validation, list, delete
- [ ] `app/routers/availability.py` — `GET /properties/{id}/availability` (public)
- [ ] `app/routers/admin.py` — add `POST /admin/properties/{id}/availability`, `DELETE /admin/availability/{id}`
- [ ] Alembic migration
- [ ] Tests: overlap rejection, valid ranges, edge cases

---

## Phase 10 — User Accounts + Comments (ROADMAP 6)

- [ ] `app/models/comment.py` — `comments` (user_id, property_id, text, rating 1-5, status: pending|approved|rejected, created_at)
- [ ] `app/schemas/comment.py` — CommentCreate, CommentRead
- [ ] `app/services/comment_service.py` — create (requires auth), moderate, aggregate rating
- [ ] `app/routers/comments.py` — `POST /comments` (auth + anti-spam), `GET /properties/{id}/comments` (approved only)
- [ ] `app/routers/admin.py` — add `GET /admin/comments`, `PATCH /admin/comments/{id}` (approve/reject)
- [ ] Alembic migration

---

## Phase 11 — Email Subscriptions (ROADMAP 7)

- [ ] `app/models/subscriber.py` — `subscribers` (email, locale, status: pending|confirmed|unsubscribed, confirm_token, created_at)
- [ ] `app/schemas/subscriber.py` — SubscribeRequest, SubscriberRead
- [ ] `app/services/email_service.py` — send via Resend (httpx)
- [ ] `app/services/subscriber_service.py` — subscribe (double opt-in), confirm, unsubscribe
- [ ] `app/routers/subscribers.py` — `POST /subscribe`, `GET /confirm/{token}`, `GET /unsubscribe/{token}`
- [ ] `app/routers/admin.py` — add `GET /admin/subscribers`, broadcast endpoint
- [ ] Alembic migration

---

## Phase 12 — Blog/Posts (ROADMAP 8)

- [ ] `app/models/post.py` — `posts` + `post_translations` (locale, title, slug, content, meta_title, meta_description)
- [ ] `app/schemas/post.py` — PostCreate, PostRead + translations
- [ ] `app/services/post_service.py` — CRUD
- [ ] `app/routers/posts.py` — `GET /posts?locale=`, `GET /posts/{slug}?locale=` (published only)
- [ ] `app/routers/admin.py` — add post CRUD
- [ ] Alembic migration

---

## Phase 13 — SEO Support Endpoints (ROADMAP 8)

- [ ] `GET /sitemap-data` — all published properties + posts x locale (for `app/sitemap.ts`)
- [ ] Structured data helpers: aggregate ratings, property metadata

---

## Phase 14 — GDPR & Data Deletion (ROADMAP 9)

- [ ] `DELETE /auth/me` — user account deletion (cascade comments, anonymize inquiries)
- [ ] `DELETE /unsubscribe/{token}` — subscriber data removal
- [ ] Privacy policy content endpoints if needed

---

## Phase 15 — Production Readiness (ROADMAP 10)

- [ ] Dockerfile for backend
- [ ] `docker-compose.yml` at repo root (backend + frontend, DB stays on Neon)
- [ ] Health check with DB ping
- [ ] Logging configuration
- [ ] HTTPS enforcement notes
- [ ] CI: `ruff check . && ruff format --check . && pytest`

---

## Current Status

**Completed:** Phase 1 (skeleton & config), Phase 2 (models & Alembic migration)
**Next:** Phase 3 (Pydantic schemas)
