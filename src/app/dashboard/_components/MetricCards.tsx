type MetricCardsProps = {
  income: number;
  expenses: number;
  balance: number;
  allTimeBalance: number;
  month: string;
};

function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
  return formatted.replace(/,/g, " ");
}

export function MetricCards({
  income,
  expenses,
  balance,
  allTimeBalance,
  month,
}: MetricCardsProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {/* Доходы */}
      <article className="lift card p-5">
        <div className="flex items-center justify-between">
          <span className="text-[12px] uppercase tracking-[0.12em] text-ink-400 font-medium">
            Доходы
          </span>
          <span className="w-8 h-8 rounded-full bg-good-50 text-good-600 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M7 17 17 7M9 7h8v8" />
            </svg>
          </span>
        </div>
        <div className="mt-4 num text-[32px] font-semibold text-good-700">
          {formatCurrency(income)}
          <span className="text-ink-300 text-[22px] font-medium ml-1">₴</span>
        </div>
        <div className="mt-2 text-[13px] text-ink-500">за {month}</div>
      </article>

      {/* Расходы */}
      <article className="lift card p-5">
        <div className="flex items-center justify-between">
          <span className="text-[12px] uppercase tracking-[0.12em] text-ink-400 font-medium">
            Расходы
          </span>
          <span className="w-8 h-8 rounded-full bg-bad-50 text-bad-600 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M17 7 7 17M15 17H7V9" />
            </svg>
          </span>
        </div>
        <div className="mt-4 num text-[32px] font-semibold text-bad-600">
          {formatCurrency(expenses)}
          <span className="text-ink-300 text-[22px] font-medium ml-1">₴</span>
        </div>
        <div className="mt-2 text-[13px] text-ink-500">за {month}</div>
      </article>

      {/* Баланс */}
      <article className="lift card p-5">
        <div className="flex items-center justify-between">
          <span className="text-[12px] uppercase tracking-[0.12em] text-ink-400 font-medium">
            Баланс
          </span>
          <span className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <rect x="3" y="6" width="18" height="13" rx="2" />
              <path d="M3 10h18" />
            </svg>
          </span>
        </div>
        <div
          className={`mt-4 num text-[32px] font-semibold ${
            balance < 0 ? "text-bad-600" : "text-ink-900"
          }`}
        >
          {balance < 0 ? "−" : ""}
          {formatCurrency(balance)}
          <span className="text-ink-300 text-[22px] font-medium ml-1">₴</span>
        </div>
        <div className="mt-2 text-[13px] text-ink-500">за {month}</div>
      </article>

      {/* Накоплено (dark hero) */}
      <article className="lift rounded-2xl p-5 shadow-soft relative overflow-hidden bg-ink-900 text-white">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-brand-500/30 blur-2xl" />
        <div className="relative flex items-center justify-between">
          <span className="text-[12px] uppercase tracking-[0.12em] text-white/50 font-medium">
            Накоплено
          </span>
          <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 4 7v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V7l-8-5z" />
            </svg>
          </span>
        </div>
        <div className="relative mt-4 num text-[32px] font-semibold">
          {allTimeBalance < 0 ? "−" : ""}
          {formatCurrency(allTimeBalance)}
          <span className="text-white/40 text-[22px] font-medium ml-1">₴</span>
        </div>
        <div className="relative mt-2 text-[13px] text-white/60">за всё время</div>
      </article>
    </div>
  );
}
