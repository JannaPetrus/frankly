# Frankly — Product Specification

> Personal finance dashboard. Version 1.0.

---

## Overview

A web application for tracking personal finances: income, expenses, savings, and goals.
Works on desktop and mobile. Designed for a single user initially, with multi-user support planned for v2.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styles | Tailwind CSS |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | NextAuth.js |
| Charts | Recharts |
| Form validation | Zod + React Hook Form |
| Containerisation | Docker + docker-compose |
| CI/CD | GitHub Actions → Railway |
| AI analytics (v2) | Anthropic Claude API |

---

## Screens

### 1. Dashboard `/dashboard`

Main screen — a snapshot of the current month.

**Metric cards (top row):**
- Income this month
- Expenses this month
- Balance (income − expenses)
- Total saved

**Charts:**
- Income vs expenses by month (last 6 months) — bar chart
- Expenses by category — pie chart

**Quick actions:**
- "+ Add transaction" button — opens a modal

---

### 2. Transactions `/dashboard/transactions`

Full transaction history with filtering.

**Transaction list:**
- Date, amount, category, type (income / expense), note
- Sorted by date, newest first by default

**Filters:**
- By month
- By category
- By type (income / expense)

**Actions:**
- Add transaction (modal)
- Edit transaction
- Delete transaction
- Import from CSV ("Upload statement" button)

---

### 3. Categories `/dashboard/categories`

Manage income and expense categories.

**Category list:**
- Name, icon (emoji), type (income / expense), colour
- Total spending per category for the current month

**Actions:**
- Create category
- Edit category
- Delete category (only if no transactions are linked)

**Default expense categories:**
`Food`, `Transport`, `Housing`, `Health`, `Entertainment`, `Subscriptions`, `Clothing`, `Other`

**Default income categories:**
`Salary`, `Freelance`, `Gift`, `Other`

---

### 4. Goals `/dashboard/goals`

Savings tracker — set a goal, track progress.

**Goal card:**
- Name (e.g. "Holiday", "New MacBook")
- Target amount
- Current saved amount
- Progress bar
- Deadline (optional)
- Forecast: "At your current pace, you'll reach this in N months"

**Actions:**
- Create goal
- Add funds (deposit amount toward a goal)
- Edit / delete goal

---

## Data Models (Prisma)

```prisma
model User {
  id           String        @id @default(cuid())
  email        String        @unique
  name         String?
  createdAt    DateTime      @default(now())
  transactions Transaction[]
  categories   Category[]
  goals        Goal[]
}

model Transaction {
  id         String   @id @default(cuid())
  amount     Float
  type       Type     // INCOME | EXPENSE
  date       DateTime
  note       String?
  createdAt  DateTime @default(now())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  categoryId String
  category   Category @relation(fields: [categoryId], references: [id])
}

model Category {
  id           String        @id @default(cuid())
  name         String
  icon         String        // emoji
  color        String        // hex
  type         Type
  userId       String
  user         User          @relation(fields: [userId], references: [id])
  transactions Transaction[]
}

model Goal {
  id           String    @id @default(cuid())
  name         String
  targetAmount Float
  savedAmount  Float     @default(0)
  deadline     DateTime?
  createdAt    DateTime  @default(now())
  userId       String
  user         User      @relation(fields: [userId], references: [id])
}

enum Type {
  INCOME
  EXPENSE
}
```

---

## TypeScript Types

```typescript
type TransactionType = "INCOME" | "EXPENSE"

interface Transaction {
  id: string
  amount: number
  type: TransactionType
  date: Date
  note?: string
  categoryId: string
  category: Category
}

interface Category {
  id: string
  name: string
  icon: string
  color: string
  type: TransactionType
}

interface Goal {
  id: string
  name: string
  targetAmount: number
  savedAmount: number
  deadline?: Date
  progress: number        // savedAmount / targetAmount * 100
  monthsLeft?: number     // forecast
}

interface MonthSummary {
  month: string           // "2026-05"
  income: number
  expenses: number
  balance: number
}
```

---

## API Routes (Next.js App Router)

```
GET    /api/transactions          — list with filters
POST   /api/transactions          — create
PATCH  /api/transactions/[id]     — update
DELETE /api/transactions/[id]     — delete
POST   /api/transactions/import   — CSV import

GET    /api/categories            — list
POST   /api/categories            — create
PATCH  /api/categories/[id]       — update
DELETE /api/categories/[id]       — delete

GET    /api/goals                 — list
POST   /api/goals                 — create
PATCH  /api/goals/[id]            — update / add funds
DELETE /api/goals/[id]            — delete

GET    /api/stats/summary         — monthly summary
GET    /api/stats/by-category     — expenses by category
```

---

## Project Structure

```
frankly/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    ← dashboard
│   │   ├── transactions/page.tsx
│   │   ├── categories/page.tsx
│   │   └── goals/page.tsx
│   └── api/
│       ├── transactions/route.ts
│       ├── categories/route.ts
│       ├── goals/route.ts
│       └── stats/
│           ├── summary/route.ts
│           └── by-category/route.ts
├── components/
│   ├── ui/                             ← base: Button, Input, Modal
│   ├── transactions/                   ← TransactionList, TransactionForm
│   ├── goals/                          ← GoalCard, GoalProgress
│   └── charts/                         ← IncomeExpenseChart, CategoryPie
├── lib/
│   ├── db.ts                           ← Prisma client
│   ├── validations.ts                  ← Zod schemas
│   └── csv-parser.ts                   ← CSV parser
├── prisma/
│   └── schema.prisma
├── docker-compose.yml
├── docker-compose.prod.yml
└── Dockerfile
```

---

## Docker

### Local development

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/frankly
    depends_on: [db]

  db:
    image: postgres:16
    environment:
      POSTGRES_DB: frankly
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports: ["5432:5432"]

volumes:
  postgres_data:
```

---

## CI/CD (GitHub Actions)

```
push → main:
  1. lint + typecheck
  2. build Docker image
  3. push → ghcr.io
  4. deploy → Railway (automatic)

manual trigger:
  — none, everything is automatic for v1
```

---

## Authentication

NextAuth.js with Email (magic link) or Google OAuth provider.
For v1 — single user. Multi-user support planned for v2.

---

## Mobile

- Responsive layout with Tailwind (mobile-first)
- Navigation — bottom tab bar on mobile, sidebar on desktop
- Forms optimised for touch input (large tap targets, native `<input type="number">`)

---

## Development Phases

| Phase | Work | Timeline |
|---|---|---|
| 1 | Project init, tsconfig, Prisma, Docker | Week 1 |
| 2 | Authentication, layout, navigation | Week 1–2 |
| 3 | Transactions — CRUD + list + filters | Week 2–3 |
| 4 | Dashboard — metrics + charts | Week 3 |
| 5 | Goals / savings | Week 4 |
| 6 | CSV import | Week 4–5 |
| 7 | Docker + CI/CD + deploy to Railway | Week 5–6 |
| 8 | Mobile polish + refinements | Week 6 |
| 9 | Claude API — AI analytics | After v1 |

---

## Out of scope for v1

- Multi-user support and access control
- Monobank webhook (v2)
- Claude AI analytics (after base version is stable)
- PDF / Excel export
- Notifications and reminders
- Recurring transactions (subscriptions)

---

*Last updated: May 2026*
