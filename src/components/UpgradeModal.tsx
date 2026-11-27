'use client';

import React from 'react';
import { Lock, Sparkles, Check, Crown, MessageSquare, ShieldCheck, X } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: () => void;
  storeName?: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  onUnlock,
  storeName,
}) => {
  if (!isOpen) return null;

  const features = [
    'Tentukan Harga Khusus untuk Agen, Reseller, & Grosir',
    'Tingkatan Harga Spesial untuk Member VIP Toko',
    'Switch harga instan 1-klik di layar kasir POS saat checkout',
    'Kalkulasi otomatis margin laba & diskon bertingkat',
    'Cetak struk belanja resmi dengan label Tipe Harga',
    'Meningkatkan omset grosir dan loyalitas langganan toko',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[92vh] overflow-hidden border border-slate-100 flex flex-col relative animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Premium Header */}
        <div className="bg-gradient-to-br from-indigo-700 via-blue-700 to-indigo-900 p-5 sm:p-6 text-white text-center relative overflow-hidden shrink-0">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -left-8 -top-8 w-32 h-32 bg-blue-400/20 rounded-full blur-xl pointer-events-none" />

          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center text-amber-300 mb-2.5 shadow-inner border border-white/20">
            <Crown className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow-md" />
          </div>

          <div className="inline-flex items-center gap-1 bg-amber-400/20 text-amber-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-300/30 mb-2 uppercase tracking-wider">
            <Lock className="w-3 h-3" />
            <span>Modul Add-On Premium</span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold tracking-tight">Multi-Tier Pricing</h3>
          <p className="text-blue-100 text-xs mt-1 max-w-xs mx-auto">
            Buka kunci fitur harga khusus untuk Agen, Reseller, dan Member Toko Anda.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1 overscroll-contain">
          {/* Benefit Checklist */}
          <div className="space-y-2.5">
            <span className="font-bold text-slate-800 block text-xs">
              Keuntungan Menggunakan Modul Ini:
            </span>
            <div className="space-y-2">
              {features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-slate-600">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span className="leading-tight">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Box */}
          <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider block">
                Biaya Modul Lisensi
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-extrabold text-slate-900">Rp 99.000</span>
                <span className="text-[10px] text-slate-500 font-medium">/ Sekali Beli (Permanen)</span>
              </div>
            </div>
            <div className="bg-blue-600 text-white p-2 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            {/* Simulasi Beli / Aktivasi Langsung (Untuk Owner & Demo) */}
            <button
              type="button"
              onClick={() => {
                onUnlock();
                onClose();
              }}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Beli &amp; Aktifkan Modul Sekarang (Instant)</span>
            </button>

            {/* Hubungi Sales via WhatsApp */}
            <a
              href="https://wa.me/6281234567890?text=Halo%20CentPOS,%20saya%20ingin%20membeli%20lisensi%20Modul%20Multi-Tier%20Pricing%20(Harga%20Agen%20&%20Member)"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Beli via WhatsApp / Sales</span>
            </a>
          </div>

          <p className="text-[10px] text-center text-slate-400">
            * Anda dapat menonaktifkan atau mengaktifkan kembali modul ini sewaktu-waktu di menu <b>Pengaturan</b>.
          </p>
        </div>
      </div>
    </div>
  );
};
