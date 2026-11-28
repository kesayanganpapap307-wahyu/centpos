'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Settings, 
  Store, 
  FileText, 
  Check, 
  RotateCcw, 
  Save, 
  ShieldCheck,
  Receipt,
  QrCode,
  Upload,
  Trash2,
  Lock,
  Crown,
  Sparkles,
  CreditCard,
  Key,
  Eye,
  EyeOff,
  ExternalLink,
  Info
} from 'lucide-react';
import { StoreSettings } from '../types/pos';

interface SettingsViewProps {
  settings: StoreSettings;
  onSaveSettings: (settings: StoreSettings) => void;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onResetData,
}) => {
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const [isSaved, setIsSaved] = useState(false);
  const [showServerKey, setShowServerKey] = useState(false);
  const [cmsStatus, setCmsStatus] = useState<{
    loading: boolean;
    connected: boolean;
    midtransClientKey?: string;
    hasServerKey?: boolean;
    hasSupabaseCmsConfig?: boolean;
    serverKeyDebug?: string;
    paymentMethods?: { channel_code: string; name: string; provider: string }[];
    features?: { feature_code: string; name: string; price: number }[];
  }>({ loading: true, connected: false });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    const env = formData.midtransIsProduction ? 'production' : 'sandbox';
    setCmsStatus((prev) => ({ ...prev, loading: true }));

    fetch(`/api/payment/cms-config?env=${env}`)
      .then((r) => r.json())
      .then((data) => {
        if (active) {
          setCmsStatus({
            loading: false,
            connected: Boolean(data?.connected),
            midtransClientKey: data?.midtransClientKey,
            hasServerKey: Boolean(data?.hasServerKey),
            hasSupabaseCmsConfig: Boolean(data?.hasSupabaseCmsConfig),
            serverKeyDebug: data?.serverKeyDebug,
            paymentMethods: data?.paymentMethods || [],
            features: data?.features || [],
          });
        }
      })
      .catch(() => {
        if (active) {
          setCmsStatus({ loading: false, connected: false });
        }
      });

    return () => {
      active = false;
    };
  }, [formData.midtransIsProduction]);

  const handleQrisUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Harap pilih file gambar (PNG, JPG, atau WebP).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      alert('Ukuran gambar terlalu besar (maksimal 3 MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormData((prev) => ({ ...prev, qrisImage: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveQris = () => {
    setFormData((prev) => ({ ...prev, qrisImage: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-600" />
            Pengaturan Toko & Kasir
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasi identitas toko, format struk, dan persentase pajak PPN
          </p>
        </div>

        {isSaved && (
          <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-bold animate-in fade-in">
            <Check className="w-4 h-4" />
            Tersimpan!
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identitas Toko */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Store className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">Identitas Toko</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Toko *</label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Kasir Utama</label>
              <input
                type="text"
                value={formData.cashierName}
                onChange={(e) => setFormData({ ...formData, cashierName: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">No. Telepon / WhatsApp</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ukuran Kertas Thermal</label>
              <select
                value={formData.paperSize}
                onChange={(e) =>
                  setFormData({ ...formData, paperSize: e.target.value as '58mm' | '80mm' })
                }
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="58mm">58 mm (Standard Mobile / Bluetooth)</option>
                <option value="80mm">80 mm (Desktop Thermal Printer)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Alamat Toko</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Pajak & Struk */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">Pajak & Format Struk Belanja</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="font-bold text-slate-900 text-sm block">Aktifkan PPN / Pajak</span>
                <span className="text-slate-500 text-xs">
                  Hitung pajak otomatis pada total transaksi di kasir
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableTax}
                  onChange={(e) => setFormData({ ...formData, enableTax: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {formData.enableTax && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Persentase Pajak (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.taxPercent}
                  onChange={(e) => setFormData({ ...formData, taxPercent: Number(e.target.value) })}
                  className="w-32 px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-bold text-emerald-700"
                />
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Catatan Penutup Struk (Footer Message)
              </label>
              <textarea
                rows={3}
                value={formData.receiptFooter}
                onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* QRIS Statis Toko */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <QrCode className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-sm text-slate-900">QRIS Pembayaran Toko (Statis)</h3>
          </div>

          <div className="space-y-3 text-xs">
            <p className="text-slate-500">
              Upload foto kode QRIS toko Anda (BCA, GoPay, Dana, OVO, ShopeePay, Bank Mandiri, dll). Gambar ini akan otomatis muncul di layar kasir saat pelanggan memilih pembayaran QRIS agar bisa langsung di-scan.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              {/* Preview Box */}
              <div className="w-36 h-36 bg-white rounded-xl border border-slate-300 flex items-center justify-center p-2 shadow-xs shrink-0 overflow-hidden relative group">
                {formData.qrisImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={formData.qrisImage}
                    alt="QRIS Toko"
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-center p-2 text-slate-400">
                    <QrCode className="w-12 h-12 mx-auto stroke-1 mb-1 text-slate-300" />
                    <span className="text-[10px] block leading-tight font-medium">Belum ada QRIS</span>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="space-y-2.5 flex-1 w-full text-center sm:text-left">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleQrisUpload}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-xl font-bold text-xs transition-all shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{formData.qrisImage ? 'Ganti Foto QRIS' : 'Upload Foto QRIS Toko'}</span>
                  </button>

                  {formData.qrisImage && (
                    <button
                      type="button"
                      onClick={handleRemoveQris}
                      className="flex items-center gap-1 px-3 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl font-semibold text-xs transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Foto</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-500">
                  Format yang didukung: <b>PNG, JPG, WebP</b> (Maksimal 3 MB). Pastikan barcode QRIS terlihat tajam dan jelas agar kamera pelanggan mudah membaca kode.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Manajemen Modul & Lisensi Add-on */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Crown className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">Manajemen Modul &amp; Lisensi Add-On</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-4 bg-gradient-to-r from-slate-50 to-indigo-50/40 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">Modul Multi-Tier Pricing</span>
                  {formData.enableMultiTierPricing ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>AKTIF (Lisensi Terpasang)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
                      <Lock className="w-3 h-3" />
                      <span>TERKUNCI (Belum Dibeli)</span>
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-[11px] max-w-lg">
                  Memungkinkan penetapan tingkatan harga jual berbeda untuk <b>Harga Agen/Reseller</b> dan <b>Harga Member</b> di kasir dan data produk.
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      enableMultiTierPricing: !prev.enableMultiTierPricing,
                    }))
                  }
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${
                    formData.enableMultiTierPricing
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                  }`}
                >
                  {formData.enableMultiTierPricing ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Kunci Kembali (Uji Coba Kunci)</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Aktifkan Lisensi Modul</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Konfigurasi Payment Gateway Midtrans */}
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-800 text-xs">
                    Konfigurasi Payment Gateway Otomatis (Midtrans Snap)
                  </span>
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    (cmsStatus.connected && cmsStatus.hasServerKey) ||
                    (formData.midtransClientKey && formData.midtransServerKey)
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {(cmsStatus.connected && cmsStatus.hasServerKey) ||
                  (formData.midtransClientKey && formData.midtransServerKey)
                    ? '✓ Terkonfigurasi'
                    : '⚠ Belum Lengkap'}
                </span>
              </div>

              {/* Status Sinkronisasi CentPay CMS */}
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-950">
                    Sinkronisasi CentPay CMS (cent-cms.vercel.app)
                  </span>
                  {cmsStatus.loading ? (
                    <span className="text-indigo-600 font-medium">Memeriksa...</span>
                  ) : cmsStatus.connected ? (
                    <span className="text-emerald-700 font-bold">✓ Terhubung</span>
                  ) : (
                    <span className="text-rose-600 font-bold">✕ Tidak Terhubung</span>
                  )}
                </div>

                {!cmsStatus.loading && cmsStatus.connected && (
                  <div className="space-y-1 text-indigo-900">
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <span>
                        Client Key CMS:{' '}
                        <b className="font-mono">
                          {cmsStatus.midtransClientKey || '(Belum diatur)'}
                        </b>
                      </span>
                      <span>
                        Server Key (`app_gateaway_providers`):{' '}
                        {cmsStatus.hasServerKey ? (
                          <b className="text-emerald-700">✓ Tersedia di Server</b>
                        ) : (
                          <b className="text-amber-700">
                            ⚠ Belum ditemukan ({cmsStatus.serverKeyDebug || 'set CENT_CMS_SUPABASE_URL & CENT_CMS_SUPABASE_SERVICE_KEY'})
                          </b>
                        )}
                      </span>
                    </div>
                    {cmsStatus.paymentMethods && cmsStatus.paymentMethods.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        <span className="text-indigo-700">Metode Aktif:</span>
                        {cmsStatus.paymentMethods.map((m) => (
                          <span
                            key={m.channel_code}
                            className="px-2 py-0.5 bg-white border border-indigo-200 rounded-md text-[10px] font-semibold text-indigo-800"
                          >
                            {m.name} ({m.provider})
                          </span>
                        ))}
                      </div>
                    )}
                    {cmsStatus.features && cmsStatus.features.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        <span className="text-indigo-700">Harga Fitur CMS:</span>
                        {cmsStatus.features.map((f) => (
                          <span
                            key={f.feature_code}
                            className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-md text-[10px] font-semibold text-emerald-800"
                          >
                            {f.name}: Rp {Number(f.price).toLocaleString('id-ID')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <p className="text-slate-500 text-[11px] leading-relaxed">
                Konfigurasi utama diambil otomatis dari <b>CentPay CMS</b>. Kolom manual di bawah ini bersifat opsional sebagai cadangan (*fallback*) apabila environment Supabase CMS belum diisi.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Mode Environment: Sandbox / Production */}
                <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl gap-2">
                  <div>
                    <span className="font-semibold text-slate-800 block text-xs">
                      Mode Transaksi Midtrans
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Pilih <b>Sandbox</b> untuk uji coba tanpa uang asli, atau <b>Production</b> untuk menerima pembayaran riil.
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-white p-1 border border-slate-200 rounded-lg shrink-0">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, midtransIsProduction: false })}
                      className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                        !formData.midtransIsProduction
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Sandbox (Test)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, midtransIsProduction: true })}
                      className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                        formData.midtransIsProduction
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Production (Live)
                    </button>
                  </div>
                </div>

                {/* Client Key */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Midtrans Client Key *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={formData.midtransIsProduction ? 'Mid-client-xxxxxxxx' : 'SB-Mid-client-xxxxxxxx'}
                      value={formData.midtransClientKey || ''}
                      onChange={(e) => setFormData({ ...formData, midtransClientKey: e.target.value.trim() })}
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                    <Key className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                {/* Server Key */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Midtrans Server Key *
                  </label>
                  <div className="relative">
                    <input
                      type={showServerKey ? 'text' : 'password'}
                      placeholder={formData.midtransIsProduction ? 'Mid-server-xxxxxxxx' : 'SB-Mid-server-xxxxxxxx'}
                      value={formData.midtransServerKey || ''}
                      onChange={(e) => setFormData({ ...formData, midtransServerKey: e.target.value.trim() })}
                      className="w-full pl-8 pr-9 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                    <Key className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <button
                      type="button"
                      onClick={() => setShowServerKey(!showServerKey)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showServerKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Harga Lisensi Modul */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Harga Modul Lisensi Multi-Tier (Rupiah)
                  </label>
                  <div className="relative max-w-xs">
                    <span className="absolute left-3 top-2 font-bold text-slate-400 text-xs">Rp</span>
                    <input
                      type="number"
                      min={10000}
                      step={5000}
                      value={formData.multiTierModulePrice || 99000}
                      onChange={(e) => setFormData({ ...formData, multiTierModulePrice: Number(e.target.value) })}
                      className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Nominal ini yang akan ditagihkan ke pembeli modul saat checkout Midtrans.
                  </span>
                </div>
              </div>

              {/* Info Bantuan Midtrans */}
              <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-start gap-2.5 text-[11px] text-indigo-900">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p>
                    Dapatkan Client Key & Server Key melalui portal resmi Midtrans di menu: <b>Settings &gt; Access Keys</b>.
                  </p>
                  <a
                    href="https://dashboard.midtrans.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-indigo-700 hover:text-indigo-800 underline"
                  >
                    <span>Buka Dashboard Midtrans</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => {
              if (
                confirm(
                  'Yakin ingin me-reset seluruh data kembali ke data demo bawaan (produk & transaksi)?'
                )
              ) {
                onResetData();
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl font-semibold transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset ke Data Demo Awal</span>
          </button>

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </form>
    </div>
  );
};
