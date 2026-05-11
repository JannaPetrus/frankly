# Frankly — Dev Log

## Сессия 1 (2026-05-06 → 2026-05-11)

---

## Фаза 1 — Инициализация проекта, Prisma, Docker

### 1. Создание Next.js проекта
```bash
cd /Users/jannapetrus/frankly
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```
Папка должна быть строчными (npm запрещает заглавные буквы в имени пакета).

### 2. Docker Compose — PostgreSQL
Файл `docker-compose.yml`:
```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: frankly
      POSTGRES_PASSWORD: frankly
      POSTGRES_DB: frankly_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
volumes:
  postgres_data:
```
Команды:
```bash
docker compose up -d     # запустить
docker compose down      # остановить
docker compose down -v   # остановить и удалить данные
```

### 3. Переменные окружения
`.env` (для Prisma CLI):
```
DATABASE_URL="postgresql://frankly:frankly@localhost:5432/frankly_dev"
```
`.env.local` (для Next.js runtime) — то же самое. Оба файла в `.gitignore`.

### 4. Prisma
```bash
npm install prisma @prisma/client
npm install --save-dev dotenv
npx prisma init --datasource-provider postgresql
```

**Важно:** использовать классический генератор `prisma-client-js`, не новый `prisma-client`.
Новый генератор кладёт файлы в `src/generated/prisma/` — webpack не может их бандлить
из-за `node:crypto`. Классический генератор кладёт клиент в `node_modules/@prisma/client`.

`prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}
datasource db {
  provider = "postgresql"
}
```

Также нужен `@prisma/adapter-pg` для подключения:
```bash
npm install @prisma/adapter-pg
```

`src/lib/prisma.ts`:
```ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

`next.config.mjs` — обязательные настройки:
```js
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
  },
  webpack: (config) => {
    config.resolve.alias["pg-native"] = false;
    return config;
  },
};
```

### 5. Схема базы данных
Модели: `User`, `Category`, `Transaction`, `Goal`.
Каждая модель (кроме User) имеет `userId` — связь с пользователем.

```bash
npx prisma migrate dev --name init
npx prisma generate
```

Миграции повторять при каждом изменении схемы. `generate` — после каждого изменения схемы.

---

## Фаза 2 — Auth + Layout

### 6. NextAuth v5
```bash
npm install next-auth@beta
```

**Ключевой паттерн:** два файла конфига.

`src/auth.config.ts` — лёгкий, без Prisma (используется в middleware/Edge runtime):
```ts
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig: NextAuthConfig = {
  providers: [Google],
  pages: { signIn: "/login" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      if (isOnDashboard && !isLoggedIn) return false;
      if (nextUrl.pathname === "/login" && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
  },
};
```

`src/auth.ts` — полный, с Prisma (для server components и API routes):
- При первом входе: создаёт User + 12 дефолтных категорий
- При повторном входе: обновляет имя и фото

`src/middleware.ts` — использует только `auth.config.ts`:
```ts
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export const { auth: middleware } = NextAuth(authConfig);
export const config = { matcher: ["/dashboard/:path*", "/login"] };
```

`src/app/api/auth/[...nextauth]/route.ts`:
```ts
import { handlers } from "@/auth";
export const { GET, POST } = handlers;
```

### 7. Переменные для NextAuth
В `.env.local`:
```
AUTH_SECRET="..."           # openssl rand -base64 32
AUTH_GOOGLE_ID="..."        # из Google Cloud Console
AUTH_GOOGLE_SECRET="..."    # из Google Cloud Console
```

Google Cloud Console → APIs & Services → Credentials → OAuth Client ID:
- Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

### 8. Layout + страницы
- `src/app/page.tsx` — редирект на `/dashboard`
- `src/app/login/page.tsx` — форма входа через Google
- `src/app/dashboard/layout.tsx` — навигация + кнопка выхода
- `src/app/dashboard/page.tsx` — заглушка дашборда

---

## Фаза 3 — Транзакции CRUD

### 9. Дефолтные категории
`src/lib/default-categories.ts` — 8 расходных + 4 доходных категории.
Создаются автоматически при первой регистрации пользователя в `auth.ts`.

**Проблема:** уже существующие пользователи не получают категории при повторном входе.
Решение для существующего пользователя — добавить напрямую через node скрипт или Prisma Studio.

### 10. Server Actions
`src/app/dashboard/transactions/actions.ts`:
- `createTransaction(formData)` — создать транзакцию
- `deleteTransaction(id)` — удалить (с проверкой userId!)
- `updateTransaction(id, formData)` — обновить

Валидация через Zod. После каждого действия — `revalidatePath("/dashboard/transactions")`.

**Важно:** всегда фильтровать по `userId` при мутациях:
```ts
await prisma.transaction.deleteMany({ where: { id, userId } });
```

### 11. UI компоненты
- `transaction-modal.tsx` — Client Component, форма добавления
- `transaction-list.tsx` — Client Component, список с фильтрами (ALL/INCOME/EXPENSE)
- `page.tsx` — Server Component, читает данные напрямую из БД

---

## GitHub

```bash
git remote add origin git@github.com:JannaPetrus/frankly.git
git push -u origin main
```

SSH ключ: `~/.ssh/id_ed25519_github` (без пароля).
SSH config в `~/.ssh/config` — автозагрузка ключа.

---

## Следующая фаза — Dashboard метрики + графики

Установить Recharts:
```bash
npm install recharts
```

Что нужно сделать:
1. API или Server Component для подсчёта метрик текущего месяца
2. Карточки: доходы / расходы / баланс / всего накоплено
3. Bar chart — доходы vs расходы за 6 месяцев
4. Pie chart — расходы по категориям
