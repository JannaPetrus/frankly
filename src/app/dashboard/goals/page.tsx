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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Цели</h1>
        <GoalModal />
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🎯</p>
          <p>Целей пока нет</p>
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
