# Greenroom — Feature Roadmap & Backlog

Last updated: March 2026

---

## Currently Built (v0.1)

- Auth (email/password, Google OAuth, demo mode)
- Main dashboard (all series overview)
- Series dashboard with tabs: shows, performers, collections, checklist template, comms, duty templates
- Individual show dashboard with tabs: dashboard, checklist, performers, run of show, promo, tickets, materials, comms, financials, notes
- Global performer database with series tagging and filtering
- Checklist template system (series-level templates, per-show instances, three-option save)
- Conditional checklist tasks
- Generic collections system (superlatives, games, themes, or whatever the producer names)
- Starter collection templates based on show type
- Communication templates with variable placeholders
- Run of show builder with calculated times and color-coded slots
- Performer roles (performer, host, headliner, opener, tech, camera, etc.)
- Show crew table (non-performing team members)
- Day-of duties with templates
- Post-show notes (attendance, rating, energy, what worked, what didn't)
- Ticketing tracker (platform, price, URL, capacity, sales)
- Financials (revenue, expenses, performer payments, net)
- App suggestion/feedback form
- Sidebar navigation with series/show hierarchy
- Breadcrumb navigation
- One-off series skip to show dashboard
- Hosts field on series and shows
- Tagline and description fields on series
- Responsive layout (desktop sidebar, mobile hamburger)
- Slug fields on series and shows for future public pages
- Soft delete / trash system for series and shows (restore or permanently delete)
- Post-show debrief banner on show dashboard (surfaces missing notes + unpaid performers, links to notes tab)
- "Mark as done" action on shows (moves show into the Past Shows list)
- Bulk move past shows to trash from the series shows tab

---

## Phase 2: Performer Pipeline

### Public Application Form
- Public page at /apply/[series-slug] that replaces Google Forms
- Fields matching the current Google Form: name, stage name, pronouns, instagram, email, consent to tag, what they want to do, performance clip or description, tech needs, availability, have we met, how they heard about us
- Submissions land in the master performer database with a "pending" status
- Application review queue in the app: accept, decline, or save for later
- Accepted performers auto-tagged to the series
- Configurable per series (each series can have its own form with different questions)

### Pre-Show Performer Form
- Sent automatically when a performer is booked for a show
- Link: /form/[token] (unique per performer per show)
- Fields: comfort with show format, superlative suggestions, promo name, short bio, topics to avoid in intro, upcoming projects to mention, promo photo upload, equipment they're bringing, equipment they need from us, background music needs, walk-up song upload, sound check preference, lineup spot preference, photo/video consent, payment method (venmo/zelle/cash), pronouns, instagram, anything else
- Responses auto-populate show_performers fields (bio, walk_up_song, photo_url, tags_ok, payment_method)
- Form status tracked: sent, opened, completed
- Automatic reminder if not filled out X days before show

### File Uploads
- Performer promo photos (stored in Supabase Storage, linked to show_performers.photo_url)
- Walk-up music files (stored in Supabase Storage, linked to show_performers.walk_up_file)
- Playback for walk-up music in the run of show and show day mode
- Bulk download of all performer photos for promo material creation

### Performer Database Enhancements
- Application history per performer (when they applied, which shows)
- Performance history across all shows with notes per show
- "Last contacted" date
- Availability tracking (dates they've said they're available or unavailable)
- Performer merge (combine duplicate records)
- Availability calendar view — visual "who's available when" before booking a lineup

---

## Phase 3: Communications

### Full Communications Hub
- Recipient group selector: Everyone, All Performers, Hosts Only, Tech & Camera, Custom
- Preview of who will receive (names + contact method)
- Template selector with auto-filled show variables
- Editable message body after template fills
- Copy to clipboard (primary v1 action)
- Mark as sent (logs to comm_log)
- Sent message history per show

### Group Messaging
- Per-show group thread view (not real-time chat, just a log of messages sent)
- Quick-send from multiple places: performer tab, show dashboard, show day mode
- "Send call time + RO to all performers" one-click flow
- "Send details to tech/camera crew" one-click flow

### Producer Reminders & Show Countdown
- Dashboard widget showing days until next show with open checklist items
- Email reminders to the producer (via Resend) for upcoming deadlines (e.g. "show in 5 days, 3 checklist items still open")
- Configurable reminder schedule per series

### Automated Sending (future)
- Email sending via Resend integration
- SMS via Twilio (optional)
- Instagram DM API if it ever becomes available
- Scheduled sends (e.g. auto-send RO 24 hours before show)

---

## Phase 4: Show Day Mode

### Enhanced Backstage View
- Large, phone-optimised layout
- Live clock showing current time
- Run of show with current/next slot highlighted based on real time
- Tap performer to see contact info
- Day-of duties grouped by person with completion checkboxes
- Day-of checklist tasks
- Quick contacts for all performers and crew
- Floating quick-compose button for sending messages
- Walk-up music playback controls (if files uploaded)

### Door List
- Generate a shareable door list for the door person (sorted alphabetically, includes +1s and payment status)
- Export as PDF or shareable link
- Quick-add comps and guests from show day mode

### Offline Support
- PWA service worker for offline availability
- Cache the show day mode data when online
- Sync completed checkboxes and duty checks when back online
- Works without internet backstage

---

## Phase 5: Public Show Pages & SEO

### Public Series Page
- URL: greenroom.app/s/[series-slug]
- Show name, venue, description, upcoming dates, past shows
- Performer lineup for upcoming shows (if published)
- Ticket links
- Structured data (schema.org Event markup) for Google
- Persistent URL that builds SEO authority over time for recurring shows

### Public Show Page
- URL: greenroom.app/s/[series-slug]/[show-slug]
- Date, time, venue, lineup, ticket link
- Schema.org Event markup
- Social sharing meta tags (Open Graph, Twitter cards)
- Inherits SEO authority from parent series page

### Google Event Integration
- Structured data that gets shows into Google's event listings
- Automatic submission to Google Events
- Rich results in search (date, venue, ticket price)

---

## Phase 6: Analytics & Metrics

### Series-Level Stats Dashboard
- Attendance trend over time (line chart across shows)
- Average tickets sold per show
- Revenue trend
- Which performers correlate with higher attendance
- Rating and energy trends
- Best and worst performing shows

### Show-Level Metrics
- Ticket sales velocity (how fast tickets sold relative to show date)
- Comparison to series averages
- Performer form completion rate

### Eventbrite / Ticketing API Integration
- Connect Eventbrite account to auto-sync ticket sales
- Real-time ticket count updates
- Attendee data import
- Support for Dice, Shotgun, and other platforms over time
- Page view tracking from ticketing platform

### Show Ranking / Performance Score
- Composite score based on attendance, ticket sales, audience energy, rating
- Track whether shows are trending up or down
- Alerts when metrics drop below series average

---

## Phase 7: Multi-Producer Collaboration

### Team Accounts
- Invite other producers to a series (Vi, Emma, Maddie each have their own login)
- Role-based permissions: owner, editor, viewer
- Task assignments tied to real user accounts (not just text names)
- Activity log: who did what and when

### Shared Performer Database
- Producers on the same series share the performer database for that series
- Global database stays private to each producer
- Permission to add/edit performers configurable per series

### Real-Time Updates
- Supabase real-time subscriptions for checklist changes
- See when a teammate checks off a task
- Conflict resolution if two people edit the same thing

---

## Phase 8: Advanced Features

### Show Duplication
- One-click "Duplicate this show" to clone a show's structure (checklist, run of show template, crew, settings) into a new show
- Option to include or exclude performers when duplicating
- Precursor to full recurring show automation

### Post-Show Debrief Flow *(partially shipped)*
- ~~Debrief banner on dashboard tab surfacing missing notes + unpaid performers~~ ✓
- ~~Mark as done action (sets status = completed, moves show to Past Shows)~~ ✓
- Still to do: one-click "send thank-yous" from debrief banner, "mark all paid" shortcut, close open comms prompt

### Bulk Show Actions *(partially shipped)*
- ~~Bulk move past shows to trash~~ ✓
- Still to do: bulk archive (separate from trash), bulk tag/label

### Recurring Show Automation
- Auto-create the next show instance X weeks before the next date in the series
- Auto-send booking inquiries to "regulars" list
- Auto-post "applications open" to the public form

### Performer Self-Service Portal
- Performers create their own account
- View their upcoming shows across all producers who book them
- Submit forms, upload materials, confirm availability
- See their performance history

### Financial Reports
- Monthly/quarterly revenue reports
- Tax-friendly expense exports
- Per-performer payment history
- Venue cost tracking over time
- Profit/loss per show and per series

### Venue Database
- Reusable venue records: name, address, capacity, load-in time, tech specs, parking notes, contact person
- "Select venue" when creating a show instead of re-entering details each time
- Venue cost history across shows for financial planning
- Multi-venue support per series for touring shows

### Ticket QR Code
- QR code button on the Tickets tab that opens a modal showing a printable/displayable QR code for the ticket URL
- Useful for door signage, on-screen display, or inclusion in promo materials
- `qrcode` npm package makes this trivial to implement
- Also display in Show Day Mode's sticky header when a ticket URL is set

### Ticket Info in Show Day Mode

- Show the ticket URL (as a tappable link) and promo code in the Show Day Mode sticky header or as a collapsible section
- Means the door person has everything in one screen without switching tabs
- Promo code should be large and tappable-to-copy, same pattern as the CopyBadge component

### Ticketing Platform API Sync

- Connect an Eventbrite (or Humanitix/Dice) account to auto-update `tickets_sold` and `capacity` from the platform
- The existing `ticket_platform` field is the hook to determine which API to call
- Real-time ticket count updates, eliminating manual entry
- Phase 1: webhook endpoint that receives sales events and updates the show record
- Phase 2: pull-based sync triggered from the Tickets tab ("Refresh from Eventbrite" button)
- Phase 3: OAuth connection flow in series settings

### Promo Tab (Show-Level)
- Social caption generator: auto-draft Instagram/Facebook post copy from show details and performer bios
- Asset checklist: track which promo materials are done (poster, IG story, event page, etc.)
- Performer promo kit: collect approved performer headshots and bios for promo use
- Show hashtags and tagging list (performer handles pre-filled from performer records)
- Link to public show page once Phase 5 is live

### Integrations
- Google Calendar sync (show dates, task due dates)
- Instagram API (auto-post promo, pull engagement metrics)
- Spotify/Apple Music (walk-up song lookup and preview)
- Canva (promo material templates)
- Square/Venmo/Zelle (payment tracking)

### Mobile App (if PWA isn't enough)
- React Native wrapper around the web app
- Push notifications
- Camera integration for backstage photos
- Offline-first architecture

---

## Ideas Parking Lot (not prioritised, just captured)

- Audience email list collection at shows
- QR code generator for show pages and ticket links
- Performer rating system (private, producer-only)
- "Similar performers" suggestions based on act type and tags
- Show poster/flyer generator with performer photos
- Setlist/bit tracking for standup performers
- Venue database with capacity, tech specs, contact info, cost history
- Multi-venue support per series (touring shows)
- Festival mode with multiple stages, time blocks, and schedule grid
- Merch tracking
- Sponsor management and fulfilment tracking
- After-party coordination
- Green room / backstage rider tracking
- Accessibility info tracking (wheelchair access, ASL interpreter, etc.)
- Carbon offset calculator for touring shows (very future)
- AI-assisted lineup building based on variety, audience preferences, and performer history
- AI-assisted promo copy generation from performer bios
- Community features: producer-to-producer networking, shared performer recommendations

---

## Priority Framework

When deciding what to build next, ask:

1. **Does it solve a problem I hit during a real show?** → Build it now.
2. **Did my producer friend ask for it?** → Build it soon.
3. **Would it make onboarding a new producer easier?** → Build it before inviting beta users.
4. **Is it a nice-to-have that no one has specifically needed?** → Park it.
5. **Is it technically cool but doesn't serve producers?** → Skip it.

The best roadmap is the notes doc from actually using Greenroom to produce a show. Everything above is a guess until validated by real usage.