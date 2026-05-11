import { auth } from "@/auth"
import {
  getMonthlyMetrics,
  getAllTimeBalance,
  getMonthlyTrend,
  getCategoryBreakdown,
} from "@/lib/dashboard"
import { MetricCards } from "./_components/MetricCards"
import { MonthlyBarChart } from "./_components/MonthlyBarChart"
import { ExpensePieChart } from "./_components/ExpensePieChart"

export default async function DashboardPage() {
  const session = await auth()
  const userId = session!.user!.id!

  const [metrics, allTime, trend, breakdown] = await Promise.all([
    getMonthlyMetrics(userId),
    getAllTimeBalance(userId),
    getMonthlyTrend(userId),
    getCategoryBreakdown(userId),
  ])

  const monthLabel = new Date().toLocaleString('ru-RU', { month: 'long', year: 'numeric' })

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-0.5">
        Привет, {session?.user?.name?.split(' ')[0]}!
      </h1>
      <p className="text-sm text-gray-400 mb-6">{monthLabel}</p>

      <MetricCards
        income={metrics.income}
        expenses={metrics.expenses}
        balance={metrics.balance}
        allTimeBalance={allTime.allTimeBalance}
      />

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3">
          <MonthlyBarChart data={trend} />
        </div>
        <div className="col-span-2">
          <ExpensePieChart data={breakdown} />
        </div>
      </div>
    </div>
  )
}
