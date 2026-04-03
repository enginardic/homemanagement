import type { Expense } from '../types/database'
import { CATEGORIES } from './ExpenseForm'

interface Props {
  expenses: Expense[]
}

export function Dashboard({ expenses }: Props) {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0)
  const thisMonth = expenses.filter(e => {
    const d = new Date(e.date)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const thisMonthTotal = thisMonth.reduce((sum, e) => sum + e.amount, 0)

  const byCat = CATEGORIES.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.value).reduce((sum, e) => sum + e.amount, 0)
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  const topCat = byCat[0]

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card accent">
          <div className="stat-label">Bu Ay</div>
          <div className="stat-value">{thisMonthTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
          <div className="stat-sub">{thisMonth.length} işlem</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Toplam</div>
          <div className="stat-value">{total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
          <div className="stat-sub">{expenses.length} kayıt</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">En Çok</div>
          <div className="stat-value">{topCat ? `${topCat.emoji} ${topCat.label}` : '—'}</div>
          <div className="stat-sub">{topCat ? `${topCat.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺` : ''}</div>
        </div>
      </div>

      {byCat.length > 0 && (
        <div className="cat-breakdown">
          <h3>Kategoriye Göre</h3>
          {byCat.map(cat => (
            <div key={cat.value} className="cat-row">
              <span className="cat-label">{cat.emoji} {cat.label}</span>
              <div className="cat-bar-wrap">
                <div className="cat-bar" style={{ width: `${(cat.total / total) * 100}%` }} />
              </div>
              <span className="cat-total">{cat.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
