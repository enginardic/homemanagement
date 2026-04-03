import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Expense, ExpenseInsert } from '../types/database'

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })

    if (err) {
      setError(err.message)
    } else {
      setExpenses(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  const addExpense = async (expense: ExpenseInsert): Promise<boolean> => {
    const { error: err } = await supabase
      .from('expenses')
      .insert([expense])

    if (err) {
      setError(err.message)
      return false
    }
    await fetchExpenses()
    return true
  }

  const updateExpense = async (id: string, updates: Partial<ExpenseInsert>): Promise<boolean> => {
    const { error: err } = await supabase
      .from('expenses')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (err) {
      setError(err.message)
      return false
    }
    await fetchExpenses()
    return true
  }

  const deleteExpense = async (id: string): Promise<boolean> => {
    const { error: err } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)

    if (err) {
      setError(err.message)
      return false
    }
    await fetchExpenses()
    return true
  }

  return { expenses, loading, error, addExpense, updateExpense, deleteExpense, refetch: fetchExpenses }
}
