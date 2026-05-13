# Phase 5 — Categories & Goals

**Date:** 2026-05-13
**Status:** Approved

## Context

Продолжение проекта Frankly (personal finance dashboard). Фаза 5 добавляет две страницы: управление категориями и накопительные цели.

## Решения по дизайну

- Категории: инлайн-редактирование, дефолтные и кастомные — без ограничений
- Цели: модалка для создания/редактирования, прогресс считается автоматически из транзакций
- Валюта: константа `CURRENCY = "₴"` в `src/lib/currency.ts`, заменяет хардкод "₽" везде
- Раскладка категорий: два столбца рядом (Расходы | Доходы)

---

## 1. Схема Prisma

Добавить в `Transaction`:
```prisma
goalId  String?
goal    Goal?   @relation(fields: [goalId], references: [id])
```

Добавить в `Goal`:
```prisma
transactions Transaction[]
```

Миграция: `20260513_add_goal_relation`

---

## 2. Страница /dashboard/categories

**Файлы:**
- `categories/page.tsx` — Server Component, загружает все категории userId, делит на EXPENSE/INCOME
- `categories/category-list.tsx` — Client Component
- `categories/actions.ts` — Server Actions

**UI:**
- Два столбца рядом: Расходы | Доходы
- Строка категории: цветная точка + emoji + название + кнопки ✏️ 🗑
- Инлайн-редактирование: поля emoji / название / color picker появляются в строке
- Кнопка "+ добавить расход / добавить доход" внизу каждого столбца — открывает инлайн-форму

**Server Actions:**
- `createCategory(formData)` — поля: name, emoji, color, type
- `updateCategory(id, formData)` — те же поля
- `deleteCategory(id)` — если категория используется в транзакциях → `{ error: "..." }`

**Zod-схема:** name (min 1), emoji (min 1), color (hex), type (INCOME | EXPENSE)

---

## 3. Страница /dashboard/goals

**Файлы:**
- `goals/page.tsx` — Server Component
- `goals/goal-card.tsx` — Client Component, грид карточек
- `goals/goal-modal.tsx` — Client Component, модалка создать/редактировать
- `goals/actions.ts` — Server Actions

**UI:**
- Grid 3 колонки (адаптивно: 1 на mobile)
- Карточка: emoji + название + прогресс-бар + `currentAmount ₴` / `из targetAmount ₴` + % + дедлайн
- Прогресс-бар: чёрный по умолчанию, зелёный при ≥ 80%
- Дедлайн: опционально, если не задан — "без срока"
- Модалка: emoji / название / целевая сумма / срок (optional)

**Server Actions:**
- `createGoal(formData)` — name, targetAmount, deadline?, emoji?
- `updateGoal(id, formData)` — те же поля
- `deleteGoal(id)`

**Zod-схема:** name (min 1), targetAmount (positive), deadline (date string | undefined), emoji (optional)

**currentAmount:** хранится в БД, обновляется атомарно через `prisma.$transaction`:
- `createTransaction` с goalId → `goal.currentAmount += amount`
- `deleteTransaction` с goalId → `goal.currentAmount -= amount`

---

## 4. Обновления существующего кода

**`transactions/transaction-modal.tsx`:**
- При type=INCOME показывать опциональный select "Привязать к цели" (список целей userId)
- page.tsx загружает goals дополнительно для передачи в modal

**`transactions/actions.ts`:**
- `createTransaction`: если goalId передан → `prisma.$transaction([createTx, incrementGoal])`
- `deleteTransaction`: если у транзакции есть goalId → декрементировать goal
- `updateTransaction`: если goalId изменился → декрементировать старый goal, инкрементировать новый

**`dashboard/layout.tsx`:**
- Добавить ссылки "Категории" и "Цели" в навигацию

**Компоненты с суммами:**
- Заменить хардкод "₽" на `CURRENCY` из `src/lib/currency.ts` в: MetricCards, transaction-list, TransactionModal

---

## 5. Обработка ошибок

- Удаление категории с транзакциями → `{ error: "Категория используется в транзакциях" }`
- Удаление цели с привязанными транзакциями → открепить транзакции (set goalId = null) перед удалением
- Все мутации защищены `getUserId()` — неавторизованный запрос бросает ошибку

---

## 6. Тесты

Юнит-тесты в `src/lib/goals.test.ts`:
- `calcProgress(current, target)` → число 0–100
- edge cases: target = 0, current > target
