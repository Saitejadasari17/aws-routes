# AWS Route 53 Clone

A functional clone of the AWS Route 53 web application with persistent storage, built with **Next.js** (TypeScript) on the frontend and **FastAPI** (Python) on the backend.

This project recreates the Route 53 user experience and core workflows — hosted zone management, DNS record CRUD, navigation, search, pagination, and modals — without implementing actual DNS functionality.

---

## Screenshots

**Login Page** — AWS Console–style sign-in screen  
**Hosted Zones** — Paginated table with search, bulk select, create/edit/delete  
**DNS Records** — Per-zone record management with type filters and color-coded badges

---

## Tech Stack

| Layer    | Technology              |
|----------|------------------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend  | FastAPI, SQLAlchemy, Pydantic |
| Database | SQLite (file-based, zero config) |
| Auth     | Token-based (mocked, in-memory session store) |

---

## Setup Instructions

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.10
- **npm** (comes with Node.js)
- **pip** (comes with Python)

### 1. Clone the Repository

```bash
git clone <repo-url>
cd route53-clone
```

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

The backend will:
- Create a `route53.db` SQLite database automatically
- Seed a default admin user (`admin` / `admin123`)
- Serve the API at `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run build
npm start
```

The frontend will serve at `http://localhost:3000`.

For development with hot-reload:
```bash
npm run dev
```

### 4. Open the App

Visit `http://localhost:3000` and log in with:

| Field    | Value      |
|----------|-----------|
| Username | `admin`   |
| Password | `admin123` |

---

## Architecture Overview

```
route53-clone/
├── backend/
│   ├── main.py              # FastAPI app, lifespan, CORS
│   ├── database.py          # SQLAlchemy engine & session
│   ├── models.py            # ORM models (User, HostedZone, Record)
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── requirements.txt
│   └── routers/
│       ├── auth.py          # Login, logout, session validation
│       ├── zones.py         # Hosted zone CRUD + search/pagination
│       └── records.py       # DNS record CRUD + search/filter/pagination
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx             # Root layout (providers)
│   │   │   ├── login/page.tsx         # AWS-style sign-in
│   │   │   └── console/
│   │   │       ├── layout.tsx         # Console shell (topbar + sidebar)
│   │   │       ├── hosted-zones/
│   │   │       │   ├── page.tsx       # Zone list with table
│   │   │       │   └── [id]/page.tsx  # Zone detail — records table
│   │   │       ├── dashboard/         # Coming soon
│   │   │       ├── health-checks/     # Coming soon
│   │   │       ├── traffic-policies/  # Coming soon
│   │   │       ├── resolver/          # Coming soon
│   │   │       └── profiles/          # Coming soon
│   │   ├── components/
│   │   │   ├── TopBar.tsx        # AWS top nav bar
│   │   │   ├── Sidebar.tsx       # Route 53 sidebar nav
│   │   │   ├── Modal.tsx         # Reusable modal dialog
│   │   │   ├── Pagination.tsx    # Page controls
│   │   │   ├── Notifications.tsx # Toast messages
│   │   │   └── ComingSoon.tsx    # Placeholder page
│   │   └── lib/
│   │       ├── api.ts            # API client (fetch wrapper)
│   │       ├── auth.tsx          # Auth context provider
│   │       └── notifications.tsx # Notification context
│   └── package.json
│
└── README.md
```

### Data Flow

```
Browser  →  Next.js (port 3000)  →  FastAPI (port 8000)  →  SQLite
   ↑                                       ↓
   └───────── JSON responses ──────────────┘
```

Authentication uses bearer tokens stored in `localStorage`. The backend keeps an in-memory token→user map (resets on server restart).

---

## Database Schema

### users
| Column        | Type     | Notes                 |
|--------------|----------|-----------------------|
| id           | TEXT PK  | UUID                  |
| username     | TEXT     | Unique, indexed       |
| password_hash| TEXT     | bcrypt hash           |
| email        | TEXT     | Nullable              |
| account_id   | TEXT     | Mocked AWS account ID |
| created_at   | DATETIME | Auto-set              |

### hosted_zones
| Column       | Type     | Notes                    |
|-------------|----------|--------------------------|
| id          | TEXT PK  | Format: Z + 12 hex chars |
| name        | TEXT     | Domain name (with dot)   |
| type        | TEXT     | "Public" or "Private"    |
| comment     | TEXT     | User description         |
| record_count| INTEGER  | Auto-synced              |
| created_at  | DATETIME | Auto-set                 |
| updated_at  | DATETIME | Auto-updated             |

### records
| Column         | Type     | Notes                              |
|---------------|----------|------------------------------------|
| id            | TEXT PK  | UUID                               |
| hosted_zone_id| TEXT FK  | References hosted_zones.id         |
| name          | TEXT     | Record name (FQDN)                 |
| type          | TEXT     | A, AAAA, CNAME, TXT, MX, NS, etc  |
| value         | TEXT     | Record value(s), newline-separated |
| ttl           | INTEGER  | Time to live in seconds            |
| routing_policy| TEXT     | Simple, Weighted, Latency, etc     |
| alias         | BOOLEAN  | Alias record flag                  |
| created_at    | DATETIME | Auto-set                           |
| updated_at    | DATETIME | Auto-updated                       |

Zone deletion cascades to all child records.

---

## API Overview

All endpoints (except login and health) require `Authorization: Bearer <token>`.

### Auth

| Method | Endpoint          | Description       |
|--------|------------------|-------------------|
| POST   | /api/auth/login  | Returns token     |
| POST   | /api/auth/logout | Invalidates token |
| GET    | /api/auth/me     | Current user info |

### Hosted Zones

| Method | Endpoint                | Description                  |
|--------|------------------------|------------------------------|
| GET    | /api/hosted-zones      | List zones (search, pagination) |
| POST   | /api/hosted-zones      | Create zone (auto-adds SOA+NS) |
| GET    | /api/hosted-zones/:id  | Get zone details             |
| PUT    | /api/hosted-zones/:id  | Update zone comment          |
| DELETE | /api/hosted-zones/:id  | Delete zone + all records    |

**Query Parameters** (GET list):
- `search` — filter by name (partial match)
- `page` — page number (default: 1)
- `page_size` — items per page (default: 20, max: 100)

### DNS Records

| Method | Endpoint                                     | Description                     |
|--------|---------------------------------------------|---------------------------------|
| GET    | /api/hosted-zones/:zoneId/records           | List records (search, filter)   |
| POST   | /api/hosted-zones/:zoneId/records           | Create record                   |
| GET    | /api/hosted-zones/:zoneId/records/:recordId | Get record details              |
| PUT    | /api/hosted-zones/:zoneId/records/:recordId | Update record value/TTL/policy  |
| DELETE | /api/hosted-zones/:zoneId/records/:recordId | Delete record (protects SOA/NS) |

**Query Parameters** (GET list):
- `search` — filter by name
- `record_type` — filter by type (A, AAAA, CNAME, etc.)
- `page` — page number (default: 1)
- `page_size` — items per page (default: 50, max: 200)

### Supported Record Types

A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA, SOA

---

## Features

### Implemented
- AWS Console–style login page
- Token-based authentication with session persistence
- Dark top bar with region selector and account menu
- Route 53 sidebar navigation
- Hosted zone CRUD with search and pagination
- DNS record CRUD with type filtering and search
- Auto-created SOA and NS records for new zones
- Color-coded record type badges
- Confirmation dialogs for destructive actions
- Toast notifications for success/error feedback
- Record detail viewer
- Breadcrumb navigation
- Protected SOA/NS records (cannot be deleted)
- Responsive table layouts

### Mocked / Placeholder
- Dashboard
- Traffic Policies
- Health Checks
- Resolver
- Profiles

---

## Development

### Backend (with auto-reload)
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

### Frontend (with hot-reload)
```bash
cd frontend
npm run dev
```

### Environment Variables

| Variable             | Default                  | Description           |
|---------------------|--------------------------|-----------------------|
| DATABASE_URL        | sqlite:///./route53.db   | SQLAlchemy DB URL     |
| NEXT_PUBLIC_API_URL | http://localhost:8000    | Backend API base URL  |

---

## License

This project is for educational and portfolio purposes.
