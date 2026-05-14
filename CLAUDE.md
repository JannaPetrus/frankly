# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # dev server on localhost:3000
npm run build      # production build
npm run lint       # ESLint
npm test           # vitest run (all tests)
npx vitest run src/lib/dashboard.test.ts  # single test file

docker-compose up -d          # start PostgreSQL (port 5432)
npx prisma migrate dev        # apply migrations
npx prisma studio             # GUI for DB
npx prisma generate           # regenerate client after schema changes
```

Required env vars: `DATABASE_URL`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`.

## Architecture

**Stack:** Next.js 14 App Router, TypeScript, Prisma 7 + PostgreSQL, NextAuth v5 (Google OAuth), Tailwind CSS, Recharts, Zod, Vitest.

**Auth flow:** `src/auth.config.ts` — route guards via middleware; `src/auth.ts` — signIn callback creates user + seeds default categories on first login. `session.user.id` is populated from DB in the session callback.

**Data layer:** All DB access goes through `src/lib/prisma.ts` (singleton with `@prisma/adapter-pg` driver). Prisma client is generated into `src/generated/prisma/`. After schema changes run `npx prisma generate`.

**Server Actions pattern:** Each feature area has an `actions.ts` with `"use server"` — validates with Zod, checks auth via `getUserId()`, writes to DB, then calls `revalidatePath()`. No API routes are used for mutations.

**Goal ↔ Transaction linkage:** INCOME transactions can be linked to a Goal. Creates/deletes/updates use `prisma.$transaction([...])` to atomically update `goal.currentAmount` alongside the transaction. This invariant must be maintained in any future changes.

**Dashboard data:** `src/lib/dashboard.ts` contains server-side query functions (`getMonthlyMetrics`, `getMonthlyTrend`, `getCategoryBreakdown`). Monthly trend uses raw SQL via `prisma.$queryRaw`.

**Currency:** Always use `₴` (UAH). The constant is in `src/lib/currency.ts`.

**Tests:** Unit tests live in `src/lib/*.test.ts` and test pure functions only (no DB). Vitest runs in `node` environment with `@` aliased to `src/`.

## Pages

- `/` → redirect to dashboard or login
- `/login` → Google OAuth sign-in
- `/dashboard` → metrics cards + bar chart + pie chart
- `/dashboard/transactions` → transaction list with create/edit/delete modal
- `/dashboard/categories` → inline-editable category list
- `/dashboard/goals` → goal cards with progress bars and modal
