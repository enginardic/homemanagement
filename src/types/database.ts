export type Category = 
  | 'market'
  | 'kira'
  | 'faturalar'
  | 'ulasim'
  | 'saglik'
  | 'eglence'
  | 'giyim'
  | 'egitim'
  | 'diger'

export interface Expense {
  id: string
  description: string
  amount: number
  category: Category
  date: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface ExpenseInsert {
  description: string
  amount: number
  category: Category
  date: string
  notes?: string
}

export interface Database {
  public: {
    Tables: {
      expenses: {
        Row: Expense
        Insert: Omit<Expense, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Expense, 'id' | 'created_at'>>
      }
    }
  }
}
