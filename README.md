# Sweety — Blood Glucose Tracker

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18.1-336791.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24.x-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000.svg?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19.3-2D3748.svg?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-20%2F20%20Passing-brightgreen.svg)]()

> A full-stack health web application built for the **Kenpath** technical assessment. Sweety enables users to register, log in, record daily blood glucose readings across four required clinical time slots, manage readings with full CRUD operations, and view statistical reports (Daily, Month-to-Date, and Previous Month) with complete clinical validation and strict data isolation.

---

## Table of Contents

1. [Architecture & Project Structure](#architecture--project-structure)
2. [Key Features & Business Rules](#key-features--business-rules)
3. [Prerequisites](#prerequisites)
4. [Step-by-Step Installation](#step-by-step-installation)
5. [PostgreSQL Database Setup & Configuration](#postgresql-database-setup--configuration)
6. [Prisma Migrations & Demo Seeding](#prisma-migrations--demo-seeding)
7. [Running the Application](#running-the-application)
8. [Demo Login Credentials](#demo-login-credentials)
9. [Automated Test Suite (20 Tests)](#automated-test-suite-20-tests)
10. [REST API Specification](#rest-api-specification)
11. [Notes & Design Decisions](#notes--design-decisions)
    - [Assumptions Made in Implementation](#assumptions-made-in-implementation)
    - [Areas for Future Improvement](#areas-for-future-improvement)

---

## Architecture & Project Structure

The project is organized into two clearly separated, independently maintainable modules: `frontend/` and `backend/`, coordinated by root scripts:

```text
Sweety/
├── frontend/                   # React 19 + Vite 6 + Tailwind CSS 4 client
│   ├── public/                 # Static assets & icons
│   ├── src/
│   │   ├── components/         # Reusable UI (Layout, Navbar, StatCard, ReadingForm, ConfirmModal, etc.)
│   │   ├── context/            # AuthContext (JWT session hydration & state management)
│   │   ├── pages/              # 9 Full Application Pages:
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── AddReadingPage.jsx
│   │   │   ├── EditReadingPage.jsx
│   │   │   ├── ReadingsListPage.jsx
│   │   │   ├── DailyReportPage.jsx
│   │   │   ├── MonthToDateReportPage.jsx
│   │   │   └── PreviousMonthReportPage.jsx
│   │   ├── services/           # Axios HTTP client with JWT interceptor & /api proxying
│   │   ├── utils/              # Date formatters, glucose category classifiers, form validation
│   │   ├── App.jsx             # React Router route definitions & protected route guards
│   │   ├── App.css
│   │   ├── index.css           # Tailwind CSS 4 configuration
│   │   └── main.jsx            # React root mount
│   ├── package.json            # Frontend dependencies and Vite build scripts
│   ├── vite.config.js          # Vite config with React plugin, Tailwind, and /api proxy to port 5000
│   └── index.html              # HTML entry point
│
├── backend/                    # Express 5 + Prisma 6 + PostgreSQL REST API
│   ├── config/                 # Environment configuration & singleton PrismaClient
│   ├── controllers/            # Auth, Reading, and Report request controllers
│   ├── middleware/             # JWT authentication, request validation, & centralized error handler
│   ├── routes/                 # REST routers (/api/auth, /api/readings, /api/reports)
│   ├── services/               # Business logic & PostgreSQL row-level locked transactions
│   ├── utils/                  # UTC timezone-safe date helpers, slot definitions, ApiError class
│   ├── validation/             # Strict payload validators (integer range, required fields, slots)
│   ├── prisma/
│   │   ├── migrations/         # Versioned SQL migrations (enums, tables, CHECK constraints)
│   │   ├── schema.prisma       # Prisma models: User, GlucoseReading, ReadingSlot
│   │   └── seed.js             # Idempotent demo database seeder
│   ├── tests/                  # 20 automated integration tests targeting isolated sweety_test database
│   │   ├── setup.js            # Test environment configuration, migration deploy & DB reset
│   │   ├── auth.test.js        # Tests 1 - 5: Registration, duplicates, login, password checks, auth guard
│   │   ├── readings.test.js    # Tests 6 - 16: CRUD, 40-600 range limits, duplicate slot, daily max, isolation
│   │   └── reports.test.js     # Tests 17 - 20: Daily, MTD, Previous Month, 1-decimal rounding, empty states
│   ├── app.js                  # Express app factory (CORS, Helmet, route mounting)
│   ├── server.js               # Server bootstrap & graceful shutdown handler
│   ├── nodemon.json            # Nodemon configuration for live development
│   ├── package.json            # Backend dependencies, scripts, and nodemonConfig
│   ├── .env                    # Real local environment variables (GIT-IGNORED)
│   └── .env.example            # Safe backend environment template
│
├── .gitignore                  # Ignores all .env files, node_modules, build artifacts, test logs
├── .env.example                # Safe root environment template
├── README.md                   # Complete assignment documentation
└── package.json                # Root orchestrator scripts (dev, start, build, test, seed, migrate)
```

---

## Key Features & Business Rules

### 1. User Authentication & Data Isolation
- **User Registration**: Accepts name, email, and password. Passwords are securely hashed using `bcrypt` (10 salt rounds). Duplicate email registration is rejected with `HTTP 409 Conflict`.
- **User Login**: Validates credentials and returns a signed JSON Web Token (JWT).
- **Session Hydration**: On browser refresh, the frontend automatically verifies the stored token via `GET /api/auth/me`.
- **Strict Data Isolation**: Every reading and report is strictly scoped to `req.user.id`. Users can never view, update, or delete another user's readings.

### 2. Blood Glucose Reading Management (CRUD)
- **Four Required Daily Slots**:
  1. `Morning (fasting)` (`MORNING_FASTING`)
  2. `After breakfast` (`AFTER_BREAKFAST`)
  3. `After lunch` (`AFTER_LUNCH`)
  4. `After dinner` (`AFTER_DINNER`)
- **Mandatory Clinical Validations (Backend + Frontend)**:
  - **Required Fields**: Reading date, blood glucose value, and reading slot are mandatory.
  - **Glucose Value Limits**: Must be a whole integer between **40 mg/dL** and **600 mg/dL**. Decimal values, negative numbers, and non-numeric characters are rejected.
  - **Database CHECK Constraint**: In addition to application-level validation, PostgreSQL enforces `CHECK ("glucose_value" >= 40 AND "glucose_value" <= 600)`.
  - **Duplicate Slot Rejection**: A user cannot record two readings for the same slot on the same date (enforced by a PostgreSQL unique compound index `@@unique([userId, date, readingSlot])`).
  - **Daily Maximum**: A strict maximum of 4 readings is allowed per date per user.
  - **Future Date Rejection**: Readings cannot be recorded for future calendar dates.
  - **Safe Updates**: Updating an existing reading permits modifying the value, slot, or date without self-collision.
  - **Concurrency Protection**: Database transactions acquire row-level locks on the user record during create/update operations to prevent race conditions.

### 3. Statistical Reports & Analytics
- **Daily Report**: Select any calendar date to view the highest reading, lowest reading, average reading (rounded to 1 decimal place), total readings count, and chronological slot-ordered readings. Handles days with no data gracefully.
- **Month-to-Date Report**: Calculates cumulative statistics (highest, lowest, average, total count, and daily breakdown) from the 1st day of the current calendar month through today.
- **Previous Month Report**: Calculates complete statistics for the entire previous calendar month (1st day to last day), completely excluding current-month records.

---

## Prerequisites

Before setting up the project, ensure you have the following installed on your machine:

- **Node.js**: `v20.x` or higher (`v24.11.1` tested)
- **npm**: `v10.x` or higher (`11.6.2` tested)
- **PostgreSQL**: `v14+` (`v18.1` tested, running on `localhost:5432`)
- **Git**: Installed and configured

---

## Step-by-Step Installation

### 1. Clone the Repository

```bash
git clone https://github.com/srj-sooraj/Sweety.git
cd Sweety
```

### 2. Install Dependencies

Install all root, backend, and frontend dependencies:

#### Option A: Single Command from Root (Recommended)
```bash
npm install && npm --prefix backend install && npm --prefix frontend install
```

#### Option B: Step-by-Step
```bash
# 1. Root dependencies (concurrently orchestrator)
npm install

# 2. Backend dependencies (Express, Prisma, bcrypt, JWT, Helmet, CORS, Supertest)
cd backend
npm install
cd ..

# 3. Frontend dependencies (React, Vite, Tailwind CSS, React Router, Axios, Lucide)
cd frontend
npm install
cd ..
```

---

## PostgreSQL Database Setup & Configuration

Sweety requires two PostgreSQL databases:
1. `sweety` — Development and runtime database.
2. `sweety_test` — Isolated test database used by the automated test suite.

### 1. Create the PostgreSQL Databases

Open your terminal or `psql` command-line utility as the PostgreSQL superuser:

```bash
psql -U postgres
```

Inside the PostgreSQL shell, create both databases:

```sql
CREATE DATABASE sweety;
CREATE DATABASE sweety_test;
\q
```

*(On Windows, you can also create these databases using pgAdmin or the SQL Shell).*

### 2. Configure Environment Variables

Copy the example environment files to create your local `.env` files:

```bash
# Backend environment file
cp backend/.env.example backend/.env

# (Optional) Root environment file
cp .env.example .env
```

Open `backend/.env` in your editor and configure your PostgreSQL credentials:

```ini
PORT=5000
CLIENT_URL="http://localhost:5173"
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/sweety?schema=public"
TEST_DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/sweety_test?schema=public"
JWT_SECRET="your-strong-random-jwt-secret-string-min-32-chars"
JWT_EXPIRES_IN="7d"
```

> **Important Notes on Connection Strings:**
> - Replace `YOUR_PASSWORD` with your actual local PostgreSQL `postgres` user password.
> - If your password contains special characters (e.g. `@`, `#`, `%`, `&`), **URL-encode** them in the connection string (e.g. replace `@` with `%40`).
> - `DATABASE_URL` connects to the `sweety` database.
> - `TEST_DATABASE_URL` connects to the `sweety_test` database. The test runner strictly verifies that the test database name ends with `_test` to prevent accidental data loss in development.
> - Real `.env` files are strictly excluded from version control via `.gitignore`.

---

## Prisma Migrations & Demo Seeding

### 1. Generate the Prisma Client

Generate the Prisma client artifacts:

```bash
# From repository root:
npm run prisma:generate

# Or inside backend/:
cd backend && npm run prisma:generate
```

### 2. Apply Database Migrations

Apply the versioned Prisma migrations to create the schema, enums, tables, indexes, and PostgreSQL `CHECK` constraints:

```bash
# From repository root:
npm run prisma:migrate

# Or inside backend/:
cd backend && npm run prisma:migrate
```

*(For non-interactive or CI environments, use `npm run prisma:deploy`).*

To verify that the Prisma schema is valid:
```bash
npm run prisma:validate
```

### 3. Seed Demo Data

Populate the development database with a complete demo patient account and realistic blood glucose readings:

```bash
# From repository root:
npm run db:seed

# Or inside backend/:
cd backend && npm run db:seed
```

The seed script creates:
- **Demo Patient User**: Alex Morgan (`demo@sweety.app` / `SweetyDemo@123`).
- **Today's Readings**: 3 readings (Morning fasting, After breakfast, After lunch), leaving the 4th slot open so you can immediately test creating a reading live.
- **Current Month Readings**: Realistic 4-slot records across earlier dates in the current month for the Month-to-Date report.
- **Previous Month Readings**: Complete 4-slot records across the previous calendar month for the Previous Month report.
- The seed script uses `upsert` and is safe to execute multiple times.

---

## Running the Application

### Option A: Run Both Backend & Frontend Together (Recommended)

From the repository root, start both servers concurrently with a single command:

```bash
npm run dev
```

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API Server**: [http://localhost:5000](http://localhost:5000)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

Vite is configured to automatically proxy all `/api/*` frontend HTTP requests to `http://localhost:5000`.

---

### Option B: Run Backend & Frontend Separately

If you prefer running the servers in separate terminal windows:

#### Terminal 1 — Backend API Server
```bash
# From repository root:
npm run dev:backend

# Or inside backend/:
cd backend
npm run dev
```
The backend will launch with Nodemon watching for changes and listen on `http://localhost:5000`.

#### Terminal 2 — Frontend Client
```bash
# From repository root:
npm run dev:frontend

# Or inside backend/:
cd frontend
npm run dev
```
The Vite development server will start on `http://localhost:5173`.

---

### Option C: Production Builds

To test the production-ready build:

```bash
# Build the React frontend production bundle into frontend/dist/
npm run build

# Start the backend server directly with Node.js
npm start
```

---

## Demo Login Credentials

For quick evaluation, pre-seeded demo patient credentials are provided:

| Attribute | Demo Account Value |
|---|---|
| **Role** | Demo Patient |
| **Email** | `demo@sweety.app` |
| **Password** | `SweetyDemo@123` |

> **Quick Login Tip:** On the Login page (`http://localhost:5173/login`), click the **"Autofill Demo"** button to automatically populate these credentials and sign in with a single click. You can also register a new account at `http://localhost:5173/register`.

---

## Automated Test Suite (20 Tests)

The backend includes a comprehensive, automated integration test suite written with the native Node.js test runner (`node:test`) and Supertest.

### Test Isolation Guarantee
The test suite executes strictly against the isolated `sweety_test` database (configured via `TEST_DATABASE_URL`). It automatically applies Prisma migrations to `sweety_test` and resets test records before each test, ensuring zero data leakage or mutation to your development database.

### Running the Tests

```bash
# From repository root:
npm test

# Or inside backend/:
cd backend
npm test
```

Command executed: `node --test --test-concurrency=1 tests/*.test.js`

### Test Suite Coverage (20 / 20 Passing)

```text
▶ Authentication API
  ✔ 1. registers a new user, hashes password with bcrypt, and returns JWT
  ✔ 2. rejects duplicate email registration with 409 Conflict
  ✔ 3. logs in an existing user with valid credentials and allows /api/auth/me
  ✔ 4. rejects login with an incorrect password
  ✔ 5. blocks unauthorized API access when token is missing, invalid, or expired

▶ Glucose Readings CRUD & Validation API
  ✔ 6. creates a valid glucose reading
  ✔ 7. rejects missing required fields (date, glucoseValue, readingSlot)
  ✔ 8. rejects glucose value below 40 mg/dL
  ✔ 9. rejects glucose value above 600 mg/dL
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

ℹ tests 20 | suites 3 | pass 20 | fail 0
```

---

## REST API Specification

All endpoints except `/api/health`, `/api/auth/register`, and `/api/auth/login` require the `Authorization` header:
`Authorization: Bearer <jwt_token>`

| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/api/health` | Service health & database connectivity check | No |
| `POST` | `/api/auth/register` | Register new user account (`name`, `email`, `password`) | No |
| `POST` | `/api/auth/login` | Authenticate user & return signed JWT | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | **Yes** |
| `POST` | `/api/readings` | Create a glucose reading (`date`, `readingSlot`, `glucoseValue`) | **Yes** |
| `GET` | `/api/readings` | List user readings with optional date/slot query filters | **Yes** |
| `GET` | `/api/readings/:id` | Get individual reading by ID (owner scoped) | **Yes** |
| `PUT` | `/api/readings/:id` | Update individual reading with validation | **Yes** |
| `DELETE` | `/api/readings/:id` | Delete individual reading (owner scoped) | **Yes** |
| `GET` | `/api/reports/daily?date=YYYY-MM-DD` | Daily statistics (min, max, avg, slot-ordered list) | **Yes** |
| `GET` | `/api/reports/month-to-date` | Cumulative statistics for the current month through today | **Yes** |
| `GET` | `/api/reports/previous-month` | Complete statistics for the previous calendar month | **Yes** |

---

## Notes & Design Decisions

### Assumptions Made in Implementation

1. **Standard Units & Range Boundaries**:
   - Blood glucose values are treated as integer measurements in milligrams per deciliter (**mg/dL**), the global clinical standard for home glucose monitors.
   - The clinical bounds of **40 mg/dL** to **600 mg/dL** were adopted based on emergency clinical laboratory limits (readings below 40 mg/dL indicate severe hypoglycemia requiring emergency intervention; values above 600 mg/dL indicate severe hyperglycemia / diabetic ketoacidosis risk). Values outside this range are rejected both in the application layer and via a PostgreSQL `CHECK` constraint.

2. **Daily 4-Slot Reading Model**:
   - Patients track readings across four clinically standard daily slots: `MORNING_FASTING`, `AFTER_BREAKFAST`, `AFTER_LUNCH`, and `AFTER_DINNER`.
   - Each slot can be recorded at most once per calendar date, capped at 4 readings per day per user.

3. **Timezone-Safe Date Storage**:
   - Reading dates are persisted using PostgreSQL's `@db.Date` data type and normalized as UTC midnight (`Date.UTC(YYYY, MM, DD)`). This eliminates timezone drift and daylight savings discrepancies when aggregating daily and monthly reports across client timezones.

4. **Statistical Rounding**:
   - As per clinical reporting standards, average blood glucose figures are rounded to exactly **1 decimal place** (e.g. `128.4 mg/dL`), while counts, minimums, and maximums remain integer values.

5. **Concurrency & Race Condition Handling**:
   - To prevent concurrent write race conditions (such as two simultaneous requests attempting to write the 5th reading of the day or the same slot), database writes are wrapped in Prisma interactive transactions using row-level locks on the user record.

6. **Stateless JWT Security Architecture**:
   - User authentication utilizes stateless JWT tokens stored securely on the client. All backend routes authenticate requests through standard `Authorization: Bearer <token>` headers, and the React client automatically attaches tokens using Axios request interceptors.

---

### Areas for Future Improvement

With additional development time, the following enhancements could be incorporated:

1. **Interactive Data Visualizations & Trend Charts**:
   - Integrate charting libraries (e.g., Recharts or Chart.js) to display interactive trend lines, target range bands (Normal: 70–140 mg/dL, High: >140 mg/dL, Low: <70 mg/dL), and time-in-range percentage charts.

2. **Report Export Capabilities (PDF & CSV)**:
   - Allow patients to export the Daily, Month-to-Date, and Previous Month statistical reports into downloadable PDF or CSV formats to share with their endocrinologists or healthcare providers.

3. **Estimated HbA1c (eAG) Calculation**:
   - Incorporate an automated estimated HbA1c calculator based on the American Diabetes Association (ADA) formula: $\text{eAG} = 28.7 \times \text{HbA1c} - 46.7$ calculated from 90-day averages.

4. **Unit Conversion Preference (mg/dL $\leftrightarrow$ mmol/L)**:
   - Provide a user profile toggle to switch between US/standard mg/dL and UK/international mmol/L (using the standard $18.0182$ conversion factor).

5. **Meal, Activity, and Medication Annotations**:
   - Allow optional metadata tags on readings, such as carbohydrate estimates (grams), insulin units administered, or physical activity notes.

6. **Email Notifications & Password Recovery**:
   - Implement automated password reset and email verification workflows using a transactional email service (e.g., SendGrid, Resend, or AWS SES).

7. **End-to-End (E2E) Browser Testing**:
   - Add Playwright or Cypress automated browser test suites to verify full end-to-end user journeys from registration through report navigation in simulated browser environments.
