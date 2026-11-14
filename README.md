# Sweety — Blood Glucose Tracker

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18.1-336791.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24.x-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000.svg?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19.3-2D3748.svg?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-20%2F20%20Passing-brightgreen.svg)]()

> A full-stack health dashboard built for the **Kenpath** technical assessment. Sweety enables users to register, log in, record daily blood glucose readings across four required clinical time slots, manage readings (CRUD), and view statistical reports (Daily, Month-to-Date, and Previous Month).

---

## Clean Frontend & Backend Architecture

The application is structured into two clearly separated modules:

```text
Sweety/
├── frontend/                   # React 19 + Vite + Tailwind CSS 4 client
│   ├── public/                 # Static assets & icons
│   ├── src/
│   │   ├── components/         # Reusable UI (Layout, StatCard, ReadingForm, ConfirmDeleteModal, etc.)
│   │   ├── context/            # AuthContext (JWT session hydration & state)
│   │   ├── pages/              # 9 Required Pages
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── AddReadingPage.jsx
│   │   │   ├── EditReadingPage.jsx
│   │   │   ├── ReadingsListPage.jsx
│   │   │   ├── DailyReportPage.jsx
│   │   │   ├── MonthToDateReportPage.jsx
│   │   │   └── PreviousMonthReportPage.jsx
│   │   ├── services/           # Axios API client with auth interceptors (proxying /api to 5000)
│   │   ├── utils/              # Date helpers, glucose categories, form validation
│   │   ├── App.jsx             # React Router routing & route guards
│   │   ├── App.css
│   │   ├── index.css           # Tailwind CSS imports
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js          # Vite config with React, Tailwind & /api proxy to port 5000
│   └── index.html
│
├── backend/                    # Express 5 + Prisma 6 + PostgreSQL backend API
│   ├── config/                 # Environment configuration & singleton PrismaClient
│   ├── controllers/            # Auth, Reading, and Report HTTP handlers
│   ├── middleware/             # JWT authentication & centralized error handling
│   ├── routes/                 # Express REST routers (/api/auth, /api/readings, /api/reports)
│   ├── services/               # Business logic & PostgreSQL transactions (SELECT ... FOR UPDATE)
│   ├── utils/                  # Timezone-safe date utils, slot definitions, ApiError
│   ├── validation/             # Strict request body & query validators
│   ├── prisma/
│   │   ├── migrations/         # Versioned SQL migrations (includes PostgreSQL CHECK constraints)
│   │   ├── schema.prisma       # User, GlucoseReading, and ReadingSlot models
│   │   └── seed.js             # Idempotent demo database seeder
│   ├── tests/                  # 20 automated tests running against isolated sweety_test database
│   │   ├── setup.js            # Isolated test environment setup
│   │   ├── auth.test.js        # Tests 1 - 5 (Register, duplicates, login, password, auth guard)
│   │   ├── readings.test.js    # Tests 6 - 16 (CRUD, 40..600 range, duplicate slot, daily max, ownership)
│   │   └── reports.test.js     # Tests 17 - 20 (Daily, MTD, Previous Month, 1-dec rounding, empty states)
│   ├── app.js                  # Express app factory (CORS, Helmet, routes)
│   ├── server.js               # Server bootstrap with graceful shutdown
│   ├── package.json            # Backend dependencies and scripts
│   ├── .env                    # Real local credentials (IGNORED BY GIT)
│   └── .env.example            # Safe environment template
│
├── .gitignore                  # Ignores all .env files, node_modules, build outputs
├── README.md                   # Full documentation & setup guide
└── package.json                # Root orchestrator scripts (dev, build, test, seed)
```

---

## Key Features & Business Rules

### 1. User Authentication & Data Isolation
- **Registration**: Validates name/email/password, hashes passwords with `bcrypt` (10 rounds), rejects duplicate emails (`409`).
- **Login**: Verifies credentials and generates a stateless JWT token.
- **Strict Isolation**: Every reading and report is strictly scoped to `req.user.id`. Users cannot view, update, or delete other users' readings.

### 2. Blood Glucose Reading Management (CRUD)
- **Four Required Daily Slots**:
  1. `Morning (fasting)` (`MORNING_FASTING`)
  2. `After breakfast` (`AFTER_BREAKFAST`)
  3. `After lunch` (`AFTER_LUNCH`)
  4. `After dinner` (`AFTER_DINNER`)
- **Mandatory Business Validations (Backend + Frontend)**:
  - **Required Fields**: Date, blood glucose value, and reading slot are mandatory.
  - **Glucose Value Limits**: Must be a whole number between **40 mg/dL** and **600 mg/dL**. Decimals, negative values, and non-numeric values are rejected.
  - **PostgreSQL Range Constraint**: The table enforces `CHECK ("glucose_value" >= 40 AND "glucose_value" <= 600)`.
  - **Duplicate Slot Rejection**: A user cannot record two readings for the same slot on the same date (`@@unique([userId, date, readingSlot])`).
  - **Daily Maximum**: Maximum of 4 readings allowed per date.
  - **No Future Dates**: Future calendar dates are rejected.
  - **Safe Editing**: Editing a reading allows updating the value, slot, or date without self-colliding with its existing record.
  - **Concurrency Protection**: Database transactions acquire a row-level lock on the user record during create/update to prevent race conditions.

### 3. Reports & Analytics
- **Daily Report**: Select any calendar date to view highest, lowest, average (rounded to 1 decimal place), total readings, and chronological slot-ordered readings. Handles empty days safely.
- **Month-to-Date Report**: Calculates cumulative statistics from the 1st day of the current calendar month through today, plus breakdown table.
- **Previous Month Report**: Calculates complete statistics for the entire previous calendar month (1st to last day).

---

## Prerequisites

- **Node.js**: `v20.x` or higher (`v24.11.1` tested)
- **npm**: `v10.x` or higher (`11.6.2` tested)
- **PostgreSQL**: `v14+` (`v18.1` tested, running on `localhost:5432`)
- **Git**: Cloned repository

---

## Quick Setup & Startup

### 1. Environment Setup

Copy `.env.example` to `backend/.env` (and root `.env`):
```bash
cp backend/.env.example backend/.env
```

Ensure `backend/.env` contains your PostgreSQL credentials:
```ini
PORT=5000
CLIENT_URL="http://localhost:5173"
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/sweety?schema=public"
TEST_DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/sweety_test?schema=public"
JWT_SECRET="your-strong-random-jwt-secret-string"
JWT_EXPIRES_IN="7d"
```

> **Security Note:** Real database credentials and JWT secrets are strictly excluded from version control via `.gitignore`.

### 2. Database Migrations & Seeding

From the repository root:
```bash
# Run Prisma migrations
npm run prisma:migrate

# Seed demo patient data
npm run db:seed
```

### 3. Start Both Backend & Frontend (Single Command)

```bash
npm run dev
```

- **Frontend Dashboard**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

Or run them individually:
- **Backend only**: `npm run dev:backend` (or `cd backend && npm run dev`)
- **Frontend only**: `npm run dev:frontend` (or `cd frontend && npm run dev`)

---

## Demo Login Credentials

| Role | Email | Password |
|---|---|---|
| **Demo Patient** | `demo@sweety.app` | `SweetyDemo@123` |

*(A convenient **"Autofill Demo"** button is also available directly on the frontend Login screen).*

---

## Automated Test Suite (20 Tests)

All 20 tests run in isolation against the dedicated `sweety_test` database without altering or deleting development data.

Run the tests from the repository root:
```bash
npm test
```
*(Or inside `backend/`: `npm test`)*

### Verified Test Results

```text
▶ Authentication API
  ✔ 1. registers a new user, hashes password with bcrypt, and returns JWT
  ✔ 2. rejects duplicate email registration with 409
  ✔ 3. logs in an existing user with valid credentials and allows /api/auth/me
  ✔ 4. rejects login with an incorrect password
  ✔ 5. blocks unauthorized API access when token is missing, invalid, or expired

▶ Glucose Readings CRUD & Validation API
  ✔ 6. creates a valid glucose reading
  ✔ 7. rejects missing required fields
  ✔ 8. rejects glucose value below 40
  ✔ 9. rejects glucose value above 600
  ✔ 10. rejects decimal and non-numeric glucose values
  ✔ 11. rejects duplicate reading slot on the same date
  ✔ 12. enforces maximum of 4 readings per date (and rejects any 5th attempt)
  ✔ 13. rejects future dates
  ✔ 14. updates an existing reading without self-duplicate error and enforces validation
  ✔ 15. deletes an existing reading
  ✔ 16. prevents accessing, updating, or deleting another user reading

▶ Reports API (Daily, Month-to-Date, Previous Month)
  ✔ 17. calculates accurate daily report statistics and slot ordering
  ✔ 18. calculates accurate month-to-date statistics excluding previous month
  ✔ 19. calculates accurate previous-month statistics excluding current month
  ✔ 20. handles empty datasets safely across all three report endpoints

ℹ tests 20 | pass 20 | fail 0
```

---

## REST API Summary

All endpoints except `/api/auth/register`, `/api/auth/login`, and `/api/health` require:
`Authorization: Bearer <jwt-token>`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health & database connectivity check |
| `POST` | `/api/auth/register` | Register new user account |
| `POST` | `/api/auth/login` | Authenticate user & receive JWT token |
| `GET` | `/api/auth/me` | Get current authenticated user profile |
| `POST` | `/api/readings` | Create glucose reading (date, slot, value) |
| `GET` | `/api/readings` | List readings with optional date/slot filters |
| `GET` | `/api/readings/:id` | Get individual reading owned by user |
| `PUT` | `/api/readings/:id` | Update individual reading with validation |
| `DELETE` | `/api/readings/:id` | Delete individual reading |
| `GET` | `/api/reports/daily?date=YYYY-MM-DD` | Daily statistics & individual readings |
| `GET` | `/api/reports/month-to-date` | Cumulative statistics for current month |
| `GET` | `/api/reports/previous-month` | Complete statistics for previous month |
