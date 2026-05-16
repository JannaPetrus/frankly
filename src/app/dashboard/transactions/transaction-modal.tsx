"use client";

import { useState, useRef, useEffect } from "react";
import { Category, Goal } from "@prisma/client";
import { createTransaction } from "./actions";

export function TransactionModal({
  categories,
  goals,
}: {
  categories: Category[];
  goals: Goal[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const formRef = useRef<HTMLFormElement>(null);

  const filtered = categories.filter((c) => c.type === type);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

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

  const inputCls =
    "w-full bg-paper border border-transparent focus:bg-white focus:border-ink-200 rounded-xl px-3.5 py-2.5 text-[14px] text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-4 focus:ring-brand-100 transition";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-primary"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Добавить
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-soft w-full max-w-md screen"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-ink-100">
              <h2 className="text-[18px] font-semibold text-ink-900">
                Новая транзакция
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="icon-btn"
                aria-label="Закрыть"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M6 18 18 6" />
                </svg>
              </button>
            </div>

            <form
              ref={formRef}
              action={handleSubmit}
              className="px-6 py-5 space-y-4"
            >
              {/* Type toggle */}
              <div className="grid grid-cols-2 gap-1.5 bg-paper rounded-xl p-1.5">
                {(["EXPENSE", "INCOME"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`py-2 rounded-lg text-[13px] font-medium transition ${
                      type === t
                        ? t === "EXPENSE"
                          ? "bg-white text-bad-600 shadow-card"
                          : "bg-white text-good-600 shadow-card"
                        : "text-ink-500 hover:text-ink-900"
                    }`}
                  >
                    {t === "EXPENSE" ? "− Расход" : "+ Доход"}
                  </button>
                ))}
              </div>
              <input type="hidden" name="type" value={type} />

              {/* Amount */}
              <div>
                <label className="block text-[13px] font-medium text-ink-700 mb-1.5">
                  Сумма
                </label>
                <div className="relative">
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    placeholder="0"
                    required
                    autoFocus
                    className={`${inputCls} pr-10 num text-[16px]`}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 text-[14px]">
                    ₴
                  </span>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-[13px] font-medium text-ink-700 mb-1.5">
                  Категория
                </label>
                <select name="categoryId" required className={inputCls}>
                  <option value="">Выберите категорию</option>
                  {filtered.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.emoji} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Goal (only INCOME) */}
              {type === "INCOME" && goals.length > 0 && (
                <div>
                  <label className="block text-[13px] font-medium text-ink-700 mb-1.5">
                    Привязать к цели
                    <span className="text-ink-400 font-normal ml-1">
                      · необязательно
                    </span>
                  </label>
                  <select name="goalId" className={inputCls}>
                    <option value="">— без цели —</option>
                    {goals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.emoji ?? "🎯"} {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block text-[13px] font-medium text-ink-700 mb-1.5">
                  Дата
                </label>
                <input
                  name="date"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className={inputCls}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[13px] font-medium text-ink-700 mb-1.5">
                  Описание
                  <span className="text-ink-400 font-normal ml-1">
                    · необязательно
                  </span>
                </label>
                <input
                  name="description"
                  type="text"
                  placeholder="Обед, такси, кофе…"
                  className={inputCls}
                />
              </div>

              {error && (
                <p className="text-bad-600 text-[13px] bg-bad-50 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn-ghost flex-1"
                >
                  Отмена
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
