'use client';

import React, { useState } from 'react';
import { 
  CloudUpload, 
  ExternalLink, 
  CheckCircle2, 
  Copy, 
  Check, 
  GitBranch, 
  Database, 
  Smartphone, 
  Printer, 
  Layers,
  Terminal,
  Zap
} from 'lucide-react';

export const VercelDeployGuide: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const gitCommands = `cd C:\\Users\\user\\Develop\\CentPos
git add .
git commit -m "feat: initial CentPOS application ready for Vercel"
# Buat repository baru di GitHub (misal: CentPos), lalu jalankan:
git remote add origin https://github.com/USERNAME_ANDA/CentPos.git
git branch -M main
git push -u origin main`;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              100% Vercel & Cloud Ready
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Panduan Hosting CentPOS di Vercel
            </h2>
            <p className="text-sm text-emerald-100 leading-relaxed">
              Aplikasi CentPOS ini sudah dikonfigurasi secara lengkap untuk Next.js App Router dan Turbopack. Anda bisa langsung mempublikasikannya ke Vercel secara <b>gratis</b> dan dapat diakses dari mana saja via internet.
            </p>
          </div>

          <a
            href="https://vercel.com/new"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-emerald-800 font-bold text-sm shadow-lg hover:bg-emerald-50 hover:scale-105 transition-all shrink-0"
          >
            <span>Buka Vercel Dashboard</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Step by Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Step 1 */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-black text-lg flex items-center justify-center mb-4">
              1
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">
              Push ke GitHub
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Simpan source code aplikasi ini ke repository GitHub Anda (bisa public atau private).
            </p>
          </div>
          <div className="text-[11px] font-semibold text-slate-500 bg-slate-100 p-2.5 rounded-xl flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-slate-800" />
            <span>GitHub Repository</span>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center mb-4">
              2
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">
              Import di Vercel
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Login ke <b>vercel.com</b> dengan akun GitHub, klik <b>&quot;Add New... &gt; Project&quot;</b>, lalu pilih repository <b>CentPos</b> dan klik <b>Deploy</b>.
            </p>
          </div>
          <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 p-2.5 rounded-xl flex items-center gap-2">
            <CloudUpload className="w-4 h-4 text-emerald-600" />
            <span>Otomatis Build & Deploy</span>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white font-black text-lg flex items-center justify-center mb-4">
              3
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">
              Buka di Kasir / Tablet
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Aplikasi Anda langsung aktif di link domain <code>https://centpos.vercel.app</code>. Bisa diakses dari Laptop kasir, Tablet Android, atau HP.
            </p>
          </div>
          <div className="text-[11px] font-semibold text-teal-800 bg-teal-50 p-2.5 rounded-xl flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-teal-600" />
            <span>Multi-Device Ready</span>
          </div>
        </div>
      </div>

      {/* Terminal Code Box */}
      <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-lg border border-slate-800">
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-mono font-medium text-slate-200">
              Terminal: Push ke GitHub
            </span>
          </div>
          <button
            onClick={() => copyToClipboard(gitCommands, 1)}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
          >
            {copiedIndex === 1 ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Script</span>
              </>
            )}
          </button>
        </div>
        <div className="p-5 font-mono text-xs text-emerald-300 leading-relaxed overflow-x-auto whitespace-pre">
          {gitCommands}
        </div>
      </div>

      {/* Features Overview */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-600" />
          Keunggulan Arsitektur CentPOS
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Offline-Tolerant & Local Persistence
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Seluruh data produk, riwayat transaksi, dan pengaturan otomatis tersimpan di browser (LocalStorage), sehingga kasir tetap bisa beroperasi meski koneksi internet sedang lambat atau putus.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <Printer className="w-4 h-4 text-emerald-600" />
              Struk Belanja Thermal 58mm / 80mm
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Mendukung printer thermal kasir (USB / Bluetooth / WiFi). Saat tombol Cetak Struk ditekan, hanya struk yang dicetak dengan format thermal kertas presisi tanpa elemen navigasi halaman.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <Database className="w-4 h-4 text-emerald-600" />
              Siap Disambungkan ke Supabase (PostgreSQL)
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Jika Anda ingin menyinkronkan data antar banyak cabang atau kasir, struktur data CentPOS sudah siap ditautkan ke database cloud Supabase dengan schema SQL terlampir.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              PWA (Progressive Web App) Compatible
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Bisa langsung di-add to home screen pada smartphone atau di-install di Windows Chrome / Edge sehingga terbuka seperti aplikasi kasir native layar penuh.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
