"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

type MonthData = {
  month: string
  income: number
  expenses: number
}

type MonthlyBarChartProps = {
  data: MonthData[]
}

function formatMonth(month: string): string {
  const [year, m] = month.split('-')
  return new Date(Number(year), Number(m) - 1, 1).toLocaleString('ru-RU', { month: 'short' })
}

export function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">Нет данных за этот период</p>
      </div>
    )
  }

  const formatted = data.map((d) => ({ ...d, month: formatMonth(d.month) }))

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-sm font-semibold text-gray-900 mb-1">Доходы vs Расходы</p>
      <p className="text-xs text-gray-400 mb-4">последние 6 месяцев</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={formatted} barGap={4}>
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#d1d5db' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${Math.round(v / 1000)}к`}
          />
          <Tooltip
            formatter={(value) => {
              if (typeof value === 'number') {
                return new Intl.NumberFormat('uk-UA').format(value)
              }
              return value
            }}
          />
          <Legend
            iconType="square"
            wrapperStyle={{ fontSize: 11 }}
            formatter={(value) => (value === 'income' ? 'Доходы' : 'Расходы')}
          />
          <Bar dataKey="income" fill="#16a34a" radius={[3, 3, 0, 0]} name="income" />
          <Bar dataKey="expenses" fill="#f87171" radius={[3, 3, 0, 0]} name="expenses" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
