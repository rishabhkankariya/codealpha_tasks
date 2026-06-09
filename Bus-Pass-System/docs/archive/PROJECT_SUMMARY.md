# PMPML SmartBus — Complete Project Summary
> **For AI Agents**: This document describes the full state of the project as of May 26, 2026.
> Use this as context before making any changes.

---

## 🚌 Project Overview

**PMPML SmartBus** is a full-stack digital bus pass and ticket booking system for Pune's PMPML (Pune Mahanagar Parivahan Mahamandal Limited) bus network. It provides separate portals for passengers and administrators, with an AI-powered route assistant.

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS — running on `http://localhost:3000`
- **Backend**: Python 3.11 + FastAPI + SQLite + SQLAlchemy — running on `http://localhost:8000`
- **Database**: SQLite (`backend/smart_bus_pass.db`) — no PostgreSQL, no Docker required
- **AI**: LangChain + ChromaDB + Ollama (optional) — vector embeddings for 1030 routes

---

## 🔐 Credentials

| Role | Email | Password | Login URL |
|------|-------|----------|-----------|
| Passenger | `test@example.com` | `Test123!@#` | `http://localhost:3000/login` |
| Admin | `admin@pmpml.com` | `admin123!@#` | `http://localhost:3000/admin/login` |

> Admin and Passenger are **completely separate portals** — different login pages, different layouts, different dashboards.

---

## 🗂️ Project Directory Structure

```
Bus Pass System/
├── backend/                          # FastAPI backend
│   ├── app/
│   │   ├── main.py                   # FastAPI app entry point, CORS, error handlers
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── __init__.py       # API router registration
│   │   │       ├── endpoints/
│   │   │       │   ├── admin.py      # Admin analytics, users, routes, bookings, passes
│   │   │       │   ├── auth.py       # Login, register, refresh, logout
│   │   │       │   ├── bookings.py   # Create, list, cancel bookings
│   │   │       │   ├── chatbot.py    # AI chatbot session + message endpoints
│   │   │       │   ├── ckan.py       # CKAN open data integration
│   │   │       │   ├── passes.py     # Pass types, purchase, list passes
│   │   │       │   ├── qr_codes.py   # QR code verification
│   │   │       │   ├── routes.py     # Route list, detail, schedules (auto-generated)
│   │   │       │   └── users.py      # GET/PUT /me profile
│   │   │       └── dependencies.py   # get_current_user, require_admin guards
│   │   ├── core/
│   │   │   ├── config.py             # Settings (env vars, JWT config)
│   │   │   ├── database.py           # SQLAlchemy engine + SessionLocal (SQLite)
│   │   │   ├── exceptions.py         # Custom HTTP exceptions
│   │   │   ├── redis.py              # Optional Redis client (graceful fallback)
│   │   │   ├── security.py           # bcrypt hashing, JWT create/decode
│   │   │   └── types.py              # SQLite-compatible UUID, JSONB, ARRAY types
│   │   ├── models/
│   │   │   ├── user.py               # User (roles: PASSENGER, ADMIN, CONDUCTOR)
│   │   │   ├── route.py              # Route (route_number, origin, destination, distance_km)
│   │   │   ├── schedule.py           # Schedule (route_id, bus_id, departure_time, arrival_time)
│   │   │   ├── bus.py                # Bus (bus_number, total_seats, bus_type enum)
│   │   │   ├── booking.py            # Booking (user_id, schedule_id, journey_date, price, status)
│   │   │   ├── pass_model.py         # PassType + BusPass (validity, QR, status)
│   │   │   ├── pricing.py            # PricingRule (base_price, price_per_km per route)
│   │   │   ├── qr_code.py            # QRCode (verification_token, scan_count, is_used)
│   │   │   ├── payment.py            # Payment tracking
│   │   │   ├── chatbot.py            # ChatbotSession + ChatbotMessage
│   │   │   ├── audit_log.py          # Audit trail
│   │   │   ├── notification.py       # Notifications
│   │   │   ├── complaint.py          # Complaints
│   │   │   ├── knowledge_base.py     # AI knowledge base
│   │   │   └── system_config.py      # System configuration
│   │   ├── schemas/
│   │   │   ├── user.py               # UserCreate, UserResponse, TokenResponse
│   │   │   ├── booking.py            # BookingCreate, BookingResponse
│   │   │   ├── pass_schema.py        # PassCreate, PassResponse
│   │   │   ├── route.py              # RouteResponse (includes fare field)
│   │   │   ├── admin.py              # Admin analytics schemas
│   │   │   └── qr_code.py            # QRCodeResponse, QRVerificationRequest
│   │   ├── services/
│   │   │   ├── auth_service.py       # authenticate(), refresh_access_token()
│   │   │   ├── booking_service.py    # create_booking() — auto-confirms + generates QR
│   │   │   ├── pass_service.py       # create_pass() — auto-generates pass number + QR
│   │   │   ├── qr_service.py         # generate_ticket_qr(), generate_pass_qr(), verify_qr_code()
│   │   │   ├── route_service.py      # get_all_active_routes() with fare calculation
│   │   │   ├── user_service.py       # create(), get_by_id(), update()
│   │   │   ├── ai_chatbot_service.py # RAG chatbot: Ollama LLM → vector search → keyword fallback
│   │   │   └── ckan_service.py       # CKAN open data integration
│   │   └── utils/
│   │       ├── csv_importer.py       # Generic CSV import utility
│   │       └── pmpml_importer.py     # PMPML dataset.csv importer
│   ├── add_pass_types.py             # Script: populate 18 PMPML pass types in DB
│   ├── add_route_pricing.py          # Script: generate pricing rules for all 1030 routes
│   ├── check_user.py                 # Script: verify user credentials
│   ├── smart_bus_pass.db             # SQLite database file
│   ├── requirements.txt              # Full dependencies
│   ├── requirements-ai.txt           # AI/ML dependencies (LangChain, ChromaDB, etc.)
│   ├── requirements-minimal.txt      # Minimal dependencies (no AI)
│   └── data/
│       ├── sample_routes.csv         # Sample route data
│       └── chroma_db/                # ChromaDB vector store (route embeddings)
│
├── frontend/                         # React frontend
│   ├── src/
│   │   ├── App.tsx                   # Router: Public / Passenger / Admin routes
│   │   ├── main.tsx                  # React entry point
│   │   ├── index.css                 # TailwindCSS + custom classes (.btn, .card, .input)
│   │   ├── vite-env.d.ts             # Vite env type declarations
│   │   ├── layouts/
│   │   │   ├── MainLayout.tsx        # Passenger layout: navbar + footer (NO admin links)
│   │   │   ├── AdminLayout.tsx       # Admin layout: dark sidebar + top bar (separate)
│   │   │   └── AuthLayout.tsx        # Centered card layout for login/register
│   │   ├── lib/
│   │   │   ├── api.ts                # Axios instance with JWT interceptors + auto-refresh
│   │   │   └── utils.ts              # formatDate, formatDateTime helpers
│   │   ├── store/
│   │   │   └── authStore.ts          # Zustand store: user, isAuthenticated, login, logout, setUser
│   │   └── pages/
│   │       ├── auth/
│   │       │   ├── LoginPage.tsx         # Passenger login → redirects to /dashboard
│   │       │   ├── AdminLoginPage.tsx    # Admin login (dark theme) → redirects to /admin
│   │       │   └── RegisterPage.tsx      # Passenger registration
│   │       ├── HomePage.tsx              # Landing page: hero, features, pass preview, AI promo
│   │       ├── RoutesPage.tsx            # Browse 1030+ routes with search + Book Ticket button
│   │       ├── DashboardPage.tsx         # Passenger dashboard: stats, recent bookings, active passes
│   │       ├── BookTicketPage.tsx        # 3-step booking: Route → Schedule → Confirm
│   │       ├── MyBookingsPage.tsx        # List bookings with QR modal + Receipt link + Cancel
│   │       ├── ReceiptPage.tsx           # Printable/downloadable booking receipt with QR
│   │       ├── BuyPassPage.tsx           # 18 pass types with category filters + purchase flow
│   │       ├── MyPassesPage.tsx          # List passes with QR modal + validity info
│   │       ├── ProfilePage.tsx           # Editable user profile (name, phone)
│   │       ├── ChatbotPage.tsx           # AI assistant: full-screen chat, route cards, booking links
│   │       └── admin/
│   │           ├── AdminDashboardPage.tsx  # KPI cards, revenue split, quick action links
│   │           ├── AdminAnalyticsPage.tsx  # Revenue charts, daily bar chart, system overview
│   │           ├── AdminBookingsPage.tsx   # Searchable/filterable bookings table
│   │           ├── AdminPassesPage.tsx     # Searchable/filterable passes table
│   │           ├── AdminUsersPage.tsx      # Searchable/filterable users table with role badges
│   │           ├── ManageRoutesPage.tsx    # Route management (view/toggle active)
│   │           └── AdminSettingsPage.tsx   # System info, security status, admin profile
│   ├── package.json
│   ├── vite.config.ts                # Vite config: port 3000, proxy /api → localhost:8000
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── dataset.csv                       # 1031 PMPML routes source data
├── docker-compose.yml                # Docker config (not used — SQLite local setup)
└── PROJECT_SUMMARY.md                # ← This file
```

---

## ✅ Completed Features

### Authentication & Users
- [x] JWT-based authentication (access + refresh tokens)
- [x] bcrypt password hashing
- [x] OAuth2PasswordRequestForm login (form-data compatible)
- [x] Auto token refresh on 401 (Axios interceptor)
- [x] Role-based access: `PASSENGER`, `ADMIN`, `CONDUCTOR`
- [x] Separate login pages for admin and passenger
- [x] User profile edit (first name, last name, phone)
- [x] Zustand auth store with localStorage persistence

### Routes & Schedules
- [x] 1030 PMPML routes imported from `dataset.csv`
- [x] Distance-based fare: ₹10 base + ₹1.50/km (min ₹10, max ₹100)
- [x] 1030 pricing rules generated for all routes
- [x] Auto-generated PMPML schedules per route (5:00 AM – 11:30 PM)
- [x] 39 time slots per route (peak every 15 min, normal every 30 min)
- [x] Peak hour detection (7–10 AM, 5–8 PM) with reduced seat availability
- [x] Route search by number, origin, destination
- [x] Pre-select route from Routes page → Book Ticket skips to Step 2

### Ticket Booking
- [x] 3-step booking flow: Select Route → Select Schedule → Confirm
- [x] Auto-confirmed booking (no payment gateway — simulated)
- [x] QR code generated immediately on booking
- [x] Fare calculation from pricing rules
- [x] Date validation (allows today + future, 1-day timezone buffer)
- [x] Cancel booking (PUT /bookings/{id}/cancel)
- [x] Printable/downloadable receipt page with QR code
- [x] "View Receipt" button on each confirmed booking

### Bus Passes
- [x] 18 PMPML pass types with official 2026 pricing
- [x] Categories: General, Student, Senior Citizen, Divyang, Journalist, Freedom Fighter, Municipal Employee
- [x] Full pass metadata: validity, travel area, time validity, discount info, eligibility
- [x] FREE passes (Divyang, Journalist, Freedom Fighter, Govt School Students)
- [x] Auto-generated unique pass number (PMPML-XXXXXXXX format)
- [x] QR code generated immediately on purchase
- [x] Pass validity tracking with days-remaining display
- [x] Category filter tabs on Buy Pass page

### QR Codes
- [x] QR code generation using `qrcode` library (PNG → base64)
- [x] Separate QR types: TICKET and PASS
- [x] Cryptographically secure verification tokens
- [x] Fraud detection: scan count tracking, single-use ticket enforcement
- [x] QR verification endpoint: `/api/v1/qr/verify`

### AI Chatbot
- [x] 3-tier response system: Ollama LLM → ChromaDB vector search → keyword fallback
- [x] Works without Ollama (graceful degradation)
- [x] Vector embeddings for all 1030 routes (ChromaDB)
- [x] Natural language queries: "Buses from Katraj to Hinjewadi"
- [x] Route cards in chat with fare, distance, duration
- [x] "Book Ticket →" button on route cards → navigates to booking with pre-selected route
- [x] Suggestion chips for follow-up queries
- [x] Session management (ChatbotSession + ChatbotMessage stored in DB)
- [x] 6 starter query cards on first load
- [x] Auto-resizing textarea, scroll-to-bottom button, clear chat

### Admin Panel (Completely Separate)
- [x] Separate dark sidebar layout (AdminLayout)
- [x] Separate login page at `/admin/login` (dark theme)
- [x] AdminRoute guard: redirects non-admins to `/admin/login`
- [x] Dashboard: KPI cards (revenue, bookings, passes, users, routes)
- [x] Analytics: revenue breakdown, daily bar chart, system overview
- [x] Bookings table: searchable, filterable by status
- [x] Passes table: searchable, filterable by status, days remaining
- [x] Users table: searchable, filterable by role, role badges
- [x] Routes management: view all routes, toggle active/inactive
- [x] Settings: system info, security status
- [x] No "Admin" button visible anywhere in passenger portal

### Passenger Portal
- [x] Dashboard with live stats (bookings, passes, total spent)
- [x] Recent bookings + active passes on dashboard
- [x] Quick action cards (Book Ticket, Buy Pass, Browse Routes, AI Assistant)
- [x] No admin links anywhere in passenger navbar or footer
- [x] Mobile-responsive navigation with hamburger menu

### UI/UX
- [x] TailwindCSS with custom primary color palette
- [x] Responsive design (mobile + desktop)
- [x] Active nav link highlighting
- [x] User avatar with initials in dropdown
- [x] Loading spinners, error states, empty states throughout
- [x] Toast-style success/error messages
- [x] Smooth transitions and hover effects
- [x] Print-friendly receipt page

---

## 🔌 API Endpoints Reference

### Auth (`/api/v1/auth/`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | OAuth2 login → returns JWT tokens + user |
| POST | `/refresh` | Refresh access token |
| POST | `/logout` | Logout (stateless) |

### Users (`/api/v1/users/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/me` | ✅ | Get current user profile |
| PUT | `/me` | ✅ | Update profile (name, phone) |

### Routes (`/api/v1/routes/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | ❌ | List all 1030 active routes with fare |
| GET | `/{route_id}` | ❌ | Get single route |
| GET | `/{route_id}/schedules` | ❌ | Get schedules (auto-generates if missing) |

### Bookings (`/api/v1/bookings/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | ✅ | Create booking → auto-confirmed + QR generated |
| GET | `/` | ✅ | List user's bookings |
| GET | `/{booking_id}` | ✅ | Get single booking (used by receipt page) |
| PUT | `/{booking_id}/cancel` | ✅ | Cancel booking |

### Passes (`/api/v1/passes/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/types` | ❌ | List all 18 pass types with full PMPML metadata |
| POST | `/` | ✅ | Purchase pass → QR generated immediately |
| GET | `/` | ✅ | List user's passes |
| GET | `/{pass_id}` | ✅ | Get single pass |

### QR Codes (`/api/v1/qr/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/verify` | ❌ | Verify QR token → returns booking/pass details |

### Chatbot (`/api/v1/chatbot/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/session` | ✅ | Create chat session |
| POST | `/message` | ✅ | Send message → AI response with routes |
| GET | `/history/{session_id}` | ✅ | Get chat history |

### Admin (`/api/v1/admin/`) — Admin role required
| Method | Path | Description |
|--------|------|-------------|
| GET | `/analytics/summary` | KPIs: revenue, bookings, passes, users, routes |
| GET | `/analytics/revenue` | Revenue breakdown + daily chart data |
| GET | `/analytics/bookings` | Booking stats by status |
| GET | `/users` | List all users |
| GET | `/routes` | List all routes |
| PUT | `/routes/{id}/toggle` | Toggle route active/inactive |
| GET | `/bookings` | List all bookings |
| GET | `/passes` | List all passes |

---

## 🗄️ Database Schema (SQLite)

### Key Tables
| Table | Key Columns |
|-------|-------------|
| `users` | id, email, password_hash, first_name, last_name, phone, role (PASSENGER/ADMIN/CONDUCTOR), is_active |
| `routes` | id, route_number, origin, destination, distance_km, estimated_duration_minutes, is_active |
| `schedules` | id, route_id, bus_id, departure_time, arrival_time, days_of_week (JSON), is_active |
| `buses` | id, bus_number, total_seats, bus_type (STANDARD/DELUXE/SLEEPER), is_active |
| `bookings` | id, user_id, schedule_id, journey_date, seat_number, price, booking_status, payment_status, qr_code_id |
| `pass_types` | id, pass_name, validity_days, price, category, travel_area, time_validity, discount_info, eligibility |
| `bus_passes` | id, user_id, pass_type_id, route_id, pass_number, valid_from, valid_to, pass_status, qr_code_id |
| `qr_codes` | id, qr_code_data (base64 PNG), verification_token, qr_type (TICKET/PASS), reference_id, is_used, scan_count |
| `pricing_rules` | id, route_id, rule_name, base_price, price_per_km, valid_from, is_active |
| `chatbot_sessions` | id, user_id, session_token, context (JSON), is_active |
| `chatbot_messages` | id, session_id, message_type (user/bot), message_text, message_metadata |

### Data Loaded
- **1030 routes** from PMPML dataset.csv
- **1030 pricing rules** (₹10 base + ₹1.50/km)
- **18 pass types** (official PMPML 2026 pricing)
- **39 schedules per route** (auto-generated on first request, 5 AM–11:30 PM)
- **2 users**: test@example.com (passenger), admin@pmpml.com (admin)

---

## 🤖 AI Chatbot Architecture

```
User Query
    │
    ▼
[1] Ollama LLM (llama3) — if running locally on port 11434
    │ fails/unavailable
    ▼
[2] ChromaDB Vector Search — semantic similarity on 1030 route embeddings
    │ no results
    ▼
[3] Keyword Search — SQL ILIKE on origin/destination/route_number
    │
    ▼
Response with:
  - answer (text)
  - routes[] (up to 5 matching routes)
  - suggestions[] (3 follow-up query chips)
```

**Embeddings**: `sentence-transformers/all-MiniLM-L6-v2` via HuggingFace
**Vector Store**: ChromaDB persisted at `backend/data/chroma_db/`

---

## 🚀 How to Run

### Backend
```bash
cd backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm run dev
```

### Access
- Passenger: http://localhost:3000
- Admin Panel: http://localhost:3000/admin/login
- API Docs: http://localhost:8000/docs

---

## 📦 Key Dependencies

### Backend
| Package | Version | Purpose |
|---------|---------|---------|
| fastapi | latest | Web framework |
| uvicorn | latest | ASGI server |
| sqlalchemy | latest | ORM |
| python-jose | latest | JWT tokens |
| passlib[bcrypt] | latest | Password hashing |
| qrcode[pil] | latest | QR code generation |
| langchain | latest | AI/RAG framework |
| chromadb | latest | Vector database |
| sentence-transformers | latest | Text embeddings |
| pydantic | v2 | Data validation |

### Frontend
| Package | Version | Purpose |
|---------|---------|---------|
| react | 18 | UI framework |
| typescript | 5 | Type safety |
| vite | 5 | Build tool |
| tailwindcss | 3 | Styling |
| react-router-dom | 6 | Routing |
| axios | latest | HTTP client |
| zustand | latest | State management |
| lucide-react | latest | Icons |

---

## ⚠️ Known Limitations / Not Implemented

- No real payment gateway (bookings auto-confirm, payment simulated)
- No email notifications (no SMTP configured)
- No SMS notifications
- No real-time bus tracking (GPS)
- Redis caching is optional and disabled by default
- Celery task queue configured but not running (pass expiry runs on-demand)
- No file upload for pass eligibility documents
- Admin route management is view-only (no create/edit form UI)
- No multi-language support (English only)

---

## 🔧 Important Implementation Notes for AI Agents

1. **SQLite compatibility**: All models use custom `UUID`, `JSONB`, `ARRAY` types from `app/core/types.py` that work with both SQLite and PostgreSQL.

2. **Schedule auto-generation**: The `/routes/{id}/schedules` endpoint auto-creates 39 PMPML-style schedules if none exist for a route. Uses `BusType.STANDARD` enum value.

3. **Booking flow**: Frontend sends `{schedule_id, booking_date, num_seats}`. Backend accepts both `booking_date` and `journey_date` field names. Booking is auto-confirmed (no separate confirm step).

4. **Pass purchase**: Frontend sends `{pass_type_id}` only. Backend auto-assigns a default route and generates a unique pass number.

5. **Admin role check**: Role is stored as `"ADMIN"` (uppercase) in SQLite. All role comparisons use `.lower()` for case-insensitive matching.

6. **QR codes**: Stored as `data:image/png;base64,...` strings. Display directly in `<img src={qr_code_data}>`.

7. **Fare field**: Routes API returns both `base_fare` (from model) and `fare` (calculated from pricing rules). Frontend uses `route.fare || route.base_fare`.

8. **Auth store**: Uses Zustand with `persist` middleware. Stored in `localStorage` as `auth-storage`. Token stored separately as `access_token` and `refresh_token`.

9. **Separate portals**: Admin uses `AdminLayout` (dark sidebar), Passenger uses `MainLayout` (top navbar). `AdminRoute` guard redirects to `/admin/login`. No cross-links between portals.

10. **Validation errors**: FastAPI validation errors return `{detail: "field: message"}` string (not nested array) due to custom handler in `main.py`.

---

*Last updated: May 26, 2026 | Status: ~90% complete | Active development*
