# HYCO CRM — Lead Management System

A production-oriented Lead Management CRM for HYCO, built with the MERN-adjacent
stack requested: **Node.js, Express, MongoDB/Mongoose, JWT + RBAC** on the backend,
and **React (Vite) + Tailwind CSS** on the frontend.

This delivers everything in the current scope of the brief: lead CRUD with zero
required fields, global search, filters, assignment, the New → Contacted →
Interested → Follow Up → Won/Lost pipeline, activity timeline, follow-ups,
Excel import with column mapping + sheet-source tracking, a WhatsApp
conversation data layer, the three limited notification types, and
role-aware dashboards for Super Admin / Manager / Sales Employee.

## Project structure

```
hyco-crm/
├── server/     Express + MongoDB API
└── client/     React + Vite + Tailwind frontend
```

## 1. Backend setup

```bash
cd server
npm install
cp .env.example .env    # edit MONGO_URI / JWT_SECRET as needed
npm run seed             # creates 3 demo users + 2 sample leads
npm run dev               # starts on http://localhost:5000
```

Demo accounts created by the seed script:

| Role            | Email              | Password  |
|-----------------|--------------------|-----------|
| Super Admin     | admin@hyco.com     | admin123  |
| Manager         | manager@hyco.com   | manager123|
| Sales Employee  | ranu@hyco.com      | sales123  |

You need a MongoDB instance reachable at `MONGO_URI` (local `mongod`, Docker,
or MongoDB Atlas all work).

## 2. Frontend setup

```bash
cd client
npm install
npm run dev    # starts on http://localhost:5173, proxies /api to :5000
```

Open `http://localhost:5173` and sign in with any demo account above.

## What's implemented

- **Auth & RBAC** — JWT login, `super_admin` / `manager` / `sales_employee`
  roles enforced on every route, not just in the UI.
- **Leads** — create/edit/delete, zero required fields, phone stored as a
  string, global search across name/phone/alternate phone/email, filters
  (status, source, state, priority, assignee, date), pagination, quick
  inline status change and assignment from the list.
- **Lead detail** — full info panel, activity timeline, follow-ups tab,
  notes tab, one-click call/WhatsApp links.
- **Follow-ups** — create, complete, list by status, shown on dashboards.
- **Excel import** — upload → preview sheets/columns → map columns to CRM
  fields → duplicate check by phone → commit. The originating file name,
  sheet name and row number are stored on every imported lead
  (`lead.importSource`), and a "New lead received from Excel - Sheet X"
  notification fires per the brief.
- **WhatsApp (Web-based) data layer** — `WhatsAppConversation` /
  `WhatsAppMessage` models, conversation list + thread UI, an
  `/api/whatsapp/inbound` endpoint designed to be called by a WhatsApp Web
  bridge (e.g. `whatsapp-web.js`) when a real message arrives, which will
  auto-match to an existing lead by phone or leave it for manual linking.
- **Notifications** — only the three types in scope (`new_lead`,
  `missed_call`, `whatsapp`), with a bell dropdown and unread badge.
- **Dashboards** — different data per role, generated dynamically from
  MongoDB (no hard-coded numbers): sales employees see their own pipeline,
  managers see team performance, super admins see sources, missed calls,
  WhatsApp activity and company-wide totals.
- **Team management** — super admin can create/deactivate users.

## Deliberately out of scope (per the brief)

Website orders, e-commerce, LMS/training, Exotel/call recording, direct
Facebook Lead Ads API, WhatsApp Cloud API, a read-only role, product
categories/variants — none of these are built, matching section 34 of the
spec. The WhatsApp Web bridge itself (the piece that actually drives a
real WhatsApp Web session, e.g. via `whatsapp-web.js` + a headless browser
or a paid provider) is intentionally left as a pluggable integration point
(`POST /api/whatsapp/inbound`) rather than wired up in this environment,
since it needs a persistent server process, a phone number to pair, and
usually a VPS — not something that can run inside this sandbox.

## Design notes (UI)

The interface takes cues from TeleCRM's *workflow* only (lead-centric
navigation, My Leads, pipeline, follow-ups, WhatsApp, notifications) with
an original HYCO look: a deep navy sidebar, a single amber accent color,
Plus Jakarta Sans for headings and Inter for data-dense UI, and status
pills that stay consistent across the whole app.

## API reference

See inline comments in `server/src/routes/*.js`. Summary:

```
POST   /api/auth/login
GET    /api/auth/me

GET    /api/leads                 (search, filters, pagination, view=my|active|unassigned)
POST   /api/leads
GET    /api/leads/:id
PUT    /api/leads/:id
PATCH  /api/leads/:id/status
PATCH  /api/leads/:id/assign
DELETE /api/leads/:id
GET    /api/leads/:id/activities
POST   /api/leads/:id/notes
POST   /api/leads/import/preview
POST   /api/leads/import/commit

GET    /api/followups
POST   /api/followups
PUT    /api/followups/:id
PATCH  /api/followups/:id/status
DELETE /api/followups/:id

GET    /api/notifications
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
POST   /api/notifications/missed-call

GET    /api/dashboard

GET    /api/whatsapp/conversations
GET    /api/whatsapp/conversations/:id/messages
POST   /api/whatsapp/conversations/:id/messages
PATCH  /api/whatsapp/conversations/:id/assign
POST   /api/whatsapp/inbound

GET    /api/users
POST   /api/users
PUT    /api/users/:id
PATCH  /api/users/:id/status
PATCH  /api/users/:id/reset-password
```
