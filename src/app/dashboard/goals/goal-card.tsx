"use client";

import { Goal } from "@prisma/client";
import { deleteGoal } from "./actions";
import { GoalModal } from "./goal-modal";
import { calcProgress } from "@/lib/goals";
import { CURRENCY } from "@/lib/currency";

export function GoalCard({ goal }: { goal: Goal }) {
  const progress = calcProgress(
    Number(goal.currentAmount),
    Number(goal.targetAmount)
  );
  const isNearComplete = progress >= 80;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-3xl">{goal.emoji ?? "🎯"}</span>
          <h3 className="text-base font-bold text-gray-900 mt-2">{goal.name}</h3>
        </div>
        <div className="flex gap-1">
          <GoalModal goal={goal} />
          <button
            onClick={() => deleteGoal(goal.id)}
            className="text-gray-400 hover:text-red-400 px-1.5 py-1 rounded text-sm"
          >
            🗑
          </button>
        </div>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${progress}%`,
            background: isNearComplete ? "#10b981" : "#111827",
          }}
        />
      </div>

      <div className="flex justify-between items-center">
        <span className="text-lg font-bold text-gray-900">
          {Number(goal.currentAmount).toLocaleString("uk-UA")} {CURRENCY}
        </span>
        <span className="text-xs text-gray-400">
          із {Number(goal.targetAmount).toLocaleString("uk-UA")} {CURRENCY}
        </span>
      </div>

      <div className={`text-xs ${isNearComplete ? "text-emerald-600" : "text-gray-400"}`}>
        {progress}%
        {goal.deadline
          ? ` · до ${new Date(goal.deadline).toLocaleDateString("uk-UA")}`
          : " · без срока"}
      </div>
    </div>
  );
}
