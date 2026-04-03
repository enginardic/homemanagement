import { useState } from 'react'
import { LayoutDashboard, Receipt, Tag, Target, ChevronLeft, ChevronRight } from 'lucide-react'
import './App.css'
import Dashboard from './components/Dashboard'
import ExpenseList from './components/ExpenseList'
import Categories from './components/Categories'
import Budgets from './components/Budgets'
import { monthName } from './lib/utils'
import type { View } from './types'

const NAV: { id: View; label: string; Icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Özet', Icon: LayoutDashboard },
  { id: 'expenses', label: 'Masraflar', Icon: Receipt },
  { id: 'categories', label: 'Kategoriler', Icon: Tag },
  { id: 'budgets', label: 'Bütçe', Icon: Target },
]

const PAGE_TITLES: Record<View, { title: string; desc: (m: number, y: number) => string }> = {
  dashboard: { title: 'Özet', desc: (m, y) => `${monthName(m)} ${y} dönemi` },
  expenses: { title: 'Masraflar', desc: (m, y) => `${monthName(m)} ${y} dönemi` },
  categories: { title: 'Kategoriler', desc: () => 'Tüm kategorilerinizi yönetin' },
  budgets: { title: 'Bütçe Hedefleri', desc: (m, y) => `${monthName(m)} ${y} dönemi` },
}

export default function App() {
  const now = new Date()
  const [view, setView] = useState<View>('dashboard')
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const pt = PAGE_TITLES[view]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>Masraf<br />Yönetim</h1>
          <span>Ev Bütçesi</span>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(({ id, label, Icon }) => (
            <button key={id} className={`nav-item${view === id ? ' active' : ''}`} onClick={() => setView(id)}>
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="month-selector">
            <button onClick={prevMonth}><ChevronLeft size={15} /></button>
            <span>{monthName(month)} {year}</span>
            <button onClick={nextMonth}><ChevronRight size={15} /></button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <div className="page-header">
          <div>
            <h2>{pt.title}</h2>
            <p>{pt.desc(month, year)}</p>
          </div>
        </div>

        <div className="page-body">
          {view === 'dashboard' && <Dashboard month={month} year={year} />}
          {view === 'expenses' && <ExpenseList month={month} year={year} />}
          {view === 'categories' && <Categories />}
          {view === 'budgets' && <Budgets month={month} year={year} />}
        </div>
      </main>
    </div>
  )
}
