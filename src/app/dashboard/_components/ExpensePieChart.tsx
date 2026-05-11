"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import type { CategoryBreakdownItem } from "@/lib/dashboard"

type ExpensePieChartProps = {
  data: CategoryBreakdownItem[]
}

export function ExpensePieChart({ data }: ExpensePieChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">Нет данных за этот период</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-sm font-semibold text-gray-900 mb-1">Расходы по категориям</p>
      <p className="text-xs text-gray-400 mb-4">текущий месяц</p>
      <div className="flex flex-col items-center gap-4">
        <ResponsiveContainer width="100%" height={140}>
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={60}
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => {
                if (typeof value === 'number') {
                  return new Intl.NumberFormat('uk-UA').format(value)
                }
                return value
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="w-full flex flex-col gap-1.5">
          {data.map((item) => (
            <div key={item.name} className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                  style={{ background: item.color }}
                />
                {item.emoji} {item.name}
              </span>
              <span className="text-gray-600 font-semibold">{item.percent}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
