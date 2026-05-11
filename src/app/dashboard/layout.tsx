import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <span className="font-bold text-gray-900 text-lg">Frankly</span>
          <div className="flex gap-6">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
              Главная
            </Link>
            <Link href="/dashboard/transactions" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
              Транзакции
            </Link>
            <Link href="/dashboard/categories" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
              Категории
            </Link>
            <Link href="/dashboard/goals" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
              Цели
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{session.user?.name}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button type="submit" className="text-sm text-gray-500 hover:text-gray-900">
              Выйти
            </button>
          </form>
        </div>
      </nav>

      <main className="p-6">{children}</main>
    </div>
  );
}
