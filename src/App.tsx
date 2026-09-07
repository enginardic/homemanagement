import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  PlusCircle, Trash2, Calendar, Home, CheckCircle, Circle,
  TrendingUp, TrendingDown, Wallet, Users, BarChart3, Copy,
  CreditCard, Building2, Utensils, ChevronRight, Edit2, X,
  Download, LogOut, ChevronLeft, KeyRound, Tag, Bell, Shield, User, ArrowRightLeft, Star, RefreshCw
} from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useAuth } from './lib/auth'
import * as db from './lib/db'
import './App.css'

const APP_VERSION = '0.2.1'
const BUILD_DATE = '2026-04-07'

const TR_MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
const INCOME_SOURCES: Record<string, { name: string; color: string }> = {
  maas:    { name: 'Maaş',            color: '#10b981' },
  serbest: { name: 'Serbest Çalışma', color: '#06b6d4' },
  kira:    { name: 'Kira Geliri',     color: '#6366f1' },
  yatirim: { name: 'Yatırım',         color: '#8b5cf6' },
  diger:   { name: 'Diğer',           color: '#6b7280' },
}

const fmt    = (n: any) => parseFloat(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtDate = (d: string) => { if (!d) return ''; const [y, m, day] = d.split('-'); return `${day}.${m}.${y}` }
const today  = () => new Date().toISOString().split('T')[0]

type Tab = 'overview'|'budget'|'members'|'incomes'|'expenses'|'transfers'|'templates'|'tasks'|'categories'|'banks'|'cards'

export default function App() {
  const { user, signOut } = useAuth()
  const now = new Date()

  // ── Period ──────────────────────────────────────────────────────────────
  const [month, setMonth]       = useState(now.getMonth() + 1)
  const [year,  setYear]        = useState(now.getFullYear())
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [saveStatus, setSaveStatus] = useState('')
  const [showProfile, setShowProfile] = useState(false)
  const [showNotifs, setShowNotifs]   = useState(false)
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  // ── Data ─────────────────────────────────────────────────────────────────
  const [members,      setMembers]      = useState<any[]>([])
  const [expenses,     setExpenses]     = useState<any[]>([])
  const [incomes,      setIncomes]      = useState<any[]>([])
  const [tasks,        setTasks]        = useState<any[]>([])
  const [categories,   setCategories]   = useState<any[]>([])
  const [banks,        setBanks]        = useState<any[]>([])
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [creditCards,  setCreditCards]  = useState<any[]>([])
  const [mealCards,    setMealCards]    = useState<any[]>([])
  const [transfers,    setTransfers]    = useState<any[]>([])
  const [templates,    setTemplates]    = useState<any[]>([])
  const [loading,      setLoading]      = useState(true)
  const [prevBalance,  setPrevBalance]  = useState(0)

  // ── Current user's member record ─────────────────────────────────────────
  const currentMember = members.find(m => m.email === user?.email)
  // Admin kontrolü: role alanı 'Admin' ya da 'admin' ise (büyük/küçük harf duyarsız)
  // Ya da üye kaydı hiç yoksa (ilk kurulum)
  const isAdmin = loading ? false : (
    currentMember?.role?.toLowerCase() === 'admin' ||
    (!currentMember && members.length === 0)
  )

  // ── Form states ──────────────────────────────────────────────────────────
  const [editingExpense,  setEditingExpense]  = useState<any>(null)
  const [editingIncome,   setEditingIncome]   = useState<any>(null)
  const [editingTask,     setEditingTask]     = useState<any>(null)
  const [editingCategory, setEditingCategory] = useState<any>(null)

  const [newExpense,     setNewExpense]     = useState({ title:'', planned_amount:'', amount:'', category:'market', date:today(), member_id:'', planned:false, realized:false, recurring:false, payment_method:'cash', payment_details:'' })
  const [newIncome,      setNewIncome]      = useState({ title:'', planned_amount:'', amount:'', source:'maas', date:today(), member_id:'', planned:false, realized:false, recurring:false })
  const [newTask,        setNewTask]        = useState({ title:'', assignee:'', due_date:today(), recurring:false, recurring_type:'daily' })
  const [newMember,      setNewMember]      = useState({ name:'', role:'Üye', color:'#6366f1', email:'', password:'' })
  const [newCategory,    setNewCategory]    = useState({ key:'', name:'', color:'#6b7280' })
  const [newBank,        setNewBank]        = useState('')
  const [newBankAccount, setNewBankAccount] = useState({ bank_id:'', account_name:'', iban:'', branch:'' })
  const [newCreditCard,  setNewCreditCard]  = useState({ bank_id:'', card_name:'', type:'credit' })
  const [newMealCard,    setNewMealCard]    = useState('')
  const [newPassword,    setNewPassword]    = useState({ next:'', confirm:'' })
  const [pwMsg,          setPwMsg]          = useState('')
  const [newTransfer,    setNewTransfer]    = useState({ from_member_id:'', to_member_id:'', amount:'', description:'', date:today() })
  const [newTemplate,    setNewTemplate]    = useState({ type:'expense', title:'', amount:'', category:'market', source:'maas', member_id:'', payment_method:'cash', payment_details:'', frequency:'monthly', day_of_month:'1' })

  const toast = (msg: string) => { setSaveStatus(msg); setTimeout(() => setSaveStatus(''), 2500) }

  // ── Load all data ────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      let [m, e, i, t, c, b, ba, cc, mc, tr, tpl] = await Promise.all([
        db.getMembers(), db.getExpenses(month, year), db.getIncomes(month, year), db.getTasks(),
        db.getCategories(), db.getBanks(), db.getBankAccounts(), db.getCreditCards(), db.getMealCards(),
        db.getTransfers(), db.getRecurringTemplates()
      ])
      setExpenses(e); setIncomes(i); setTasks(t)  // setMembers aşağıda user bloğunda yapılır
      setCategories(c); setBanks(b); setBankAccounts(ba); setCreditCards(cc); setMealCards(mc)
      setTransfers(tr); setTemplates(tpl)

      // Auto-add logged-in user as member if not already there
      if (user) {
        const name  = user.user_metadata?.name || user.email || 'Kullanıcı'
        const email = user.email || ''
        const exists = m.some((mb: any) => mb.email === email)
        if (!exists) {
          // First user ever → Admin, others → Üye
          const role = m.length === 0 ? 'Admin' : 'Üye'
          const newM = await db.upsertMember({ name, role, color: '#6366f1', email })
          m = [...m, newM]  // sonraki setMembers(m) bunu alır
        }
        setMembers(m)  // en güncel listeyi set et
      }

      // Önceki ayın devreden bakiyesini hesapla
      const pm = month === 1 ? 12 : month - 1
      const py = month === 1 ? year - 1 : year
      const [pe, pi] = await Promise.all([db.getExpenses(pm, py), db.getIncomes(pm, py)])
      const pRealizedExp = pe.filter((x:any) => !x.planned || x.realized).reduce((s:number,x:any) => s+parseFloat(x.amount||0), 0)
      const pRealizedInc = pi.filter((x:any) => !x.planned || x.realized).reduce((s:number,x:any) => s+parseFloat(x.amount||0), 0)
      setPrevBalance(pRealizedInc - pRealizedExp)
    } catch(e) { console.error(e); toast('✗ Yükleme hatası') }
    finally { setLoading(false) }
  }, [user, month, year])

  useEffect(() => { loadAll() }, [loadAll])

  const loadPeriod = useCallback(async () => {
    try {
      const [e, i] = await Promise.all([db.getExpenses(month, year), db.getIncomes(month, year)])
      setExpenses(e); setIncomes(i)
    } catch(e) { console.error(e) }
  }, [month, year])

  // Set default member_id to current user whenever members list changes
  useEffect(() => {
    if (!currentMember) return
    setNewExpense(p => ({ ...p, member_id: String(currentMember.id) }))
    setNewIncome(p  => ({ ...p, member_id: String(currentMember.id) }))
    setNewTask(p    => ({ ...p, assignee: currentMember.name }))
  }, [currentMember?.id])

  // Close notif panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Browser push notification on load for upcoming planned items
  useEffect(() => {
    if (loading || plannedAlerts.length === 0) return
    if (!('Notification' in window)) return
    if (Notification.permission === 'granted') {
      plannedAlerts.slice(0, 3).forEach(a => {
        new Notification('📌 Planlanan İşlem', { body: `${a.title} — ${fmt(a.amount)} ₺ (${fmtDate(a.date)})`, icon: '/homemanagement/favicon.svg' })
      })
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission()
    }
  }, [loading])

  // ── Derived data ─────────────────────────────────────────────────────────
  const realizedExp     = expenses.filter(e => !e.planned || e.realized)
  const realizedInc     = incomes.filter(i => !i.planned || i.realized)
  const plannedExp      = expenses.filter(e => e.planned && !e.realized)
  const plannedInc      = incomes.filter(i => i.planned && !i.realized)
  const totalExp        = realizedExp.reduce((s, e) => s + parseFloat(e.amount || 0), 0)
  const totalInc        = realizedInc.reduce((s, i) => s + parseFloat(i.amount || 0), 0)
  const plannedExpTotal = plannedExp.reduce((s, e) => s + parseFloat(e.planned_amount || e.amount || 0), 0)
  const plannedIncTotal = plannedInc.reduce((s, i) => s + parseFloat(i.planned_amount || i.amount || 0), 0)
  // Bütçe ekranı: planlanan işaretli TÜM kayıtların planlanan tutarı (gerçekleşmiş olsun olmasın)
  const budgetExpTotal  = expenses.filter(e => e.planned).reduce((s, e) => s + parseFloat(e.planned_amount || e.amount || 0), 0)
  const budgetIncTotal  = incomes.filter(i => i.planned).reduce((s, i) => s + parseFloat(i.planned_amount || i.amount || 0), 0)
  const balance         = totalInc - totalExp
  const balanceWithCarryover = balance + prevBalance
  const plannedBalance  = plannedIncTotal - plannedExpTotal
  const budgetBalance   = budgetIncTotal - budgetExpTotal
  const completedTasks  = tasks.filter(t => t.completed).length
  const catMap          = Object.fromEntries(categories.map(c => [c.key, c]))

  // Alerts: planned but not realized items
  const plannedAlerts = [
    ...plannedExp.map(e => ({ ...e, type: 'expense', amount: e.planned_amount || e.amount })),
    ...plannedInc.map(i => ({ ...i, type: 'income',  amount: i.planned_amount || i.amount })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const getCategoryData = () => {
    const totals: Record<string, number> = {}
    realizedExp.forEach(e => { totals[e.category] = (totals[e.category] || 0) + parseFloat(e.amount || 0) })
    return Object.entries(totals).map(([k, v]) => ({ name: catMap[k]?.name || k, value: v, color: catMap[k]?.color || '#6b7280' }))
  }

  // Member stats — admin sees all, normal user sees only self
  const visibleMembers = isAdmin ? members : members.filter(m => m.email === user?.email)

  const getMemberById = (id: any) => members.find(m => m.id == id)
  const getBankById   = (id: any) => banks.find(b => b.id == id)

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y-1) } else setMonth(m => m-1) }
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y+1) } else setMonth(m => m+1) }

  // ── CRUD ─────────────────────────────────────────────────────────────────
  const handleAddExpense = async () => {
    if (!newExpense.title) { toast('⚠ Başlık gerekli'); return }
    if (!newExpense.planned_amount && !newExpense.amount) { toast('⚠ En az bir tutar girin'); return }
    try {
      const payload: Record<string, unknown> = {
        title: newExpense.title, category: newExpense.category, date: newExpense.date,
        member_id: newExpense.member_id || null, planned: newExpense.planned,
        realized: newExpense.realized, recurring: newExpense.recurring,
        payment_method: newExpense.payment_method, payment_details: newExpense.payment_details,
      }
      if (newExpense.planned_amount) payload.planned_amount = parseFloat(newExpense.planned_amount)
      if (newExpense.amount)         payload.amount         = parseFloat(newExpense.amount)
      await db.insertExpense(payload)
      toast('✓ Kaydedildi')
      setNewExpense({ title:'', planned_amount:'', amount:'', category:'market', date:today(), member_id: currentMember ? String(currentMember.id) : '', planned:false, realized:false, recurring:false, payment_method:'cash', payment_details:'' })
      loadPeriod()
    } catch(e: any) { toast('✗ ' + e.message) }
  }

  const handleUpdateExpense = async () => {
    if (!editingExpense) return
    try {
      const { id, member, month: _m, year: _y, ...rest } = editingExpense
      await db.updateExpense(id, { ...rest, planned_amount: rest.planned_amount ? parseFloat(rest.planned_amount) : null, amount: rest.amount ? parseFloat(rest.amount) : null })
      setEditingExpense(null); toast('✓ Güncellendi'); loadPeriod()
    } catch(e: any) { toast('✗ ' + e.message) }
  }

  const toggleExpenseRealized = async (exp: any) => {
    const becomingRealized = !exp.realized
    // When marking as realized: if no separate amount yet, use planned_amount as the realized amount
    const newAmount = becomingRealized
      ? (exp.amount || exp.planned_amount)
      : exp.amount
    await db.updateExpense(exp.id, { realized: becomingRealized, amount: newAmount })
    loadPeriod()
  }

  const handleAddIncome = async () => {
    if (!newIncome.title) { toast('⚠ Başlık gerekli'); return }
    if (!newIncome.planned_amount && !newIncome.amount) { toast('⚠ En az bir tutar girin'); return }
    try {
      const payload: Record<string, unknown> = {
        title: newIncome.title, source: newIncome.source, date: newIncome.date,
        member_id: newIncome.member_id || null, planned: newIncome.planned,
        realized: newIncome.realized, recurring: newIncome.recurring,
      }
      if (newIncome.planned_amount) payload.planned_amount = parseFloat(newIncome.planned_amount)
      if (newIncome.amount)         payload.amount         = parseFloat(newIncome.amount)
      await db.insertIncome(payload)
      toast('✓ Kaydedildi')
      setNewIncome({ title:'', planned_amount:'', amount:'', source:'maas', date:today(), member_id: currentMember ? String(currentMember.id) : '', planned:false, realized:false, recurring:false })
      loadPeriod()
    } catch(e: any) { toast('✗ ' + e.message) }
  }

  const handleUpdateIncome = async () => {
    if (!editingIncome) return
    try {
      const { id, member, month: _m, year: _y, ...rest } = editingIncome
      await db.updateIncome(id, { ...rest, planned_amount: rest.planned_amount ? parseFloat(rest.planned_amount) : null, amount: rest.amount ? parseFloat(rest.amount) : null })
      setEditingIncome(null); toast('✓ Güncellendi'); loadPeriod()
    } catch(e: any) { toast('✗ ' + e.message) }
  }

  const toggleIncomeRealized = async (inc: any) => {
    const becomingRealized = !inc.realized
    const newAmount = becomingRealized
      ? (inc.amount || inc.planned_amount)
      : inc.amount
    await db.updateIncome(inc.id, { realized: becomingRealized, amount: newAmount })
    loadPeriod()
  }

  const handleAddTask = async (assigneeName?: string) => {
    if (!newTask.title) { toast('⚠ Görev başlığı gerekli'); return }
    await db.insertTask({ ...newTask, assignee: assigneeName || newTask.assignee })
    setNewTask({ title:'', assignee: currentMember?.name || '', due_date:today(), recurring:false, recurring_type:'daily' })
    const t = await db.getTasks(); setTasks(t)
    toast('✓ Kaydedildi')
  }

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.email || !newMember.password) { toast('⚠ İsim, e-posta ve şifre gerekli'); return }
    if (newMember.password.length < 6) { toast('⚠ Şifre en az 6 karakter'); return }
    toast('⏳ Hesap oluşturuluyor...')
    const { supabase } = await import('./lib/supabase')
    const { error } = await supabase.auth.signUp({ email: newMember.email, password: newMember.password, options: { data: { name: newMember.name } } })
    if (error && !error.message.includes('already registered')) { toast('✗ ' + error.message); return }
    await db.upsertMember({ name: newMember.name, role: newMember.role, color: newMember.color, email: newMember.email })
    setNewMember({ name:'', role:'Üye', color:'#6366f1', email:'', password:'' })
    const m = await db.getMembers(); setMembers(m)
    toast('✓ Üye eklendi')
  }

  // ── Virman / Borç-Alacak ────────────────────────────────────────────────
  const handleAddTransfer = async () => {
    if (!newTransfer.from_member_id || !newTransfer.to_member_id || !newTransfer.amount) { toast('⚠ Kimden, kime ve tutar gerekli'); return }
    if (newTransfer.from_member_id === newTransfer.to_member_id) { toast('⚠ Aynı kişi seçilemez'); return }
    try {
      await db.insertTransfer({
        from_member_id: parseInt(newTransfer.from_member_id),
        to_member_id: parseInt(newTransfer.to_member_id),
        amount: parseFloat(newTransfer.amount),
        description: newTransfer.description,
        date: newTransfer.date,
      })
      setNewTransfer({ from_member_id:'', to_member_id:'', amount:'', description:'', date:today() })
      const tr = await db.getTransfers(); setTransfers(tr)
      toast('✓ Virman eklendi')
    } catch(e: any) { toast('✗ ' + e.message) }
  }

  const toggleTransferSettled = async (tr: any) => {
    await db.updateTransfer(tr.id, { settled: !tr.settled, settled_date: !tr.settled ? today() : null })
    const t = await db.getTransfers(); setTransfers(t)
  }

  const handleDeleteTransfer = async (id: number) => {
    if (!confirm('Silinsin mi?')) return
    await db.deleteTransfer(id)
    const t = await db.getTransfers(); setTransfers(t)
    toast('✓ Silindi')
  }

  // Üyeler arası net bakiye: kim kime ne kadar borçlu (sadece ödenmemiş virmanlar)
  const getNetBalances = () => {
    const net: Record<string, number> = {} // key: "fromId-toId" pozitif => from, to'ya borçlu
    transfers.filter(t => !t.settled).forEach(t => {
      const a = t.from_member_id, b = t.to_member_id
      const key = a < b ? `${a}-${b}` : `${b}-${a}`
      const sign = a < b ? 1 : -1
      net[key] = (net[key] || 0) + sign * parseFloat(t.amount)
    })
    return Object.entries(net)
      .filter(([, v]) => Math.abs(v) > 0.01)
      .map(([key, v]) => {
        const [id1, id2] = key.split('-').map(Number)
        const debtorId = v > 0 ? id1 : id2
        const creditorId = v > 0 ? id2 : id1
        return { debtor: getMemberById(debtorId), creditor: getMemberById(creditorId), amount: Math.abs(v) }
      })
  }

  // ── Tekrarlayan Şablonlar (Favoriler) ────────────────────────────────────
  const handleAddTemplate = async () => {
    if (!newTemplate.title || !newTemplate.amount) { toast('⚠ Başlık ve tutar gerekli'); return }
    try {
      const payload: Record<string, unknown> = {
        type: newTemplate.type, title: newTemplate.title, amount: parseFloat(newTemplate.amount),
        member_id: newTemplate.member_id || null, frequency: newTemplate.frequency,
        day_of_month: parseInt(newTemplate.day_of_month) || 1,
      }
      if (newTemplate.type === 'expense') {
        payload.category = newTemplate.category
        payload.payment_method = newTemplate.payment_method
        payload.payment_details = newTemplate.payment_details
      } else {
        payload.source = newTemplate.source
      }
      await db.insertRecurringTemplate(payload)
      setNewTemplate({ type:'expense', title:'', amount:'', category:'market', source:'maas', member_id:'', payment_method:'cash', payment_details:'', frequency:'monthly', day_of_month:'1' })
      const tpl = await db.getRecurringTemplates(); setTemplates(tpl)
      toast('✓ Favorilere eklendi')
    } catch(e: any) { toast('✗ ' + e.message) }
  }

  const handleApplyTemplate = async (tpl: any) => {
    try {
      if (tpl.type === 'expense') {
        await db.insertExpense({
          title: tpl.title, amount: parseFloat(tpl.amount), category: tpl.category,
          date: today(), member_id: tpl.member_id, planned: false, realized: true,
          recurring: true, payment_method: tpl.payment_method || 'cash', payment_details: tpl.payment_details || '',
        })
      } else {
        await db.insertIncome({
          title: tpl.title, amount: parseFloat(tpl.amount), source: tpl.source,
          date: today(), member_id: tpl.member_id, planned: false, realized: true, recurring: true,
        })
      }
      loadPeriod()
      toast(`✓ "${tpl.title}" bu aya eklendi`)
    } catch(e: any) { toast('✗ ' + e.message) }
  }

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('Bu favori silinsin mi?')) return
    await db.deleteRecurringTemplate(id)
    const tpl = await db.getRecurringTemplates(); setTemplates(tpl)
    toast('✓ Silindi')
  }

  const handleChangePassword = async () => {
    if (!newPassword.next || newPassword.next !== newPassword.confirm) { setPwMsg('Şifreler eşleşmiyor'); return }
    if (newPassword.next.length < 6) { setPwMsg('En az 6 karakter'); return }
    const { supabase } = await import('./lib/supabase')
    const { error } = await supabase.auth.updateUser({ password: newPassword.next })
    if (error) { setPwMsg('✗ ' + error.message) } else { setPwMsg('✓ Şifre güncellendi'); setNewPassword({ next:'', confirm:'' }) }
  }

  const exportData = () => {
    const data = { expenses, incomes, tasks, members, banks, bankAccounts, creditCards, mealCards, categories, exportDate: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `ev-yonetim-${today()}.json`; a.click()
  }

  // ── Loading screen ────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center"><div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div><p className="mt-4 text-gray-500">Yükleniyor...</p></div>
    </div>
  )

  // ── Member detail view ────────────────────────────────────────────────────
  if (selectedMember) {
    const mExp = realizedExp.filter(e => e.member_id == selectedMember.id)
    const mInc = realizedInc.filter(i => i.member_id == selectedMember.id)
    const mBal = mInc.reduce((s,i)=>s+parseFloat(i.amount||0),0) - mExp.reduce((s,e)=>s+parseFloat(e.amount||0),0)
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6">
          <button onClick={() => setSelectedMember(null)} className="mb-4 text-indigo-600 flex items-center gap-2 hover:underline"><ChevronLeft className="w-4 h-4"/>Geri Dön</button>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-3xl" style={{backgroundColor:selectedMember.color}}>{selectedMember.name.charAt(0).toUpperCase()}</div>
            <div>
              <h2 className="text-2xl font-bold">{selectedMember.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${selectedMember.role==='Admin'?'bg-indigo-100 text-indigo-700':'bg-gray-100 text-gray-600'}`}>{selectedMember.role==='Admin'?'👑 Admin':'👤 Üye'}</span>
                <span className="text-gray-500 text-sm">{selectedMember.email}</span>
              </div>
              <p className={`text-lg font-bold mt-1 ${mBal>=0?'text-green-600':'text-red-600'}`}>Bakiye: {fmt(mBal)} ₺</p>
            </div>
          </div>
          {isAdmin && (
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-green-50 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-green-600">{fmt(mInc.reduce((s,i)=>s+parseFloat(i.amount||0),0))}</p><p className="text-xs text-gray-500 mt-1">₺ Gelir</p></div>
              <div className="bg-red-50 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-red-600">{fmt(mExp.reduce((s,e)=>s+parseFloat(e.amount||0),0))}</p><p className="text-xs text-gray-500 mt-1">₺ Gider</p></div>
              <div className="bg-purple-50 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-purple-600">{tasks.filter(t=>t.assignee===selectedMember.name).length}</p><p className="text-xs text-gray-500 mt-1">Görev</p></div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-600"/>Gelir Ekle</h3>
              <input type="text" placeholder="Başlık" value={newIncome.title} onChange={e=>setNewIncome({...newIncome,title:e.target.value})} className="w-full px-3 py-2 border rounded mb-2 text-sm"/>
              <input type="number" placeholder="Tutar" value={newIncome.amount} onChange={e=>setNewIncome({...newIncome,amount:e.target.value})} className="w-full px-3 py-2 border rounded mb-2 text-sm"/>
              <select value={newIncome.source} onChange={e=>setNewIncome({...newIncome,source:e.target.value})} className="w-full px-3 py-2 border rounded mb-2 text-sm">{Object.entries(INCOME_SOURCES).map(([k,v])=><option key={k} value={k}>{v.name}</option>)}</select>
              <input type="date" value={newIncome.date} onChange={e=>setNewIncome({...newIncome,date:e.target.value})} className="w-full px-3 py-2 border rounded mb-2 text-sm"/>
              <button onClick={async()=>{const prev=newIncome.member_id;setNewIncome(p=>({...p,member_id:String(selectedMember.id)}));await handleAddIncome();setNewIncome(p=>({...p,member_id:prev}));setSelectedMember(null)}} className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 text-sm font-semibold">Ekle</button>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><TrendingDown className="w-5 h-5 text-red-600"/>Gider Ekle</h3>
              <input type="text" placeholder="Başlık" value={newExpense.title} onChange={e=>setNewExpense({...newExpense,title:e.target.value})} className="w-full px-3 py-2 border rounded mb-2 text-sm"/>
              <input type="number" placeholder="Tutar" value={newExpense.amount} onChange={e=>setNewExpense({...newExpense,amount:e.target.value})} className="w-full px-3 py-2 border rounded mb-2 text-sm"/>
              <select value={newExpense.category} onChange={e=>setNewExpense({...newExpense,category:e.target.value})} className="w-full px-3 py-2 border rounded mb-2 text-sm">{categories.map(c=><option key={c.key} value={c.key}>{c.name}</option>)}</select>
              <input type="date" value={newExpense.date} onChange={e=>setNewExpense({...newExpense,date:e.target.value})} className="w-full px-3 py-2 border rounded mb-2 text-sm"/>
              <button onClick={async()=>{const prev=newExpense.member_id;setNewExpense(p=>({...p,member_id:String(selectedMember.id)}));await handleAddExpense();setNewExpense(p=>({...p,member_id:prev}));setSelectedMember(null)}} className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 text-sm font-semibold">Ekle</button>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Calendar className="w-5 h-5 text-purple-600"/>Görev Ata</h3>
              <input type="text" placeholder="Görev" value={newTask.title} onChange={e=>setNewTask({...newTask,title:e.target.value})} className="w-full px-3 py-2 border rounded mb-2 text-sm"/>
              <input type="date" value={newTask.due_date} onChange={e=>setNewTask({...newTask,due_date:e.target.value})} className="w-full px-3 py-2 border rounded mb-2 text-sm"/>
              <button onClick={()=>{handleAddTask(selectedMember.name);setSelectedMember(null)}} className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 text-sm font-semibold">Ata</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const TABS: {id:Tab;icon:any;label:string}[] = [
    {id:'overview',icon:Wallet,label:'Genel Bakış'},{id:'budget',icon:BarChart3,label:'Bütçe'},
    {id:'members',icon:Users,label:'Üyeler'},{id:'incomes',icon:TrendingUp,label:'Gelirler'},
    {id:'expenses',icon:TrendingDown,label:'Giderler'},{id:'transfers',icon:ArrowRightLeft,label:'Virman'},
    {id:'templates',icon:Star,label:'Favoriler'},{id:'tasks',icon:Calendar,label:'Görevler'},
    {id:'categories',icon:Tag,label:'Kategoriler'},{id:'banks',icon:Building2,label:'Bankalar'},{id:'cards',icon:CreditCard,label:'Kartlar'}
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* ── Header ── */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2"><Home className="w-6 h-6"/>Ev Yönetim Merkezi Pro</h1>
                <p className="text-indigo-100 text-xs mt-0.5">{expenses.length} masraf · {incomes.length} gelir · {tasks.length} görev · <span className="opacity-60">v{APP_VERSION}</span></p>
              </div>
              {/* Month nav */}
              <div className="flex items-center gap-1 bg-white/20 rounded-xl px-3 py-1.5">
                <button onClick={prevMonth} className="hover:bg-white/20 rounded p-1"><ChevronLeft className="w-4 h-4"/></button>
                <span className="text-sm font-semibold px-2 min-w-[100px] text-center">{TR_MONTHS[month-1]} {year}</span>
                <button onClick={nextMonth} className="hover:bg-white/20 rounded p-1"><ChevronRight className="w-4 h-4"/></button>
              </div>
              <div className="flex items-center gap-2">
                {saveStatus && <div className="bg-white/20 px-3 py-1.5 rounded-lg text-xs">{saveStatus}</div>}
                <button onClick={exportData} className="bg-white/20 hover:bg-white/30 p-2 rounded-lg" title="Dışa Aktar"><Download className="w-4 h-4"/></button>

                {/* Bell icon with badge */}
                <div className="relative" ref={notifRef}>
                  <button onClick={() => setShowNotifs(p=>!p)} className="relative bg-white/20 hover:bg-white/30 p-2 rounded-lg">
                    <Bell className="w-4 h-4"/>
                    {plannedAlerts.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">{plannedAlerts.length > 9 ? '9+' : plannedAlerts.length}</span>
                    )}
                  </button>
                  {showNotifs && (
                    <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-2xl z-50 overflow-hidden">
                      <div className="bg-indigo-600 px-4 py-3 flex items-center justify-between">
                        <h3 className="text-white font-semibold text-sm">Planlanan İşlemler</h3>
                        <span className="text-indigo-200 text-xs">{plannedAlerts.length} bekliyor</span>
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {plannedAlerts.length === 0 ? (
                          <p className="text-gray-400 text-sm text-center py-6">Bekleyen işlem yok 🎉</p>
                        ) : plannedAlerts.map(a => (
                          <div key={`${a.type}-${a.id}`} className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${a.type==='expense'?'border-l-4 border-l-red-400':'border-l-4 border-l-green-400'}`}>
                            <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${a.type==='expense'?'bg-red-100 text-red-600':'bg-green-100 text-green-600'}`}>
                              {a.type==='expense' ? '↓' : '↑'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-800 text-sm truncate">{a.title}</p>
                              <p className="text-xs text-gray-500">{fmtDate(a.date)} · {fmt(a.amount)} ₺</p>
                              {a.member_id && getMemberById(a.member_id) && <p className="text-xs text-indigo-500">{getMemberById(a.member_id).name}</p>}
                            </div>
                            <button
                              onClick={async()=>{
                                if(a.type==='expense') await db.updateExpense(a.id,{realized:true,amount:a.planned_amount||a.amount})
                                else await db.updateIncome(a.id,{realized:true,amount:a.planned_amount||a.amount})
                                loadPeriod(); toast('✓ Gerçekleşti olarak işaretlendi')
                              }}
                              className="flex-shrink-0 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200"
                            >✓</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* User button */}
                <button onClick={() => setShowProfile(p=>!p)} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-white/40 flex items-center justify-center font-bold text-xs">{(user?.user_metadata?.name||user?.email||'?').charAt(0).toUpperCase()}</div>
                  <span className="text-sm hidden md:block">{user?.user_metadata?.name||user?.email}</span>
                  {isAdmin && <span className="text-xs bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded font-bold hidden md:block">Admin</span>}
                </button>
                <button onClick={signOut} className="bg-white/20 hover:bg-red-500/60 p-2 rounded-lg" title="Çıkış"><LogOut className="w-4 h-4"/></button>
              </div>
            </div>
            {/* Profile panel */}
            {showProfile && (
              <div className="mt-4 bg-white/10 rounded-xl p-4 max-w-sm">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm"><KeyRound className="w-4 h-4"/>Şifre Değiştir</h3>
                <input type="password" placeholder="Yeni şifre" value={newPassword.next} onChange={e=>setNewPassword(p=>({...p,next:e.target.value}))} className="w-full px-3 py-2 rounded-lg text-gray-800 mb-2 text-sm"/>
                <input type="password" placeholder="Yeni şifre tekrar" value={newPassword.confirm} onChange={e=>setNewPassword(p=>({...p,confirm:e.target.value}))} className="w-full px-3 py-2 rounded-lg text-gray-800 mb-2 text-sm"/>
                {pwMsg && <p className="text-xs mb-2">{pwMsg}</p>}
                <button onClick={handleChangePassword} className="w-full bg-white text-indigo-600 font-semibold py-2 rounded-lg hover:bg-indigo-50 text-sm">Güncelle</button>
              </div>
            )}
          </div>

          {/* ── Tabs ── */}
          <div className="flex border-b overflow-x-auto bg-gray-50">
            {TABS.map(tab=>(
              <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
                className={`py-3 px-4 font-semibold whitespace-nowrap text-sm flex items-center gap-1 transition-all ${activeTab===tab.id?'bg-white text-indigo-600 border-b-2 border-indigo-600':'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}>
                <tab.icon className="w-4 h-4"/>{tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">

            {/* ══ GENEL BAKIŞ ══ */}
            {activeTab==='overview' && (
              <div>
                {/* Planned alerts banner on dashboard */}
                {plannedAlerts.length > 0 && (
                  <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Bell className="w-5 h-5 text-amber-600"/>
                      <h3 className="font-semibold text-amber-800">Bekleyen Planlı İşlemler ({plannedAlerts.length})</h3>
                    </div>
                    <div className="space-y-2">
                      {plannedAlerts.slice(0,4).map(a=>(
                        <div key={`${a.type}-${a.id}`} className={`flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border-l-4 ${a.type==='expense'?'border-red-400':'border-green-400'}`}>
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${a.type==='expense'?'bg-red-100 text-red-600':'bg-green-100 text-green-600'}`}>{a.type==='expense'?'↓':'↑'}</span>
                            <div>
                              <p className="font-semibold text-sm text-gray-800">{a.title}</p>
                              <p className="text-xs text-gray-500">{fmtDate(a.date)}{a.member_id&&getMemberById(a.member_id)?' · '+getMemberById(a.member_id).name:''}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`font-bold ${a.type==='expense'?'text-red-600':'text-green-600'}`}>{a.type==='expense'?'-':'+'}{fmt(a.amount)} ₺</span>
                            <button onClick={async()=>{
                              if(a.type==='expense') await db.updateExpense(a.id,{realized:true,amount:a.planned_amount||a.amount})
                              else await db.updateIncome(a.id,{realized:true,amount:a.planned_amount||a.amount})
                              loadPeriod(); toast('✓ Gerçekleşti')
                            }} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200 font-semibold">Gerçekleşti ✓</button>
                          </div>
                        </div>
                      ))}
                      {plannedAlerts.length > 4 && <p className="text-xs text-amber-600 text-center pt-1">+{plannedAlerts.length-4} daha — bildirim çanına bakın</p>}
                    </div>
                  </div>
                )}

                {/* Devreden bakiye banner */}
                {prevBalance !== 0 && (
                  <div className={`mb-5 rounded-xl p-4 flex items-center justify-between ${prevBalance>=0?'bg-blue-50 border border-blue-200':'bg-orange-50 border border-orange-200'}`}>
                    <div className="flex items-center gap-3">
                      <ArrowRightLeft className={`w-5 h-5 ${prevBalance>=0?'text-blue-600':'text-orange-600'}`}/>
                      <div>
                        <p className={`font-semibold text-sm ${prevBalance>=0?'text-blue-800':'text-orange-800'}`}>Önceki Aydan Devreden Bakiye</p>
                        <p className="text-xs text-gray-500">{TR_MONTHS[month===1?11:month-2]} {month===1?year-1:year} ayından</p>
                      </div>
                    </div>
                    <span className={`text-xl font-bold ${prevBalance>=0?'text-blue-600':'text-orange-600'}`}>{prevBalance>=0?'+':''}{fmt(prevBalance)} ₺</span>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl p-5 text-white"><p className="text-xs opacity-90 mb-1">Gerçekleşen Gelir</p><p className="text-2xl font-bold">{fmt(totalInc)} ₺</p></div>
                  <div className="bg-gradient-to-br from-red-400 to-pink-500 rounded-xl p-5 text-white"><p className="text-xs opacity-90 mb-1">Gerçekleşen Gider</p><p className="text-2xl font-bold">{fmt(totalExp)} ₺</p></div>
                  <div className={`bg-gradient-to-br ${balanceWithCarryover>=0?'from-blue-400 to-indigo-500':'from-orange-400 to-red-500'} rounded-xl p-5 text-white`}>
                    <p className="text-xs opacity-90 mb-1">Net Bakiye {prevBalance!==0 && <span className="opacity-70">(devir dahil)</span>}</p>
                    <p className="text-2xl font-bold">{fmt(balanceWithCarryover)} ₺</p>
                  </div>
                  <div className={`bg-gradient-to-br ${plannedBalance>=0?'from-cyan-400 to-blue-500':'from-yellow-400 to-orange-500'} rounded-xl p-5 text-white`}><p className="text-xs opacity-90 mb-1">Planlanan Bakiye</p><p className="text-2xl font-bold">{fmt(plannedBalance)} ₺</p></div>
                </div>

                {getCategoryData().length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="font-semibold mb-3">Kategori Dağılımı</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={getCategoryData()} dataKey="value" nameKey="name"
                            cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                            paddingAngle={2}>
                            {getCategoryData().map((e,i)=><Cell key={i} fill={e.color}/>)}
                          </Pie>
                          <Tooltip formatter={(v:any)=>`${fmt(v)} ₺`}/>
                          <Legend
                            formatter={(value, entry:any) => `${value} %${((entry.payload.value / getCategoryData().reduce((s:number,d:any)=>s+d.value,0))*100).toFixed(0)}`}
                            iconType="square" iconSize={10}
                            wrapperStyle={{fontSize:'12px', paddingTop:'8px'}}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {isAdmin && members.length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h3 className="font-semibold mb-3">Üye Bazlı <span className="text-xs text-indigo-500 ml-1">👑 Admin görünümü</span></h3>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={members.map(m=>({name:m.name,gelir:realizedInc.filter(i=>i.member_id==m.id).reduce((s,i)=>s+parseFloat(i.amount||0),0),masraf:realizedExp.filter(e=>e.member_id==m.id).reduce((s,e)=>s+parseFloat(e.amount||0),0)}))}>
                            <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip formatter={(v:any)=>`${fmt(v)} ₺`}/><Legend/>
                            <Bar dataKey="gelir" name="Gelir" fill="#10b981"/><Bar dataKey="gider" name="Gider" fill="#ef4444"/>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-purple-50 rounded-xl p-5">
                    <h3 className="font-semibold text-purple-900 mb-3">Görev Durumu</h3>
                    <div className="flex gap-3">
                      <div className="flex-1 bg-white rounded-lg p-3 text-center"><p className="text-2xl font-bold text-purple-600">{completedTasks}/{tasks.length}</p><p className="text-xs text-gray-500">Tamamlanan</p></div>
                      <div className="flex-1 bg-white rounded-lg p-3 text-center"><p className="text-2xl font-bold text-orange-500">{tasks.length-completedTasks}</p><p className="text-xs text-gray-500">Bekleyen</p></div>
                    </div>
                  </div>
                  <div className="bg-indigo-50 rounded-xl p-5">
                    <h3 className="font-semibold text-indigo-900 mb-3">İstatistikler</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {[{v:members.length,l:'Üye',c:'text-indigo-600'},{v:banks.length,l:'Banka',c:'text-green-600'},{v:creditCards.length,l:'Kart',c:'text-blue-600'},{v:categories.length,l:'Kategori',c:'text-orange-600'}].map(s=>(
                        <div key={s.l} className="bg-white rounded-lg p-3"><p className={`text-xl font-bold ${s.c}`}>{s.v}</p><p className="text-xs text-gray-500">{s.l}</p></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══ BÜTÇE ══ */}
            {activeTab==='budget' && (
              <div>
                <h2 className="text-2xl font-bold mb-5">Bütçe — {TR_MONTHS[month-1]} {year}</h2>
                {/* Özet kartlar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">Bütçe Geliri</p>
                    <p className="text-xl font-bold text-green-600">+{fmt(budgetIncTotal)} ₺</p>
                    <p className="text-xs text-gray-400 mt-1">{incomes.filter(i=>i.planned).length} kalem</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">Gerçekleşen Gelir</p>
                    <p className="text-xl font-bold text-emerald-600">+{fmt(totalInc)} ₺</p>
                    <p className="text-xs text-gray-400 mt-1">{realizedInc.length} kalem</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">Bütçe Gideri</p>
                    <p className="text-xl font-bold text-red-500">-{fmt(budgetExpTotal)} ₺</p>
                    <p className="text-xs text-gray-400 mt-1">{expenses.filter(e=>e.planned).length} kalem</p>
                  </div>
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">Gerçekleşen Gider</p>
                    <p className="text-xl font-bold text-rose-600">-{fmt(totalExp)} ₺</p>
                    <p className="text-xs text-gray-400 mt-1">{realizedExp.length} kalem</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Gelirler */}
                  <div className="bg-white border rounded-xl overflow-hidden">
                    <div className="px-5 py-3 bg-green-50 border-b flex justify-between items-center">
                      <h3 className="font-bold text-green-700">Gelirler</h3>
                      <div className="flex gap-3 text-xs">
                        <span className="text-gray-500">Bütçe: <span className="font-bold text-blue-600">{fmt(budgetIncTotal)} ₺</span></span>
                        <span className="text-gray-500">Gerçekleşen: <span className="font-bold text-green-600">{fmt(totalInc)} ₺</span></span>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      {[...plannedInc.map(i=>({...i,_state:'planned'})), ...realizedInc.map(i=>({...i,_state:'realized'}))].length===0
                        ? <p className="text-gray-400 text-center py-4">Kayıt yok</p>
                        : [...plannedInc.map(i=>({...i,_state:'planned'})), ...realizedInc.map(i=>({...i,_state:'realized'}))].map(i=>(
                        <div key={`${i._state}-${i.id}`} className={`flex justify-between items-center p-3 rounded-lg ${i._state==='planned'?'bg-yellow-50 border border-yellow-200':'bg-green-50 border border-green-200'}`}>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm">{i.title}</p>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${i._state==='planned'?'bg-yellow-200 text-yellow-800':'bg-green-200 text-green-800'}`}>{i._state==='planned'?'Planlanan':'Gerçekleşen'}</span>
                            </div>
                            <p className="text-xs text-gray-500">{fmtDate(i.date)}</p>
                          </div>
                          <p className={`font-bold ${i._state==='planned'?'text-yellow-600':'text-green-600'}`}>+{fmt(i._state==='planned'?i.planned_amount||i.amount:i.amount)} ₺</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Giderler */}
                  <div className="bg-white border rounded-xl overflow-hidden">
                    <div className="px-5 py-3 bg-red-50 border-b flex justify-between items-center">
                      <h3 className="font-bold text-red-700">Giderler</h3>
                      <div className="flex gap-3 text-xs">
                        <span className="text-gray-500">Bütçe: <span className="font-bold text-blue-600">{fmt(budgetExpTotal)} ₺</span></span>
                        <span className="text-gray-500">Gerçekleşen: <span className="font-bold text-red-600">{fmt(totalExp)} ₺</span></span>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      {[...plannedExp.map(e=>({...e,_state:'planned'})), ...realizedExp.map(e=>({...e,_state:'realized'}))].length===0
                        ? <p className="text-gray-400 text-center py-4">Kayıt yok</p>
                        : [...plannedExp.map(e=>({...e,_state:'planned'})), ...realizedExp.map(e=>({...e,_state:'realized'}))].map(e=>(
                        <div key={`${e._state}-${e.id}`} className={`flex justify-between items-center p-3 rounded-lg ${e._state==='planned'?'bg-yellow-50 border border-yellow-200':'bg-red-50 border border-red-200'}`}>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm">{e.title}</p>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${e._state==='planned'?'bg-yellow-200 text-yellow-800':'bg-red-200 text-red-800'}`}>{e._state==='planned'?'Planlanan':'Gerçekleşen'}</span>
                            </div>
                            <p className="text-xs text-gray-500">{fmtDate(e.date)}</p>
                          </div>
                          <p className={`font-bold ${e._state==='planned'?'text-yellow-600':'text-red-600'}`}>-{fmt(e._state==='planned'?e.planned_amount||e.amount:e.amount)} ₺</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Denge */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`bg-gradient-to-r ${budgetBalance>=0?'from-cyan-500 to-blue-500':'from-yellow-500 to-orange-500'} text-white rounded-xl p-5`}>
                    <h3 className="font-bold mb-1 text-sm opacity-90">Bütçe Dengesi</h3>
                    <p className="text-3xl font-bold">{fmt(budgetBalance)} ₺</p>
                    <p className="text-sm mt-1 opacity-80">{budgetBalance>=0?'Bütçe fazlası':'Bütçe açığı'}</p>
                  </div>
                  <div className={`bg-gradient-to-r ${balanceWithCarryover>=0?'from-indigo-500 to-purple-600':'from-orange-500 to-red-600'} text-white rounded-xl p-5`}>
                    <h3 className="font-bold mb-1 text-sm opacity-90">Gerçekleşen Denge {prevBalance!==0 && <span className="opacity-70">(devir dahil)</span>}</h3>
                    <p className="text-3xl font-bold">{fmt(balanceWithCarryover)} ₺</p>
                    <p className="text-sm mt-1 opacity-80">{balanceWithCarryover>=0?'Gerçekleşen fazla':'Gerçekleşen açık'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ══ ÜYELER ══ */}
            {activeTab==='members' && (
              <div>
                {isAdmin && (
                  <div className="bg-gray-50 rounded-xl p-5 mb-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2"><PlusCircle className="w-5 h-5"/>Yeni Üye <span className="text-xs text-gray-400">(Sadece Admin ekleyebilir)</span></h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <input type="text" placeholder="İsim" value={newMember.name} onChange={e=>setNewMember({...newMember,name:e.target.value})} className="px-4 py-2 border rounded-lg"/>
                      <input type="email" placeholder="E-posta" value={newMember.email} onChange={e=>setNewMember({...newMember,email:e.target.value})} className="px-4 py-2 border rounded-lg"/>
                      <input type="password" placeholder="Şifre (min. 6 karakter)" value={newMember.password} onChange={e=>setNewMember({...newMember,password:e.target.value})} className="px-4 py-2 border rounded-lg"/>
                      <select value={newMember.role} onChange={e=>setNewMember({...newMember,role:e.target.value})} className="px-4 py-2 border rounded-lg">
                        <option value="Üye">👤 Üye</option>
                        <option value="Admin">👑 Admin</option>
                      </select>
                      <div className="flex gap-2">
                        <input type="color" value={newMember.color} onChange={e=>setNewMember({...newMember,color:e.target.value})} className="w-14 h-10 border rounded-lg"/>
                        <button onClick={handleAddMember} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-semibold">Ekle</button>
                      </div>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleMembers.map(m=>{
                    const mBal = realizedInc.filter(i=>i.member_id==m.id).reduce((s,i)=>s+parseFloat(i.amount||0),0) - realizedExp.filter(e=>e.member_id==m.id).reduce((s,e)=>s+parseFloat(e.amount||0),0)
                    return (
                      <div key={m.id} className="bg-white border rounded-xl p-5 hover:shadow-lg transition">
                        <div className="flex justify-between mb-3">
                          <div className="flex gap-3">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl" style={{backgroundColor:m.color}}>{m.name.charAt(0).toUpperCase()}</div>
                            <div>
                              <h4 className="font-bold">{m.name}</h4>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${m.role==='Admin'?'bg-indigo-100 text-indigo-700':'bg-gray-100 text-gray-600'}`}>{m.role==='Admin'?'👑 Admin':'👤 Üye'}</span>
                              {isAdmin && <p className={`text-sm font-bold mt-1 ${mBal>=0?'text-green-600':'text-red-600'}`}>{fmt(mBal)} ₺</p>}
                            </div>
                          </div>
                          {isAdmin && m.email !== user?.email && (
                            <button onClick={()=>db.deleteMember(m.id).then(()=>setMembers(prev=>prev.filter(x=>x.id!==m.id)))} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                          )}
                        </div>
                        {isAdmin && (
                          <div className="grid grid-cols-3 gap-2 text-center mb-3 text-sm">
                            <div className="bg-green-50 rounded p-2"><p className="text-xs text-gray-500">Gelir</p><p className="font-bold text-green-600">{realizedInc.filter(i=>i.member_id==m.id).length}</p></div>
                            <div className="bg-red-50 rounded p-2"><p className="text-xs text-gray-500">Gider</p><p className="font-bold text-red-600">{realizedExp.filter(e=>e.member_id==m.id).length}</p></div>
                            <div className="bg-purple-50 rounded p-2"><p className="text-xs text-gray-500">Görev</p><p className="font-bold text-purple-600">{tasks.filter(t=>t.assignee===m.name).length}</p></div>
                          </div>
                        )}
                        <button onClick={()=>setSelectedMember(m)} className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 text-sm font-semibold flex items-center justify-center gap-1">İşlem Yap<ChevronRight className="w-4 h-4"/></button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ══ GELİRLER ══ */}
            {activeTab==='incomes' && (
              <div>
                {editingIncome ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-5">
                    <div className="flex justify-between items-center mb-3"><h3 className="font-semibold flex items-center gap-2"><Edit2 className="w-4 h-4"/>Gelir Düzenle</h3><button onClick={()=>setEditingIncome(null)}><X className="w-5 h-5"/></button></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input type="text" value={editingIncome.title} onChange={e=>setEditingIncome({...editingIncome,title:e.target.value})} placeholder="Başlık" className="px-4 py-2 border rounded-lg"/>
                      <input type="number" value={editingIncome.planned_amount||''} onChange={e=>setEditingIncome({...editingIncome,planned_amount:e.target.value})} placeholder="Planlanan tutar" className="px-4 py-2 border rounded-lg"/>
                      <input type="number" value={editingIncome.amount||''} onChange={e=>setEditingIncome({...editingIncome,amount:e.target.value})} placeholder="Gerçekleşen tutar" className="px-4 py-2 border rounded-lg"/>
                      <select value={editingIncome.source} onChange={e=>setEditingIncome({...editingIncome,source:e.target.value})} className="px-4 py-2 border rounded-lg">{Object.entries(INCOME_SOURCES).map(([k,v])=><option key={k} value={k}>{v.name}</option>)}</select>
                      <input type="date" value={editingIncome.date} onChange={e=>setEditingIncome({...editingIncome,date:e.target.value})} className="px-4 py-2 border rounded-lg"/>
                      <button onClick={handleUpdateIncome} className="bg-green-600 text-white py-2 rounded-lg font-semibold">Kaydet</button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-5 mb-5">
                    <h3 className="font-semibold mb-4"><PlusCircle className="inline w-5 h-5 mr-1"/>Yeni Gelir</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <input type="text" placeholder="Başlık" value={newIncome.title} onChange={e=>setNewIncome({...newIncome,title:e.target.value})} className="px-4 py-2 border rounded-lg"/>
                      <select value={newIncome.source} onChange={e=>setNewIncome({...newIncome,source:e.target.value})} className="px-4 py-2 border rounded-lg">{Object.entries(INCOME_SOURCES).map(([k,v])=><option key={k} value={k}>{v.name}</option>)}</select>
                      <input type="date" value={newIncome.date} onChange={e=>setNewIncome({...newIncome,date:e.target.value})} className="px-4 py-2 border rounded-lg"/>
                      <select value={newIncome.member_id} onChange={e=>setNewIncome({...newIncome,member_id:e.target.value})} className="px-4 py-2 border rounded-lg">
                        <option value="">Üye seçin</option>
                        {(isAdmin ? members : [currentMember].filter(Boolean)).map(m=><option key={m.id} value={m.id}>{m.name}{m.id==currentMember?.id?' (ben)':''}</option>)}
                      </select>
                      <label className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white cursor-pointer">
                        <input type="checkbox" checked={newIncome.planned} onChange={e=>setNewIncome({...newIncome,planned:e.target.checked,realized:false,amount:''})}/>
                        <span className="text-sm">Planlanan</span>
                      </label>
                      {newIncome.planned ? (
                        <>
                          <input type="number" placeholder="Planlanan tutar (₺)" value={newIncome.planned_amount} onChange={e=>setNewIncome({...newIncome,planned_amount:e.target.value})} className="px-4 py-2 border border-yellow-400 rounded-lg"/>
                          <label className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white cursor-pointer">
                            <input type="checkbox" checked={newIncome.realized} onChange={e=>setNewIncome({...newIncome,realized:e.target.checked})}/>
                            <span className="text-sm">Gerçekleşti</span>
                          </label>
                          {newIncome.realized && <input type="number" placeholder="Gerçekleşen tutar (₺)" value={newIncome.amount} onChange={e=>setNewIncome({...newIncome,amount:e.target.value})} className="px-4 py-2 border border-green-400 rounded-lg"/>}
                        </>
                      ) : (
                        <input type="number" placeholder="Tutar (₺)" value={newIncome.amount} onChange={e=>setNewIncome({...newIncome,amount:e.target.value})} className="px-4 py-2 border rounded-lg"/>
                      )}
                      <label className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white cursor-pointer">
                        <input type="checkbox" checked={newIncome.recurring} onChange={e=>setNewIncome({...newIncome,recurring:e.target.checked})}/>
                        <span className="text-sm">🔁 Tekrar Eden</span>
                      </label>
                      <button onClick={handleAddIncome} className="bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-semibold">Ekle</button>
                    </div>
                  </div>
                )}
                <div className="space-y-3">
                  {incomes.map(inc=>{
                    const m=getMemberById(inc.member_id); const isPlanned=inc.planned&&!inc.realized
                    return (
                      <div key={inc.id} className={`${isPlanned?'bg-yellow-50 border-yellow-300':'bg-white'} border-l-4 border-green-500 rounded-xl p-4`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="font-semibold">{inc.title}</h4>
                              {m&&<div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{backgroundColor:m.color}}>{m.name.charAt(0).toUpperCase()}</div>}
                              {inc.recurring&&<span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Tekrarlayan</span>}
                              {inc.planned&&<span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">Planlanan</span>}
                              {inc.planned&&<label className="flex items-center gap-1 text-xs cursor-pointer"><input type="checkbox" checked={inc.realized} onChange={()=>toggleIncomeRealized(inc)}/> Gerçekleşti</label>}
                            </div>
                            <div className="flex gap-2 flex-wrap text-xs">
                              <span className="px-2 py-0.5 rounded-full" style={{backgroundColor:(INCOME_SOURCES[inc.source]?.color||'#6b7280')+'20',color:INCOME_SOURCES[inc.source]?.color||'#6b7280'}}>{INCOME_SOURCES[inc.source]?.name||inc.source}</span>
                              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{fmtDate(inc.date)}</span>
                              {m&&<span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">{m.name}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            <div className="text-right">
                              {inc.planned_amount && inc.amount && parseFloat(inc.planned_amount) !== parseFloat(inc.amount) && (
                                <p className="text-xs text-gray-400 line-through">{fmt(inc.planned_amount)} ₺</p>
                              )}
                              <p className="text-xl font-bold text-green-600">+{fmt(inc.amount || inc.planned_amount)} ₺</p>
                            </div>
                            <button onClick={()=>setEditingIncome(inc)} className="text-blue-400 hover:text-blue-600"><Edit2 className="w-4 h-4"/></button>
                            <button onClick={()=>db.deleteIncome(inc.id).then(loadPeriod)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ══ MASRAFLAR ══ */}
            {activeTab==='expenses' && (
              <div>
                {editingExpense ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-5">
                    <div className="flex justify-between items-center mb-3"><h3 className="font-semibold flex items-center gap-2"><Edit2 className="w-4 h-4"/>Gider Düzenle</h3><button onClick={()=>setEditingExpense(null)}><X className="w-5 h-5"/></button></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input type="text" value={editingExpense.title} onChange={e=>setEditingExpense({...editingExpense,title:e.target.value})} placeholder="Başlık" className="px-4 py-2 border rounded-lg"/>
                      <input type="number" value={editingExpense.planned_amount||''} onChange={e=>setEditingExpense({...editingExpense,planned_amount:e.target.value})} placeholder="Planlanan tutar" className="px-4 py-2 border rounded-lg"/>
                      <input type="number" value={editingExpense.amount||''} onChange={e=>setEditingExpense({...editingExpense,amount:e.target.value})} placeholder="Gerçekleşen tutar" className="px-4 py-2 border rounded-lg"/>
                      <select value={editingExpense.category} onChange={e=>setEditingExpense({...editingExpense,category:e.target.value})} className="px-4 py-2 border rounded-lg">{categories.map(c=><option key={c.key} value={c.key}>{c.name}</option>)}</select>
                      <input type="date" value={editingExpense.date} onChange={e=>setEditingExpense({...editingExpense,date:e.target.value})} className="px-4 py-2 border rounded-lg"/>
                      <button onClick={handleUpdateExpense} className="bg-green-600 text-white py-2 rounded-lg font-semibold">Kaydet</button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-5 mb-5">
                    <h3 className="font-semibold mb-4"><PlusCircle className="inline w-5 h-5 mr-1"/>Yeni Gider</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <input type="text" placeholder="Başlık" value={newExpense.title} onChange={e=>setNewExpense({...newExpense,title:e.target.value})} className="px-4 py-2 border rounded-lg"/>
                      <select value={newExpense.category} onChange={e=>setNewExpense({...newExpense,category:e.target.value})} className="px-4 py-2 border rounded-lg">{categories.map(c=><option key={c.key} value={c.key}>{c.name}</option>)}</select>
                      <input type="date" value={newExpense.date} onChange={e=>setNewExpense({...newExpense,date:e.target.value})} className="px-4 py-2 border rounded-lg"/>
                      <select value={newExpense.member_id} onChange={e=>setNewExpense({...newExpense,member_id:e.target.value})} className="px-4 py-2 border rounded-lg">
                        <option value="">Üye seçin</option>
                        {(isAdmin ? members : [currentMember].filter(Boolean)).map(m=><option key={m.id} value={m.id}>{m.name}{m.id==currentMember?.id?' (ben)':''}</option>)}
                      </select>
                      <select value={newExpense.payment_method} onChange={e=>setNewExpense({...newExpense,payment_method:e.target.value,payment_details:''})} className="px-4 py-2 border rounded-lg">
                        <option value="cash">Nakit</option><option value="bank">Banka</option><option value="credit">Kredi Kartı</option><option value="meal">Yemek Kartı</option>
                      </select>
                      {newExpense.payment_method==='bank'&&<select value={newExpense.payment_details} onChange={e=>setNewExpense({...newExpense,payment_details:e.target.value})} className="px-4 py-2 border rounded-lg"><option value="">Banka seçin</option>{banks.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>}
                      {newExpense.payment_method==='credit'&&<select value={newExpense.payment_details} onChange={e=>setNewExpense({...newExpense,payment_details:e.target.value})} className="px-4 py-2 border rounded-lg"><option value="">Kart seçin</option>{creditCards.map(c=><option key={c.id} value={c.id}>{c.card_name}</option>)}</select>}
                      {newExpense.payment_method==='meal'&&<select value={newExpense.payment_details} onChange={e=>setNewExpense({...newExpense,payment_details:e.target.value})} className="px-4 py-2 border rounded-lg"><option value="">Yemek kartı seçin</option>{mealCards.map(mc=><option key={mc.id} value={mc.id}>{mc.name}</option>)}</select>}
                      <label className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white cursor-pointer">
                        <input type="checkbox" checked={newExpense.planned} onChange={e=>setNewExpense({...newExpense,planned:e.target.checked,realized:false,amount:''})}/>
                        <span className="text-sm">Planlanan</span>
                      </label>
                      {newExpense.planned ? (
                        <>
                          <input type="number" placeholder="Planlanan tutar (₺)" value={newExpense.planned_amount} onChange={e=>setNewExpense({...newExpense,planned_amount:e.target.value})} className="px-4 py-2 border border-yellow-400 rounded-lg"/>
                          <label className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white cursor-pointer">
                            <input type="checkbox" checked={newExpense.realized} onChange={e=>setNewExpense({...newExpense,realized:e.target.checked})}/>
                            <span className="text-sm">Gerçekleşti</span>
                          </label>
                          {newExpense.realized&&<input type="number" placeholder="Gerçekleşen tutar (₺)" value={newExpense.amount} onChange={e=>setNewExpense({...newExpense,amount:e.target.value})} className="px-4 py-2 border border-green-400 rounded-lg"/>}
                        </>
                      ) : (
                        <input type="number" placeholder="Tutar (₺)" value={newExpense.amount} onChange={e=>setNewExpense({...newExpense,amount:e.target.value})} className="px-4 py-2 border rounded-lg"/>
                      )}
                      <label className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white cursor-pointer">
                        <input type="checkbox" checked={newExpense.recurring} onChange={e=>setNewExpense({...newExpense,recurring:e.target.checked})}/>
                        <span className="text-sm">🔁 Tekrar Eden</span>
                      </label>
                      <button onClick={handleAddExpense} className="bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-semibold">Ekle</button>
                    </div>
                  </div>
                )}
                <div className="space-y-3">
                  {expenses.map(exp=>{
                    const m=getMemberById(exp.member_id); const isPlanned=exp.planned&&!exp.realized
                    let payText='Nakit'
                    if(exp.payment_method==='bank') payText='Banka: '+(getBankById(exp.payment_details)?.name||'-')
                    if(exp.payment_method==='credit') payText='Kart: '+(creditCards.find((c:any)=>c.id==exp.payment_details)?.card_name||'-')
                    if(exp.payment_method==='meal') payText='Yemek: '+(mealCards.find((mc:any)=>mc.id==exp.payment_details)?.name||'-')
                    return (
                      <div key={exp.id} className={`${isPlanned?'bg-yellow-50 border-yellow-300':'bg-white'} border-l-4 border-red-500 rounded-xl p-4`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="font-semibold">{exp.title}</h4>
                              {m&&<div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{backgroundColor:m.color}}>{m.name.charAt(0).toUpperCase()}</div>}
                              {exp.recurring&&<span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Tekrarlayan</span>}
                              {exp.planned&&<span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">Planlanan</span>}
                              {exp.planned&&<label className="flex items-center gap-1 text-xs cursor-pointer"><input type="checkbox" checked={exp.realized} onChange={()=>toggleExpenseRealized(exp)}/> Gerçekleşti</label>}
                            </div>
                            <div className="flex gap-2 flex-wrap text-xs">
                              <span className="px-2 py-0.5 rounded-full" style={{backgroundColor:(catMap[exp.category]?.color||'#6b7280')+'20',color:catMap[exp.category]?.color||'#6b7280'}}>{catMap[exp.category]?.name||exp.category}</span>
                              <span className="px-2 py-0.5 rounded-full bg-gray-100">{fmtDate(exp.date)}</span>
                              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{payText}</span>
                              {m&&<span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">{m.name}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            <div className="text-right">
                              {exp.planned_amount && exp.amount && parseFloat(exp.planned_amount) !== parseFloat(exp.amount) && (
                                <p className="text-xs text-gray-400 line-through">{fmt(exp.planned_amount)} ₺</p>
                              )}
                              <p className="text-xl font-bold text-red-600">-{fmt(exp.amount || exp.planned_amount)} ₺</p>
                            </div>
                            <button onClick={()=>setEditingExpense(exp)} className="text-blue-400 hover:text-blue-600"><Edit2 className="w-4 h-4"/></button>
                            <button onClick={()=>{setNewExpense({title:exp.title,planned_amount:'',amount:exp.amount?.toString()||'',category:exp.category,date:today(),member_id:currentMember?String(currentMember.id):'',planned:false,realized:false,recurring:exp.recurring,payment_method:exp.payment_method||'cash',payment_details:exp.payment_details||''});setActiveTab('expenses')}} className="text-blue-400 hover:text-blue-600" title="Kopyala"><Copy className="w-4 h-4"/></button>
                            <button onClick={()=>{if(!confirm('Silinsin mi?'))return;db.deleteExpense(exp.id).then(loadPeriod);toast('✓ Silindi')}} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ══ VİRMAN (Borç/Alacak) ══ */}
            {activeTab==='transfers' && (
              <div>
                <div className="bg-gray-50 rounded-xl p-5 mb-5">
                  <h3 className="font-semibold mb-4"><PlusCircle className="inline w-5 h-5 mr-1"/>Yeni Virman</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    <select value={newTransfer.from_member_id} onChange={e=>setNewTransfer({...newTransfer,from_member_id:e.target.value})} className="px-4 py-2 border rounded-lg">
                      <option value="">Kimden (borçlu)</option>
                      {members.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <select value={newTransfer.to_member_id} onChange={e=>setNewTransfer({...newTransfer,to_member_id:e.target.value})} className="px-4 py-2 border rounded-lg">
                      <option value="">Kime (alacaklı)</option>
                      {members.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <input type="number" placeholder="Tutar (₺)" value={newTransfer.amount} onChange={e=>setNewTransfer({...newTransfer,amount:e.target.value})} className="px-4 py-2 border rounded-lg"/>
                    <input type="text" placeholder="Açıklama (opsiyonel)" value={newTransfer.description} onChange={e=>setNewTransfer({...newTransfer,description:e.target.value})} className="px-4 py-2 border rounded-lg"/>
                    <input type="date" value={newTransfer.date} onChange={e=>setNewTransfer({...newTransfer,date:e.target.value})} className="px-4 py-2 border rounded-lg"/>
                  </div>
                  <button onClick={handleAddTransfer} className="mt-3 bg-indigo-600 text-white py-2 px-5 rounded-lg hover:bg-indigo-700 font-semibold text-sm">Ekle</button>
                </div>

                {/* Net bakiyeler özeti */}
                {getNetBalances().length > 0 && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-5">
                    <h3 className="font-semibold text-indigo-900 mb-3">Kim Kime Ne Kadar Borçlu</h3>
                    <div className="space-y-2">
                      {getNetBalances().map((n, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-semibold" style={{color:n.debtor?.color}}>{n.debtor?.name || '—'}</span>
                            <ArrowRightLeft className="w-3.5 h-3.5 text-gray-400"/>
                            <span className="font-semibold" style={{color:n.creditor?.color}}>{n.creditor?.name || '—'}</span>
                          </div>
                          <span className="font-bold text-indigo-600">{fmt(n.amount)} ₺</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {transfers.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">Henüz virman kaydı yok</p>
                  ) : transfers.map(tr => (
                    <div key={tr.id} className={`border-l-4 ${tr.settled ? 'border-green-400 bg-green-50/40' : 'border-orange-400 bg-orange-50/40'} rounded-xl p-4 bg-white`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm mb-1">
                            <span className="font-semibold" style={{color:tr.from_member?.color}}>{tr.from_member?.name || '—'}</span>
                            <ArrowRightLeft className="w-3.5 h-3.5 text-gray-400"/>
                            <span className="font-semibold" style={{color:tr.to_member?.color}}>{tr.to_member?.name || '—'}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tr.settled?'bg-green-100 text-green-700':'bg-orange-100 text-orange-700'}`}>{tr.settled?'Ödendi':'Bekliyor'}</span>
                          </div>
                          {tr.description && <p className="text-sm text-gray-600">{tr.description}</p>}
                          <p className="text-xs text-gray-400 mt-1">{fmtDate(tr.date)}{tr.settled_date ? ` · Ödeme: ${fmtDate(tr.settled_date)}` : ''}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <p className="text-xl font-bold text-indigo-600">{fmt(tr.amount)} ₺</p>
                          <label className="flex items-center gap-1 text-xs cursor-pointer">
                            <input type="checkbox" checked={tr.settled} onChange={()=>toggleTransferSettled(tr)}/>
                          </label>
                          <button onClick={()=>handleDeleteTransfer(tr.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══ FAVORİLER (Tekrarlayan Şablonlar) ══ */}
            {activeTab==='templates' && (
              <div>
                <div className="bg-gray-50 rounded-xl p-5 mb-5">
                  <h3 className="font-semibold mb-4"><Star className="inline w-5 h-5 mr-1"/>Yeni Favori Şablon</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <select value={newTemplate.type} onChange={e=>setNewTemplate({...newTemplate,type:e.target.value})} className="px-4 py-2 border rounded-lg">
                      <option value="expense">Gider</option>
                      <option value="income">Gelir</option>
                    </select>
                    <input type="text" placeholder="Başlık (örn: Kira)" value={newTemplate.title} onChange={e=>setNewTemplate({...newTemplate,title:e.target.value})} className="px-4 py-2 border rounded-lg"/>
                    <input type="number" placeholder="Tutar (₺)" value={newTemplate.amount} onChange={e=>setNewTemplate({...newTemplate,amount:e.target.value})} className="px-4 py-2 border rounded-lg"/>
                    {newTemplate.type==='expense' ? (
                      <select value={newTemplate.category} onChange={e=>setNewTemplate({...newTemplate,category:e.target.value})} className="px-4 py-2 border rounded-lg">
                        {categories.map(c=><option key={c.key} value={c.key}>{c.name}</option>)}
                      </select>
                    ) : (
                      <select value={newTemplate.source} onChange={e=>setNewTemplate({...newTemplate,source:e.target.value})} className="px-4 py-2 border rounded-lg">
                        {Object.entries(INCOME_SOURCES).map(([k,v])=><option key={k} value={k}>{v.name}</option>)}
                      </select>
                    )}
                    <select value={newTemplate.member_id} onChange={e=>setNewTemplate({...newTemplate,member_id:e.target.value})} className="px-4 py-2 border rounded-lg">
                      <option value="">Üye seçin</option>
                      {members.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <select value={newTemplate.frequency} onChange={e=>setNewTemplate({...newTemplate,frequency:e.target.value})} className="px-4 py-2 border rounded-lg">
                      <option value="monthly">Aylık</option>
                      <option value="weekly">Haftalık</option>
                    </select>
                  </div>
                  <button onClick={handleAddTemplate} className="mt-3 bg-indigo-600 text-white py-2 px-5 rounded-lg hover:bg-indigo-700 font-semibold text-sm">Favorilere Ekle</button>
                </div>

                {templates.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">Henüz favori şablon yok. Sık tekrarlayan gelir/giderlerinizi (kira, maaş, faturalar) buraya ekleyin, her ay tek tıkla ekleyin.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map(tpl => (
                      <div key={tpl.id} className="bg-white border rounded-xl p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${tpl.type==='expense'?'bg-red-100 text-red-600':'bg-green-100 text-green-600'}`}>{tpl.type==='expense'?'↓':'↑'}</span>
                            <div>
                              <p className="font-semibold text-sm">{tpl.title}</p>
                              <p className="text-xs text-gray-400">{tpl.frequency==='monthly'?'Aylık':'Haftalık'}{tpl.member?` · ${tpl.member.name}`:''}</p>
                            </div>
                          </div>
                          <button onClick={()=>handleDeleteTemplate(tpl.id)} className="text-red-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5"/></button>
                        </div>
                        <p className={`text-lg font-bold mb-3 ${tpl.type==='expense'?'text-red-600':'text-green-600'}`}>{tpl.type==='expense'?'-':'+'}{fmt(tpl.amount)} ₺</p>
                        <button onClick={()=>handleApplyTemplate(tpl)} className="w-full bg-indigo-50 text-indigo-700 py-2 rounded-lg hover:bg-indigo-100 text-sm font-semibold flex items-center justify-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5"/>Bu Aya Ekle
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ══ GÖREVLER ══ */}
            {activeTab==='tasks' && (
              <div>
                {editingTask ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-5">
                    <div className="flex justify-between items-center mb-3"><h3 className="font-semibold flex items-center gap-2"><Edit2 className="w-4 h-4"/>Görev Düzenle</h3><button onClick={()=>setEditingTask(null)}><X className="w-5 h-5"/></button></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input type="text" value={editingTask.title} onChange={e=>setEditingTask({...editingTask,title:e.target.value})} className="px-4 py-2 border rounded-lg"/>
                      <select value={editingTask.assignee} onChange={e=>setEditingTask({...editingTask,assignee:e.target.value})} className="px-4 py-2 border rounded-lg">
                        <option value="">Sorumlu</option>
                        {(isAdmin?members:[currentMember].filter(Boolean)).map(m=><option key={m.id} value={m.name}>{m.name}{m.email===user?.email?' (ben)':''}</option>)}
                      </select>
                      <input type="date" value={editingTask.due_date} onChange={e=>setEditingTask({...editingTask,due_date:e.target.value})} className="px-4 py-2 border rounded-lg"/>
                      <button onClick={async()=>{await db.updateTask(editingTask.id,{title:editingTask.title,assignee:editingTask.assignee,due_date:editingTask.due_date});setEditingTask(null);const t=await db.getTasks();setTasks(t);toast('✓ Güncellendi')}} className="bg-green-600 text-white py-2 rounded-lg font-semibold">Kaydet</button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-5 mb-5">
                    <h3 className="font-semibold mb-4"><PlusCircle className="inline w-5 h-5 mr-1"/>Yeni Görev</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      <input type="text" placeholder="Görev" value={newTask.title} onChange={e=>setNewTask({...newTask,title:e.target.value})} className="px-4 py-2 border rounded-lg col-span-2"/>
                      <select value={newTask.assignee} onChange={e=>setNewTask({...newTask,assignee:e.target.value})} className="px-4 py-2 border rounded-lg">
                        <option value="">Sorumlu</option>
                        {(isAdmin?members:[currentMember].filter(Boolean)).map(m=><option key={m.id} value={m.name}>{m.name}{m.email===user?.email?' (ben)':''}</option>)}
                      </select>
                      <input type="date" value={newTask.due_date} onChange={e=>setNewTask({...newTask,due_date:e.target.value})} className="px-4 py-2 border rounded-lg"/>
                      <label className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white cursor-pointer">
                        <input type="checkbox" checked={newTask.recurring} onChange={e=>setNewTask({...newTask,recurring:e.target.checked})}/>
                        <span className="text-sm">🔁 Tekrar</span>
                      </label>
                      {newTask.recurring ? (
                        <select value={newTask.recurring_type} onChange={e=>setNewTask({...newTask,recurring_type:e.target.value})} className="px-4 py-2 border rounded-lg">
                          <option value="daily">Günlük</option>
                          <option value="weekly">Haftalık</option>
                          <option value="monthly">Aylık</option>
                        </select>
                      ) : (
                        <button onClick={()=>handleAddTask()} className="bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 font-semibold">Ata</button>
                      )}
                      {newTask.recurring && (
                        <button onClick={()=>handleAddTask()} className="bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 font-semibold">Ata</button>
                      )}
                    </div>
                  </div>
                )}
                <div className="space-y-3">
                  {tasks.map(task=>{
                    const am=members.find(m=>m.name===task.assignee)
                    return (
                      <div key={task.id} className={`bg-white border rounded-xl p-4 ${task.completed?'opacity-60':''}`}>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3 flex-1">
                            <button onClick={async()=>{await db.updateTask(task.id,{completed:!task.completed});const t=await db.getTasks();setTasks(t)}} className="text-purple-600">{task.completed?<CheckCircle className="w-6 h-6"/>:<Circle className="w-6 h-6"/>}</button>
                            <div>
                              <h4 className={`font-semibold ${task.completed?'line-through text-gray-400':''}`}>{task.title}</h4>
                              <div className="flex gap-3 text-xs mt-1 items-center">
                                {task.assignee&&am&&<div className="flex items-center gap-1"><div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{backgroundColor:am.color}}>{task.assignee.charAt(0).toUpperCase()}</div><span>{task.assignee}</span></div>}
                                <span className="text-gray-500">📅 {fmtDate(task.due_date)}</span>
                                {task.recurring&&<span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{task.recurring_type==='daily'?'Günlük':task.recurring_type==='weekly'?'Haftalık':'Aylık'}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={()=>setEditingTask(task)} className="text-blue-400 hover:text-blue-600"><Edit2 className="w-4 h-4"/></button>
                            <button onClick={async()=>{await db.deleteTask(task.id);const t=await db.getTasks();setTasks(t)}} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ══ KATEGORİLER ══ */}
            {activeTab==='categories' && (
              <div>
                {isAdmin && (
                  <div className="bg-gray-50 rounded-xl p-5 mb-5">
                    <h3 className="font-semibold mb-4"><PlusCircle className="inline w-5 h-5 mr-1"/>Yeni Kategori</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input type="text" placeholder="Anahtar (örn: gida)" value={newCategory.key} onChange={e=>setNewCategory({...newCategory,key:e.target.value.toLowerCase().replace(/\s/g,'_')})} className="px-4 py-2 border rounded-lg"/>
                      <input type="text" placeholder="Kategori Adı" value={newCategory.name} onChange={e=>setNewCategory({...newCategory,name:e.target.value})} className="px-4 py-2 border rounded-lg"/>
                      <input type="color" value={newCategory.color} onChange={e=>setNewCategory({...newCategory,color:e.target.value})} className="w-full h-10 border rounded-lg"/>
                      <button onClick={async()=>{if(!newCategory.key||!newCategory.name)return;await db.upsertCategory(newCategory);const c=await db.getCategories();setCategories(c);setNewCategory({key:'',name:'',color:'#6b7280'});toast('✓ Eklendi')}} className="bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-semibold">Ekle</button>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map(cat=>(
                    <div key={cat.key} className="bg-white border rounded-xl p-4">
                      {editingCategory?.key===cat.key ? (
                        <div className="space-y-2">
                          <input type="text" value={editingCategory.name} onChange={e=>setEditingCategory({...editingCategory,name:e.target.value})} className="w-full px-3 py-2 border rounded"/>
                          <input type="color" value={editingCategory.color} onChange={e=>setEditingCategory({...editingCategory,color:e.target.value})} className="w-full h-10 border rounded"/>
                          <div className="flex gap-2">
                            <button onClick={async()=>{await db.upsertCategory(editingCategory);const c=await db.getCategories();setCategories(c);setEditingCategory(null);toast('✓ Güncellendi')}} className="flex-1 bg-green-600 text-white py-2 rounded text-sm">Kaydet</button>
                            <button onClick={()=>setEditingCategory(null)} className="flex-1 bg-gray-400 text-white py-2 rounded text-sm">İptal</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg" style={{backgroundColor:cat.color}}></div>
                            <div><p className="font-semibold">{cat.name}</p><p className="text-xs text-gray-400">{cat.key}</p></div>
                          </div>
                          {isAdmin && (
                            <div className="flex gap-2">
                              <button onClick={()=>setEditingCategory(cat)} className="text-blue-400 hover:text-blue-600"><Edit2 className="w-4 h-4"/></button>
                              <button onClick={async()=>{await db.deleteCategory(cat.key);const c=await db.getCategories();setCategories(c);toast('✓ Silindi')}} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══ BANKALAR ══ */}
            {activeTab==='banks' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  {isAdmin && (
                    <div className="bg-gray-50 rounded-xl p-5 mb-4">
                      <h3 className="font-semibold mb-3"><Building2 className="inline w-5 h-5 mr-1"/>Yeni Banka</h3>
                      <div className="flex gap-3">
                        <input type="text" placeholder="Banka Adı" value={newBank} onChange={e=>setNewBank(e.target.value)} className="flex-1 px-4 py-2 border rounded-lg"/>
                        <button onClick={async()=>{if(!newBank)return;await db.insertBank(newBank);const b=await db.getBanks();setBanks(b);setNewBank('');toast('✓ Eklendi')}} className="bg-green-600 text-white px-5 py-2 rounded-lg font-semibold">Ekle</button>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">{banks.map(b=><div key={b.id} className="bg-white border rounded-lg p-4 flex justify-between items-center"><div className="flex items-center gap-3"><Building2 className="w-5 h-5 text-green-600"/><span className="font-semibold">{b.name}</span></div>{isAdmin&&<button onClick={async()=>{await db.deleteBank(b.id);const bb=await db.getBanks();setBanks(bb)}} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>}</div>)}</div>
                </div>
                <div>
                  {isAdmin && (
                    <div className="bg-gray-50 rounded-xl p-5 mb-4">
                      <h3 className="font-semibold mb-3"><Wallet className="inline w-5 h-5 mr-1"/>Yeni Banka Hesabı</h3>
                      <div className="grid gap-3">
                        <select value={newBankAccount.bank_id} onChange={e=>setNewBankAccount({...newBankAccount,bank_id:e.target.value})} className="px-4 py-2 border rounded-lg"><option value="">Banka Seçin</option>{banks.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>
                        <input type="text" placeholder="Hesap Adı" value={newBankAccount.account_name} onChange={e=>setNewBankAccount({...newBankAccount,account_name:e.target.value})} className="px-4 py-2 border rounded-lg"/>
                        <input type="text" placeholder="IBAN (opsiyonel)" value={newBankAccount.iban} onChange={e=>setNewBankAccount({...newBankAccount,iban:e.target.value})} className="px-4 py-2 border rounded-lg"/>
                        <button onClick={async()=>{if(!newBankAccount.bank_id||!newBankAccount.account_name)return;await db.insertBankAccount({...newBankAccount,bank_id:parseInt(newBankAccount.bank_id)});const ba=await db.getBankAccounts();setBankAccounts(ba);setNewBankAccount({bank_id:'',account_name:'',iban:'',branch:''});toast('✓ Eklendi')}} className="bg-blue-600 text-white py-2 rounded-lg font-semibold">Ekle</button>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">{bankAccounts.map(acc=><div key={acc.id} className="bg-white border rounded-lg p-4"><div className="flex justify-between"><div><p className="font-semibold">{acc.account_name}</p><p className="text-xs text-gray-500">{acc.bank?.name}{acc.iban?' · '+acc.iban:''}</p></div>{isAdmin&&<button onClick={async()=>{await db.deleteBankAccount(acc.id);const ba=await db.getBankAccounts();setBankAccounts(ba)}} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>}</div></div>)}</div>
                </div>
              </div>
            )}

            {/* ══ KARTLAR ══ */}
            {activeTab==='cards' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  {isAdmin && (
                    <div className="bg-gray-50 rounded-xl p-5 mb-4">
                      <h3 className="font-semibold mb-3"><CreditCard className="inline w-5 h-5 mr-1"/>Yeni Kredi/Banka Kartı</h3>
                      <div className="grid gap-3">
                        <select value={newCreditCard.bank_id} onChange={e=>setNewCreditCard({...newCreditCard,bank_id:e.target.value})} className="px-4 py-2 border rounded-lg"><option value="">Banka Seçin</option>{banks.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>
                        <input type="text" placeholder="Kart Adı" value={newCreditCard.card_name} onChange={e=>setNewCreditCard({...newCreditCard,card_name:e.target.value})} className="px-4 py-2 border rounded-lg"/>
                        <select value={newCreditCard.type} onChange={e=>setNewCreditCard({...newCreditCard,type:e.target.value})} className="px-4 py-2 border rounded-lg"><option value="credit">Kredi Kartı</option><option value="debit">Debit Kart</option></select>
                        <button onClick={async()=>{if(!newCreditCard.bank_id||!newCreditCard.card_name)return;await db.insertCreditCard({...newCreditCard,bank_id:parseInt(newCreditCard.bank_id)});const cc=await db.getCreditCards();setCreditCards(cc);setNewCreditCard({bank_id:'',card_name:'',type:'credit'});toast('✓ Eklendi')}} className="bg-indigo-600 text-white py-2 rounded-lg font-semibold">Ekle</button>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">{creditCards.map(c=><div key={c.id} className="bg-white border rounded-lg p-4 flex justify-between items-center"><div><p className="font-semibold">{c.card_name}</p><p className="text-xs text-gray-500">{c.bank?.name} · {c.type==='credit'?'Kredi Kartı':'Debit'}</p></div>{isAdmin&&<button onClick={async()=>{await db.deleteCreditCard(c.id);const cc=await db.getCreditCards();setCreditCards(cc)}} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>}</div>)}</div>
                </div>
                <div>
                  {isAdmin && (
                    <div className="bg-gray-50 rounded-xl p-5 mb-4">
                      <h3 className="font-semibold mb-3"><Utensils className="inline w-5 h-5 mr-1"/>Yeni Yemek Kartı</h3>
                      <div className="flex gap-3">
                        <input type="text" placeholder="Kart Adı" value={newMealCard} onChange={e=>setNewMealCard(e.target.value)} className="flex-1 px-4 py-2 border rounded-lg"/>
                        <button onClick={async()=>{if(!newMealCard)return;await db.insertMealCard(newMealCard);const mc=await db.getMealCards();setMealCards(mc);setNewMealCard('');toast('✓ Eklendi')}} className="bg-orange-600 text-white px-5 py-2 rounded-lg font-semibold">Ekle</button>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">{mealCards.map(mc=><div key={mc.id} className="bg-white border rounded-lg p-4 flex justify-between items-center"><div className="flex items-center gap-3"><Utensils className="w-5 h-5 text-orange-500"/><span className="font-semibold">{mc.name}</span></div>{isAdmin&&<button onClick={async()=>{await db.deleteMealCard(mc.id);const m=await db.getMealCards();setMealCards(m)}} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>}</div>)}</div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
