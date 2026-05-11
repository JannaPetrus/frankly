import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Привет, {session?.user?.name?.split(" ")[0]}!
      </h1>
      <p className="text-gray-500">Дашборд в разработке</p>
    </div>
  );
}
