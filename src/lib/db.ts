import { supabase } from './supabase'
import type { Category, Expense, Budget } from '../types'

// ─── Kategoriler ───────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function createCategory(cat: Omit<Category, 'id' | 'created_at'>): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert(cat)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCategory(id: string, cat: Partial<Category>): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update(cat)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

// ─── Masraflar ─────────────────────────────────────────────────────────────

export async function getExpenses(filters?: {
  month?: number
  year?: number
  category_id?: string
}): Promise<Expense[]> {
  let query = supabase
    .from('expenses')
    .select(`*, category:categories(*)`)
    .order('date', { ascending: false })

  if (filters?.month && filters?.year) {
    const start = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`
    const lastDay = new Date(filters.year, filters.month, 0).getDate()
    const end = `${filters.year}-${String(filters.month).padStart(2, '0')}-${lastDay}`
    query = query.gte('date', start).lte('date', end)
  }

  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function createExpense(expense: Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'category'>): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .insert(expense)
    .select(`*, category:categories(*)`)
    .single()
  if (error) throw error
  return data
}

export async function updateExpense(id: string, expense: Partial<Omit<Expense, 'category'>>): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .update({ ...expense, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(`*, category:categories(*)`)
    .single()
  if (error) throw error
  return data
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
}

// ─── Bütçeler ──────────────────────────────────────────────────────────────

export async function getBudgets(month: number, year: number): Promise<Budget[]> {
  const { data, error } = await supabase
    .from('budgets')
    .select(`*, category:categories(*)`)
    .eq('month', month)
    .eq('year', year)
  if (error) throw error
  return data ?? []
}

export async function upsertBudget(budget: Omit<Budget, 'id' | 'created_at' | 'category'>): Promise<Budget> {
  const { data, error } = await supabase
    .from('budgets')
    .upsert(budget, { onConflict: 'category_id,month,year' })
    .select(`*, category:categories(*)`)
    .single()
  if (error) throw error
  return data
}

export async function deleteBudget(id: string): Promise<void> {
  const { error } = await supabase.from('budgets').delete().eq('id', id)
  if (error) throw error
}

// ─── Özet istatistikler ────────────────────────────────────────────────────

export async function getMonthlySummary(month: number, year: number) {
  const expenses = await getExpenses({ month, year })

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const daysInMonth = new Date(year, month, 0).getDate()

  const byCategory: Record<string, { name: string; total: number; color: string; icon: string }> = {}
  expenses.forEach((e) => {
    const cid = e.category_id ?? 'other'
    if (!byCategory[cid]) {
      byCategory[cid] = {
        name: e.category?.name ?? 'Diğer',
        total: 0,
        color: e.category?.color ?? '#6b7280',
        icon: e.category?.icon ?? '📦',
      }
    }
    byCategory[cid].total += Number(e.amount)
  })

  return {
    total,
    count: expenses.length,
    dailyAverage: total / daysInMonth,
    byCategory: Object.values(byCategory).sort((a, b) => b.total - a.total),
  }
}
