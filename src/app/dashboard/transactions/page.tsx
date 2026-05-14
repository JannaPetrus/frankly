import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TransactionList } from "./transaction-list";
import { TransactionModal } from "./transaction-modal";

export default async function TransactionsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [transactions, categories, goals] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { date: "desc" },
    }),
    prisma.category.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    prisma.goal.findMany({ where: { userId }, orderBy: { name: "asc" } }),
  ]);

  const turnover = transactions.reduce(
    (sum, t) => sum + Number(t.amount),
    0
  );
  const turnoverLabel = new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  })
    .format(turnover)
    .replace(/,/g, " ");

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[32px] font-semibold tracking-tight text-ink-900">
            Транзакции
          </h1>
          <p className="mt-1 text-ink-500 text-[15px]">
            Всего{" "}
            <span className="text-ink-700 font-medium">
              {transactions.length}{" "}
              {transactions.length === 1
                ? "запись"
                : transactions.length < 5
                ? "записи"
                : "записей"}
            </span>{" "}
            · оборот <span className="num">{turnoverLabel} ₴</span>
          </p>
        </div>
        <TransactionModal categories={categories} goals={goals} />
      </div>

      <TransactionList transactions={transactions} />
    </div>
  );
}
