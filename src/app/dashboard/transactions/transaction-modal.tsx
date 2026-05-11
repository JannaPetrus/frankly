"use client";

import { useState, useRef } from "react";
import { Category } from "@prisma/client";
import { createTransaction } from "./actions";

export function TransactionModal({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const formRef = useRef<HTMLFormElement>(null);

  const filtered = categories.filter((c) => c.type === type);

  async function handleSubmit(formData: FormData) {
    setError("");
    const result = await createTransaction(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setOpen(false);
      formRef.current?.reset();
      setType("EXPENSE");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
      >
        + Добавить
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Новая транзакция</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form ref={formRef} action={handleSubmit} className="space-y-4">
              <div className="flex gap-2">
                {(["EXPENSE", "INCOME"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                      type === t
                        ? t === "EXPENSE"
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {t === "EXPENSE" ? "Расход" : "Доход"}
                  </button>
                ))}
              </div>
              <input type="hidden" name="type" value={type} />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Сумма</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  required
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
                <select
                  name="categoryId"
                  required
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="">Выберите категорию</option>
                  {filtered.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.emoji} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дата</label>
                <input
                  name="date"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание (опционально)</label>
                <input
                  name="description"
                  type="text"
                  placeholder="Обед, такси, кофе..."
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Сохранить
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
