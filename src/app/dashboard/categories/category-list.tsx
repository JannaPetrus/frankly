"use client";

import { useState } from "react";
import { Category } from "@prisma/client";
import { createCategory, updateCategory, deleteCategory } from "./actions";

export function CategoryList({
  expenses,
  income,
}: {
  expenses: Category[];
  income: Category[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingType, setAddingType] = useState<"INCOME" | "EXPENSE" | null>(
    null
  );
  const [error, setError] = useState("");

  async function handleUpdate(id: string, formData: FormData) {
    const result = await updateCategory(id, formData);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setEditingId(null);
    setError("");
  }
  async function handleCreate(formData: FormData) {
    const result = await createCategory(formData);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setAddingType(null);
    setError("");
  }
  async function handleDelete(id: string) {
    const result = await deleteCategory(id);
    if (result?.error) setError(result.error);
    else setError("");
  }

  const columns = [
    {
      type: "EXPENSE" as const,
      label: "Расходы",
      addLabel: "Добавить категорию расхода",
      iconBg: "bg-bad-50",
      iconFg: "text-bad-600",
      items: expenses,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M17 7 7 17M15 17H7V9" />
        </svg>
      ),
    },
    {
      type: "INCOME" as const,
      label: "Доходы",
      addLabel: "Добавить категорию дохода",
      iconBg: "bg-good-50",
      iconFg: "text-good-600",
      items: income,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M7 17 17 7M9 7h8v8" />
        </svg>
      ),
    },
  ];

  const inputCls =
    "bg-white border border-ink-200 rounded-lg px-2.5 py-1.5 text-[13px] text-ink-900 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-6">
        {columns.map((col) => (
          <div key={col.type} className="card">
            {/* Header */}
            <div className="px-6 py-5 flex items-center justify-between border-b border-ink-100">
              <div className="flex items-center gap-3">
                <span
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${col.iconBg} ${col.iconFg}`}
                >
                  {col.icon}
                </span>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.12em] text-ink-400 font-medium">
                    {col.label}
                  </div>
                  <div className="text-[17px] font-semibold leading-tight text-ink-900">
                    {col.items.length}{" "}
                    {col.items.length === 1
                      ? "категория"
                      : col.items.length < 5
                      ? "категории"
                      : "категорий"}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddingType(col.type)}
                className="text-[13px] text-brand-600 hover:text-brand-700 font-medium px-3 py-1.5 rounded-lg hover:bg-brand-50 transition"
              >
                + Категория
              </button>
            </div>

            {/* Rows */}
            <ul className="p-3 space-y-1.5">
              {col.items.map((cat) =>
                editingId === cat.id ? (
                  <li key={cat.id}>
                    <form
                      action={(fd) => handleUpdate(cat.id, fd)}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-brand-50/50 border border-brand-100"
                    >
                      <input type="hidden" name="type" value={cat.type} />
                      <input
                        name="emoji"
                        defaultValue={cat.emoji}
                        className={`${inputCls} w-12 text-center text-base`}
                      />
                      <input
                        name="name"
                        defaultValue={cat.name}
                        className={`${inputCls} flex-1`}
                      />
                      <input
                        name="color"
                        type="color"
                        defaultValue={cat.color}
                        className="w-9 h-9 border border-ink-200 rounded-lg cursor-pointer bg-white"
                      />
                      <button
                        type="submit"
                        className="btn-primary !px-3 !py-2"
                        title="Сохранить"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m5 12 5 5L20 7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="icon-btn"
                        title="Отмена"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M6 6l12 12M6 18 18 6" />
                        </svg>
                      </button>
                    </form>
                  </li>
                ) : (
                  <li
                    key={cat.id}
                    className="row group flex items-center gap-3 px-3.5 py-3 rounded-xl"
                  >
                    <span
                      className="dot"
                      style={{ background: cat.color }}
                    />
                    <span className="w-9 h-9 rounded-xl bg-paper border border-ink-200 flex items-center justify-center text-[16px]">
                      {cat.emoji}
                    </span>
                    <span className="flex-1 min-w-0 text-[15px] text-ink-900 font-medium truncate">
                      {cat.name}
                    </span>
                    <div className="row-actions flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingId(cat.id)}
                        className="icon-btn !w-8 !h-8"
                        title="Редактировать"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat.id)}
                        className="icon-btn !w-8 !h-8 hover:!text-bad-600"
                        title="Удалить"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m1 0v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6" />
                        </svg>
                      </button>
                    </div>
                  </li>
                )
              )}

              {/* Add row */}
              <li>
                {addingType === col.type ? (
                  <form
                    action={handleCreate}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-paper border border-ink-200"
                  >
                    <input type="hidden" name="type" value={col.type} />
                    <input
                      name="emoji"
                      placeholder="😀"
                      required
                      autoFocus
                      className={`${inputCls} w-12 text-center text-base`}
                    />
                    <input
                      name="name"
                      placeholder="Название"
                      required
                      className={`${inputCls} flex-1`}
                    />
                    <input
                      name="color"
                      type="color"
                      defaultValue="#4F46E5"
                      className="w-9 h-9 border border-ink-200 rounded-lg cursor-pointer bg-white"
                    />
                    <button
                      type="submit"
                      className="btn-primary !px-3 !py-2"
                      title="Создать"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m5 12 5 5L20 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddingType(null)}
                      className="icon-btn"
                      title="Отмена"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M6 6l12 12M6 18 18 6" />
                      </svg>
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingType(col.type)}
                    className="add-card w-full rounded-xl py-3 text-[13px] font-medium"
                  >
                    + {col.addLabel}
                  </button>
                )}
              </li>
            </ul>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-bad-50 border border-bad-500/20 rounded-xl text-[13px] text-bad-600">
          {error}
        </div>
      )}
    </div>
  );
}
