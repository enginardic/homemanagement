import { useState } from 'react'
import { Trash2, Edit2, X, Check } from 'lucide-react'
import type { Expense, ExpenseInsert } from '../types/database'
import { CATEGORIES } from './ExpenseForm'

interface Props {
  expenses: Expense[]
  onDelete: (id: string) => Promise<boolean>
  onUpdate: (id: string, updates: Partial<ExpenseInsert>) => Promise<boolean>
}

export function ExpenseList({ expenses, onDelete, onUpdate }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<ExpenseInsert>>({})

  const startEdit = (expense: Expense) => {
    setEditingId(expense.id)
    setEditForm({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      notes: expense.notes,
    })
  }

  const saveEdit = async (id: string) => {
    const ok = await onUpdate(id, editForm)
    if (ok) setEditingId(null)
  }

  const getCategoryInfo = (cat: string) => 
    CATEGORIES.find(c => c.value === cat) || { emoji: '📦', label: cat }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  if (expenses.length === 0) {
    return <div className="empty-state">Henüz masraf kaydı yok</div>
  }

  return (
    <div className="expense-list">
      {expenses.map(expense => {
        const catInfo = getCategoryInfo(expense.category)
        const isEditing = editingId === expense.id
        return (
          <div key={expense.id} className={`expense-item ${isEditing ? 'editing' : ''}`}>
            {isEditing ? (
              <div className="expense-edit-row">
                <input
                  className="edit-input"
                  value={editForm.description || ''}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                />
                <input
                  className="edit-input amount-input"
                  type="number"
                  step="0.01"
                  value={editForm.amount || ''}
                  onChange={e => setEditForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                />
                <input
                  className="edit-input date-input"
                  type="date"
                  value={editForm.date || ''}
                  onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                />
                <div className="expense-actions">
                  <button className="btn-icon success" onClick={() => saveEdit(expense.id)}><Check size={16} /></button>
                  <button className="btn-icon" onClick={() => setEditingId(null)}><X size={16} /></button>
                </div>
              </div>
            ) : (
              <div className="expense-row">
                <span className="cat-badge">{catInfo.emoji}</span>
                <div className="expense-info">
                  <span className="expense-desc">{expense.description}</span>
                  {expense.notes && <span className="expense-notes">{expense.notes}</span>}
                  <span className="expense-date">{formatDate(expense.date)}</span>
                </div>
                <div className="expense-right">
                  <span className="expense-amount">{expense.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                  <div className="expense-actions">
                    <button className="btn-icon" onClick={() => startEdit(expense)}><Edit2 size={14} /></button>
                    <button className="btn-icon danger" onClick={() => onDelete(expense.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
