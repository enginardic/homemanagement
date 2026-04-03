import { useState } from 'react'
import type { Category, ExpenseInsert } from '../types/database'

const CATEGORIES: { value: Category; label: string; emoji: string }[] = [
  { value: 'market', label: 'Market', emoji: '🛒' },
  { value: 'kira', label: 'Kira', emoji: '🏠' },
  { value: 'faturalar', label: 'Faturalar', emoji: '⚡' },
  { value: 'ulasim', label: 'Ulaşım', emoji: '🚗' },
  { value: 'saglik', label: 'Sağlık', emoji: '💊' },
  { value: 'eglence', label: 'Eğlence', emoji: '🎬' },
  { value: 'giyim', label: 'Giyim', emoji: '👕' },
  { value: 'egitim', label: 'Eğitim', emoji: '📚' },
  { value: 'diger', label: 'Diğer', emoji: '📦' },
]

interface Props {
  onSubmit: (expense: ExpenseInsert) => Promise<boolean>
  onCancel?: () => void
  initialValues?: Partial<ExpenseInsert>
  submitLabel?: string
}

export function ExpenseForm({ onSubmit, onCancel, initialValues, submitLabel = 'Ekle' }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState<ExpenseInsert>({
    description: initialValues?.description || '',
    amount: initialValues?.amount || 0,
    category: initialValues?.category || 'diger',
    date: initialValues?.date || today,
    notes: initialValues?.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.description.trim()) { setError('Açıklama gerekli'); return }
    if (form.amount <= 0) { setError('Tutar 0\'dan büyük olmalı'); return }
    setSaving(true)
    setError(null)
    const ok = await onSubmit(form)
    setSaving(false)
    if (!ok) setError('Kayıt sırasında hata oluştu')
    else {
      setForm({ description: '', amount: 0, category: 'diger', date: today, notes: '' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="expense-form">
      {error && <div className="form-error">{error}</div>}
      <div className="form-grid">
        <div className="form-group">
          <label>Açıklama *</label>
          <input
            type="text"
            placeholder="Migros alışverişi..."
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            required
          />
        </div>
        <div className="form-group">
          <label>Tutar (₺) *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.amount || ''}
            onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
            required
          />
        </div>
        <div className="form-group">
          <label>Kategori</label>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}>
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Tarih</label>
          <input
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          />
        </div>
        <div className="form-group full-width">
          <label>Not (opsiyonel)</label>
          <input
            type="text"
            placeholder="Ek açıklama..."
            value={form.notes || ''}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          />
        </div>
      </div>
      <div className="form-actions">
        {onCancel && <button type="button" className="btn-secondary" onClick={onCancel}>İptal</button>}
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Kaydediliyor...' : submitLabel}
        </button>
      </div>
    </form>
  )
}

export { CATEGORIES }
