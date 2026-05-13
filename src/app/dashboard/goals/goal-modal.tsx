"use client";

import { useState, useRef } from "react";
import { Goal } from "@prisma/client";
import { createGoal, updateGoal } from "./actions";

export function GoalModal({ goal }: { goal?: Goal }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    setError("");
    const result = goal
      ? await updateGoal(goal.id, formData)
      : await createGoal(formData);
    if (result?.error) { setError(result.error); return; }
    setOpen(false);
    formRef.current?.reset();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          goal
            ? "text-gray-400 hover:text-gray-600 px-1.5 py-1 rounded text-sm"
            : "bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
        }
      >
        {goal ? "✏️" : "+ Новая цель"}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {goal ? "Редактировать цель" : "Новая цель"}
              </h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form ref={formRef} action={handleSubmit} className="space-y-4">
              <div className="flex gap-3">
                <input
                  name="emoji"
                  defaultValue={goal?.emoji ?? ""}
                  placeholder="🎯"
                  className="w-14 border border-gray-300 rounded-xl px-2 py-2 text-center text-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <input
                  name="name"
                  defaultValue={goal?.name ?? ""}
                  placeholder="Название цели"
                  required
                  className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Целевая сумма (₴)
                </label>
                <input
                  name="targetAmount"
                  type="number"
                  step="0.01"
                  defaultValue={goal ? Number(goal.targetAmount) : ""}
                  placeholder="0.00"
                  required
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Срок (необязательно)
                </label>
                <input
                  name="deadline"
                  type="date"
                  defaultValue={
                    goal?.deadline
                      ? new Date(goal.deadline).toISOString().split("T")[0]
                      : ""
                  }
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
