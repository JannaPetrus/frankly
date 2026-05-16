"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { CategoryBreakdownItem } from "@/lib/dashboard";

type ExpensePieChartProps = {
  data: CategoryBreakdownItem[];
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 })
    .format(value)
    .replace(/,/g, " ");
}

export function ExpensePieChart({ data }: ExpensePieChartProps) {
  const total = data.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="card p-6 h-full">
      <h3 className="text-[17px] font-semibold text-ink-900">
        Расходы по категориям
      </h3>
      <p className="text-[13px] text-ink-500 mt-0.5">Текущий месяц</p>

      {data.length === 0 ? (
        <div className="h-[260px] flex items-center justify-center text-ink-400 text-[14px]">
          Нет данных за этот период
        </div>
      ) : (
        <>
          <div className="relative mt-4 mx-auto" style={{ width: 220, height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={105}
                  paddingAngle={2}
                  strokeWidth={0}
                  startAngle={90}
                  endAngle={-270}
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) =>
                    typeof value === "number" ? `${formatCurrency(value)} ₴` : value
                  }
                  contentStyle={{
                    background: "#0F1115",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "white",
                    padding: "6px 10px",
                  }}
                  itemStyle={{ color: "white" }}
                  labelStyle={{ color: "white" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-[11px] uppercase tracking-[0.14em] text-ink-400">
                Всего
              </div>
              <div className="num text-[24px] font-semibold mt-0.5 text-ink-900">
                {formatCurrency(total)} ₴
              </div>
              <div className="text-[12px] text-ink-500 mt-0.5">
                {data.length} {data.length === 1 ? "категория" : data.length < 5 ? "категории" : "категорий"}
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-2.5">
            {data.map((item) => (
              <div key={item.name} className="flex items-center gap-3 text-[14px]">
                <span className="dot" style={{ background: item.color }} />
                <span className="flex-1 text-ink-700">
                  <span className="mr-1">{item.emoji}</span>
                  {item.name}
                </span>
                <span className="num mono text-ink-500">
                  {formatCurrency(item.amount)} ₴
                </span>
                <span className="num text-ink-900 font-semibold w-10 text-right">
                  {item.percent}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
