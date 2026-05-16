"use client";

import { useState, useMemo } from "react";
import { deleteTransaction } from "./actions";

type Transaction = {
  id: string;
  amount: { toString(): string };
  type: "INCOME" | "EXPENSE";
  description: string | null;
  date: Date;
  category: { name: string; emoji: string; color: string };
};

type Filter = "ALL" | "INCOME" | "EXPENSE";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "ALL", label: "Все" },
  { value: "INCOME", label: "Доходы" },
  { value: "EXPENSE", label: "Расходы" },
];

function formatAmount(value: number): string {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 })
    .format(Math.abs(value))
    .replace(/,/g, " ");
}

export function TransactionList({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filter !== "ALL" && t.type !== filter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        (t.description ?? "").toLowerCase().includes(q) ||
        t.category.name.toLowerCase().includes(q)
      );
    });
  }, [transactions, filter, query]);

  return (
    <div className="card overflow-hidden">
      {/* Toolbar */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-ink-100 gap-3">
        <div className="flex items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className="chip"
              data-active={filter === f.value ? "true" : "false"}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск"
              className="text-[13px] pl-9 pr-3 py-2 rounded-xl bg-paper border border-transparent focus:bg-white focus:border-ink-200 focus:outline-none w-52 placeholder:text-ink-400 transition"
            />
          </div>
        </div>
      </div>

      {/* Column header */}
      {filtered.length > 0 && (
        <div className="px-6 py-3 grid grid-cols-12 text-[11px] uppercase tracking-[0.12em] text-ink-400 font-medium bg-paper/60 border-b border-ink-100">
          <div className="col-span-5">Операция</div>
          <div className="col-span-3">Категория</div>
          <div className="col-span-2">Дата</div>
          <div className="col-span-2 text-right">Сумма</div>
        </div>
      )}

      {/* Rows */}
      {filtered.length === 0 ? (
        <div className="px-6 py-20 text-center text-ink-400">
          <p className="text-4xl mb-3">💸</p>
          <p className="text-[14px]">
            {query || filter !== "ALL"
              ? "Ничего не найдено"
              : "Транзакций пока нет"}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-ink-100">
          {filtered.map((t) => {
            const amount = Number(t.amount);
            const isInc = t.type === "INCOME";
            return (
              <li
                key={t.id}
                className="row grid grid-cols-12 items-center px-6 py-4"
              >
                <div className="col-span-5 flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-paper border border-ink-200 flex items-center justify-center text-[18px]">
                    {t.category.emoji}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[15px] text-ink-900 font-medium truncate">
                      {t.description || t.category.name}
                    </div>
                    <div className="text-[12px] text-ink-400 mt-0.5">
                      {isInc ? "Доход" : "Расход"}
                    </div>
                  </div>
                </div>
                <div className="col-span-3 flex items-center gap-2 text-[13px] text-ink-500">
                  <span
                    className="dot"
                    style={{ background: t.category.color }}
                  />
                  {t.category.name}
                </div>
                <div className="col-span-2 text-[13px] text-ink-500 mono">
                  {new Date(t.date).toLocaleDateString("ru-RU")}
                </div>
                <div className="col-span-2 flex items-center justify-end gap-3">
                  <span
                    className={`num mono text-[15px] font-semibold ${
                      isInc ? "text-good-600" : "text-bad-600"
                    }`}
                  >
                    {isInc ? "+" : "−"}
                    {formatAmount(amount)} ₴
                  </span>
                  <div className="row-actions">
                    <button
                      type="button"
                      onClick={() => deleteTransaction(t.id)}
                      className="icon-btn !w-8 !h-8 hover:!text-bad-600"
                      title="Удалить"
                      aria-label="Удалить"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m1 0v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6" />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {filtered.length > 0 && (
        <div className="px-6 py-4 flex items-center justify-between border-t border-ink-100 bg-paper/40">
          <div className="text-[13px] text-ink-500">
            Показано{" "}
            <span className="num font-medium text-ink-700">
              {filtered.length}
            </span>{" "}
            из{" "}
            <span className="num font-medium text-ink-700">
              {transactions.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
