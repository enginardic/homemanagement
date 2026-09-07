-- =============================================
-- Migration: Virman (Borç/Alacak) + Tekrarlayan Şablonlar
-- Supabase SQL Editor'da çalıştırın
-- =============================================

-- Virman / Borç-Alacak kayıtları
CREATE TABLE IF NOT EXISTS transfers (
  id BIGSERIAL PRIMARY KEY,
  from_member_id BIGINT REFERENCES members(id) ON DELETE SET NULL,  -- borçlu (parayı veren/borç alan)
  to_member_id BIGINT REFERENCES members(id) ON DELETE SET NULL,    -- alacaklı (parayı alan/alacaklı)
  amount NUMERIC(12,2) NOT NULL,
  description TEXT DEFAULT '',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  settled BOOLEAN DEFAULT FALSE,  -- ödendi mi?
  settled_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE transfers DISABLE ROW LEVEL SECURITY;
GRANT ALL ON transfers TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE transfers_id_seq TO anon, authenticated;

-- Tekrarlayan işlem şablonları (favoriler)
CREATE TABLE IF NOT EXISTS recurring_templates (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('expense','income')),
  title TEXT NOT NULL,
  amount NUMERIC(12,2),
  category TEXT,          -- sadece expense için
  source TEXT,            -- sadece income için
  member_id BIGINT REFERENCES members(id) ON DELETE SET NULL,
  payment_method TEXT DEFAULT 'cash',
  payment_details TEXT DEFAULT '',
  frequency TEXT DEFAULT 'monthly' CHECK (frequency IN ('monthly','weekly')),
  day_of_month INT DEFAULT 1,   -- ayın kaçında (monthly için)
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE recurring_templates DISABLE ROW LEVEL SECURITY;
GRANT ALL ON recurring_templates TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE recurring_templates_id_seq TO anon, authenticated;
