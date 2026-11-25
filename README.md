# CentPOS - Modern Cloud Point of Sale (POS)

Aplikasi Kasir (Point of Sale) modern, responsif, offline-tolerant, dan siap langsung di-hosting di **Vercel** secara gratis.

---

## 🚀 Fitur Utama

- 🛒 **Menu Kasir Cepat (POS)**:
  - Pencarian produk instan & support barcode scanner (klik Enter pada input pencarian untuk scan barcode).
  - Filter kategori produk (Makanan, Minuman, Snack, Sembako, dll).
  - Keranjang belanja dinamis dengan kontrol kuantitas (`+` / `-`).
  - Diskon fleksibel (%) dan perhitungan pajak otomatis (PPN 11%).
- 💵 **Multi-Payment Modal**:
  - **Tunai**: Tombol cepat uang pecahan (Uang Pas, 20rb, 50rb, 100rb, dll) & kalkulasi uang kembalian otomatis.
  - **QRIS**: Tampilan QRIS statis toko untuk pembayaran digital (GoPay, OVO, Dana, BCA, dll).
  - **Transfer / Debit**: Catatan EDC & nomor rekening bank.
- 🖨️ **Cetak Struk Thermal (58mm / 80mm)**:
  - Format nota presisi untuk printer thermal kasir (USB, Bluetooth, atau Network).
  - Cetak otomatis via dialog print browser (hanya area struk yang dicetak, halaman web otomatis disembunyikan).
- 📦 **Manajemen Produk & Stok**:
  - Tambah, edit, dan hapus produk.
  - Indikator peringatan stok menipis (Low Stock) dan stok habis.
- 📊 **Laporan & Riwayat Penjualan**:
  - Statistik omset total, jumlah transaksi, rata-rata nota.
  - Rincian penjualan per metode pembayaran (Tunai, QRIS, Transfer).
  - Cetak ulang nota transaksi masa lalu.
  - Export laporan transaksi ke file Excel / CSV.
- ⚙️ **Pengaturan Toko**:
  - Nama toko, alamat, telepon, nama kasir utama, dan catatan penutup struk.
- 💾 **Offline-Tolerant & Local Persistence**:
  - Data tersimpan otomatis di LocalStorage browser sehingga tetap berfungsi lancar walau internet putus.
  - Siap dihubungkan ke database cloud PostgreSQL via **Supabase** (`supabase_schema.sql` terlampir).

---

## 💻 Menjalankan di Lokal (Development)

1. Masuk ke folder project:
   ```bash
   cd C:\Users\user\Develop\CentPos
   ```

2. Jalankan development server:
   ```bash
   npm run dev
   ```

3. Buka di browser:
   ```
   http://localhost:3000
   ```

---

## ☁️ Cara Deploy / Hosting ke Vercel (Gratis)

### Langkah 1: Push ke GitHub
Buka terminal dan jalankan perintah berikut:
```bash
git add .
git commit -m "feat: setup CentPOS ready for Vercel deployment"
git remote add origin https://github.com/USERNAME_ANDA/CentPos.git
git branch -M main
git push -u origin main
```
*(Ganti `USERNAME_ANDA` dengan username GitHub Anda)*

### Langkah 2: Deploy di Vercel
1. Kunjungi [vercel.com](https://vercel.com) dan login menggunakan akun GitHub.
2. Klik tombol **"Add New..."** lalu pilih **"Project"**.
3. Pilih repository **CentPos** dari daftar repository GitHub Anda.
4. Klik **"Deploy"** (tanpa perlu mengubah pengaturan apa pun).
5. Dalam 1-2 menit, aplikasi kasir Anda akan aktif di URL seperti:
   ```
   https://centpos-xyz.vercel.app
   ```

---

## 🗄️ Koneksi Database Supabase (Opsional)
Jika ingin menyinkronkan data antar banyak perangkat kasir secara terpusat:
1. Buat project gratis di [supabase.com](https://supabase.com).
2. Buka menu **SQL Editor**, salin seluruh isi file `supabase_schema.sql`, dan klik **Run**.
3. Masukkan URL dan Anon Key Supabase ke Environment Variables di dashboard Vercel.
