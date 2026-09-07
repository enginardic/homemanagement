import { supabase } from './supabase'

// ─── Members ──────────────────────────────────────────────────────────────
export async function getMembers() {
  const { data, error } = await supabase.from('members').select('*').order('created_at')
  if (error) throw error
  return data ?? []
}
export async function upsertMember(m: { id?: number; name: string; role: string; color: string; email: string }) {
  const { data, error } = await supabase.from('members').upsert(m as never).select().single()
  if (error) throw error
  return data
}
export async function deleteMember(id: number) {
  const { error } = await supabase.from('members').delete().eq('id', id)
  if (error) throw error
}

// ─── Categories ────────────────────────────────────────────────────────────
export async function getCategories() {
  const { data, error } = await supabase.from('categories').select('*').order('name')
  if (error) throw error
  return data ?? []
}
export async function upsertCategory(c: { key: string; name: string; color: string }) {
  const { data, error } = await supabase.from('categories').upsert(c as never).select().single()
  if (error) throw error
  return data
}
export async function deleteCategory(key: string) {
  const { error } = await supabase.from('categories').delete().eq('key', key)
  if (error) throw error
}

// ─── Expenses ──────────────────────────────────────────────────────────────
export async function getExpenses(month?: number, year?: number) {
  let q = supabase.from('expenses').select('*, member:members(*)').order('date', { ascending: false })
  if (month && year) q = q.eq('month', month).eq('year', year)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}
export async function insertExpense(e: Record<string, unknown>) {
  const { data, error } = await supabase.from('expenses').insert(e as never).select('*, member:members(*)').single()
  if (error) throw error
  return data
}
export async function updateExpense(id: number, e: Record<string, unknown>) {
  const { data, error } = await supabase.from('expenses').update(e as never).eq('id', id).select('*, member:members(*)').single()
  if (error) throw error
  return data
}
export async function deleteExpense(id: number) {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
}

// ─── Incomes ───────────────────────────────────────────────────────────────
export async function getIncomes(month?: number, year?: number) {
  let q = supabase.from('incomes').select('*, member:members(*)').order('date', { ascending: false })
  if (month && year) q = q.eq('month', month).eq('year', year)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}
export async function insertIncome(i: Record<string, unknown>) {
  const { data, error } = await supabase.from('incomes').insert(i as never).select('*, member:members(*)').single()
  if (error) throw error
  return data
}
export async function updateIncome(id: number, i: Record<string, unknown>) {
  const { data, error } = await supabase.from('incomes').update(i as never).eq('id', id).select('*, member:members(*)').single()
  if (error) throw error
  return data
}
export async function deleteIncome(id: number) {
  const { error } = await supabase.from('incomes').delete().eq('id', id)
  if (error) throw error
}

// ─── Tasks ─────────────────────────────────────────────────────────────────
export async function getTasks() {
  const { data, error } = await supabase.from('tasks').select('*').order('due_date')
  if (error) throw error
  return data ?? []
}
export async function insertTask(t: Record<string, unknown>) {
  const { data, error } = await supabase.from('tasks').insert(t as never).select().single()
  if (error) throw error
  return data
}
export async function updateTask(id: number, t: Record<string, unknown>) {
  const { data, error } = await supabase.from('tasks').update(t as never).eq('id', id).select().single()
  if (error) throw error
  return data
}
export async function deleteTask(id: number) {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

// ─── Banks / Cards ─────────────────────────────────────────────────────────
export async function getBanks() {
  const { data, error } = await supabase.from('banks').select('*').order('name')
  if (error) throw error
  return data ?? []
}
export async function insertBank(name: string) {
  const { data, error } = await supabase.from('banks').insert({ name } as never).select().single()
  if (error) throw error
  return data
}
export async function deleteBank(id: number) {
  const { error } = await supabase.from('banks').delete().eq('id', id)
  if (error) throw error
}

export async function getBankAccounts() {
  const { data, error } = await supabase.from('bank_accounts').select('*, bank:banks(*)').order('account_name')
  if (error) throw error
  return data ?? []
}
export async function insertBankAccount(a: Record<string, unknown>) {
  const { data, error } = await supabase.from('bank_accounts').insert(a as never).select('*, bank:banks(*)').single()
  if (error) throw error
  return data
}
export async function deleteBankAccount(id: number) {
  const { error } = await supabase.from('bank_accounts').delete().eq('id', id)
  if (error) throw error
}

export async function getCreditCards() {
  const { data, error } = await supabase.from('credit_cards').select('*, bank:banks(*)').order('card_name')
  if (error) throw error
  return data ?? []
}
export async function insertCreditCard(c: Record<string, unknown>) {
  const { data, error } = await supabase.from('credit_cards').insert(c as never).select('*, bank:banks(*)').single()
  if (error) throw error
  return data
}
export async function deleteCreditCard(id: number) {
  const { error } = await supabase.from('credit_cards').delete().eq('id', id)
  if (error) throw error
}

export async function getMealCards() {
  const { data, error } = await supabase.from('meal_cards').select('*').order('name')
  if (error) throw error
  return data ?? []
}
export async function insertMealCard(name: string) {
  const { data, error } = await supabase.from('meal_cards').insert({ name } as never).select().single()
  if (error) throw error
  return data
}
export async function deleteMealCard(id: number) {
  const { error } = await supabase.from('meal_cards').delete().eq('id', id)
  if (error) throw error
}

// ─── Transfers (Virman / Borç-Alacak) ───────────────────────────────────────
export async function getTransfers() {
  const { data, error } = await supabase
    .from('transfers')
    .select('*, from_member:members!transfers_from_member_id_fkey(*), to_member:members!transfers_to_member_id_fkey(*)')
    .order('date', { ascending: false })
  if (error) throw error
  return data ?? []
}
export async function insertTransfer(t: Record<string, unknown>) {
  const { data, error } = await supabase.from('transfers').insert(t as never)
    .select('*, from_member:members!transfers_from_member_id_fkey(*), to_member:members!transfers_to_member_id_fkey(*)').single()
  if (error) throw error
  return data
}
export async function updateTransfer(id: number, t: Record<string, unknown>) {
  const { data, error } = await supabase.from('transfers').update(t as never).eq('id', id)
    .select('*, from_member:members!transfers_from_member_id_fkey(*), to_member:members!transfers_to_member_id_fkey(*)').single()
  if (error) throw error
  return data
}
export async function deleteTransfer(id: number) {
  const { error } = await supabase.from('transfers').delete().eq('id', id)
  if (error) throw error
}

// ─── Recurring Templates (Favori Tekrarlayan İşlemler) ──────────────────────
export async function getRecurringTemplates() {
  const { data, error } = await supabase.from('recurring_templates').select('*, member:members(*)').order('created_at')
  if (error) throw error
  return data ?? []
}
export async function insertRecurringTemplate(t: Record<string, unknown>) {
  const { data, error } = await supabase.from('recurring_templates').insert(t as never).select('*, member:members(*)').single()
  if (error) throw error
  return data
}
export async function updateRecurringTemplate(id: number, t: Record<string, unknown>) {
  const { data, error } = await supabase.from('recurring_templates').update(t as never).eq('id', id).select('*, member:members(*)').single()
  if (error) throw error
  return data
}
export async function deleteRecurringTemplate(id: number) {
  const { error } = await supabase.from('recurring_templates').delete().eq('id', id)
  if (error) throw error
}
