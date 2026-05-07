# Настройка базы данных — пошаговая инструкция

## Что нам нужно
- Docker Desktop (запущен)
- Node.js / npm

---

## Шаг 1 — Docker Compose

Создаём `docker-compose.yml` в корне проекта:

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

Запускаем контейнер:

```bash
docker compose up -d
```

Флаг `-d` — запуск в фоне. Остановить: `docker compose down`.

---

## Шаг 2 — Переменные окружения

Создаём два файла с одинаковым содержимым:

**`.env`** — для Prisma CLI:
```
DATABASE_URL="postgresql://frankly:frankly@localhost:5432/frankly_dev"
```

**`.env.local`** — для Next.js (runtime):
```
DATABASE_URL="postgresql://frankly:frankly@localhost:5432/frankly_dev"
```

> `.env.local` уже исключён из git через `.gitignore`. Убедись что `.env` тоже там есть.

---

## Шаг 3 — Установка Prisma

```bash
npm install prisma @prisma/client
npm install --save-dev dotenv
npx prisma init --datasource-provider postgresql
```

После этого появляется:
- `prisma/schema.prisma` — описание моделей
- `prisma.config.ts` — конфигурация подключения
- `.env` — шаблон переменных (заменяем на наш DATABASE_URL)

---

## Шаг 4 — Схема базы данных

Редактируем `prisma/schema.prisma` — описываем модели (таблицы):

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model Category {
  id           String        @id @default(cuid())
  name         String
  emoji        String
  color        String
  type         CategoryType
  isDefault    Boolean       @default(false)
  createdAt    DateTime      @default(now())
  transactions Transaction[]
}

model Transaction {
  id          String          @id @default(cuid())
  amount      Decimal         @db.Decimal(12, 2)
  type        TransactionType
  description String?
  date        DateTime
  categoryId  String
  category    Category        @relation(fields: [categoryId], references: [id])
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}

model Goal {
  id            String    @id @default(cuid())
  name          String
  targetAmount  Decimal   @db.Decimal(12, 2)
  currentAmount Decimal   @default(0) @db.Decimal(12, 2)
  deadline      DateTime?
  emoji         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum CategoryType {
  INCOME
  EXPENSE
}

enum TransactionType {
  INCOME
  EXPENSE
}
```

---

## Шаг 5 — Миграция

Создаём и применяем первую миграцию:

```bash
npx prisma migrate dev --name init
```

Prisma автоматически генерирует SQL и создаёт таблицы в базе.  
Файл миграции сохраняется в `prisma/migrations/` — коммитить в git обязательно.

---

## Шаг 6 — Генерация TypeScript-клиента

```bash
npx prisma generate
```

Генерирует типизированный клиент в `src/generated/prisma/`.  
**Повторять каждый раз после изменения `schema.prisma`.**

---

## Шаг 7 — Singleton Prisma Client

Создаём `src/lib/prisma.ts`:

```ts
import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

Импортируем этот файл везде где нужна база:

```ts
import { prisma } from "@/lib/prisma";
```

---

## Повседневный цикл разработки

| Действие | Команда |
|---|---|
| Запустить базу | `docker compose up -d` |
| Остановить базу | `docker compose down` |
| Изменил схему → применить | `npx prisma migrate dev --name описание` |
| Изменил схему → обновить клиент | `npx prisma generate` |
| Посмотреть данные в браузере | `npx prisma studio` |

---

## Если всё сломалось и нужно начать заново

```bash
docker compose down -v   # удаляет контейнер И все данные
docker compose up -d     # поднимает чистую базу
npx prisma migrate dev   # применяет все миграции заново
```
