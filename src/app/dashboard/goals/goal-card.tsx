"use client";

import { Goal } from "@prisma/client";
import { deleteGoal } from "./actions";
import { GoalModal } from "./goal-modal";
import { calcProgress } from "@/lib/goals";
import { CURRENCY } from "@/lib/currency";

function formatAmount(value: number): string {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 })
    .format(value)
    .replace(/,/g, " ");
}

export function GoalCard({ goal }: { goal: Goal }) {
  const current = Number(goal.currentAmount);
  const target = Number(goal.targetAmount);
  const progress = calcProgress(current, target);
  const isDone = progress >= 100;

  const accentBg = isDone
    ? "bg-good-50"
    : progress >= 50
    ? "bg-brand-50"
    : "bg-paper";
  const barStyle = isDone
    ? { background: "#10B981" }
    : { background: "linear-gradient(90deg,#4F46E5,#6366F1)" };

  return (
    <article className="lift card p-6 relative overflow-hidden">
      <div
        className={`absolute right-0 top-0 w-32 h-32 rounded-full -translate-y-12 translate-x-12 ${accentBg}`}
      />
      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-2xl bg-paper border border-ink-200 flex items-center justify-center text-[24px]">
            {goal.emoji ?? "🎯"}
          </span>
          <div>
            <div className="text-[11px] uppercase tracking-[0.12em] text-ink-400 font-medium">
              Цель
            </div>
            <div className="text-[18px] font-semibold leading-tight text-ink-900">
              {goal.name}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isDone && (
            <span className="inline-flex items-center gap-1 text-[12px] font-medium text-good-700 bg-good-50 px-2.5 py-1 rounded-full mr-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12 5 5L20 7" />
              </svg>
              Готово
            </span>
          )}
          <GoalModal goal={goal} />
          <button
            type="button"
            onClick={() => deleteGoal(goal.id)}
            className="icon-btn !w-8 !h-8 hover:!text-bad-600"
            title="Удалить"
            aria-label="Удалить"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m1 0v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative mt-6">
        <div className="flex items-baseline justify-between mb-2">
          <div className="num text-[28px] font-semibold text-ink-900">
            {formatAmount(current)}
            <span className="text-ink-300 text-[18px] ml-1">{CURRENCY}</span>
          </div>
          <div className="num text-[14px] text-ink-500">
            из{" "}
            <span className="text-ink-700 font-medium">
              {formatAmount(target)} {CURRENCY}
            </span>
          </div>
        </div>
        <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, ...barStyle }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-[13px]">
          <span className="text-ink-500">
            <span
              className={`num font-medium ${
                isDone ? "text-good-700" : "text-ink-900"
              }`}
            >
              {progress}%
            </span>{" "}
            {goal.deadline
              ? `· до ${new Date(goal.deadline).toLocaleDateString("ru-RU")}`
              : "· без срока"}
          </span>
        </div>
      </div>
    </article>
  );
}
