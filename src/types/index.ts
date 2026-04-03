export interface Category {
  id: string
  name: string
  icon: string
  color: string
  created_at?: string
}

export interface Expense {
  id: string
  amount: number
  description: string
  category_id: string | null
  date: string
  note?: string
  created_at?: string
  updated_at?: string
  category?: Category
}

export interface Budget {
  id: string
  category_id: string
  month: number
  year: number
  amount: number
  created_at?: string
  category?: Category
}

export interface MonthlyStats {
  totalExpenses: number
  expenseCount: number
  topCategory: string
  dailyAverage: number
}

export type View = 'dashboard' | 'expenses' | 'categories' | 'budgets'
