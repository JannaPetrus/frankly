import Link from "next/link";

type Transaction = {
  id: string;
  amount: { toString(): string };
  type: "INCOME" | "EXPENSE";
  description: string | null;
  date: Date;
  category: { name: string; emoji: string; color: string };
};

function formatAmount(value: number): string {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 })
    .format(Math.abs(value))
    .replace(/,/g, " ");
}

export function RecentTransactions({
  transactions,
}: {
  transactions: Transaction[];
}) {
  if (transactions.length === 0) return null;

  return (
    <section className="card">
      <div className="px-6 py-4 flex items-center justify-between border-b border-ink-100">
        <h3 className="text-[17px] font-semibold text-ink-900">
          Недавние операции
        </h3>
        <Link
          href="/dashboard/transactions"
          className="text-[13px] text-brand-600 hover:text-brand-700 font-medium inline-flex items-center gap-1 transition"
        >
          Все транзакции
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <ul className="divide-y divide-ink-100">
        {transactions.map((t) => {
          const amount = Number(t.amount);
          const isInc = t.type === "INCOME";
          return (
            <li
              key={t.id}
              className="row grid grid-cols-12 items-center px-6 py-4"
            >
              <div className="col-span-6 flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-paper border border-ink-200 flex items-center justify-center text-[18px]">
                  {t.category.emoji}
                </div>
                <div className="min-w-0">
                  <div className="text-[15px] text-ink-900 font-medium truncate">
                    {t.description || t.category.name}
                  </div>
                  <div className="text-[12px] text-ink-400 mt-0.5 flex items-center gap-1.5">
                    <span className="dot" style={{ background: t.category.color }} />
                    {t.category.name}
                  </div>
                </div>
              </div>
              <div className="col-span-3 text-[13px] text-ink-500 mono">
                {new Date(t.date).toLocaleDateString("ru-RU")}
              </div>
              <div className="col-span-3 flex items-center justify-end">
                <span
                  className={`num mono text-[15px] font-semibold ${
                    isInc ? "text-good-600" : "text-bad-600"
                  }`}
                >
                  {isInc ? "+" : "−"}
                  {formatAmount(amount)} ₴
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
