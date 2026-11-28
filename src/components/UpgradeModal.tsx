'use client';

import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Sparkles, 
  Check, 
  Crown, 
  MessageSquare, 
  ShieldCheck, 
  X, 
  CreditCard, 
  Loader2, 
  AlertCircle,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { StoreSettings } from '../types/pos';
import { formatCurrency } from '../utils/format';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: () => void;
  settings?: StoreSettings;
  storeName?: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  onUnlock,
  settings,
  storeName,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [cmsConfig, setCmsConfig] = useState<{
    connected: boolean;
    midtransClientKey?: string;
    hasServerKey?: boolean;
    paymentMethods?: { channel_code: string; name: string; provider: string }[];
  } | null>(null);

  const price = settings?.multiTierModulePrice || 99000;
  const isProduction = Boolean(settings?.midtransIsProduction);
  const clientKey =
    cmsConfig?.midtransClientKey?.trim() ||
    settings?.midtransClientKey?.trim() ||
    '';
  const serverKey = settings?.midtransServerKey?.trim() || '';
  const hasServerKey = Boolean(cmsConfig?.hasServerKey || serverKey);
  const isGatewayConfigured = Boolean(clientKey && hasServerKey);

  // Ambil konfigurasi terbaru dari CentPay CMS saat modal dibuka
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    const env = isProduction ? 'production' : 'sandbox';

    fetch(`/api/payment/cms-config?env=${env}`)
      .then((r) => r.json())
      .then((data) => {
        if (active && data) {
          setCmsConfig(data);
        }
      })
      .catch((err) => {
        console.error('Gagal memuat config CentPay CMS:', err);
      });

    return () => {
      active = false;
    };
  }, [isOpen, isProduction]);

  // Load Midtrans Snap JS dynamically
  useEffect(() => {
    if (!isOpen) {
      setErrorMessage(null);
      setIsSuccess(false);
      setIsLoading(false);
      return;
    }

    const snapScriptUrl = isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';

    // Remove existing script if mode changed
    const existingScript = document.getElementById('midtrans-snap-script') as HTMLScriptElement | null;
    if (existingScript) {
      if (existingScript.src === snapScriptUrl && existingScript.getAttribute('data-client-key') === clientKey) {
        return;
      }
      existingScript.remove();
    }

    if (clientKey) {
      const script = document.createElement('script');
      script.id = 'midtrans-snap-script';
      script.src = snapScriptUrl;
      script.setAttribute('data-client-key', clientKey);
      script.async = true;
      document.body.appendChild(script);
    }
  }, [isOpen, clientKey, isProduction]);

  if (!isOpen) return null;

  const features = [
    'Tentukan Harga Khusus untuk Agen, Reseller, & Grosir',
    'Tingkatan Harga Spesial untuk Member VIP Toko',
    'Switch harga instan 1-klik di layar kasir POS saat checkout',
    'Kalkulasi otomatis margin laba & diskon bertingkat',
    'Cetak struk belanja resmi dengan label Tipe Harga',
    'Meningkatkan omset grosir dan loyalitas langganan toko',
  ];

  const handlePayWithMidtrans = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/payment/midtrans/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: `CENTPOS-TIER-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          grossAmount: price,
          serverKey: serverKey,
          isProduction: isProduction,
          storeName: storeName || settings?.storeName || 'CentPOS User',
          customerPhone: settings?.phone || '081234567890',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.token) {
        throw new Error(data.error || 'Gagal membuat sesi pembayaran Midtrans.');
      }

      const snap = (window as any).snap;

      if (!snap || typeof snap.pay !== 'function') {
        // Fallback jika popup snap belum termuat sempurna: arahkan ke redirect_url jika tersedia
        if (data.redirect_url) {
          window.open(data.redirect_url, '_blank');
          return;
        }
        throw new Error('Script Snap Midtrans belum siap. Periksa koneksi internet atau Client Key Anda.');
      }

      snap.pay(data.token, {
        onSuccess: (result: any) => {
          console.log('Midtrans Payment Success:', result);
          setIsSuccess(true);
          onUnlock();
          setTimeout(() => {
            onClose();
          }, 2500);
        },
        onPending: (result: any) => {
          console.log('Midtrans Payment Pending:', result);
          alert('Pembayaran Anda sedang diproses. Modul akan otomatis aktif begitu pembayaran selesai diverifikasi.');
        },
        onError: (result: any) => {
          console.error('Midtrans Payment Error:', result);
          setErrorMessage('Pembayaran gagal atau terjadi kendala dari pihak penyedia pembayaran.');
        },
        onClose: () => {
          console.log('Customer closed Snap modal without finishing payment');
        },
      });
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Terjadi kesalahan saat memproses pembayaran.');
    } finally {
      setIsLoading(false);
    }
  };

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
          {/* Success Banner */}
          {isSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2 animate-in zoom-in-95">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-emerald-900 text-sm">Pembayaran Berhasil!</h4>
              <p className="text-emerald-700 text-xs">
                Modul Multi-Tier Pricing telah aktif secara permanen di toko Anda.
              </p>
            </div>
          )}

          {/* Benefit Checklist */}
          {!isSuccess && (
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
          )}

          {/* Pricing Box */}
          <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider block">
                Biaya Modul Lisensi
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-extrabold text-slate-900">
                  {formatCurrency(price)}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">/ Sekali Beli (Permanen)</span>
              </div>
            </div>
            <div className="bg-blue-600 text-white p-2 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-snug">
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* CentPay CMS Sync Status */}
          {cmsConfig?.connected && (
            <div className="p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between text-[11px]">
              <span className="font-semibold text-indigo-900">
                ✓ Tersinkron dengan CentPay CMS
              </span>
              <span className="text-indigo-700 font-medium">
                {isProduction ? 'Production' : 'Sandbox'}
              </span>
            </div>
          )}

          {/* Warning if gateway not configured */}
          {!isGatewayConfigured && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 text-amber-900 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-800">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Konfigurasi Midtrans Belum Lengkap</span>
              </div>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Pastikan <b>CENT_CMS_SUPABASE_URL</b> &amp; <b>CENT_CMS_SUPABASE_SERVICE_KEY</b> sudah diatur di Vercel, atau isi Client Key &amp; Server Key manual di menu <b>Pengaturan</b>.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            {/* Tombol Utama: Bayar Otomatis via Midtrans Snap */}
            {isGatewayConfigured ? (
              <button
                type="button"
                onClick={handlePayWithMidtrans}
                disabled={isLoading || isSuccess}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 active:scale-98 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Menghubungi Midtrans...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 text-amber-300" />
                    <span>
                      Bayar Sekarang via Midtrans ({isProduction ? 'Live' : 'Sandbox'})
                    </span>
                  </>
                )}
              </button>
            ) : null}

            {/* Tombol Simulasi Beli / Aktivasi Langsung (Untuk Owner & Demo) */}
            <button
              type="button"
              onClick={() => {
                onUnlock();
                onClose();
              }}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Simulasi Beli / Buka Kunci Instan (Owner &amp; Demo)</span>
            </button>

            {/* Hubungi Sales via WhatsApp */}
            <a
              href={`https://wa.me/6281234567890?text=Halo%20CentPOS,%20saya%20ingin%20membeli%20lisensi%20Modul%20Multi-Tier%20Pricing%20seharga%20${encodeURIComponent(formatCurrency(price))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Beli via WhatsApp / Sales</span>
            </a>
          </div>

          <p className="text-[10px] text-center text-slate-400">
            * Pembayaran didukung oleh Midtrans (QRIS, VA BCA/Mandiri/BRI/BNI, GoPay, ShopeePay).
          </p>
        </div>
      </div>
    </div>
  );
};
