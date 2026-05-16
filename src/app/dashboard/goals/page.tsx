import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GoalCard } from "./goal-card";
import { GoalModal } from "./goal-modal";

export default async function GoalsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[32px] font-semibold tracking-tight text-ink-900">
            Цели
          </h1>
          <p className="mt-1 text-ink-500 text-[15px]">
            Откладывайте на важное и следите за прогрессом
          </p>
        </div>
        <GoalModal />
      </div>

      {goals.length === 0 ? (
        <div className="card py-20 text-center text-ink-400">
          <p className="text-4xl mb-3">🎯</p>
          <p className="text-[14px]">Целей пока нет</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}
