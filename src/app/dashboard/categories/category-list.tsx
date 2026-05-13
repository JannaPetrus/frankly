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
  const [addingType, setAddingType] = useState<"INCOME" | "EXPENSE" | null>(null);
  const [error, setError] = useState("");

  async function handleUpdate(id: string, formData: FormData) {
    const result = await updateCategory(id, formData);
    if (result?.error) { setError(result.error); return; }
    setEditingId(null);
    setError("");
  }

  async function handleCreate(formData: FormData) {
    const result = await createCategory(formData);
    if (result?.error) { setError(result.error); return; }
    setAddingType(null);
    setError("");
  }

  async function handleDelete(id: string) {
    const result = await deleteCategory(id);
    if (result?.error) setError(result.error);
    else setError("");
  }

  const columns = [
    { type: "EXPENSE" as const, label: "Расходы", addLabel: "+ добавить расход", items: expenses },
    { type: "INCOME" as const, label: "Доходы", addLabel: "+ добавить доход", items: income },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-6">
        {columns.map((col) => (
          <div key={col.type} className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              {col.label}
            </div>

            <div className="space-y-2">
              {col.items.map((cat) =>
                editingId === cat.id ? (
                  <form
                    key={cat.id}
                    action={(fd) => handleUpdate(cat.id, fd)}
                    className="flex gap-2 p-3 rounded-xl bg-yellow-50 border border-yellow-200"
                  >
                    <input type="hidden" name="type" value={cat.type} />
                    <input
                      name="emoji"
                      defaultValue={cat.emoji}
                      className="w-12 border border-gray-200 rounded-lg px-2 py-1.5 text-center text-base"
                    />
                    <input
                      name="name"
                      defaultValue={cat.name}
                      className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                    />
                    <input
                      name="color"
                      type="color"
                      defaultValue={cat.color}
                      className="w-9 h-9 border border-gray-200 rounded-lg cursor-pointer"
                    />
                    <button
                      type="submit"
                      className="bg-gray-900 text-white rounded-lg px-3 text-sm"
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="bg-gray-100 text-gray-600 rounded-lg px-3 text-sm"
                    >
                      ✕
                    </button>
                  </form>
                ) : (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: cat.color }}
                      />
                      <span className="text-lg">{cat.emoji}</span>
                      <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingId(cat.id)}
                        className="text-gray-400 hover:text-gray-600 px-1.5 py-1 rounded text-sm"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="text-gray-400 hover:text-red-400 px-1.5 py-1 rounded text-sm"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>

            {addingType === col.type ? (
              <form
                action={handleCreate}
                className="mt-3 flex gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200"
              >
                <input type="hidden" name="type" value={col.type} />
                <input
                  name="emoji"
                  placeholder="😀"
                  required
                  className="w-12 border border-gray-200 rounded-lg px-2 py-1.5 text-center text-base"
                />
                <input
                  name="name"
                  placeholder="Название"
                  required
                  className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                />
                <input
                  name="color"
                  type="color"
                  defaultValue="#6B7280"
                  className="w-9 h-9 border border-gray-200 rounded-lg cursor-pointer"
                />
                <button
                  type="submit"
                  className="bg-gray-900 text-white rounded-lg px-3 text-sm"
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => setAddingType(null)}
                  className="bg-gray-100 text-gray-600 rounded-lg px-3 text-sm"
                >
                  ✕
                </button>
              </form>
            ) : (
              <button
                onClick={() => setAddingType(col.type)}
                className="mt-3 w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors"
              >
                {col.addLabel}
              </button>
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
