import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TransactionList } from "./transaction-list";
import { TransactionModal } from "./transaction-modal";

export default async function TransactionsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [transactions, categories] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { date: "desc" },
    }),
    prisma.category.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Транзакции</h1>
        <TransactionModal categories={categories} />
      </div>
      <TransactionList transactions={transactions} categories={categories} />
    </div>
  );
}
