# 🏠 Masraf Yönetim Uygulaması

React + TypeScript + Supabase ile kalıcı veri depolama destekli ev bütçe uygulaması.

---

## ⚡ Kurulum (Adım adım)

### 1. Supabase Projesi Oluşturun

1. [supabase.com](https://supabase.com) → **New Project**
2. Proje adı, şifre seçin → **Create new project**
3. Proje açıldıktan sonra **SQL Editor** → **New Query**
4. `supabase-schema.sql` dosyasının tüm içeriğini yapıştırın → **Run**

### 2. Supabase API Anahtarlarını Alın

**Settings → API** bölümünden:
- `Project URL` → `VITE_SUPABASE_URL`
- `anon / public` key → `VITE_SUPABASE_ANON_KEY`

### 3. .env Dosyası Oluşturun

```bash
cp .env.example .env
```

`.env` dosyasını açın ve değerleri doldurun:

```
VITE_SUPABASE_URL=https://SIZIN_PROJE_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJI...
```

### 4. Bağımlılıkları Yükleyin

```bash
npm install
```

### 5. Geliştirme Modunda Çalıştırın

```bash
npm run dev
```

---

## 🚀 GitHub Pages'e Deploy

### İlk kez deploy etmek için:

```bash
npm run deploy
```

Bu komut:
1. Projeyi build eder (`dist/` klasörü oluşturulur)
2. `gh-pages` branch'ına otomatik push eder

### GitHub Repo Ayarları:

1. GitHub repo → **Settings → Pages**
2. **Source:** `gh-pages` branch, `/ (root)` klasör
3. **Save**

Birkaç dakika içinde `https://enginardic.github.io/homemanagement/` adresinde yayınlanır.

### ⚠️ Önemli: .env değerlerini GitHub Actions ile kullanmak için

Eğer GitHub Actions ile otomatik deploy istiyorsanız, repo **Settings → Secrets and variables → Actions** bölümüne şu secret'ları ekleyin:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 📁 Proje Yapısı

```
homemanagement/
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx      # Aylık özet ve grafikler
│   │   ├── ExpenseList.tsx    # Masraf listesi (CRUD)
│   │   ├── Categories.tsx     # Kategori yönetimi
│   │   └── Budgets.tsx        # Bütçe hedefleri
│   ├── lib/
│   │   ├── supabase.ts        # Supabase istemcisi
│   │   ├── db.ts              # Tüm veritabanı işlemleri
│   │   └── utils.ts           # Yardımcı fonksiyonlar
│   ├── types/
│   │   └── index.ts           # TypeScript tipleri
│   ├── App.tsx                # Ana uygulama & navigasyon
│   ├── App.css                # Tüm stiller
│   └── main.tsx               # Giriş noktası
├── supabase-schema.sql        # Veritabanı şeması
├── .env.example               # Örnek .env
├── vite.config.ts             # Vite konfigürasyonu (base: /homemanagement/)
├── index.html
└── package.json
```

---

## 🔒 Güvenlik Notu

`.env` dosyası `.gitignore`'a eklenmiştir, dolayısıyla GitHub'a push edilmez.
Supabase `anon` key'i frontend'de kullanmak güvenlidir — Row Level Security (RLS) ile korunur.
