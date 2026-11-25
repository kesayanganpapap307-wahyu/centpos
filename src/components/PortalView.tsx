'use client';

import React, { useMemo, useState } from 'react';
import { 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Settings, 
  CloudUpload, 
  ArrowRight, 
  DollarSign, 
  Receipt, 
  AlertTriangle, 
  CheckCircle, 
  User, 
  Clock, 
  Printer, 
  Plus, 
  QrCode, 
  Banknote, 
  Store,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { Product, Transaction, StoreSettings } from '../types/pos';
import { formatCurrency, formatDateTime } from '../utils/format';

interface PortalViewProps {
  onNavigate: (tab: 'portal' | 'pos' | 'products' | 'reports' | 'settings' | 'deploy') => void;
  products: Product[];
  transactions: Transaction[];
  settings: StoreSettings;
  onOpenReceipt: (transaction: Transaction) => void;
  onQuickAddStock: (productId: string, amount: number) => void;
}

export const PortalView: React.FC<PortalViewProps> = ({
  onNavigate,
  products,
  transactions,
  settings,
  onOpenReceipt,
  onQuickAddStock,
}) => {
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [initialCash, setInitialCash] = useState<number>(100000); // Modal kas awal default Rp 100.000

  // Calculations for Today
  const todayTransactions = useMemo(() => {
    const todayStr = new Date().toDateString();
    return transactions.filter(
      (t) => new Date(t.createdAt).toDateString() === todayStr
    );
  }, [transactions]);

  const todayRevenue = useMemo(() => {
    return todayTransactions.reduce((acc, t) => acc + t.totalAmount, 0);
  }, [todayTransactions]);

  const todayCashRevenue = useMemo(() => {
    return todayTransactions
      .filter((t) => t.paymentMethod === 'TUNAI')
      .reduce((acc, t) => acc + t.totalAmount, 0);
  }, [todayTransactions]);

  const todayDigitalRevenue = useMemo(() => {
    return todayTransactions
      .filter((t) => t.paymentMethod !== 'TUNAI')
      .reduce((acc, t) => acc + t.totalAmount, 0);
  }, [todayTransactions]);

  // Low stock products (stock <= 10)
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.stock <= 10);
  }, [products]);

  // Recent 5 transactions
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  // Formatted today date in Indonesian
  const formattedTodayDate = useMemo(() => {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date());
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Top Welcome & Operational Status Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Toko Buka • Shift Aktif
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {formattedTodayDate}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Portal Bisnis {settings.storeName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Pusat kendali operasional toko. Kelola transaksi kasir, inventori stok, rekapan harian, dan monitoring cloud dalam satu portal terpadu.
            </p>
          </div>

          {/* Quick Cashier Action Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full md:w-auto">
            <button
              onClick={() => setIsShiftModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Rekap Shift Kasir</span>
            </button>

            <button
              onClick={() => onNavigate('pos')}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-900/40 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Buka Mesin Kasir (POS)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Omset Hari Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Omset Hari Ini
            </span>
            <h3 className="text-xl font-black text-slate-900">
              {formatCurrency(todayRevenue)}
            </h3>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {todayTransactions.length} transaksi hari ini
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Kas Tunai di Laci */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Kas Tunai Fisik (Laci)
            </span>
            <h3 className="text-xl font-black text-slate-900">
              {formatCurrency(initialCash + todayCashRevenue)}
            </h3>
            <span className="text-[11px] text-slate-500">
              Modal awal: {formatCurrency(initialCash)}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Banknote className="w-6 h-6" />
          </div>
        </div>

        {/* Non-Tunai / QRIS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Pendapatan Digital (QRIS)
            </span>
            <h3 className="text-xl font-black text-slate-900">
              {formatCurrency(todayDigitalRevenue)}
            </h3>
            <span className="text-[11px] text-purple-600 font-semibold flex items-center gap-1">
              <QrCode className="w-3 h-3" />
              Masuk rekening bank
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <QrCode className="w-6 h-6" />
          </div>
        </div>

        {/* Status Inventori & Alert */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Katalog Produk
            </span>
            <h3 className="text-xl font-black text-slate-900">
              {products.length} SKU
            </h3>
            {lowStockProducts.length > 0 ? (
              <span className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {lowStockProducts.length} produk menipis!
              </span>
            ) : (
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Semua stok aman
              </span>
            )}
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Module Launcher Cards (Portal Hub) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-600" />
            Menu Utama Aplikasi
          </h2>
          <span className="text-xs text-slate-500">Pilih modul untuk mulai bekerja</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1. Terminal Kasir */}
          <div
            onClick={() => onNavigate('pos')}
            className="group relative bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all text-emerald-600">
              <ShoppingCart className="w-24 h-24" />
            </div>

            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 mb-4 group-hover:scale-105 transition-transform">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                  Terminal Kasir (POS)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Utama
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Layar checkout kasir instan. Mendukung pencarian cepat, scan barcode, kalkulasi diskon, multi-pembayaran, dan cetak struk thermal.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600">
              <span>Buka Kasir Sekarang</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 2. Produk & Inventori */}
          <div
            onClick={() => onNavigate('products')}
            className="group relative bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all text-blue-600">
              <Package className="w-24 h-24" />
            </div>

            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 mb-4 group-hover:scale-105 transition-transform">
                <Package className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Produk & Inventori
                </h3>
                {lowStockProducts.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                    {lowStockProducts.length} Perlu Restock
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Kelola katalog harga beli, harga jual, kode barcode SKU, kategori barang, dan monitor stok masuk/keluar.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
              <span>Kelola Katalog & Stok</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 3. Laporan & Pembukuan */}
          <div
            onClick={() => onNavigate('reports')}
            className="group relative bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-xl hover:border-amber-300 transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all text-amber-600">
              <BarChart3 className="w-24 h-24" />
            </div>

            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 mb-4 group-hover:scale-105 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                  Laporan & Riwayat
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pantau grafik omset, rincian pembayaran tunai vs digital, riwayat transaksi lengkap, cetak ulang nota, dan export laporan ke Excel (CSV).
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-600">
              <span>Buka Laporan Penjualan</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 4. Pengaturan Toko & Printer */}
          <div
            onClick={() => onNavigate('settings')}
            className="group relative bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-xl hover:border-slate-400 transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all text-slate-600">
              <Settings className="w-24 h-24" />
            </div>

            <div>
              <div className="w-12 h-12 rounded-2xl bg-slate-700 text-white flex items-center justify-center shadow-md shadow-slate-700/20 mb-4 group-hover:scale-105 transition-transform">
                <Settings className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-slate-700 transition-colors">
                  Pengaturan Toko
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Kustomisasi identitas toko (nama, alamat, no telepon), format kertas nota thermal (58mm/80mm), teks footer struk, dan persentase pajak PPN.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Konfigurasi Toko</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 5. Deploy & Cloud Integration */}
          <div
            onClick={() => onNavigate('deploy')}
            className="group relative bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-xl hover:border-teal-300 transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all text-teal-600">
              <CloudUpload className="w-24 h-24" />
            </div>

            <div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20 mb-4 group-hover:scale-105 transition-transform">
                <CloudUpload className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                  Hosting & Cloud Sync
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                  Vercel Ready
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Panduan 1-klik deploy gratis ke cloud Vercel, cara menyambungkan database Supabase PostgreSQL, dan panduan instalasi PWA di tablet kasir.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-600">
              <span>Buka Panduan Hosting</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 6. Info Shift & Kasir Card */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-800 flex items-center justify-center mb-4">
                <User className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Informasi Kasir Aktif
              </h3>
              <div className="space-y-2 mt-3 text-xs text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span>Nama Kasir:</span>
                  <span className="font-bold text-slate-800">{settings.cashierName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span>Ukuran Printer:</span>
                  <span className="font-bold text-slate-800">{settings.paperSize} Thermal</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span>Pajak Toko:</span>
                  <span className="font-bold text-slate-800">
                    {settings.enableTax ? `Aktif (${settings.taxPercent}%)` : 'Non-aktif'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsShiftModalOpen(true)}
              className="mt-6 w-full py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Lihat Detail Rekapan Kasir
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Section: Low Stock Warnings & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Low Stock Alerts */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base text-slate-900">
                  Peringatan Stok Menipis
                </h3>
              </div>
              <button
                onClick={() => onNavigate('products')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                Lihat Semua ({products.length}) →
              </button>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <CheckCircle className="w-10 h-10 text-emerald-500 mb-2" />
                <p className="text-sm font-semibold text-slate-700">Semua Stok Barang Aman</p>
                <p className="text-xs text-slate-400 mt-0.5">Tidak ada produk dengan sisa stok di bawah 10.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {lowStockProducts.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors"
                  >
                    <div>
                      <h4 className="font-semibold text-xs text-slate-900 line-clamp-1">
                        {p.name}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {p.category} • {formatCurrency(p.sellPrice)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          p.stock <= 0
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        Sisa {p.stock} {p.unit}
                      </span>
                      <button
                        onClick={() => onQuickAddStock(p.id, 10)}
                        title="Tambah 10 stok cepat"
                        className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 text-xs flex items-center gap-1 font-semibold transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+10</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Ambang batas peringatan: &le; 10 unit</span>
            <button
              onClick={() => onNavigate('products')}
              className="text-emerald-600 font-semibold hover:underline"
            >
              Kelola Inventori
            </button>
          </div>
        </div>

        {/* Right: Recent 5 Transactions */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Transaksi Terakhir
                </h3>
              </div>
              <button
                onClick={() => onNavigate('reports')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                Lihat Semua ({transactions.length}) →
              </button>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <Receipt className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-700">Belum Ada Transaksi</p>
                <p className="text-xs text-slate-400 mt-0.5">Buka menu Kasir untuk transaksi pertama.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentTransactions.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-800">
                          {t.invoiceNumber}
                        </span>
                        <span className="px-1.5 py-0.2 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-600">
                          {t.paymentMethod}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {t.customerName} • {formatDateTime(t.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-emerald-700">
                        {formatCurrency(t.totalAmount)}
                      </span>
                      <button
                        onClick={() => onOpenReceipt(t)}
                        title="Cetak Struk"
                        className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Transaksi tersimpan otomatis secara lokal</span>
            <button
              onClick={() => onNavigate('pos')}
              className="text-emerald-600 font-semibold hover:underline"
            >
              + Transaksi Baru
            </button>
          </div>
        </div>
      </div>

      {/* SHIFT SUMMARY MODAL */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 bg-emerald-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">Rekap Kasir & Shift</h3>
              </div>
              <button
                onClick={() => setIsShiftModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Kasir Bertugas:</span>
                  <span className="font-bold text-slate-800">{settings.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Tanggal:</span>
                  <span className="font-bold text-slate-800">{formattedTodayDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Struk Hari Ini:</span>
                  <span className="font-bold text-slate-800">{todayTransactions.length} Struk</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-semibold text-slate-700">Modal Kas Awal di Laci (Rp)</label>
                <input
                  type="number"
                  min={0}
                  value={initialCash}
                  onChange={(e) => setInitialCash(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-2">
                <div className="flex justify-between text-slate-700">
                  <span>Modal Kas Awal:</span>
                  <span className="font-semibold">{formatCurrency(initialCash)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Penerimaan Kas Tunai:</span>
                  <span className="font-semibold text-emerald-700">+{formatCurrency(todayCashRevenue)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Penerimaan Digital (QRIS):</span>
                  <span className="font-semibold text-purple-700">+{formatCurrency(todayDigitalRevenue)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-emerald-200">
                  <span>Total Uang Kas di Laci:</span>
                  <span className="text-emerald-700">{formatCurrency(initialCash + todayCashRevenue)}</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsShiftModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  window.print();
                  setIsShiftModalOpen(false);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Rekap Kasir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
