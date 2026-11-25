'use client';

import React, { useMemo } from 'react';
import { 
  BarChart3, 
  DollarSign, 
  Receipt, 
  ShoppingBag, 
  TrendingUp, 
  Printer, 
  Download, 
  Calendar,
  CreditCard,
  Banknote,
  QrCode
} from 'lucide-react';
import { Transaction, StoreSettings } from '../types/pos';
import { formatCurrency, formatDateTime } from '../utils/format';

interface ReportsViewProps {
  transactions: Transaction[];
  onOpenReceipt: (transaction: Transaction) => void;
  settings: StoreSettings;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  transactions,
  onOpenReceipt,
  settings,
}) => {
  // Metrics calculation
  const totalRevenue = useMemo(() => {
    return transactions.reduce((acc, t) => acc + t.totalAmount, 0);
  }, [transactions]);

  const totalTransactionsCount = transactions.length;

  const averageBasket = totalTransactionsCount > 0 ? totalRevenue / totalTransactionsCount : 0;

  // Breakdown by payment method
  const paymentBreakdown = useMemo(() => {
    const summary: Record<string, { count: number; total: number }> = {
      TUNAI: { count: 0, total: 0 },
      QRIS: { count: 0, total: 0 },
      TRANSFER: { count: 0, total: 0 },
    };
    transactions.forEach((t) => {
      const method = t.paymentMethod || 'TUNAI';
      if (!summary[method]) summary[method] = { count: 0, total: 0 };
      summary[method].count += 1;
      summary[method].total += t.totalAmount;
    });
    return summary;
  }, [transactions]);

  // Export to CSV
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert('Belum ada transaksi untuk diexport.');
      return;
    }

    const headers = ['No Invoice', 'Tanggal & Waktu', 'Kasir', 'Pelanggan', 'Metode Bayar', 'Subtotal', 'Diskon', 'Pajak', 'Total Bayar'];
    const rows = transactions.map((t) => [
      t.invoiceNumber,
      `"${new Date(t.createdAt).toLocaleString('id-ID')}"`,
      `"${t.cashierName}"`,
      `"${t.customerName}"`,
      t.paymentMethod,
      t.subtotal,
      t.discountAmount,
      t.taxAmount,
      t.totalAmount,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Transaksi_CentPOS_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            Laporan & Riwayat Penjualan
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pantau arus kas, rincian omset kasir, dan cetak ulang nota transaksi
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold shadow-xs transition-colors"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          <span>Export Excel/CSV</span>
        </button>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Omset
            </p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
              {formatCurrency(totalRevenue)}
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Transaksi
            </p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
              {totalTransactionsCount} Struk
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Rata-rata Nota
            </p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
              {formatCurrency(averageBasket)}
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pembayaran QRIS
            </p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
              {formatCurrency(paymentBreakdown.QRIS?.total || 0)}
            </h3>
          </div>
        </div>
      </div>

      {/* Payment methods breakdown bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <span className="font-bold text-slate-700">Rincian Metode Pembayaran:</span>
        <div className="flex flex-wrap gap-4">
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <Banknote className="w-4 h-4 text-emerald-600" />
            Tunai: <b className="text-slate-900">{formatCurrency(paymentBreakdown.TUNAI?.total || 0)}</b> ({paymentBreakdown.TUNAI?.count || 0})
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <QrCode className="w-4 h-4 text-teal-600" />
            QRIS: <b className="text-slate-900">{formatCurrency(paymentBreakdown.QRIS?.total || 0)}</b> ({paymentBreakdown.QRIS?.count || 0})
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <CreditCard className="w-4 h-4 text-blue-600" />
            Transfer: <b className="text-slate-900">{formatCurrency(paymentBreakdown.TRANSFER?.total || 0)}</b> ({paymentBreakdown.TRANSFER?.count || 0})
          </span>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">Riwayat Transaksi Terakhir</h3>
          <span className="text-xs text-slate-500">Menampilkan {transactions.length} transaksi</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">No. Invoice</th>
                <th className="px-4 py-3.5">Waktu Transaksi</th>
                <th className="px-4 py-3.5">Pelanggan</th>
                <th className="px-4 py-3.5 text-center">Item</th>
                <th className="px-4 py-3.5">Metode</th>
                <th className="px-4 py-3.5 text-right">Total Transaksi</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Belum ada transaksi tersimpan. Lakukan transaksi pertama di menu Kasir!
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-800">
                      {t.invoiceNumber}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {formatDateTime(t.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">
                      {t.customerName}
                    </td>
                    <td className="px-4 py-3.5 text-center font-semibold text-slate-600">
                      {t.items.reduce((a, b) => a + b.quantity, 0)} item
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold text-[10px] text-slate-700">
                        {t.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-extrabold text-emerald-700 text-sm">
                      {formatCurrency(t.totalAmount)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => onOpenReceipt(t)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak Ulang</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
