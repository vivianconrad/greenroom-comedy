# Greenroom

**Produce comedy shows without losing your mind.**

Greenroom is a production platform for independent comedy show producers. It replaces the spreadsheets, Google Forms, and notes apps that most producers juggle, combining guided checklists, performer management, and production tools into one place.

## What It Does

Greenroom helps producers manage every part of putting on a show:

- **Smart Checklists** — Template-driven production timelines that count backwards from your show date. Know what to do, when to do it, and who's responsible. Customizable per show with a three-option save system (this show only, update series template, or push to all upcoming shows).
- **Performer Pipeline** — A global performer database shared across all your shows. Add performers, manage their details, bios, and promo materials. Book performers to shows and manage show-specific details (slot order, payment, status).
- **Series & Show Management** — Organize shows into recurring series (monthly, weekly, etc.) or one-offs. Each series has its own templates, performer pool, and custom collections. Each show instance gets its own dashboard, lineup, and checklist.
- **Custom Collections** — A flexible system for any named list a producer needs. Superlatives, audience games, show themes, recurring segments, or anything else. Starter templates are suggested based on show type but everything is renameable and deletable.
- **Day-of Duties** — Assign responsibilities to crew and cast for the day of the show. Define duty templates at the series level, then assign them per show.
- **Run of Show Builder** — Visual running order with calculated start times, colour-coded slot types, walk-up songs, and tech cues.
- **Group Communications** — Compose and send messages to performer groups, tech crew, or the whole team. Templates with auto-filled show details. Select recipients by role or custom groups.
- **Promo Timeline** — Social media schedule baked into the checklist. Know when to post the first teaser, when to push stories, and when to do the day-after recap.
- **Ticketing & Financials** — Track ticket sales, venue costs, performer payments, and revenue.
- **Show Day Mode** — A stripped-down view for when doors open. Just the run of show, walk-up songs, tech cues, and day-of duties. No clutter.
- **Post-Show Notes** — Log attendance, audience energy, what worked, and what didn't. Build a history that helps you make better decisions over time.

---

## Architecture

The app has a three-level navigation structure:

```
All Series (main dashboard)
  └── Series Dashboard (shared databases, templates, performer pool)
        └── Individual Show (full production tools)
```

One-off shows skip the series level and go straight to the show dashboard.

The performer database is global (shared across all series) with series-level filtering via a junction table.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js (App Router) | SSR for landing page, client-side app, API routes |
| Styling | Tailwind CSS | Custom warm/playful theme |
| Database | Supabase (PostgreSQL) | Relational data, auth, real-time, file storage |
| Hosting | Vercel | Auto-deploy from GitHub |
| Testing | Jest + jsdom | Unit tests for utility functions |

---

## Database Schema

Core tables:

- `profiles` — User accounts (extends Supabase Auth)
- `series` — Recurring or one-off show concepts
- `shows` — Individual show instances within a series
- `performers` — Global performer database
- `performer_series` — Links performers to series (many-to-many)
- `show_performers` — Performers booked for a specific show with show-specific details
- `checklist_templates` — Default checklist for a series (seeds new shows)
- `checklist_items` — Per-show checklist (generated from template, fully editable)
- `series_collections` — Custom named lists per series (superlatives, games, themes, etc.)
- `collection_items` — Entries within a collection
- `show_collection_selections` — Which collection items were picked for a specific show
- `comm_templates` — Communication templates with variable placeholders
- `duty_templates` — Default day-of duties defined at the series level
- `show_duties` — Duty assignments for a specific show

Database triggers automatically:
- Create a user profile on signup
- Generate a show's checklist from the series template when a show is created
- Seed starter collections when a new series is created (based on show type)

Database RPCs:
- `push_checklist_is_active_to_upcoming_shows` — Atomically pushes `is_active` changes from a checklist edit to all upcoming shows in the same series

---

## Project Structure

```
greenroom/
├── app/
│   ├── (auth)/              # Login, signup pages
│   │   ├── login/
│   │   └── signup/
│   ├── (app)/               # Authenticated app
│   │   └── dashboard/
│   │       ├── page.jsx           # Main dashboard (all series)
│   │       ├── series/[id]/       # Series dashboard
│   │       ├── shows/[id]/        # Individual show dashboard
│   │       └── performers/        # Global performer database
│   ├── api/
│   │   ├── auth/callback/   # OAuth callback handler
│   │   └── demo/reset/      # Demo data reset endpoint
│   ├── page.jsx             # Landing page
│   ├── global-error.jsx     # Root error boundary
│   └── layout.js            # Root layout
├── components/
│   ├── ui/                  # Reusable UI primitives (Button, Modal, Pill, etc.)
│   ├── layout/              # Sidebar, breadcrumb, demo banner
│   ├── forms/               # Create/edit modals for series and shows
│   ├── dashboard/           # Series card, show mini card
│   ├── performers/          # Performer list and add modal
│   ├── series/              # Series-level tab components
│   └── show/                # Show-level tab components + show day mode
├── lib/
│   ├── supabase/            # Supabase client (browser, server, middleware)
│   ├── queries/             # Data fetching functions
│   ├── actions/             # Server actions (mutations)
│   └── utils.js             # Helpers (cn, formatDate, daysUntil, slugify)
├── supabase/
│   └── migrations/          # SQL migrations (apply via Supabase CLI or SQL editor)
├── __tests__/               # Jest unit tests
├── middleware.js             # Auth session refresh, route protection
├── jest.config.js            # Jest config (next/jest preset, jsdom environment)
├── tailwind.config.js        # Custom theme (cream, coral, sage, etc.)
└── .env.local               # Supabase URL + anon key (not committed)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase account (free tier works)
- A Vercel account (free tier works)

### Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/YOUR_USERNAME/greenroom.git
   cd greenroom
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file from the example:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase project URL and anon key (found in Supabase dashboard → Settings → API Keys).

4. Run the database migrations. Either use the Supabase CLI:
   ```bash
   supabase db push
   ```
   Or paste each file from `supabase/migrations/` into the Supabase dashboard SQL editor.

5. Start the dev server:
   ```bash
   npm run dev
   ```

6. Open http://localhost:3000

### Testing

```bash
npm test
```

Tests live in `__tests__/`. The suite currently covers utility functions (`cn`, `formatDate`, `daysUntil`, `slugify`). Uses Jest with `jest-environment-jsdom`.

### Deploy

Push to `main` on GitHub. Vercel auto-deploys. Make sure your environment variables are set in Vercel's project settings.

---

## Status

Core production management features are implemented:

- Series and show creation/editing
- Checklist management with template push (series-level and cross-show)
- Performer database with per-show booking
- Collections system
- Day-of duties with series templates
- Group communications with templates
- Show day mode
- Show-level tabs: checklist, performers, duties, comms, run of show, promo, tickets, financials, materials, notes

### Backlog

- Pre-show performer forms (automated outreach)
- Eventbrite / ticketing platform API integration
- Series-level analytics (attendance trends, revenue trends, performer correlations)
- Push notifications for task reminders
- Multi-producer collaboration
- Public show pages with SEO and structured event data (schema.org)
- Offline show-day mode via PWA service worker

---

## Design

The visual identity is warm, playful, and approachable. Not corporate SaaS.

- **Colours:** Cream (#FFF8F0), Coral (#E8735A), Deep Brown (#2C1810), Sage (#A8C5A0), Butter (#FFE566), Lavender (#C5B8D9)
- **Typography:** Fraunces (display/headings), DM Sans (body)
- **Aesthetic:** Rounded corners, soft shadows, colour-coded status pills, progress bars

---

## Built For

Independent comedy producers who run stand-up showcases, variety shows, open mics, sketch nights, improv shows, drag shows, burlesque nights, comedy festivals, and everything in between.

Built in Chicago.

---

## License

Private. Not open source (yet).
