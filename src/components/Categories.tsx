import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../lib/db'
import type { Category } from '../types'

const ICONS = ['🛒','⚡','🚗','💊','🎬','👕','🍽️','📚','🏠','💻','✈️','🎁','💰','🐾','🌿','📦']
const COLORS = ['#10b981','#f59e0b','#3b82f6','#ef4444','#8b5cf6','#ec4899','#f97316','#06b6d4','#84cc16','#6366f1']

const EMPTY: Omit<Category, 'id' | 'created_at'> = { name: '', icon: '📦', color: '#6366f1' }

export default function Categories() {
  const [cats, setCats] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    getCategories()
      .then(setCats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openAdd = () => { setEditing(null); setForm(EMPTY); setShowModal(true) }
  const openEdit = (c: Category) => { setEditing(c); setForm({ name: c.name, icon: c.icon, color: c.color }); setShowModal(true) }

  const handleSave = async () => {
    if (!form.name) return
    setSaving(true)
    try {
      if (editing) await updateCategory(editing.id, form)
      else await createCategory(form)
      setShowModal(false)
      load()
    } catch (e: unknown) { setError((e as Error).message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kategoriyi silmek istediğinize emin misiniz?\nBu kategorideki masraflar kategorisiz kalacak.')) return
    try { await deleteCategory(id); load() }
    catch (e: unknown) { setError((e as Error).message) }
  }

  return (
    <div>
      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          {cats.map((c) => (
            <div key={c.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '10px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '20px', background: c.color + '18',
                border: `1px solid ${c.color}30`, flexShrink: 0
              }}>
                {c.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: c.color, marginTop: 4 }} />
              </div>
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                <button className="btn btn-ghost" style={{ padding: '5px 7px' }} onClick={() => openEdit(c)}><Pencil size={12} /></button>
                <button className="btn btn-danger" style={{ padding: '5px 7px' }} onClick={() => handleDelete(c.id)}><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Kategori Ekle</button>

      {showModal && (
        <div className="modal-backdrop" onClick={(ev) => { if (ev.target === ev.currentTarget) setShowModal(false) }}>
          <div className="modal">
            <h3>{editing ? 'Kategoriyi Düzenle' : 'Yeni Kategori'}</h3>

            <div className="form-group">
              <label>Kategori Adı</label>
              <input className="form-control" type="text" placeholder="Ör: Market"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>

            <div className="form-group">
              <label>İkon</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {ICONS.map((ic) => (
                  <button key={ic} onClick={() => setForm({ ...form, icon: ic })}
                    style={{
                      width: 36, height: 36, borderRadius: '8px', fontSize: '18px',
                      border: form.icon === ic ? '2px solid var(--accent)' : '1px solid var(--border)',
                      background: form.icon === ic ? 'var(--accent-light)' : 'transparent',
                    }}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Renk</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {COLORS.map((cl) => (
                  <button key={cl} onClick={() => setForm({ ...form, color: cl })}
                    style={{
                      width: 28, height: 28, borderRadius: '50%', background: cl,
                      border: form.color === cl ? '3px solid var(--text-primary)' : '2px solid transparent',
                      outline: form.color === cl ? '2px solid var(--bg-card)' : 'none',
                      outlineOffset: '-4px',
                    }} />
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Kaydediliyor...' : editing ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
