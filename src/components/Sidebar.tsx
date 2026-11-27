'use client';

import React, { useEffect, useState } from 'react';
import {
  ShoppingCart,
  Package,
  BarChart3,
  Settings,
  CloudUpload,
  Clock,
  User,
  Wifi,
  Menu,
  X,
  ChevronRight,
  LogOut,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import { StoreSettings, AuthUser } from '../types/pos';

interface SidebarProps {
  activeTab: 'pos' | 'products' | 'reports' | 'settings' | 'deploy';
  setActiveTab: (tab: 'pos' | 'products' | 'reports' | 'settings' | 'deploy') => void;
  cartCount?: number;
  settings: StoreSettings;
  cloudStatus?: 'connecting' | 'connected' | 'error' | 'offline';
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  isOnline?: boolean;
  pendingSyncCount?: number;
  isSyncing?: boolean;
  onManualSync?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  cartCount = 0,
  settings,
  cloudStatus = 'connected',
  currentUser,
  onLogout,
  isOnline = true,
  pendingSyncCount = 0,
  isSyncing = false,
  onManualSync,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    {
      id: 'pos' as const,
      label: 'Menu Kasir (POS)',
      shortLabel: 'Kasir',
      icon: ShoppingCart,
      badge: cartCount > 0 ? cartCount : null,
    },
    {
      id: 'products' as const,
      label: 'Manajemen Produk',
      shortLabel: 'Produk',
      icon: Package,
    },
    {
      id: 'reports' as const,
      label: 'Laporan Penjualan',
      shortLabel: 'Laporan',
      icon: BarChart3,
    },
    {
      id: 'settings' as const,
      label: 'Pengaturan Toko',
      shortLabel: 'Pengaturan',
      icon: Settings,
    },
    {
      id: 'deploy' as const,
      label: 'Status Cloud Supabase',
      shortLabel: 'Cloud',
      icon: CloudUpload,
      highlight: true,
    },
  ];

  const handleSelectTab = (tab: 'pos' | 'products' | 'reports' | 'settings' | 'deploy') => {
    setActiveTab(tab);
    setIsOpen(false);
  };

  return (
    <>
      {/* ============================================================ */}
      {/* 1. MOBILE TOP HEADER (Hanya Tampil di Layar Kecil / HP)       */}
      {/* ============================================================ */}
      <header className="md:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-3 h-14 flex items-center justify-between shadow-xs w-full max-w-full overflow-hidden">
        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
          <button
            onClick={() => setIsOpen(true)}
            className="p-1.5 -ml-1 text-slate-700 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition-colors active:scale-95 shrink-0"
            aria-label="Buka Navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0">
              CP
            </div>
            <div className="leading-tight min-w-0">
              <h1 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                {settings.storeName}
              </h1>
              <p className="text-[10px] text-slate-500 truncate">CentPOS Cloud</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Status Badge Mobile */}
          {!isOnline ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-800 border-amber-300">
              <WifiOff className="w-2.5 h-2.5 text-amber-600" />
              <span>Offline {pendingSyncCount > 0 ? `(${pendingSyncCount})` : ''}</span>
            </span>
          ) : isSyncing ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
              <RefreshCw className="w-2.5 h-2.5 text-blue-600 animate-spin" />
              <span>Sinkron...</span>
            </span>
          ) : pendingSyncCount > 0 ? (
            <button
              onClick={onManualSync}
              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-amber-500 text-white border-amber-600 hover:bg-amber-600 transition-colors shadow-2xs"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>Sinkron ({pendingSyncCount})</span>
            </button>
          ) : (
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                cloudStatus === 'error'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              <Wifi className="w-2.5 h-2.5 text-emerald-500 animate-pulse" />
              <span>Online</span>
            </span>
          )}

          <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md hidden xs:inline">
            {time.slice(0, 5)}
          </span>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. MOBILE SLIDE-OUT DRAWER (Meluncur dari Kiri saat Klik ☰)  */}
      {/* ============================================================ */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs transition-opacity duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`md:hidden fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              CP
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                {settings.storeName}
              </h2>
              <p className="text-xs text-slate-500">CentPOS System</p>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Menu List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="px-3 pt-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Menu Utama
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? 'text-white' : item.highlight ? 'text-emerald-600' : 'text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-white text-emerald-700' : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {!item.badge && (
                  <ChevronRight
                    className={`w-4 h-4 ${isActive ? 'text-emerald-200' : 'text-slate-300'}`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 text-xs text-slate-600 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser?.role === 'owner' ? '👑' : '🛒'}
              </div>
              <div className="min-w-0">
                <span className="font-bold text-slate-900 block truncate">
                  {currentUser?.name || settings.cashierName}
                </span>
                <span className="text-[10px] text-slate-400 capitalize">
                  {currentUser?.role || 'Kasir'}
                </span>
              </div>
            </div>

            {onLogout && (
              <button
                onClick={() => {
                  if (confirm('Yakin ingin keluar / ganti akun kasir?')) {
                    onLogout();
                  }
                }}
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                title="Keluar / Ganti Akun"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
            <span>CentPOS v0.1</span>
            <span className="font-mono">{time || '00:00:00'}</span>
          </div>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* 3. DESKTOP PERMANENT LEFT SIDEBAR (Tampil di Layar Lebar/PC) */}
      {/* ============================================================ */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-white border-r border-slate-200 h-screen sticky top-0 z-30 select-none">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-xl shadow-sm shrink-0">
            CP
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-slate-900 truncate leading-tight">
              {settings.storeName}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              {!isOnline ? (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <p className="text-xs text-amber-700 font-semibold">Mode Offline</p>
                </>
              ) : isSyncing ? (
                <>
                  <RefreshCw className="w-3 h-3 text-blue-600 animate-spin" />
                  <p className="text-xs text-blue-600 font-semibold">Menyinkronkan...</p>
                </>
              ) : (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-xs text-slate-500 font-medium">Cloud Online</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Nav Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <p className="px-3 pt-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Menu Kasir
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-white' : item.highlight ? 'text-emerald-600' : 'text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-white text-emerald-700' : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Offline Sync Status Widget in Desktop Sidebar */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className={`p-3 rounded-xl border text-xs ${
            !isOnline
              ? 'bg-amber-50/80 border-amber-200 text-amber-900'
              : pendingSyncCount > 0
              ? 'bg-blue-50/80 border-blue-200 text-blue-900'
              : 'bg-emerald-50/50 border-emerald-100 text-emerald-900'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold flex items-center gap-1.5 text-[11px]">
                {!isOnline ? (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                    <span>Mode Offline</span>
                  </>
                ) : isSyncing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                    <span>Menyinkronkan...</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Sinkronisasi Otomatis</span>
                  </>
                )}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                pendingSyncCount > 0 ? 'bg-amber-200 text-amber-900' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {pendingSyncCount} Antrean
              </span>
            </div>

            <p className="text-[11px] leading-relaxed text-slate-500 mb-2">
              {!isOnline
                ? 'Toko tetap bisa jualan. Data transaksi tersimpan aman di browser & auto-upload saat online.'
                : pendingSyncCount > 0
                ? `${pendingSyncCount} transaksi offline menunggu dikirim ke Supabase.`
                : 'Semua transaksi offline telah tersinkron aman ke database cloud.'}
            </p>

            {pendingSyncCount > 0 && onManualSync && (
              <button
                onClick={onManualSync}
                disabled={isSyncing || !isOnline}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg transition-colors text-[11px] shadow-xs"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sedang Sinkron...' : 'Sinkronkan Sekarang'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Cashier & Clock Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser?.role === 'owner' ? '👑' : '🛒'}
              </div>
              <div className="min-w-0">
                <span className="font-bold text-slate-900 block truncate text-xs">
                  {currentUser?.name || settings.cashierName}
                </span>
                <span className="text-[10px] text-emerald-600 font-medium capitalize block">
                  {currentUser?.role === 'owner' ? 'Owner / Admin' : 'Kasir'}
                </span>
              </div>
            </div>

            {onLogout && (
              <button
                onClick={() => {
                  if (confirm('Yakin ingin keluar / ganti akun kasir?')) {
                    onLogout();
                  }
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                title="Keluar / Ganti Akun"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
            <span>CentPOS Cloud</span>
            <span className="font-mono">{time || '00:00:00'}</span>
          </div>
        </div>
      </aside>
    </>
  );
};
