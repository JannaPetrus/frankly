# Phase 5 — Categories & Goals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить /dashboard/categories (CRUD с инлайн-редактированием) и /dashboard/goals (CRUD через модалку + автоматический прогресс из транзакций).

**Architecture:** Server Component страницы загружают данные и передают их в Client Components. Server Actions обрабатывают мутации с Zod-валидацией. Прогресс цели хранится в `Goal.currentAmount` и обновляется атомарно через `prisma.$transaction` при создании/удалении/обновлении транзакций с `goalId`.

**Tech Stack:** Next.js 14 App Router, TypeScript, Prisma + PostgreSQL, Zod, Tailwind CSS, Vitest

---

## Файловая карта

**Создать:**
- `src/lib/currency.ts` — константа `CURRENCY = "₴"`
- `src/lib/goals.ts` — утилита `calcProgress`
- `src/lib/goals.test.ts` — юнит-тесты
- `src/app/dashboard/categories/actions.ts` — Server Actions
- `src/app/dashboard/categories/category-list.tsx` — Client Component
- `src/app/dashboard/categories/page.tsx` — Server Component
- `src/app/dashboard/goals/actions.ts` — Server Actions
- `src/app/dashboard/goals/goal-modal.tsx` — Client Component
- `src/app/dashboard/goals/goal-card.tsx` — Client Component
- `src/app/dashboard/goals/page.tsx` — Server Component

**Изменить:**
- `prisma/schema.prisma` — добавить `goalId` в Transaction, `transactions` в Goal
- `src/app/dashboard/transactions/actions.ts` — поддержка goalId + обновление Goal
- `src/app/dashboard/transactions/page.tsx` — загружать goals
- `src/app/dashboard/transactions/transaction-modal.tsx` — дропдаун целей при type=INCOME

---

### Task 1: Prisma migration — goalId на Transaction

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Добавить связь в schema.prisma**

В модель `Transaction` добавить после поля `categoryId`:
```prisma
goalId  String?
goal    Goal?   @relation(fields: [goalId], references: [id])
```

В модель `Goal` добавить после поля `updatedAt`:
```prisma
transactions Transaction[]
```

- [ ] **Step 2: Запустить миграцию**

```bash
npx prisma migrate dev --name add_goal_relation
```
Ожидаем: `Your database is now in sync with your schema.`

- [ ] **Step 3: Сгенерировать клиент**

```bash
npx prisma generate
```

- [ ] **Step 4: Коммит**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add goalId relation on Transaction"
```

---

### Task 2: Утилиты — currency.ts + calcProgress + тесты

**Files:**
- Create: `src/lib/currency.ts`
- Create: `src/lib/goals.ts`
- Create: `src/lib/goals.test.ts`

- [ ] **Step 1: Написать падающие тесты**

Создать `src/lib/goals.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { calcProgress } from "./goals";

describe("calcProgress", () => {
  it("returns correct percentage", () => {
    expect(calcProgress(30000, 50000)).toBe(60);
  });

  it("caps at 100 when current exceeds target", () => {
    expect(calcProgress(60000, 50000)).toBe(100);
  });

  it("returns 0 when target is 0", () => {
    expect(calcProgress(0, 0)).toBe(0);
  });

  it("returns 0 when current is 0", () => {
    expect(calcProgress(0, 50000)).toBe(0);
  });
});
```

- [ ] **Step 2: Запустить тесты и убедиться что падают**

```bash
npx vitest run src/lib/goals.test.ts
```
Ожидаем: FAIL — `Cannot find module './goals'`

- [ ] **Step 3: Реализовать calcProgress**

Создать `src/lib/goals.ts`:
```typescript
export function calcProgress(current: number, target: number): number {
  if (target === 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
}
```

- [ ] **Step 4: Запустить тесты и убедиться что проходят**

```bash
npx vitest run src/lib/goals.test.ts
```
Ожидаем: PASS — 4 tests

- [ ] **Step 5: Создать currency.ts**

Создать `src/lib/currency.ts`:
```typescript
export const CURRENCY = "₴";
```

- [ ] **Step 6: Коммит**

```bash
git add src/lib/goals.ts src/lib/goals.test.ts src/lib/currency.ts
git commit -m "feat: add calcProgress utility and CURRENCY constant"
```

---

### Task 3: Categories Server Actions

**Files:**
- Create: `src/app/dashboard/categories/actions.ts`

- [ ] **Step 1: Создать actions.ts**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const CategorySchema = z.object({
  name: z.string().min(1, "Введите название"),
  emoji: z.string().min(1, "Введите emoji"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Неверный формат цвета"),
  type: z.enum(["INCOME", "EXPENSE"]),
});

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Не авторизован");
  return session.user.id;
}

export async function createCategory(formData: FormData) {
  const userId = await getUserId();

  const parsed = CategorySchema.safeParse({
    name: formData.get("name"),
    emoji: formData.get("emoji"),
    color: formData.get("color"),
    type: formData.get("type"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.category.create({ data: { ...parsed.data, userId } });
  revalidatePath("/dashboard/categories");
  return { success: true };
}

export async function updateCategory(id: string, formData: FormData) {
  const userId = await getUserId();

  const parsed = CategorySchema.safeParse({
    name: formData.get("name"),
    emoji: formData.get("emoji"),
    color: formData.get("color"),
    type: formData.get("type"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.category.updateMany({
    where: { id, userId },
    data: parsed.data,
  });
  revalidatePath("/dashboard/categories");
  return { success: true };
}

export async function deleteCategory(id: string) {
  const userId = await getUserId();

  const inUse = await prisma.transaction.count({ where: { categoryId: id, userId } });
  if (inUse > 0) return { error: "Категория используется в транзакциях" };

  await prisma.category.deleteMany({ where: { id, userId } });
  revalidatePath("/dashboard/categories");
  return { success: true };
}
```

- [ ] **Step 2: Коммит**

```bash
git add src/app/dashboard/categories/actions.ts
git commit -m "feat: add categories server actions"
```

---

### Task 4: Categories page UI

**Files:**
- Create: `src/app/dashboard/categories/category-list.tsx`
- Create: `src/app/dashboard/categories/page.tsx`

- [ ] **Step 1: Создать category-list.tsx**

```typescript
"use client";

import { useState } from "react";
import { Category } from "@prisma/client";
import { createCategory, updateCategory, deleteCategory } from "./actions";

export function CategoryList({
  expenses,
  income,
}: {
  expenses: Category[];
  income: Category[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingType, setAddingType] = useState<"INCOME" | "EXPENSE" | null>(null);
  const [error, setError] = useState("");

  async function handleUpdate(id: string, formData: FormData) {
    const result = await updateCategory(id, formData);
    if (result?.error) { setError(result.error); return; }
    setEditingId(null);
    setError("");
  }

  async function handleCreate(formData: FormData) {
    const result = await createCategory(formData);
    if (result?.error) { setError(result.error); return; }
    setAddingType(null);
    setError("");
  }

  async function handleDelete(id: string) {
    const result = await deleteCategory(id);
    if (result?.error) setError(result.error);
    else setError("");
  }

  const columns = [
    { type: "EXPENSE" as const, label: "Расходы", addLabel: "+ добавить расход", items: expenses },
    { type: "INCOME" as const, label: "Доходы", addLabel: "+ добавить доход", items: income },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-6">
        {columns.map((col) => (
          <div key={col.type} className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              {col.label}
            </div>

            <div className="space-y-2">
              {col.items.map((cat) =>
                editingId === cat.id ? (
                  <form
                    key={cat.id}
                    action={(fd) => handleUpdate(cat.id, fd)}
                    className="flex gap-2 p-3 rounded-xl bg-yellow-50 border border-yellow-200"
                  >
                    <input type="hidden" name="type" value={cat.type} />
                    <input
                      name="emoji"
                      defaultValue={cat.emoji}
                      className="w-12 border border-gray-200 rounded-lg px-2 py-1.5 text-center text-base"
                    />
                    <input
                      name="name"
                      defaultValue={cat.name}
                      className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                    />
                    <input
                      name="color"
                      type="color"
                      defaultValue={cat.color}
                      className="w-9 h-9 border border-gray-200 rounded-lg cursor-pointer"
                    />
                    <button
                      type="submit"
                      className="bg-gray-900 text-white rounded-lg px-3 text-sm"
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="bg-gray-100 text-gray-600 rounded-lg px-3 text-sm"
                    >
                      ✕
                    </button>
                  </form>
                ) : (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: cat.color }}
                      />
                      <span className="text-lg">{cat.emoji}</span>
                      <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingId(cat.id)}
                        className="text-gray-400 hover:text-gray-600 px-1.5 py-1 rounded text-sm"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="text-gray-400 hover:text-red-400 px-1.5 py-1 rounded text-sm"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>

            {addingType === col.type ? (
              <form
                action={handleCreate}
                className="mt-3 flex gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200"
              >
                <input type="hidden" name="type" value={col.type} />
                <input
                  name="emoji"
                  placeholder="😀"
                  required
                  className="w-12 border border-gray-200 rounded-lg px-2 py-1.5 text-center text-base"
                />
                <input
                  name="name"
                  placeholder="Название"
                  required
                  className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                />
                <input
                  name="color"
                  type="color"
                  defaultValue="#6B7280"
                  className="w-9 h-9 border border-gray-200 rounded-lg cursor-pointer"
                />
                <button
                  type="submit"
                  className="bg-gray-900 text-white rounded-lg px-3 text-sm"
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => setAddingType(null)}
                  className="bg-gray-100 text-gray-600 rounded-lg px-3 text-sm"
                >
                  ✕
                </button>
              </form>
            ) : (
              <button
                onClick={() => setAddingType(col.type)}
                className="mt-3 w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors"
              >
                {col.addLabel}
              </button>
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Создать page.tsx**

```typescript
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CategoryList } from "./category-list";

export default async function CategoriesPage() {
  const session = await auth();
  const userId = session!.user.id;

  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  const expenses = categories.filter((c) => c.type === "EXPENSE");
  const income = categories.filter((c) => c.type === "INCOME");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Категории</h1>
      <CategoryList expenses={expenses} income={income} />
    </div>
  );
}
```

- [ ] **Step 3: Открыть http://localhost:3000/dashboard/categories — проверить два столбца, инлайн-редактирование, добавление, удаление**

- [ ] **Step 4: Коммит**

```bash
git add src/app/dashboard/categories/
git commit -m "feat: add categories page with inline editing"
```

---

### Task 5: Goals Server Actions

**Files:**
- Create: `src/app/dashboard/goals/actions.ts`

- [ ] **Step 1: Создать actions.ts**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const GoalSchema = z.object({
  name: z.string().min(1, "Введите название"),
  targetAmount: z.coerce.number().positive("Сумма должна быть положительной"),
  deadline: z.string().optional(),
  emoji: z.string().optional(),
});

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Не авторизован");
  return session.user.id;
}

export async function createGoal(formData: FormData) {
  const userId = await getUserId();

  const parsed = GoalSchema.safeParse({
    name: formData.get("name"),
    targetAmount: formData.get("targetAmount"),
    deadline: formData.get("deadline") || undefined,
    emoji: formData.get("emoji") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { deadline, ...rest } = parsed.data;
  await prisma.goal.create({
    data: { ...rest, deadline: deadline ? new Date(deadline) : null, userId },
  });

  revalidatePath("/dashboard/goals");
  return { success: true };
}

export async function updateGoal(id: string, formData: FormData) {
  const userId = await getUserId();

  const parsed = GoalSchema.safeParse({
    name: formData.get("name"),
    targetAmount: formData.get("targetAmount"),
    deadline: formData.get("deadline") || undefined,
    emoji: formData.get("emoji") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { deadline, ...rest } = parsed.data;
  await prisma.goal.updateMany({
    where: { id, userId },
    data: { ...rest, deadline: deadline ? new Date(deadline) : null },
  });

  revalidatePath("/dashboard/goals");
  return { success: true };
}

export async function deleteGoal(id: string) {
  const userId = await getUserId();

  await prisma.$transaction([
    prisma.transaction.updateMany({
      where: { goalId: id, userId },
      data: { goalId: null },
    }),
    prisma.goal.deleteMany({ where: { id, userId } }),
  ]);

  revalidatePath("/dashboard/goals");
}
```

- [ ] **Step 2: Коммит**

```bash
git add src/app/dashboard/goals/actions.ts
git commit -m "feat: add goals server actions"
```

---

### Task 6: Goals page UI

**Files:**
- Create: `src/app/dashboard/goals/goal-modal.tsx`
- Create: `src/app/dashboard/goals/goal-card.tsx`
- Create: `src/app/dashboard/goals/page.tsx`

- [ ] **Step 1: Создать goal-modal.tsx**

```typescript
"use client";

import { useState, useRef } from "react";
import { Goal } from "@prisma/client";
import { createGoal, updateGoal } from "./actions";

export function GoalModal({ goal }: { goal?: Goal }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    setError("");
    const result = goal
      ? await updateGoal(goal.id, formData)
      : await createGoal(formData);
    if (result?.error) { setError(result.error); return; }
    setOpen(false);
    formRef.current?.reset();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          goal
            ? "text-gray-400 hover:text-gray-600 px-1.5 py-1 rounded text-sm"
            : "bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
        }
      >
        {goal ? "✏️" : "+ Новая цель"}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {goal ? "Редактировать цель" : "Новая цель"}
              </h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form ref={formRef} action={handleSubmit} className="space-y-4">
              <div className="flex gap-3">
                <input
                  name="emoji"
                  defaultValue={goal?.emoji ?? ""}
                  placeholder="🎯"
                  className="w-14 border border-gray-300 rounded-xl px-2 py-2 text-center text-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <input
                  name="name"
                  defaultValue={goal?.name ?? ""}
                  placeholder="Название цели"
                  required
                  className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Целевая сумма (₴)
                </label>
                <input
                  name="targetAmount"
                  type="number"
                  step="0.01"
                  defaultValue={goal ? Number(goal.targetAmount) : ""}
                  placeholder="0.00"
                  required
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Срок (необязательно)
                </label>
                <input
                  name="deadline"
                  type="date"
                  defaultValue={
                    goal?.deadline
                      ? new Date(goal.deadline).toISOString().split("T")[0]
                      : ""
                  }
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Сохранить
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Создать goal-card.tsx**

```typescript
"use client";

import { Goal } from "@prisma/client";
import { deleteGoal } from "./actions";
import { GoalModal } from "./goal-modal";
import { calcProgress } from "@/lib/goals";
import { CURRENCY } from "@/lib/currency";

export function GoalCard({ goal }: { goal: Goal }) {
  const progress = calcProgress(
    Number(goal.currentAmount),
    Number(goal.targetAmount)
  );
  const isNearComplete = progress >= 80;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-3xl">{goal.emoji ?? "🎯"}</span>
          <h3 className="text-base font-bold text-gray-900 mt-2">{goal.name}</h3>
        </div>
        <div className="flex gap-1">
          <GoalModal goal={goal} />
          <button
            onClick={() => deleteGoal(goal.id)}
            className="text-gray-400 hover:text-red-400 px-1.5 py-1 rounded text-sm"
          >
            🗑
          </button>
        </div>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${progress}%`,
            background: isNearComplete ? "#10b981" : "#111827",
          }}
        />
      </div>

      <div className="flex justify-between items-center">
        <span className="text-lg font-bold text-gray-900">
          {Number(goal.currentAmount).toLocaleString("uk-UA")} {CURRENCY}
        </span>
        <span className="text-xs text-gray-400">
          из {Number(goal.targetAmount).toLocaleString("uk-UA")} {CURRENCY}
        </span>
      </div>

      <div className={`text-xs ${isNearComplete ? "text-emerald-600" : "text-gray-400"}`}>
        {progress}%
        {goal.deadline
          ? ` · до ${new Date(goal.deadline).toLocaleDateString("uk-UA")}`
          : " · без срока"}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Создать page.tsx**

```typescript
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GoalCard } from "./goal-card";
import { GoalModal } from "./goal-modal";

export default async function GoalsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Цели</h1>
        <GoalModal />
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🎯</p>
          <p>Целей пока нет</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Открыть http://localhost:3000/dashboard/goals — проверить карточки, создать цель, удалить**

- [ ] **Step 5: Коммит**

```bash
git add src/app/dashboard/goals/
git commit -m "feat: add goals page with progress cards and modal"
```

---

### Task 7: Привязка транзакций к целям

**Files:**
- Modify: `src/app/dashboard/transactions/actions.ts`
- Modify: `src/app/dashboard/transactions/page.tsx`
- Modify: `src/app/dashboard/transactions/transaction-modal.tsx`

- [ ] **Step 1: Обновить actions.ts**

Полностью заменить содержимое файла:
```typescript
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const TransactionSchema = z.object({
  amount: z.coerce.number().positive("Сумма должна быть положительной"),
  type: z.enum(["INCOME", "EXPENSE"]),
  description: z.string().optional(),
  date: z.string().min(1, "Укажите дату"),
  categoryId: z.string().min(1, "Выберите категорию"),
  goalId: z.string().optional(),
});

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Не авторизован");
  return session.user.id;
}

export async function createTransaction(formData: FormData) {
  const userId = await getUserId();

  const parsed = TransactionSchema.safeParse({
    amount: formData.get("amount"),
    type: formData.get("type"),
    description: formData.get("description"),
    date: formData.get("date"),
    categoryId: formData.get("categoryId"),
    goalId: formData.get("goalId") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { goalId, amount, type, description, date, categoryId } = parsed.data;

  if (goalId && type === "INCOME") {
    await prisma.$transaction([
      prisma.transaction.create({
        data: { amount, type, description, date: new Date(date), categoryId, userId, goalId },
      }),
      prisma.goal.update({
        where: { id: goalId },
        data: { currentAmount: { increment: amount } },
      }),
    ]);
  } else {
    await prisma.transaction.create({
      data: { amount, type, description, date: new Date(date), categoryId, userId },
    });
  }

  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/goals");
  return { success: true };
}

export async function deleteTransaction(id: string) {
  const userId = await getUserId();

  const tx = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!tx) return;

  if (tx.goalId && tx.type === "INCOME") {
    await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { id, userId } }),
      prisma.goal.update({
        where: { id: tx.goalId },
        data: { currentAmount: { decrement: Number(tx.amount) } },
      }),
    ]);
  } else {
    await prisma.transaction.deleteMany({ where: { id, userId } });
  }

  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/goals");
}

export async function updateTransaction(id: string, formData: FormData) {
  const userId = await getUserId();

  const parsed = TransactionSchema.safeParse({
    amount: formData.get("amount"),
    type: formData.get("type"),
    description: formData.get("description"),
    date: formData.get("date"),
    categoryId: formData.get("categoryId"),
    goalId: formData.get("goalId") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { goalId, amount, type, description, date, categoryId } = parsed.data;

  const old = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!old) return { error: "Транзакция не найдена" };

  const goalOps = [];

  if (old.goalId && old.type === "INCOME") {
    goalOps.push(
      prisma.goal.update({
        where: { id: old.goalId },
        data: { currentAmount: { decrement: Number(old.amount) } },
      })
    );
  }
  if (goalId && type === "INCOME") {
    goalOps.push(
      prisma.goal.update({
        where: { id: goalId },
        data: { currentAmount: { increment: amount } },
      })
    );
  }

  await prisma.$transaction([
    prisma.transaction.updateMany({
      where: { id, userId },
      data: { amount, type, description, date: new Date(date), categoryId, goalId: goalId ?? null },
    }),
    ...goalOps,
  ]);

  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/goals");
  return { success: true };
}
```

- [ ] **Step 2: Обновить transactions/page.tsx — добавить загрузку goals**

```typescript
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TransactionList } from "./transaction-list";
import { TransactionModal } from "./transaction-modal";

export default async function TransactionsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [transactions, categories, goals] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { date: "desc" },
    }),
    prisma.category.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    prisma.goal.findMany({ where: { userId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Транзакции</h1>
        <TransactionModal categories={categories} goals={goals} />
      </div>
      <TransactionList transactions={transactions} />
    </div>
  );
}
```

- [ ] **Step 3: Обновить transaction-modal.tsx — добавить prop goals и дропдаун целей**

Изменить сигнатуру компонента и добавить поле goalId:

```typescript
"use client";

import { useState, useRef } from "react";
import { Category, Goal } from "@prisma/client";
import { createTransaction } from "./actions";

export function TransactionModal({
  categories,
  goals,
}: {
  categories: Category[];
  goals: Goal[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const formRef = useRef<HTMLFormElement>(null);

  const filtered = categories.filter((c) => c.type === type);

  async function handleSubmit(formData: FormData) {
    setError("");
    const result = await createTransaction(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setOpen(false);
      formRef.current?.reset();
      setType("EXPENSE");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
      >
        + Добавить
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Новая транзакция</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form ref={formRef} action={handleSubmit} className="space-y-4">
              <div className="flex gap-2">
                {(["EXPENSE", "INCOME"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                      type === t
                        ? t === "EXPENSE"
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {t === "EXPENSE" ? "Расход" : "Доход"}
                  </button>
                ))}
              </div>
              <input type="hidden" name="type" value={type} />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Сумма</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  required
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
                <select
                  name="categoryId"
                  required
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="">Выберите категорию</option>
                  {filtered.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.emoji} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {type === "INCOME" && goals.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Привязать к цели (необязательно)
                  </label>
                  <select
                    name="goalId"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="">— без цели —</option>
                    {goals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.emoji ?? "🎯"} {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дата</label>
                <input
                  name="date"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание (опционально)</label>
                <input
                  name="description"
                  type="text"
                  placeholder="Обед, такси, кофе..."
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Сохранить
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 4: Запустить dev-сервер и проверить golden path**

```bash
npm run dev
```

1. Создать цель "Ноутбук" на 50 000 ₴
2. Создать INCOME транзакцию с привязкой к цели на 10 000 ₴
3. Перейти на /dashboard/goals — убедиться что прогресс показывает 10 000 ₴ / 20%
4. Удалить транзакцию — прогресс должен вернуться к 0

- [ ] **Step 5: Запустить все тесты**

```bash
npx vitest run
```
Ожидаем: все тесты проходят

- [ ] **Step 6: Коммит**

```bash
git add src/app/dashboard/transactions/
git commit -m "feat: link income transactions to goals with atomic updates"
```
