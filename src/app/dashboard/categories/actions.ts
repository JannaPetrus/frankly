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
