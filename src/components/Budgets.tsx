import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { getBudgets, upsertBudget, deleteBudget, getCategories, getExpenses } from '../lib/db'
import { formatCurrency } from '../lib/utils'
import type { Budget, Category, Expense } from '../types'

interface Props { month: number; year: number }

export default function Budgets({ month, year }: Props) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ category_id: '', amount: '' })
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([getBudgets(month, year), getCategories(), getExpenses({ month, year })])
      .then(([b, c, e]) => { setBudgets(b); setCategories(c); setExpenses(e) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [month, year])

  const handleSave = async () => {
    if (!form.category_id || !form.amount) return
    setSaving(true)
    try {
      await upsertBudget({ category_id: form.category_id, amount: parseFloat(form.amount), month, year })
      setShowModal(false)
      setForm({ category_id: '', amount: '' })
      load()
    } catch (e: unknown) { setError((e as Error).message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    try { await deleteBudget(id); load() }
    catch (e: unknown) { setError((e as Error).message) }
  }

  const spentByCategory = (catId: string) =>
    expenses.filter((e) => e.category_id === catId).reduce((s, e) => s + Number(e.amount), 0)

  return (
    <div>
      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : budgets.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 40, height: 40, margin: '0 auto 12px', opacity: 0.4 }}>
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <p>Bu ay için bütçe hedefi belirlenmemiş.</p>
          <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => setShowModal(true)}>
            <Plus size={15} /> Bütçe Hedefi Ekle
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          {budgets.map((b) => {
            const spent = spentByCategory(b.category_id)
            const pct = Math.min((spent / b.amount) * 100, 100)
            const over = spent > b.amount
            return (
              <div key={b.id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>{b.category?.icon}</span>
                    <div>
                      <div style={{ fontWeight: 500 }}>{b.category?.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {formatCurrency(spent)} / {formatCurrency(b.amount)}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '12px', fontWeight: 600, padding: '3px 8px', borderRadius: '20px',
                      background: over ? '#fef2f2' : '#f0fdf4',
                      color: over ? '#dc2626' : '#16a34a',
                    }}>
                      {over ? `%${Math.round((spent / b.amount) * 100 - 100)} aşım` : `%${Math.round(pct)} kullanıldı`}
                    </span>
                    <button className="btn btn-danger" style={{ padding: '5px 7px' }} onClick={() => handleDelete(b.id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '3px', width: `${pct}%`,
                    background: over ? '#ef4444' : b.category?.color ?? 'var(--accent)',
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {budgets.length > 0 && (
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={15} /> Bütçe Hedefi Ekle</button>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={(ev) => { if (ev.target === ev.currentTarget) setShowModal(false) }}>
          <div className="modal">
            <h3>Bütçe Hedefi Ekle</h3>

            <div className="form-group">
              <label>Kategori</label>
              <select className="form-control" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">— Seçin</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Aylık Bütçe (₺)</label>
              <input className="form-control" type="number" step="1" placeholder="0"
                value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
