# Phase 4 — Dashboard Metrics & Charts

**Date:** 2026-05-11  
**Status:** Approved

## Overview

Add a functional `/dashboard` page with 4 metric cards and 2 charts (bar + pie) using Recharts. Data is fetched server-side in parallel via `Promise.all` and passed as props to client chart components.

## Requirements

- **Metric cards (4):** Доходы / Расходы / Баланс за текущий месяц + Накоплено за всё время
- **Bar chart:** Доходы vs Расходы за последние 6 месяцев, grouped by month
- **Pie chart:** Расходы по категориям за текущий месяц
- **Layout:** 4 cards in a row, then bar chart (60%) + pie chart (40%) side by side

## Architecture

### Data Layer — `src/lib/dashboard.ts`

Four query functions, all accept `userId: string`:

| Function | Query | Returns |
|---|---|---|
| `getMonthlyMetrics(userId)` | `groupBy type` + `_sum amount`, filter `date >= start of month` | `{ income, expenses, balance }` |
| `getAllTimeBalance(userId)` | Same without date filter | `{ allTimeBalance }` |
| `getMonthlyTrend(userId)` | `$queryRaw` with `DATE_TRUNC('month', date)`, last 6 months including current | `Array<{ month: string, income: number, expenses: number }>` |
| `getCategoryBreakdown(userId)` | `groupBy categoryId` + `_sum`, filter current month expenses, include category name/emoji/color; `percent` calculated inside this function | `Array<{ name, emoji, color, amount, percent }>` |

`getMonthlyTrend` uses `$queryRaw` because Prisma's `groupBy` does not support grouping by a date truncation expression.

### Page — `src/app/dashboard/page.tsx`

Server Component. Fetches all data in parallel:

```ts
const [metrics, allTime, trend, breakdown] = await Promise.all([
  getMonthlyMetrics(userId),
  getAllTimeBalance(userId),
  getMonthlyTrend(userId),
  getCategoryBreakdown(userId),
])
```

Renders `MetricCards`, `MonthlyBarChart`, `ExpensePieChart` with fetched data as props.

### Components

| File | Type | Responsibility |
|---|---|---|
| `src/app/dashboard/_components/MetricCards.tsx` | Server Component | Renders 4 stat cards from props |
| `src/app/dashboard/_components/MonthlyBarChart.tsx` | `"use client"` | Recharts `BarChart` — income vs expenses by month |
| `src/app/dashboard/_components/ExpensePieChart.tsx` | `"use client"` | Recharts `PieChart` — expenses by category with legend |

The `_components` folder prefix prevents Next.js from treating these files as routes.

### Dependencies

- Install: `npm install recharts`
- Recharts requires `"use client"` — it uses DOM APIs not available server-side

## Data Flow

```
page.tsx (Server Component)
  ↓ auth() → userId
  ↓ Promise.all([4 queries])
  ├── MetricCards        ← props: { income, expenses, balance, allTimeBalance }
  └── charts row
      ├── MonthlyBarChart ← props: { data: Array<{month, income, expenses}> }
      └── ExpensePieChart ← props: { data: Array<{name, emoji, color, amount, percent}> }
```

## Visual Design

- Cards: white background, 1px border `#e5e7eb`, rounded-lg, colored amounts (green/red/blue/purple)
- Current month bar: dashed outline (data still incoming)
- Pie chart: colored segments matching category colors from DB + emoji + percent legend
- Subtitle on each card: "за май 2026" or "за всё время"

## Edge Cases

- No transactions this month → show `₴ 0` in all cards, empty state in charts ("Нет данных за этот период")
- Fewer than 6 months of data → show only available months in bar chart
- Category with no color in DB → fallback to `#94a3b8` (slate-400)

## Out of Scope

- Period selector (all-time / this year / this month toggle) — Phase 5+
- Skeleton loading states — Phase 5+
- Recharts animations customization
