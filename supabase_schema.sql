-- ============================================================
-- CENTPOS - Supabase (PostgreSQL) Database Schema
-- Jalankan query ini di SQL Editor dashboard Supabase Anda
-- ============================================================

-- 1. Tabel Produk & Stok
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Lainnya',
    barcode VARCHAR(100) UNIQUE,
    buy_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    sell_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    unit VARCHAR(50) NOT NULL DEFAULT 'pcs',
    color VARCHAR(50) DEFAULT 'bg-emerald-500',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabel Transaksi / Penjualan
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    cashier_name VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255) DEFAULT 'Pelanggan Umum',
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'TUNAI',
    amount_paid NUMERIC(15, 2) NOT NULL DEFAULT 0,
    change_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabel Detail Item Transaksi
CREATE TABLE IF NOT EXISTS transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    sell_price NUMERIC(15, 2) NOT NULL,
    subtotal NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabel Pengaturan Toko
CREATE TABLE IF NOT EXISTS store_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    store_name VARCHAR(255) NOT NULL DEFAULT 'CentPOS Mart & Cafe',
    address TEXT DEFAULT 'Jl. Merdeka No. 45, Jakarta Pusat',
    phone VARCHAR(50) DEFAULT '0812-3456-7890',
    cashier_name VARCHAR(255) DEFAULT 'Kasir Utama',
    tax_percent NUMERIC(5, 2) DEFAULT 11.00,
    enable_tax BOOLEAN DEFAULT false,
    receipt_footer TEXT DEFAULT 'Terima Kasih Telah Berbelanja!\nBarang yang sudah dibeli tidak dapat ditukar.',
    currency VARCHAR(10) DEFAULT 'Rp',
    paper_size VARCHAR(10) DEFAULT '58mm',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexing untuk pencarian cepat
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_transactions_invoice ON transactions(invoice_number);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
