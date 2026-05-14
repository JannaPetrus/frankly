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
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-semibold tracking-tight text-ink-900">
          Категории
        </h1>
        <p className="mt-1 text-ink-500 text-[15px]">
          {expenses.length} для расходов · {income.length} для доходов · можно
          переименовать и менять цвет
        </p>
      </div>

      <CategoryList expenses={expenses} income={income} />
    </div>
  );
}
