"use client";

import { useState } from "react";
import { Category } from "@prisma/client";
import { deleteTransaction } from "./actions";

type Transaction = {
  id: string;
  amount: { toString(): string };
  type: "INCOME" | "EXPENSE";
  description: string | null;
  date: Date;
  category: Category;
};

export function TransactionList({
  transactions,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  categories,
}: {
  transactions: Transaction[];
  categories: Category[];
}) {
  const [filter, setFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");

  const filtered = transactions.filter(
    (t) => filter === "ALL" || t.type === filter
  );

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {(["ALL", "INCOME", "EXPENSE"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "ALL" ? "Все" : f === "INCOME" ? "Доходы" : "Расходы"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">💸</p>
          <p>Транзакций пока нет</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl divide-y divide-gray-100">
          {filtered.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{t.category.emoji}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {t.description || t.category.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(t.date).toLocaleDateString("ru-RU")} · {t.category.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`font-semibold text-sm ${
                    t.type === "INCOME" ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {t.type === "INCOME" ? "+" : "−"}{Number(t.amount).toLocaleString("ru-RU")} ₴
                </span>
                <button
                  onClick={() => deleteTransaction(t.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
