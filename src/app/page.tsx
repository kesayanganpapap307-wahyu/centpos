'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { CashierView } from '../components/CashierView';
import { ProductsView } from '../components/ProductsView';
import { ReportsView } from '../components/ReportsView';
import { SettingsView } from '../components/SettingsView';
import { VercelDeployGuide } from '../components/VercelDeployGuide';
import { ReceiptPrint } from '../components/ReceiptPrint';
import { LoginView } from '../components/LoginView';
import { Product, Transaction, StoreSettings, AuthUser } from '../types/pos';
import { initialProducts, initialStoreSettings } from '../data/initialData';
import { AlertTriangle, Copy, Check, Wifi, WifiOff, RefreshCw } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'pos' | 'products' | 'reports' | 'settings' | 'deploy'>('pos');
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Core Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(initialStoreSettings);

  // Cloud Sync & Offline-First State
  const [cloudStatus, setCloudStatus] = useState<'connecting' | 'connected' | 'error' | 'offline'>('connecting');
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Helper Queue Storage Offline
  const getPendingQueue = (): Transaction[] => {
    try {
      const q = localStorage.getItem('centpos_pending_sync_queue');
      return q ? JSON.parse(q) : [];
    } catch {
      return [];
    }
  };

  const savePendingQueue = (queue: Transaction[]) => {
    try {
      localStorage.setItem('centpos_pending_sync_queue', JSON.stringify(queue));
      setPendingSyncCount(queue.length);
    } catch (e) {
      console.error(e);
    }
  };

  // Active Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState<Transaction | null>(null);

  const grantSqlCode = `-- Jalankan query ini di SQL Editor Supabase Anda:
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for products" ON products;
CREATE POLICY "Allow all for products" ON products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for transactions" ON transactions;
CREATE POLICY "Allow all for transactions" ON transactions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for transaction_items" ON transaction_items;
CREATE POLICY "Allow all for transaction_items" ON transaction_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);`;

  // 1. Initial Load & Cloud Sync
  useEffect(() => {
    setIsClient(true);
    let currentProducts = initialProducts;

    // Load LocalStorage first for instant speed
    try {
      const savedProducts = localStorage.getItem('centpos_products');
      if (savedProducts) {
        currentProducts = JSON.parse(savedProducts);
        setProducts(currentProducts);
      } else {
        setProducts(initialProducts);
        localStorage.setItem('centpos_products', JSON.stringify(initialProducts));
      }

      const savedTransactions = localStorage.getItem('centpos_transactions');
      if (savedTransactions) {
        setTransactions(JSON.parse(savedTransactions));
      } else {
        const sampleTransaction: Transaction = {
          id: 'trx-sample-1',
          invoiceNumber: 'INV-261125-1001',
          createdAt: new Date().toISOString(),
          cashierName: initialStoreSettings.cashierName,
          customerName: 'Budi Santoso',
          items: [
            {
              productId: 'prd-1',
              productName: 'Kopi Susu Gula Aren',
              quantity: 2,
              sellPrice: 18000,
              subtotal: 36000,
            },
            {
              productId: 'prd-6',
              productName: 'Roti Bakar Coklat Keju',
              quantity: 1,
              sellPrice: 16000,
              subtotal: 16000,
            },
          ],
          subtotal: 52000,
          discountAmount: 0,
          taxAmount: 0,
          totalAmount: 52000,
          paymentMethod: 'QRIS',
          amountPaid: 52000,
          changeAmount: 0,
        };
        setTransactions([sampleTransaction]);
        localStorage.setItem('centpos_transactions', JSON.stringify([sampleTransaction]));
      }

      const savedSettings = localStorage.getItem('centpos_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }

      const savedUser = localStorage.getItem('centpos_user');
      if (savedUser) {
        const parsedUser: AuthUser = JSON.parse(savedUser);
        setCurrentUser(parsedUser);
        setSettings((prev) => ({ ...prev, cashierName: parsedUser.name }));
      }
    } catch (e) {
      console.error('Error loading data from localStorage', e);
      setProducts(initialProducts);
      setSettings(initialStoreSettings);
    }

    // 2. Asynchronously sync with Supabase Cloud
    const syncCloud = async () => {
      try {
        const statusRes = await fetch('/api/status');
        const statusData = await statusRes.json();

        if (!statusData.configured) {
          setCloudStatus('offline');
          return;
        }

        if (!statusData.dbConnected) {
          setCloudStatus('error');
          setCloudError(statusData.error || 'Permission denied on database');
          return;
        }

        setCloudStatus('connected');
        setCloudError(null);

        // Fetch products from Supabase
        const prodRes = await fetch('/api/products');
        if (prodRes.ok) {
          const dbProducts = await prodRes.json();
          if (Array.isArray(dbProducts) && dbProducts.length > 0) {
            setProducts(dbProducts);
            localStorage.setItem('centpos_products', JSON.stringify(dbProducts));
          }
        }

        // Fetch transactions from Supabase
        const trxRes = await fetch('/api/transactions');
        if (trxRes.ok) {
          const dbTransactions = await trxRes.json();
          if (Array.isArray(dbTransactions) && dbTransactions.length > 0) {
            setTransactions(dbTransactions);
            localStorage.setItem('centpos_transactions', JSON.stringify(dbTransactions));
          }
        }
      } catch (err: any) {
        console.warn('Cloud sync error, falling back to local storage:', err);
        setCloudStatus('offline');
      }
    };

    syncCloud();

    // 3. Online/Offline Reconnect Listener & Auto-Sync
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const queue = getPendingQueue();
      setPendingSyncCount(queue.length);

      const handleOnline = () => {
        setIsOnline(true);
        setCloudStatus('connected');
        setSyncNotice('Koneksi internet terhubung kembali! Menyinkronkan data...');
        // Auto-sync immediately upon reconnecting
        syncPendingTransactionsInternal();
      };

      const handleOffline = () => {
        setIsOnline(false);
        setCloudStatus('offline');
        setSyncNotice('Koneksi internet terputus. Beralih ke Mode Offline (Data transaksi tetap tersimpan aman di perangkat).');
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Periodic check every 25 seconds if online and there are pending items
      const autoSyncInterval = setInterval(() => {
        if (navigator.onLine && getPendingQueue().length > 0) {
          syncPendingTransactionsInternal();
        }
      }, 25000);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        clearInterval(autoSyncInterval);
      };
    }
  }, []);

  // Sync Pending Transactions to Supabase
  const syncPendingTransactionsInternal = async () => {
    const queue = getPendingQueue();
    if (queue.length === 0) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSyncNotice('Tidak dapat menyinkronkan: perangkat sedang offline.');
      return;
    }

    setIsSyncing(true);
    let successCount = 0;
    const remaining: Transaction[] = [];

    for (const trx of queue) {
      try {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(trx),
        });

        if (res.ok) {
          successCount++;
        } else {
          remaining.push(trx);
        }
      } catch (err) {
        remaining.push(trx);
      }
    }

    savePendingQueue(remaining);
    setIsSyncing(false);

    if (successCount > 0) {
      setSyncNotice(`✅ Sukses menyinkronkan ${successCount} transaksi offline ke Supabase Cloud!`);
      setTimeout(() => setSyncNotice(null), 6000);
    }
  };

  const handleManualSync = () => {
    syncPendingTransactionsInternal();
  };

  // Save to localStorage
  const saveProductsLocally = (newProducts: Product[]) => {
    setProducts(newProducts);
    try {
      localStorage.setItem('centpos_products', JSON.stringify(newProducts));
    } catch (e) {
      console.error(e);
    }
  };

  const saveTransactionsLocally = (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
    try {
      localStorage.setItem('centpos_transactions', JSON.stringify(newTransactions));
    } catch (e) {
      console.error(e);
    }
  };

  const saveSettingsLocally = (newSettings: StoreSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('centpos_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.error(e);
    }
  };

  // Stock deduction
  const handleUpdateProductStock = async (productId: string, quantityDeducted: number) => {
    let targetProduct: Product | undefined;

    setProducts((prev) => {
      const updated = prev.map((p) => {
        if (p.id === productId) {
          const newStock = Math.max(0, p.stock - quantityDeducted);
          targetProduct = { ...p, stock: newStock };
          return targetProduct;
        }
        return p;
      });
      try {
        localStorage.setItem('centpos_products', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    // Sync updated stock to Supabase
    if (targetProduct) {
      try {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(targetProduct),
        });
      } catch (e) {
        console.warn('Could not sync stock deduction to cloud:', e);
      }
    }
  };

  // Quick add stock
  const handleQuickAddStock = async (productId: string, amount: number) => {
    let targetProduct: Product | undefined;

    setProducts((prev) => {
      const updated = prev.map((p) => {
        if (p.id === productId) {
          targetProduct = { ...p, stock: p.stock + amount };
          return targetProduct;
        }
        return p;
      });
      try {
        localStorage.setItem('centpos_products', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    if (targetProduct) {
      try {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(targetProduct),
        });
      } catch (e) {
        console.warn('Could not sync quick stock to cloud:', e);
      }
    }
  };

  // Login & Logout Handlers
  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    localStorage.setItem('centpos_user', JSON.stringify(user));
    setSettings((prev) => ({ ...prev, cashierName: user.name }));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('centpos_user');
  };

  // Save transaction
  const handleSaveTransaction = async (transaction: Transaction) => {
    const trxWithCashier = {
      ...transaction,
      cashierName: currentUser?.name || settings.cashierName,
    };
    const updated = [trxWithCashier, ...transactions];
    saveTransactionsLocally(updated);

    // Cek jika sedang offline: simpan ke antrean offline
    const isCurrentlyOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    if (isCurrentlyOffline) {
      const queue = getPendingQueue();
      const newQueue = [...queue, trxWithCashier];
      savePendingQueue(newQueue);
      setSyncNotice(`Transaksi ${trxWithCashier.invoiceNumber} disimpan offline (${newQueue.length} transaksi dalam antrean sinkronisasi).`);
      return;
    }

    // Jika online, kirim ke Supabase via /api/transactions
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trxWithCashier),
      });

      if (!res.ok) {
        throw new Error('Supabase responded with non-OK');
      }
    } catch (e) {
      console.warn('Gagal sinkron langsung ke cloud, memasukkan ke antrean offline:', e);
      const queue = getPendingQueue();
      const newQueue = [...queue, trxWithCashier];
      savePendingQueue(newQueue);
      setSyncNotice(`Koneksi terganggu: Transaksi disimpan di antrean offline (${newQueue.length} tertunda).`);
    }
  };

  // Add Product (with Cloud Sync)
  const handleAddProduct = async (product: Product) => {
    // 1. Optimistic local update
    const updated = [product, ...products];
    saveProductsLocally(updated);

    // 2. Sync to Supabase via server API
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });

      if (res.ok) {
        const savedData = await res.json();
        // Replace temporary local ID with Supabase UUID
        if (savedData?.id) {
          setProducts((prev) => {
            const synced = prev.map((p) =>
              p.id === product.id ? { ...p, id: savedData.id } : p
            );
            localStorage.setItem('centpos_products', JSON.stringify(synced));
            return synced;
          });
        }
      } else {
        const errorData = await res.json();
        console.error('Supabase error saving product:', errorData);
        if (errorData?.error && errorData.error.includes('permission denied')) {
          setCloudStatus('error');
          setCloudError(errorData.error);
        }
      }
    } catch (e) {
      console.warn('Could not sync product to cloud:', e);
    }
  };

  // Update Product (with Cloud Sync)
  const handleUpdateProduct = async (product: Product) => {
    const updated = products.map((p) => (p.id === product.id ? product : p));
    saveProductsLocally(updated);

    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
    } catch (e) {
      console.warn('Could not sync updated product to cloud:', e);
    }
  };

  // Delete Product (with Cloud Sync)
  const handleDeleteProduct = async (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    saveProductsLocally(updated);

    try {
      await fetch(`/api/products?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.warn('Could not sync deleted product to cloud:', e);
    }
  };

  // Reset data
  const handleResetData = () => {
    saveProductsLocally(initialProducts);
    saveTransactionsLocally([]);
    saveSettingsLocally(initialStoreSettings);
    alert('Data toko dan transaksi berhasil di-reset ke pengaturan awal.');
  };

  const copyGrantSql = () => {
    navigator.clipboard.writeText(grantSqlCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl animate-pulse">
            CP
          </div>
          <span className="text-sm font-semibold text-slate-600">Memuat CentPOS...</span>
        </div>
      </div>
    );
  }

  // Jika belum login, tampilkan layar Login
  if (!currentUser) {
    return <LoginView settings={settings} onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-100">
      {/* Left Sidebar (Desktop Fixed + Mobile Slide-out Drawer) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={0}
        settings={settings}
        cloudStatus={cloudStatus}
        currentUser={currentUser}
        onLogout={handleLogout}
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        isSyncing={isSyncing}
        onManualSync={handleManualSync}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Offline Alert / Sync Notice Banner */}
        {syncNotice && (
          <div className="bg-emerald-600 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between shadow-sm animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>{syncNotice}</span>
            </div>
            <button
              onClick={() => setSyncNotice(null)}
              className="px-2 py-0.5 text-emerald-100 hover:text-white hover:bg-emerald-700 rounded-md transition-colors text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Offline Mode Indicator Banner (Ketika Benar-Benar Putus Internet) */}
        {!isOnline && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2.5 text-xs font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-amber-600 shadow-sm">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 shrink-0 text-slate-950" />
              <span>
                Mode Offline Aktif: Internet tidak terhubung. Kasir tetap bisa jualan normal! Seluruh transaksi disimpan aman di perangkat ({pendingSyncCount} antrean).
              </span>
            </div>
            <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[11px] font-mono shrink-0">
              Otomatis sinkron saat online
            </span>
          </div>
        )}

        {/* Cloud Status Alert Banner (if Supabase permissions are missing) */}
        {cloudStatus === 'error' && (
          <div className="bg-amber-500 text-slate-950 px-4 py-3 border-b border-amber-600 shadow-sm">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-slate-950" />
                <div>
                  <span className="font-bold">Izin Database Supabase Diperlukan (Permission Denied):</span>{' '}
                  <span>Supabase menolak akses tulis karena tabel belum diberi hak akses GRANT.</span>
                </div>
              </div>

              <button
                onClick={copyGrantSql}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors shrink-0"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>SQL Izin Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin SQL Perbaikan Izin</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Main Views */}
        <main className="flex-1 flex flex-col min-w-0">
          {activeTab === 'pos' && (
            <CashierView
              products={products}
              onUpdateProductStock={handleUpdateProductStock}
              onSaveTransaction={handleSaveTransaction}
              settings={settings}
              onSaveSettings={saveSettingsLocally}
              onOpenReceipt={(trx) => setActiveReceipt(trx)}
            />
          )}

          {activeTab === 'products' && (
            <ProductsView
              products={products}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              settings={settings}
              onSaveSettings={saveSettingsLocally}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              transactions={transactions}
              onOpenReceipt={(trx) => setActiveReceipt(trx)}
              settings={settings}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onSaveSettings={saveSettingsLocally}
              onResetData={handleResetData}
            />
          )}

          {activeTab === 'deploy' && <VercelDeployGuide />}
        </main>
      </div>

      {/* Thermal Receipt Print Modal */}
      {activeReceipt && (
        <ReceiptPrint
          transaction={activeReceipt}
          settings={settings}
          onClose={() => setActiveReceipt(null)}
          onNewTransaction={() => setActiveTab('pos')}
        />
      )}
    </div>
  );
}
