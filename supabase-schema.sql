-- =============================================
-- Masraf Yönetim Uygulaması - Supabase Schema
-- supabase.com > SQL Editor > New Query
-- Bu dosyayı çalıştırarak tabloları oluşturun
-- =============================================

-- Kategoriler tablosu
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📦',
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Masraflar tablosu
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  amount NUMERIC(12, 2) NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bütçe tablosu (aylık hedefler)
CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, month, year)
);

-- Varsayılan kategoriler
INSERT INTO categories (name, icon, color) VALUES
  ('Market', '🛒', '#10b981'),
  ('Faturalar', '⚡', '#f59e0b'),
  ('Ulaşım', '🚗', '#3b82f6'),
  ('Sağlık', '💊', '#ef4444'),
  ('Eğlence', '🎬', '#8b5cf6'),
  ('Giyim', '👕', '#ec4899'),
  ('Yemek', '🍽️', '#f97316'),
  ('Eğitim', '📚', '#06b6d4'),
  ('Diğer', '📦', '#6b7280')
ON CONFLICT DO NOTHING;

-- Row Level Security (isteğe bağlı - kimlik doğrulama eklerseniz)
-- Şimdilik herkese açık (anon key ile erişilebilir)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkese okuma izni" ON categories FOR SELECT USING (true);
CREATE POLICY "Herkese yazma izni" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkese güncelleme izni" ON categories FOR UPDATE USING (true);
CREATE POLICY "Herkese silme izni" ON categories FOR DELETE USING (true);

CREATE POLICY "Herkese okuma izni" ON expenses FOR SELECT USING (true);
CREATE POLICY "Herkese yazma izni" ON expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkese güncelleme izni" ON expenses FOR UPDATE USING (true);
CREATE POLICY "Herkese silme izni" ON expenses FOR DELETE USING (true);

CREATE POLICY "Herkese okuma izni" ON budgets FOR SELECT USING (true);
CREATE POLICY "Herkese yazma izni" ON budgets FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkese güncelleme izni" ON budgets FOR UPDATE USING (true);
CREATE POLICY "Herkese silme izni" ON budgets FOR DELETE USING (true);
