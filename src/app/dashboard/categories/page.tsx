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
