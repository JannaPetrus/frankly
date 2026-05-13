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
