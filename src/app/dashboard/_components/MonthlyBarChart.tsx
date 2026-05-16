"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

type MonthData = {
  month: string;
  income: number;
  expenses: number;
};

type MonthlyBarChartProps = {
  data: MonthData[];
};

function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  return new Date(Number(year), Number(m) - 1, 1).toLocaleString("ru-RU", {
    month: "short",
  });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 })
    .format(value)
    .replace(/,/g, " ");
}

type TipPayloadItem = { dataKey: string; value: number; color: string };
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const inc = payload.find((p) => p.dataKey === "income")?.value ?? 0;
  const exp = payload.find((p) => p.dataKey === "expenses")?.value ?? 0;
  return (
    <div className="bg-ink-900 text-white text-[11px] rounded-lg shadow-soft px-3 py-2">
      <div className="font-semibold mono mb-1">{label}</div>
      <div className="flex gap-3">
        <span className="text-good-500 mono">+{formatCurrency(inc)} ₴</span>
        <span className="text-bad-500 mono">−{formatCurrency(exp)} ₴</span>
      </div>
    </div>
  );
}

export function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  const empty = data.every((d) => d.income === 0 && d.expenses === 0);
  const formatted = data.map((d) => ({ ...d, month: formatMonth(d.month) }));

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-[17px] font-semibold text-ink-900">
            Доходы и расходы
          </h3>
          <p className="text-[13px] text-ink-500 mt-0.5">Последние 6 месяцев</p>
        </div>
        <div className="flex items-center gap-4 text-[13px]">
          <span className="inline-flex items-center gap-2 text-ink-700">
            <span className="w-2.5 h-2.5 rounded-sm bg-good-500" />
            Доходы
          </span>
          <span className="inline-flex items-center gap-2 text-ink-700">
            <span className="w-2.5 h-2.5 rounded-sm bg-bad-500/70" />
            Расходы
          </span>
        </div>
      </div>

      {empty ? (
        <div className="h-[280px] flex items-center justify-center text-ink-400 text-[14px]">
          Нет данных за этот период
        </div>
      ) : (
        <div className="mt-6 h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formatted} barGap={4} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid stroke="#EFF0F3" strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#8A9099" }}
                axisLine={false}
                tickLine={false}
                dy={6}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#B7BCC4" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${Math.round(v / 1000)}к`}
                width={48}
              />
              <Tooltip cursor={{ fill: "rgba(15,17,21,0.04)" }} content={<CustomTooltip />} />
              <Bar dataKey="income"   fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={28} />
              <Bar dataKey="expenses" fill="#EF4444" fillOpacity={0.75} radius={[6, 6, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
