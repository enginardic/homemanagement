-- =============================================
-- Masraf Yönetim Uygulaması - Supabase Schema
-- supabase.com > SQL Editor > New Query
-- Bu dosyayı çalıştırarak tabloları oluşturun
-- =============================================

-- Tabloları oluştur
CREATE TABLE IF NOT EXISTS members (id BIGSERIAL PRIMARY KEY, name TEXT, role TEXT, color TEXT, email TEXT, password TEXT, created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS expenses (id BIGSERIAL PRIMARY KEY, title TEXT, amount NUMERIC, planned_amount NUMERIC(12, 2) DEFAULT NULL, category TEXT, date DATE, member_id BIGINT, recurring BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS incomes (id BIGSERIAL PRIMARY KEY, title TEXT, amount NUMERIC, planned_amount NUMERIC(12, 2) DEFAULT NULL, source TEXT, date DATE, member_id BIGINT, recurring BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS tasks (id BIGSERIAL PRIMARY KEY, title TEXT, assignee TEXT, due_date DATE, completed BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT NOW());
-- RLS'i KAPAT (Önemli!)
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE incomes DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
-- Herkese tam erişim izni ver
GRANT ALL ON members TO anon, authenticated;
GRANT ALL ON expenses TO anon, authenticated;
GRANT ALL ON incomes TO anon, authenticated;
GRANT ALL ON tasks TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
