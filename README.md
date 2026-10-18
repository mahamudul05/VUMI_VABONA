# ভূমি ভাবনা | Vumi Vabona

**ডিজিটাল ভূমি সেবা প্ল্যাটফর্ম — Digital Land Service Platform**

> LandTech 2026 Hackathon Prototype — Problem P2: Deed & Ownership Verification

⚠️ **This is a prototype. It is NOT a government system. All data is synthetic/demo.**

## Setup & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The app runs at `http://localhost:5173` by default.

## Demo Accounts

| Role | Name (BN) | Name (EN) | Purpose |
|------|-----------|-----------|---------|
| **Citizen** | আবদুল করিম | Abdul Karim | View land, verify deeds, submit applications |
| **Land Officer** | ফাতেমা বেগম | Fatema Begum | Review applications, approve/reject |
| **Administrator** | রফিকুল ইসলাম | Rafiqul Islam | Manage demo records, audit logs |

Click any demo login button on the login page — no passwords required.

## Features

### Core (P2: Deed & Ownership Verification)
- **Deed Verification**: Upload PDF/image → SHA-256 hash → compare against registered reference hashes
- **QR Code Generation**: Generate QR codes linking to verification pages
- **Sample Files**: Downloadable sample files for testing match/mismatch scenarios
- **Clear Results**: MATCH / MISMATCH / RECORD NOT FOUND / UNABLE TO VERIFY with Bangla explanations

### Land Search & Profile
- Search by district, upazila, mouza, JL number, survey type (CS/SA/RS/BS/BRS), dag, khatian
- Detailed parcel view: owners, shares, transaction history, tax records, mortgage/bank claims, legal notices
- Inconsistency detection (share totals vs. parcel area)
- Privacy-safe public view via QR sharing

### Inheritance & Mutation
- Guided multi-step form (6 steps)
- Deceased info → Applicant → Land selection → Heirs → Document upload → Review & submit
- File upload with SHA-256 hashing
- Application tracking by ID
- Status lifecycle: Draft → Submitted → Under Review → More Documents Required → Approved/Rejected

### Dashboards
- **Citizen**: My parcels, applications, tax/mortgage summary, notifications
- **Officer**: Pending applications, review/approve/reject with required reasons, officer notes
- **Admin**: Manage parcels, reference documents, users, audit logs, demo data reset

### Other
- **বাংলা / English toggle** across entire UI
- Responsive layout (desktop + mobile)
- localStorage persistence
- Audit logging for all officer/admin actions
- Empty states, loading indicators, form validation, confirmation dialogs

## Synthetic Demo Data

All data is entirely fictional:

| Parcel | Location | Area | Scenario |
|--------|----------|------|----------|
| PARCEL-001 | Savar, Dhaka | 20 dec | Sale chain: A→B (10), B→C (4). Active mortgage. Unpaid tax. |
| PARCEL-002 | Patiya, Chittagong | 15 dec | Inheritance. Released mortgage. Taxes paid. |
| PARCEL-003 | Godagari, Rajshahi | 30 dec | Gift/heba transfer. Partial tax. Active land dispute case. |
| PARCEL-004 | Savar, Dhaka | 12 dec | Deceased owner. Pending mutation. Auction notice. Unknown mortgage. |

Pre-seeded applications:
- `APP-2025-0001` — Inheritance application (under review)
- `APP-2025-0002` — Mutation application (more documents required)

## Architecture

```
src/
├── components/        # Shared UI components (Header, Footer, SharedUI)
├── context/           # AppContext (global state via useReducer + localStorage)
├── data/              # Seed data, translations dictionary
├── pages/             # All route pages
├── types/             # TypeScript type definitions
├── utils/             # Hashing, formatting, ID generation
├── App.tsx            # Router setup
├── main.tsx           # Entry point
└── index.css          # Complete stylesheet
```

**State Management**: React `useReducer` + `localStorage` persistence. No external state library needed.

**Styling**: Tailwind CSS v4 + custom CSS with design tokens. Government-style restrained palette (deep green, navy, white).

## Tech Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS v4
- React Router v7
- Lucide React (icons)
- qrcode.react (QR generation)
- Web Crypto API (`crypto.subtle`) for SHA-256 hashing
- localStorage for state persistence

## Implemented Advanced Capabilities

1. **Live & File QR Scanner** — Built using `html5-qrcode` supporting real-time camera scanning and image file QR scanning with instant document lookup.
2. **IndexedDB Document Storage** — Uploaded deed documents and mutation attachments are cached in IndexedDB via `idb-keyval`, enabling viewing and downloading across citizen and officer portals.
3. **Print & Export Certificates** — Clean `@media print` layouts for printing official Khatian certificates, application acknowledgment receipt slips, and deed verification certificates.
4. **Document Resubmission Workflow** — Citizens can upload requested additional documents directly from the application tracking screen.
5. **Bilingual Digit Normalization** — Search by dag and khatian numbers interchangeably in English (e.g. 234) or Bengali (২৩৪) digits.

## Known Limitations

1. **No remote backend** — all data is in-memory/localStorage & IndexedDB; resets on manual cache clear.
2. **Simulated authentication** — demo 1-click role logins (citizen, land officer, admin).
3. **Synthetic government data** — all parcels, deeds, khatians, and citizen records are fictional demo data for hackathon presentation.
4. **No real NID verification API** — simulated validation without connecting to external government servers.

## Data Safety & Compliance

- ✅ No live government API integration
- ✅ No scraping or automated portal querying
- ✅ No real personal data
- ✅ All records labeled as demo
- ✅ Public views restrict sensitive info (NID, phone, address hidden)
- ✅ Audit logs for officer/admin actions
- ✅ Clear prototype disclaimers throughout

## AI Tool Disclosure

This prototype was developed with assistance from AI coding tools (Antigravity IDE / AI-assisted development). All code was reviewed and the application logic was directed by the developer.

## License

Hackathon prototype — not for production use.
