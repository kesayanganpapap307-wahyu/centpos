'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { PortalView } from '../components/PortalView';
import { CashierView } from '../components/CashierView';
import { ProductsView } from '../components/ProductsView';
import { ReportsView } from '../components/ReportsView';
import { SettingsView } from '../components/SettingsView';
import { VercelDeployGuide } from '../components/VercelDeployGuide';
import { ReceiptPrint } from '../components/ReceiptPrint';
import { Product, Transaction, StoreSettings } from '../types/pos';
import { initialProducts, initialStoreSettings } from '../data/initialData';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'portal' | 'pos' | 'products' | 'reports' | 'settings' | 'deploy'>('portal');
  const [isClient, setIsClient] = useState(false);

  // Core Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(initialStoreSettings);

  // Active Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState<Transaction | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    setIsClient(true);
    try {
      const savedProducts = localStorage.getItem('centpos_products');
      if (savedProducts) {
        setProducts(JSON.parse(savedProducts));
      } else {
        setProducts(initialProducts);
        localStorage.setItem('centpos_products', JSON.stringify(initialProducts));
      }

      const savedTransactions = localStorage.getItem('centpos_transactions');
      if (savedTransactions) {
        setTransactions(JSON.parse(savedTransactions));
      } else {
        // Initial sample transaction for demonstration
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
    } catch (e) {
      console.error('Error loading data from localStorage', e);
      setProducts(initialProducts);
      setSettings(initialStoreSettings);
    }
  }, []);

  // Save to localStorage when states change
  const saveProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    try {
      localStorage.setItem('centpos_products', JSON.stringify(newProducts));
    } catch (e) {
      console.error(e);
    }
  };

  const saveTransactions = (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
    try {
      localStorage.setItem('centpos_transactions', JSON.stringify(newTransactions));
    } catch (e) {
      console.error(e);
    }
  };

  const saveSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('centpos_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.error(e);
    }
  };

  // Stock deduction upon cashier checkout
  const handleUpdateProductStock = (productId: string, quantityDeducted: number) => {
    setProducts((prev) => {
      const updated = prev.map((p) => {
        if (p.id === productId) {
          const newStock = Math.max(0, p.stock - quantityDeducted);
          return { ...p, stock: newStock };
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
  };

  // Quick add stock (e.g. from portal alert)
  const handleQuickAddStock = (productId: string, amount: number) => {
    setProducts((prev) => {
      const updated = prev.map((p) => {
        if (p.id === productId) {
          return { ...p, stock: p.stock + amount };
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
  };

  // Save new transaction
  const handleSaveTransaction = (transaction: Transaction) => {
    const updated = [transaction, ...transactions];
    saveTransactions(updated);
  };

  // Products CRUD
  const handleAddProduct = (product: Product) => {
    const updated = [product, ...products];
    saveProducts(updated);
  };

  const handleUpdateProduct = (product: Product) => {
    const updated = products.map((p) => (p.id === product.id ? product : p));
    saveProducts(updated);
  };

  const handleDeleteProduct = (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    saveProducts(updated);
  };

  // Reset to initial demo data
  const handleResetData = () => {
    saveProducts(initialProducts);
    saveTransactions([]);
    saveSettings(initialStoreSettings);
    alert('Data toko dan transaksi berhasil di-reset ke pengaturan awal.');
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={0}
        settings={settings}
      />

      {/* Main Views */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'portal' && (
          <PortalView
            onNavigate={(tab) => setActiveTab(tab)}
            products={products}
            transactions={transactions}
            settings={settings}
            onOpenReceipt={(trx) => setActiveReceipt(trx)}
            onQuickAddStock={handleQuickAddStock}
          />
        )}

        {activeTab === 'pos' && (
          <CashierView
            products={products}
            onUpdateProductStock={handleUpdateProductStock}
            onSaveTransaction={handleSaveTransaction}
            settings={settings}
            onOpenReceipt={(trx) => setActiveReceipt(trx)}
          />
        )}

        {activeTab === 'products' && (
          <ProductsView
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
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
            onSaveSettings={saveSettings}
            onResetData={handleResetData}
          />
        )}

        {activeTab === 'deploy' && <VercelDeployGuide />}
      </main>

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
