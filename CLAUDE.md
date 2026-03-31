# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev       # Start development server (Turbopack)
npm run build     # Production build
npm run lint      # ESLint
npm run test      # Jest (all tests)
npx jest --testPathPattern=<file>  # Run a single test file
```

## Architecture

**Greenroom** is a production management platform for independent comedy show producers — built by a producer for producers. The first user runs a monthly variety show (BGT Variety Hour) at The Lincoln Lodge in Chicago.

Stack: Next.js App Router, **JavaScript (not TypeScript)**, Supabase (Postgres + Auth + RLS), Tailwind CSS v4, React 19. Hosted on Vercel (auto-deploys from main).

### Navigation Hierarchy

```text
Dashboard (all series)
  → Series Dashboard (templates, performer pool, series settings)
    → Show (full per-show production tools)
```

One-off series (`is_one_off = true`) skip the series dashboard and go straight to the show.

### Route Groups

- `app/(auth)/` — Public login/signup pages
- `app/(app)/dashboard/` — Protected routes (enforced by `proxy.js`)
  - `series/[id]/` — Series dashboard
  - `show/[id]/` — Individual show dashboard
  - `performers/` — Global performer database
- `app/api/` — Auth callback, demo reset
- `proxy.js` — Protects `/dashboard/*`, refreshes auth session, redirects with `?redirectTo` param

### Data Layer (`lib/`)

- `lib/queries/` — Read-only Supabase queries called from **Server Components**
- `lib/actions/` — Mutations as **Server Actions** called from Client Components
- `lib/actions/utils.js` — `getAuthenticatedUser`, `verifyShowOwnership`, `verifySeriesOwnership`, `verifyPerformerOwnership`
- `lib/supabase/client.js` — Browser client (`createBrowserClient`)
- `lib/supabase/server.js` — Server client (`createServerClient` with cookies)
- `lib/supabase/middleware.js` — Session refresh logic

**Never** use a bare `createClient` without the SSR wrapper.

### Server vs Client Split

- Pages and layouts fetch data as Server Components via `lib/queries/`
- Client Components (`"use client"`) handle interactivity: forms, modals, toggles, tabs
- Call `revalidatePath()` after every mutation in Server Actions
- Every Server Action: get authenticated user → verify ownership → mutate

### Component Organization

- `components/ui/` — Generic primitives re-exported from `components/ui/index.js`
- `components/layout/` — Sidebar, breadcrumb, demo banner
- `components/forms/` — Modal-based create/edit flows
- `components/series/` — Series-level tab components
- `components/show/` — Show-level tab and day-of mode components
- `components/performers/` — Performer management

### Styling

- Tailwind CSS v4 with custom tokens in `tailwind.config.js`
- Custom colors: `cream`, `peach`, `coral`, `coral-hover`, `deep`, `mid`, `soft`, `butter`, `butter-soft`, `sage`, `sage-bg`, `lav`, `lav-bg`, `red`, `red-bg`, `amber`, `amber-bg`, `green`, `green-bg`
- Custom border-radius: `rounded-card` (14px), `rounded-card-lg` (22px)
- Fonts: `font-display` → Fraunces (headings), `font-body` → DM Sans (body)
- `cn()` in `lib/utils.js` merges Tailwind classes (clsx + tailwind-merge)

## Database Schema

These are the **exact** column names. Do not invent columns not listed here.

**profiles:** `id`, `display_name`, `email`, `created_at`

**series:** `id`, `owner_id`, `name`, `venue`, `venue_name`, `frequency`, `show_type`, `is_one_off`, `default_call_time`, `default_doors_time`, `default_show_time`, `tagline`, `description_long`, `default_hosts`, `slug`, `created_at`

**shows:** `id`, `series_id`, `date`, `call_time`, `doors_time`, `show_time`, `venue`, `venue_cost`, `capacity`, `theme`, `status`, `hosts`, `ticket_platform`, `ticket_price`, `ticket_url`, `tickets_sold`, `notes_attendance`, `notes_rating`, `notes_energy`, `notes_worked`, `notes_didnt_work`, `notes_next_time`, `slug`, `created_at`

**performers:** `id`, `owner_id`, `name`, `pronouns`, `act_type`, `instagram`, `email`, `contact_method`, `how_we_met`, `book_again`, `audience_favourite`, `notes`, `tags`, `created_at`

**performer_series:** `performer_id`, `series_id`

**show_performers:** `id`, `show_id`, `performer_id`, `slot_label`, `slot_order`, `set_length`, `call_time`, `walk_up_song`, `walk_up_file`, `bio`, `photo_url`, `tags_ok`, `confirmed`, `form_complete`, `paid`, `payment_amount`, `payment_method`, `role`, `created_at`

**show_crew:** `id`, `show_id`, `name`, `role`, `contact_method`, `contact_info`, `call_time`, `notes`, `created_at`

**checklist_templates:** `id`, `series_id`, `task`, `weeks_out`, `category`, `stage`, `default_owner`, `enabled`, `condition`, `sort_order`

**checklist_items:** `id`, `show_id`, `template_id`, `task`, `weeks_out`, `due_date`, `category`, `stage`, `owner`, `enabled`, `done`, `done_at`, `sort_order`

**series_collections:** `id`, `series_id`, `name`, `description`, `icon`, `sort_order`, `created_at`

**collection_items:** `id`, `collection_id`, `text`, `description`, `status`, `sort_order`, `created_at`  (`status`: `'available'` | `'rejected'` | `'used'`)

**show_collection_selections:** `id`, `show_id`, `collection_item_id`, `assigned_to`, `notes`, `created_at`

**comm_templates:** `id`, `series_id`, `name`, `body`, `sort_order`

**comm_log:** `id`, `show_id`, `template_id`, `recipient_group`, `recipient_names`, `subject`, `body`, `sent_at`, `sent_via`

**show_duties:** `id`, `show_id`, `assigned_to`, `duty`, `time_note`, `sort_order`, `completed`, `created_at`

**duty_templates:** `id`, `series_id`, `default_assigned_to`, `duty`, `time_note`, `sort_order`

**app_suggestions:** `id`, `user_id`, `user_email`, `category`, `body`, `status`, `created_at`

### Key Relationships & Ownership

- Ownership column is **`owner_id`** on `series` and `performers` — never `user_id`
- `series.owner_id` → `profiles.id`
- `performers.owner_id` → `profiles.id`
- `show_performers.performer_id` is nullable (TBD slots)
- `performer_series` is the junction for performer↔series (many-to-many)
- `checklist_items.template_id` → `checklist_templates.id` (nullable, for sync)
- RLS ownership chain: `auth.uid()` → `profiles.id` → `series.owner_id` → `shows` → everything else

### Database Triggers (automatic)

- **on_auth_user_created** → creates a profile row on signup
- **on_show_created (generate_checklist_for_show)** → copies `checklist_templates` → `checklist_items`
- **on_show_created (generate_duties_for_show)** → copies `duty_templates` → `show_duties`
- **on_series_created (seed_collections_for_series)** → creates starter collections based on `show_type`

Notable RPC: `push_checklist_enabled_to_upcoming_shows()` — atomically syncs `enabled` changes across upcoming shows in a series.

## Key Design Decisions

**Checklist template → instance pattern:** `checklist_templates` are series-level defaults. A trigger copies them into `checklist_items` when a show is created. Each show's checklist is then independently editable. Three save modes: "this show only", "update series template", "template + push to upcoming shows".

**Global performer database:** Performers live in a single table owned by the producer; tagged to series via `performer_series`. A performer can be in multiple series.

**Generic collections:** `series_collections` + `collection_items` are free-form named lists. Starter templates auto-created by `show_type` but fully deletable/renameable.

**Hosts as text:** `series.default_hosts` and `shows.hosts` are plain text fields (e.g. `"Vi, Maddie, Emma"`), not performer records.

**Show day mode:** Activated via `?mode=showday` URL param. Stripped-down backstage view: run of show, day-of duties, checklist tasks, quick contacts.

**Comm templates:** Use `[variable]` placeholders (`[name]`, `[date]`, `[callTime]`, `[venue]`, `[runningOrder]`). v1 send = copy-to-clipboard + log to `comm_log`.

**Tab state in URL:** Tab selection stored in URL `searchParams` for bookmarkability — not `localStorage` or `sessionStorage`.

## Coding Conventions

- JavaScript, not TypeScript
- `formData.get(key)?.toString() ?? null` — not `.toString()` (avoids `null` → `"null"` coercion)
- `forwardRef` on UI components where appropriate
- UI components re-exported from `components/ui/index.js`

## What NOT to Do

- Do not use `user_id` on `series` or `performers` queries — it's `owner_id`
- Do not create columns not listed in the schema above
- Do not use bare `createClient` without the SSR wrapper
- Do not use TypeScript
- Do not skip ownership verification in Server Actions
- Do not use `localStorage` or `sessionStorage` in components

## Environment Variables

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```
