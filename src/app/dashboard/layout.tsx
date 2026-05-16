import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { NavLinks } from "./_components/NavLinks";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const name = session.user?.name ?? "";
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-30 bg-paper/85 backdrop-blur border-b border-ink-200/70">
        <div className="max-w-[1320px] mx-auto px-8 h-[68px] flex items-center justify-between">
          <div className="flex items-center gap-10">
            <a href="/dashboard" className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-[10px] bg-ink-900 text-white flex items-center justify-center font-bold text-[15px]">
                f
              </span>
              <span className="font-semibold text-[18px] tracking-tight text-ink-900">Frankly</span>
            </a>
            <NavLinks />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="icon-btn rounded-full"
              title="Уведомления"
              aria-label="Уведомления"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10 21a2 2 0 0 0 4 0" />
              </svg>
            </button>

            <div className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-ink-100/60 cursor-default">
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold text-[13px]">
                {initials || "ЖП"}
              </div>
              <span className="text-[14px] text-ink-700 font-medium pr-1">{name || "Пользователь"}</span>
            </div>

            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="ml-1 text-[14px] text-ink-500 hover:text-ink-900 px-3 py-2 rounded-lg hover:bg-ink-100/60 transition"
              >
                Выйти
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-[1320px] mx-auto px-8 py-10 screen">{children}</main>
    </div>
  );
}
