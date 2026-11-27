'use client';

import React from 'react';
import { Printer, CheckCircle, X } from 'lucide-react';
import { Transaction, StoreSettings } from '../types/pos';
import { formatCurrency, formatDateTime } from '../utils/format';

interface ReceiptPrintProps {
  transaction: Transaction | null;
  settings: StoreSettings;
  onClose: () => void;
  onNewTransaction?: () => void;
}

export const ReceiptPrint: React.FC<ReceiptPrintProps> = ({
  transaction,
  settings,
  onClose,
  onNewTransaction,
}) => {
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-emerald-50">
          <div className="flex items-center gap-2 text-emerald-800">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-base">Transaksi Berhasil!</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Receipt Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex justify-center">
          {/* Paper Layout (Target for print via #receipt-print-area) */}
          <div
            id="receipt-print-area"
            className="w-full max-w-[340px] bg-white p-5 rounded-lg shadow-sm font-mono text-xs text-slate-800 border border-slate-200"
          >
            {/* Header Toko */}
            <div className="text-center pb-3 border-b border-dashed border-slate-400">
              <h2 className="text-sm font-bold uppercase tracking-wider">{settings.storeName}</h2>
              <p className="text-[11px] text-slate-600 mt-0.5">{settings.address}</p>
              <p className="text-[11px] text-slate-600">Telp: {settings.phone}</p>
            </div>

            {/* Info Transaksi */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>No. Nota:</span>
                <span className="font-semibold">{transaction.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>{formatDateTime(transaction.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{transaction.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span>{transaction.customerName}</span>
              </div>
              {transaction.customerTier && transaction.customerTier !== 'customer' && (
                <div className="flex justify-between text-blue-700 font-semibold">
                  <span>Tipe Harga:</span>
                  <span className="uppercase">{transaction.customerTier === 'agen' ? 'Harga Agen' : 'Harga Member'}</span>
                </div>
              )}
            </div>

            {/* List Barang */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-2 text-[11px]">
              {transaction.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-semibold text-slate-900">{item.productName}</div>
                  <div className="flex justify-between text-slate-600 pl-2">
                    <span>
                      {item.quantity} x {formatCurrency(item.sellPrice)}
                    </span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Perhitungan Total */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(transaction.subtotal)}</span>
              </div>
              {transaction.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Diskon:</span>
                  <span>-{formatCurrency(transaction.discountAmount)}</span>
                </div>
              )}
              {transaction.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span>Pajak (PPN):</span>
                  <span>{formatCurrency(transaction.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-bold pt-1 border-t border-slate-200">
                <span>TOTAL:</span>
                <span>{formatCurrency(transaction.totalAmount)}</span>
              </div>
            </div>

            {/* Pembayaran & Kembalian */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Metode Bayar:</span>
                <span className="font-semibold">{transaction.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Bayar:</span>
                <span>{formatCurrency(transaction.amountPaid)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Kembalian:</span>
                <span>{formatCurrency(transaction.changeAmount)}</span>
              </div>
            </div>

            {/* Footer Struk */}
            <div className="pt-3 text-center text-[10px] text-slate-500 whitespace-pre-line leading-relaxed">
              {settings.receiptFooter}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
          <button
            onClick={() => {
              if (onNewTransaction) onNewTransaction();
              onClose();
            }}
            className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-50 transition-colors"
          >
            Transaksi Baru
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-medium text-sm hover:bg-emerald-700 shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk</span>
          </button>
        </div>
      </div>
    </div>
  );
};
