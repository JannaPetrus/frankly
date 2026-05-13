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
