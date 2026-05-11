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
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { amount, type, description, date, categoryId } = parsed.data;

  await prisma.transaction.create({
    data: {
      amount,
      type,
      description,
      date: new Date(date),
      categoryId,
      userId,
    },
  });

  revalidatePath("/dashboard/transactions");
  return { success: true };
}

export async function deleteTransaction(id: string) {
  const userId = await getUserId();

  await prisma.transaction.deleteMany({
    where: { id, userId },
  });

  revalidatePath("/dashboard/transactions");
}

export async function updateTransaction(id: string, formData: FormData) {
  const userId = await getUserId();

  const parsed = TransactionSchema.safeParse({
    amount: formData.get("amount"),
    type: formData.get("type"),
    description: formData.get("description"),
    date: formData.get("date"),
    categoryId: formData.get("categoryId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { amount, type, description, date, categoryId } = parsed.data;

  await prisma.transaction.updateMany({
    where: { id, userId },
    data: { amount, type, description, date: new Date(date), categoryId },
  });

  revalidatePath("/dashboard/transactions");
  return { success: true };
}
