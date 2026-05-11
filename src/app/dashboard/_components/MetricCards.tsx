type MetricCardsProps = {
  income: number
  expenses: number
  balance: number
  allTimeBalance: number
  month: string
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function MetricCards({ income, expenses, balance, allTimeBalance, month }: MetricCardsProps) {

  const cards = [
    { label: 'Доходы', amount: income, color: '#16a34a', subtitle: `за ${month}` },
    { label: 'Расходы', amount: expenses, color: '#dc2626', subtitle: `за ${month}` },
    { label: 'Баланс', amount: balance, color: '#2563eb', subtitle: `за ${month}` },
    { label: 'Накоплено', amount: allTimeBalance, color: '#7c3aed', subtitle: 'за всё время' },
  ]

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{card.label}</p>
          <p className="text-2xl font-bold" style={{ color: card.color }}>
            {formatCurrency(card.amount)}
          </p>
          <p className="text-xs text-gray-400 mt-1">{card.subtitle}</p>
        </div>
      ))}
    </div>
  )
}
