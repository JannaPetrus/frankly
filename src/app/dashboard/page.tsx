import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  getMonthlyMetrics,
  getAllTimeBalance,
  getMonthlyTrend,
  getCategoryBreakdown,
} from "@/lib/dashboard";
import { MetricCards } from "./_components/MetricCards";
import { MonthlyBarChart } from "./_components/MonthlyBarChart";
import { ExpensePieChart } from "./_components/ExpensePieChart";
import { RecentTransactions } from "./_components/RecentTransactions";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [metrics, allTime, trend, breakdown, recent] = await Promise.all([
    getMonthlyMetrics(userId),
    getAllTimeBalance(userId),
    getMonthlyTrend(userId),
    getCategoryBreakdown(userId),
    prisma.transaction.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { date: "desc" },
      take: 5,
    }),
  ]);

  const monthLabel = new Date().toLocaleString("ru-RU", {
    month: "long",
    year: "numeric",
  });
  const firstName = session?.user?.name?.split(" ")[0] ?? "";

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[32px] font-semibold tracking-tight text-ink-900">
            Привет, {firstName} <span className="inline-block">👋</span>
          </h1>
          <p className="mt-1 text-ink-500 text-[15px]">
            Сводка за <span className="text-ink-700 font-medium">{monthLabel}</span>
          </p>
        </div>
      </div>

      <MetricCards
        income={metrics.income}
        expenses={metrics.expenses}
        balance={metrics.balance}
        allTimeBalance={allTime.allTimeBalance}
        month={monthLabel}
      />

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <MonthlyBarChart data={trend} />
        </div>
        <div className="col-span-1">
          <ExpensePieChart data={breakdown} />
        </div>
      </div>

      <RecentTransactions transactions={recent} />
    </div>
  );
}
