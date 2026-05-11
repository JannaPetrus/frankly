import { prisma } from '@/lib/prisma'

export function calcPercent(amount: number, total: number): number {
  return total > 0 ? Math.round((amount / total) * 100) : 0
}

export async function getMonthlyMetrics(userId: string) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)

  const result = await prisma.transaction.groupBy({
    by: ['type'],
    where: { userId, date: { gte: start } },
    _sum: { amount: true },
  })

  const income = Number(result.find((r) => r.type === 'INCOME')?._sum.amount ?? 0)
  const expenses = Number(result.find((r) => r.type === 'EXPENSE')?._sum.amount ?? 0)
  return { income, expenses, balance: income - expenses }
}

export async function getAllTimeBalance(userId: string) {
  const result = await prisma.transaction.groupBy({
    by: ['type'],
    where: { userId },
    _sum: { amount: true },
  })

  const income = Number(result.find((r) => r.type === 'INCOME')?._sum.amount ?? 0)
  const expenses = Number(result.find((r) => r.type === 'EXPENSE')?._sum.amount ?? 0)
  return { allTimeBalance: income - expenses }
}

type TrendRow = { month: string; income: number; expenses: number }

export async function getMonthlyTrend(userId: string): Promise<TrendRow[]> {
  const rows = await prisma.$queryRaw<TrendRow[]>`
    SELECT
      TO_CHAR(DATE_TRUNC('month', date), 'YYYY-MM') AS month,
      SUM(CASE WHEN type::text = 'INCOME' THEN amount ELSE 0 END)::float AS income,
      SUM(CASE WHEN type::text = 'EXPENSE' THEN amount ELSE 0 END)::float AS expenses
    FROM "Transaction"
    WHERE "userId" = ${userId}
      AND date >= DATE_TRUNC('month', NOW()) - INTERVAL '5 months'
    GROUP BY DATE_TRUNC('month', date)
    ORDER BY DATE_TRUNC('month', date) ASC
  `
  return rows.map((r) => ({
    month: r.month,
    income: Number(r.income),
    expenses: Number(r.expenses),
  }))
}

export type CategoryBreakdownItem = {
  name: string
  emoji: string
  color: string
  amount: number
  percent: number
}

export async function getCategoryBreakdown(userId: string): Promise<CategoryBreakdownItem[]> {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)

  const result = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: { userId, type: 'EXPENSE', date: { gte: start } },
    _sum: { amount: true },
  })

  if (result.length === 0) return []

  const total = result.reduce((sum, r) => sum + Number(r._sum.amount ?? 0), 0)

  const categories = await prisma.category.findMany({
    where: { id: { in: result.map((r) => r.categoryId) } },
    select: { id: true, name: true, emoji: true, color: true },
  })

  const categoryMap = new Map(categories.map((c) => [c.id, c]))

  return result
    .map((r) => {
      const cat = categoryMap.get(r.categoryId)
      const amount = Number(r._sum.amount ?? 0)
      return {
        name: cat?.name ?? 'Прочее',
        emoji: cat?.emoji ?? '📦',
        color: cat?.color ?? '#94a3b8',
        amount,
        percent: calcPercent(amount, total),
      }
    })
    .sort((a, b) => b.amount - a.amount)
}
