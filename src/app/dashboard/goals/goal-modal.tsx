"use client";

import { useState, useRef, useEffect } from "react";
import { Goal } from "@prisma/client";
import { createGoal, updateGoal } from "./actions";

export function GoalModal({ goal }: { goal?: Goal }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

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
    const result = goal
      ? await updateGoal(goal.id, formData)
      : await createGoal(formData);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    formRef.current?.reset();
  }

  const inputCls =
    "w-full bg-paper border border-transparent focus:bg-white focus:border-ink-200 rounded-xl px-3.5 py-2.5 text-[14px] text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-4 focus:ring-brand-100 transition";

  return (
    <>
      {goal ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="icon-btn !w-8 !h-8"
          title="Редактировать"
          aria-label="Редактировать"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
          </svg>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn-primary"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Новая цель
        </button>
      )}

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
                {goal ? "Редактировать цель" : "Новая цель"}
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
              <div>
                <label className="block text-[13px] font-medium text-ink-700 mb-1.5">
                  Иконка и название
                </label>
                <div className="flex gap-2">
                  <input
                    name="emoji"
                    defaultValue={goal?.emoji ?? ""}
                    placeholder="🎯"
                    className={`${inputCls} w-16 text-center !text-xl`}
                  />
                  <input
                    name="name"
                    defaultValue={goal?.name ?? ""}
                    placeholder="Название цели"
                    required
                    autoFocus={!goal}
                    className={`${inputCls} flex-1`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-ink-700 mb-1.5">
                  Целевая сумма
                </label>
                <div className="relative">
                  <input
                    name="targetAmount"
                    type="number"
                    step="0.01"
                    defaultValue={goal ? Number(goal.targetAmount) : ""}
                    placeholder="0"
                    required
                    className={`${inputCls} pr-10 num text-[16px]`}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 text-[14px]">
                    ₴
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-ink-700 mb-1.5">
                  Срок
                  <span className="text-ink-400 font-normal ml-1">
                    · необязательно
                  </span>
                </label>
                <input
                  name="deadline"
                  type="date"
                  defaultValue={
                    goal?.deadline
                      ? new Date(goal.deadline).toISOString().split("T")[0]
                      : ""
                  }
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
