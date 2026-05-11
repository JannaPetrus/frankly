# Dashboard Metrics & Charts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Реализовать `/dashboard` страницу с 4 метрическими карточками и 2 графиками (гистограмма + круговая) через Recharts.

**Architecture:** Server Component (`page.tsx`) забирает данные из БД параллельно через `Promise.all` и передаёт как props в дочерние компоненты. Компоненты с Recharts — клиентские (`"use client"`), данные получают через props с сервера.

**Tech Stack:** Next.js 14 App Router, TypeScript, Prisma (prisma-client-js + @prisma/adapter-pg), Tailwind CSS, Recharts, Vitest.

---

## File Map

| Действие | Файл | Ответственность |
|---|---|---|
| Создать | `src/lib/dashboard.ts` | 4 функции запросов к БД + `calcPercent` |
| Создать | `src/lib/dashboard.test.ts` | Unit-тест `calcPercent` |
| Создать | `vitest.config.ts` | Конфигурация Vitest |
| Создать | `src/app/dashboard/_components/MetricCards.tsx` | Server Component — 4 карточки |
| Создать | `src/app/dashboard/_components/MonthlyBarChart.tsx` | Client Component — Recharts BarChart |
| Создать | `src/app/dashboard/_components/ExpensePieChart.tsx` | Client Component — Recharts PieChart |
| Изменить | `src/app/dashboard/page.tsx` | Заменить заглушку на реальную страницу |
| Изменить | `.gitignore` | Добавить `.superpowers/` |

---

## Task 1: Установить зависимости и настроить Vitest

**Files:**
- Modify: `package.json` (через npm install)
- Create: `vitest.config.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Установить Recharts**

```bash
npm install recharts
```

Ожидаемый вывод: `added N packages` без ошибок.

- [ ] **Step 2: Установить Vitest**

```bash
npm install -D vitest
```

- [ ] **Step 3: Добавить скрипт test в package.json**

В `package.json`, в секцию `"scripts"` добавить:
```json
"test": "vitest run"
```

Итоговая секция scripts:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest run"
}
```

- [ ] **Step 4: Создать vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 5: Добавить .superpowers/ в .gitignore**

В конец файла `.gitignore` добавить:
```
# brainstorming sessions
.superpowers/
```

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts .gitignore
git commit -m "chore: add recharts and vitest"
```

---

## Task 2: Data layer — `src/lib/dashboard.ts`

**Что нового:** Prisma умеет делать `groupBy` с агрегатами (`_sum`) прямо в запросе — база считает суммы, а не мы перебираем массив в JS. Для группировки по месяцу Prisma не поддерживает `DATE_TRUNC`, поэтому используем `$queryRaw` — сырой SQL с полным контролем.

**Files:**
- Create: `src/lib/dashboard.ts`
- Create: `src/lib/dashboard.test.ts`

- [ ] **Step 1: Написать падающий тест**

Создать `src/lib/dashboard.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({ prisma: {} }))

import { calcPercent } from './dashboard'

describe('calcPercent', () => {
  it('считает процент', () => {
    expect(calcPercent(30, 100)).toBe(30)
    expect(calcPercent(50, 200)).toBe(25)
    expect(calcPercent(1, 3)).toBe(33)
  })

  it('возвращает 0 когда total равен 0', () => {
    expect(calcPercent(0, 0)).toBe(0)
  })
})
```

- [ ] **Step 2: Запустить тест — убедиться что падает**

```bash
npm test
```

Ожидаемый вывод: ошибка `Cannot find module './dashboard'` или `calcPercent is not exported`.

- [ ] **Step 3: Реализовать dashboard.ts**

Создать `src/lib/dashboard.ts`:

```ts
import { prisma } from '@/lib/prisma'

export function calcPercent(amount: number, total: number): number {
  return total > 0 ? Math.round((amount / total) * 100) : 0
}

export async function getMonthlyMetrics(userId: string) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)

  const result = await prisma.transaction.groupBy({
    by: ['type'],
    where: { userId, date: { gte: start } },
    _sum: { amount: true },
  })

  const income = Number(result.find((r) => r.type === 'INCOME')?._sum.amount ?? 0)
  const expenses = Number(result.find((r) => r.type === 'EXPENSE')?._sum.amount ?? 0)
  return { income, expenses, balance: income - expenses }
}

export async function getAllTimeBalance(userId: string) {
  const result = await prisma.transaction.groupBy({
    by: ['type'],
    where: { userId },
    _sum: { amount: true },
  })

  const income = Number(result.find((r) => r.type === 'INCOME')?._sum.amount ?? 0)
  const expenses = Number(result.find((r) => r.type === 'EXPENSE')?._sum.amount ?? 0)
  return { allTimeBalance: income - expenses }
}

type TrendRow = { month: string; income: number; expenses: number }

export async function getMonthlyTrend(userId: string): Promise<TrendRow[]> {
  const rows = await prisma.$queryRaw<TrendRow[]>`
    SELECT
      TO_CHAR(DATE_TRUNC('month', date), 'YYYY-MM') AS month,
      SUM(CASE WHEN type::text = 'INCOME' THEN amount ELSE 0 END)::float AS income,
      SUM(CASE WHEN type::text = 'EXPENSE' THEN amount ELSE 0 END)::float AS expenses
    FROM "Transaction"
    WHERE "userId" = ${userId}
      AND date >= DATE_TRUNC('month', NOW()) - INTERVAL '5 months'
    GROUP BY DATE_TRUNC('month', date)
    ORDER BY DATE_TRUNC('month', date) ASC
  `
  return rows.map((r) => ({
    month: r.month,
    income: Number(r.income),
    expenses: Number(r.expenses),
  }))
}

export type CategoryBreakdownItem = {
  name: string
  emoji: string
  color: string
  amount: number
  percent: number
}

export async function getCategoryBreakdown(userId: string): Promise<CategoryBreakdownItem[]> {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)

  const result = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: { userId, type: 'EXPENSE', date: { gte: start } },
    _sum: { amount: true },
  })

  if (result.length === 0) return []

  const total = result.reduce((sum, r) => sum + Number(r._sum.amount ?? 0), 0)

  const categories = await prisma.category.findMany({
    where: { id: { in: result.map((r) => r.categoryId) } },
    select: { id: true, name: true, emoji: true, color: true },
  })

  const categoryMap = new Map(categories.map((c) => [c.id, c]))

  return result
    .map((r) => {
      const cat = categoryMap.get(r.categoryId)
      const amount = Number(r._sum.amount ?? 0)
      return {
        name: cat?.name ?? 'Прочее',
        emoji: cat?.emoji ?? '📦',
        color: cat?.color ?? '#94a3b8',
        amount,
        percent: calcPercent(amount, total),
      }
    })
    .sort((a, b) => b.amount - a.amount)
}
```

- [ ] **Step 4: Запустить тест — убедиться что проходит**

```bash
npm test
```

Ожидаемый вывод:
```
✓ src/lib/dashboard.test.ts (2)
  ✓ calcPercent > считает процент
  ✓ calcPercent > возвращает 0 когда total равен 0

Test Files  1 passed (1)
Tests  2 passed (2)
```

- [ ] **Step 5: Проверить TypeScript**

```bash
npx tsc --noEmit
```

Ожидаемый вывод: без ошибок (или только предупреждения не из нашего файла).

- [ ] **Step 6: Commit**

```bash
git add src/lib/dashboard.ts src/lib/dashboard.test.ts
git commit -m "feat: add dashboard data layer"
```

---

## Task 3: MetricCards component

**Что нового:** Серверный компонент, получает числа как props и форматирует их через `Intl.NumberFormat` — стандартный браузерный/Node.js API для локализованного форматирования валют.

**Files:**
- Create: `src/app/dashboard/_components/MetricCards.tsx`

- [ ] **Step 1: Создать компонент**

Создать `src/app/dashboard/_components/MetricCards.tsx`:

```tsx
type MetricCardsProps = {
  income: number
  expenses: number
  balance: number
  allTimeBalance: number
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    maximumFractionDigits: 0,
  }).format(amount)
}

function getMonthLabel(): string {
  return new Date().toLocaleString('ru-RU', { month: 'long', year: 'numeric' })
}

export function MetricCards({ income, expenses, balance, allTimeBalance }: MetricCardsProps) {
  const month = getMonthLabel()

  const cards = [
    { label: 'Доходы', amount: income, color: '#16a34a', subtitle: `за ${month}` },
    { label: 'Расходы', amount: expenses, color: '#dc2626', subtitle: `за ${month}` },
    { label: 'Баланс', amount: balance, color: '#2563eb', subtitle: `за ${month}` },
    { label: 'Накоплено', amount: allTimeBalance, color: '#7c3aed', subtitle: 'за всё время' },
  ]

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{card.label}</p>
          <p className="text-2xl font-bold" style={{ color: card.color }}>
            {formatCurrency(card.amount)}
          </p>
          <p className="text-xs text-gray-400 mt-1">{card.subtitle}</p>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Проверить TypeScript**

```bash
npx tsc --noEmit
```

Ожидаемый вывод: без ошибок.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/_components/MetricCards.tsx
git commit -m "feat: add MetricCards component"
```

---

## Task 4: MonthlyBarChart component

**Что нового:** Первый клиентский компонент с Recharts. `"use client"` в первой строке говорит Next.js: этот компонент выполняется в браузере. `ResponsiveContainer` от Recharts автоматически подстраивает размер графика под контейнер.

**Files:**
- Create: `src/app/dashboard/_components/MonthlyBarChart.tsx`

- [ ] **Step 1: Создать компонент**

Создать `src/app/dashboard/_components/MonthlyBarChart.tsx`:

```tsx
"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

type MonthData = {
  month: string
  income: number
  expenses: number
}

type MonthlyBarChartProps = {
  data: MonthData[]
}

function formatMonth(month: string): string {
  const [year, m] = month.split('-')
  return new Date(Number(year), Number(m) - 1, 1).toLocaleString('ru-RU', { month: 'short' })
}

export function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">Нет данных за этот период</p>
      </div>
    )
  }

  const formatted = data.map((d) => ({ ...d, month: formatMonth(d.month) }))

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-sm font-semibold text-gray-900 mb-1">Доходы vs Расходы</p>
      <p className="text-xs text-gray-400 mb-4">последние 6 месяцев</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={formatted} barGap={4}>
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#d1d5db' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${Math.round(v / 1000)}к`}
          />
          <Tooltip
            formatter={(value: number) => new Intl.NumberFormat('uk-UA').format(value)}
          />
          <Legend
            iconType="square"
            wrapperStyle={{ fontSize: 11 }}
            formatter={(value) => (value === 'income' ? 'Доходы' : 'Расходы')}
          />
          <Bar dataKey="income" fill="#16a34a" radius={[3, 3, 0, 0]} name="income" />
          <Bar dataKey="expenses" fill="#f87171" radius={[3, 3, 0, 0]} name="expenses" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 2: Проверить TypeScript**

```bash
npx tsc --noEmit
```

Ожидаемый вывод: без ошибок.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/_components/MonthlyBarChart.tsx
git commit -m "feat: add MonthlyBarChart component"
```

---

## Task 5: ExpensePieChart component

**Что нового:** `PieChart` + `Pie` + `Cell` — стандартный паттерн Recharts для круговой диаграммы. `Cell` задаёт цвет каждого сегмента отдельно (цвет берём из БД). Легенда отрисовывается вручную (не через Recharts Legend) — так легче контролировать форматирование.

**Files:**
- Create: `src/app/dashboard/_components/ExpensePieChart.tsx`

- [ ] **Step 1: Создать компонент**

Создать `src/app/dashboard/_components/ExpensePieChart.tsx`:

```tsx
"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import type { CategoryBreakdownItem } from "@/lib/dashboard"

type ExpensePieChartProps = {
  data: CategoryBreakdownItem[]
}

export function ExpensePieChart({ data }: ExpensePieChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">Нет данных за этот период</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-sm font-semibold text-gray-900 mb-1">Расходы по категориям</p>
      <p className="text-xs text-gray-400 mb-4">текущий месяц</p>
      <div className="flex flex-col items-center gap-4">
        <ResponsiveContainer width="100%" height={140}>
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={60}
              strokeWidth={0}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => new Intl.NumberFormat('uk-UA').format(value)}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="w-full flex flex-col gap-1.5">
          {data.map((item) => (
            <div key={item.name} className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                  style={{ background: item.color }}
                />
                {item.emoji} {item.name}
              </span>
              <span className="text-gray-600 font-semibold">{item.percent}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Проверить TypeScript**

```bash
npx tsc --noEmit
```

Ожидаемый вывод: без ошибок.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/_components/ExpensePieChart.tsx
git commit -m "feat: add ExpensePieChart component"
```

---

## Task 6: Wire up dashboard page

**Что нового:** `Promise.all([...])` — запускает все промисы параллельно. Если бы мы писали `await a(); await b(); await c()` — каждый запрос ждал бы предыдущий. `Promise.all` ждёт все сразу, общее время = время самого медленного запроса.

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Заменить страницу**

Полное содержимое `src/app/dashboard/page.tsx`:

```tsx
import { auth } from "@/auth"
import {
  getMonthlyMetrics,
  getAllTimeBalance,
  getMonthlyTrend,
  getCategoryBreakdown,
} from "@/lib/dashboard"
import { MetricCards } from "./_components/MetricCards"
import { MonthlyBarChart } from "./_components/MonthlyBarChart"
import { ExpensePieChart } from "./_components/ExpensePieChart"

export default async function DashboardPage() {
  const session = await auth()
  const userId = session!.user!.id!

  const [metrics, allTime, trend, breakdown] = await Promise.all([
    getMonthlyMetrics(userId),
    getAllTimeBalance(userId),
    getMonthlyTrend(userId),
    getCategoryBreakdown(userId),
  ])

  const monthLabel = new Date().toLocaleString('ru-RU', { month: 'long', year: 'numeric' })

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-0.5">
        Привет, {session?.user?.name?.split(' ')[0]}!
      </h1>
      <p className="text-sm text-gray-400 mb-6">{monthLabel}</p>

      <MetricCards
        income={metrics.income}
        expenses={metrics.expenses}
        balance={metrics.balance}
        allTimeBalance={allTime.allTimeBalance}
      />

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3">
          <MonthlyBarChart data={trend} />
        </div>
        <div className="col-span-2">
          <ExpensePieChart data={breakdown} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Запустить сборку**

```bash
npm run build
```

Ожидаемый вывод: `✓ Compiled successfully` без ошибок TypeScript. Если есть ошибки — исправить перед продолжением.

- [ ] **Step 3: Запустить dev-сервер и проверить в браузере**

```bash
npm run dev
```

Открыть `http://localhost:3000/dashboard`.

Проверить:
- [ ] 4 карточки с цветными числами
- [ ] Гистограмма слева (или сообщение «Нет данных» если транзакций нет)
- [ ] Круговая диаграмма справа (или сообщение «Нет данных»)
- [ ] Нет ошибок в консоли браузера

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: implement dashboard page with metrics and charts"
```
