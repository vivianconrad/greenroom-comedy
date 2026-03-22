# 🔴 Greenroom

**Produce comedy shows without losing your mind.**

Greenroom is a production platform for independent comedy show producers. It replaces the spreadsheets, Google Forms, and notes apps that most producers juggle, combining guided checklists, performer management, and production tools into one place.

## What It Does

Greenroom helps producers manage every part of putting on a show:

- **Smart Checklists** — Template-driven production timelines that count backwards from your show date. Know what to do, when to do it, and who's responsible. Customizable per show with a three-option save system (this show only, update series template, or push to all upcoming shows).
- **Performer Pipeline** — A global performer database shared across all your shows. Performers apply through a public form, you review and book them, and a pre-show form goes out automatically. Bios, promo photos, walk-up songs, and tech needs flow into the show without re-entering data.
- **Series & Show Management** — Organize shows into recurring series (monthly, weekly, etc.) or one-offs. Each series has its own templates, performer pool, and custom collections. Each show instance gets its own dashboard, lineup, and checklist.
- **Custom Collections** — A flexible system for any named list a producer needs. Superlatives, audience games, show themes, recurring segments, or anything else. Starter templates are suggested based on show type but everything is renameable and deletable.
- **Run of Show Builder** — Visual running order with calculated start times, colour-coded slot types, walk-up songs, and tech cues. Auto-generates from your confirmed lineup.
- **Group Communications** — Compose and send messages to performer groups, tech crew, or the whole team. Templates with auto-filled show details (date, call time, venue, running order). Select recipients by role: all performers, hosts only, tech and camera, or custom groups.
- **Promo Timeline** — Social media schedule baked into the checklist. Know when to post the first teaser, when to push stories, and when to do the day-after recap.
- **Ticketing & Financials** — Track ticket sales, venue costs, performer payments, and revenue. Connects to your existing ticketing platform (Eventbrite, Dice, etc.).
- **Show Day Mode** — A stripped-down view for when doors open. Just the run of show, walk-up songs, tech cues, and day-of tasks. No clutter.
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
| Email | Resend | Transactional emails and notifications |

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

Database triggers automatically:
- Create a user profile on signup
- Generate a show's checklist from the series template when a show is created
- Seed starter collections when a new series is created (based on show type)

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
│   │       ├── show/[id]/         # Individual show dashboard
│   │       └── performers/        # Global performer database
│   ├── (public)/            # Public pages
│   │   └── page.jsx              # Landing page
│   ├── auth/callback/       # OAuth callback
│   └── layout.jsx           # Root layout
├── components/
│   ├── ui/                  # Reusable UI components
│   ├── layout/              # Sidebar, breadcrumb, header
│   ├── forms/               # Create series, create show, etc.
│   └── auth/                # Logout button, auth components
├── lib/
│   ├── supabase/            # Supabase client (browser, server, middleware)
│   ├── queries/             # Data fetching functions
│   ├── actions/             # Server actions (mutations)
│   └── utils.js             # Helpers (cn, formatDate, slugify, etc.)
├── middleware.js             # Auth session refresh, route protection
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

4. Run the database migrations in your Supabase SQL Editor:
   - `sql/001-initial-schema.sql` — Core tables
   - `sql/002-collections-update.sql` — Generic collections system

5. Start the dev server:
   ```bash
   npm run dev
   ```

6. Open http://localhost:3000

### Deploy

Push to `main` on GitHub. Vercel auto-deploys. Make sure your environment variables are set in Vercel's project settings.

---

## Development Phases

### Phase 1: Checklist & Show Management (current)
Create series, create shows, manage checklists with templates. The core "know what to do and when" experience.

### Phase 2: Performer Pipeline
Global performer database, application forms, pre-show forms, lineup management, run of show builder, group communications.

### Phase 3: Full Production Suite
Promo timelines, ticketing integration, financials, notifications, show-day mode, post-show notes, collection management, PWA offline support.

### Backlog
- Public show pages with SEO and structured event data (schema.org)
- Eventbrite / ticketing platform API integration
- Series-level analytics (attendance trends, revenue trends, performer correlations)
- Push notifications for task reminders
- Multi-producer collaboration
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