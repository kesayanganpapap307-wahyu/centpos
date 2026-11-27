'use client';

import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  User, 
  KeyRound, 
  ShieldCheck, 
  Delete, 
  ArrowRight, 
  AlertCircle,
  Store,
  UserPlus,
  CheckCircle2
} from 'lucide-react';
import { AuthUser, StoreSettings } from '../types/pos';

interface LoginViewProps {
  settings: StoreSettings;
  onLogin: (user: AuthUser) => void;
}

// Akun default sistem
export const DEFAULT_USERS: (AuthUser & { password?: string })[] = [
  {
    id: 'user-owner',
    name: 'Wahyu (Owner)',
    username: 'admin',
    role: 'owner',
    pin: '1234',
    password: 'admin',
  },
  {
    id: 'user-cashier-1',
    name: 'Kasir Utama',
    username: 'kasir',
    role: 'cashier',
    pin: '0000',
    password: 'kasir',
  },
];

export const LoginView: React.FC<LoginViewProps> = ({ settings, onLogin }) => {
  // Mode Sign In vs Sign Up
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Tab Sign In: 'pin' | 'password'
  const [tab, setTab] = useState<'pin' | 'password'>('password');
  
  // State Sign In PIN
  const [pin, setPin] = useState('');
  
  // State Sign In Password
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // State Sign Up Form
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regRole, setRegRole] = useState<'owner' | 'cashier'>('cashier');
  
  // List user terdaftar (termasuk dari localStorage)
  const [allUsers, setAllUsers] = useState<(AuthUser & { password?: string })[]>(DEFAULT_USERS);

  // Status pesan
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load custom users from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('centpos_registered_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setAllUsers([...DEFAULT_USERS, ...parsed]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Handle Numpad input (PIN Sign In)
  const handleNumClick = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError(null);
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setPin('');
    setError(null);
  };

  // Verifikasi PIN
  const verifyPin = (pinToTest: string) => {
    const matched = allUsers.find((u) => u.pin === pinToTest);
    if (matched) {
      onLogin(matched);
    } else {
      setError('PIN tidak valid. Coba PIN: 1234 (Owner) atau 0000 (Kasir)');
      setTimeout(() => setPin(''), 600);
    }
  };

  // Verifikasi Username/Password Sign In
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = allUsers.find(
      (u) =>
        u.username.toLowerCase() === username.trim().toLowerCase() &&
        (u.password === password || u.pin === password)
    );

    if (matched) {
      onLogin(matched);
    } else {
      setError('Username atau Password salah.');
    }
  };

  // Handle Registrasi Akun Baru (Sign Up)
  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUser = regUsername.trim().toLowerCase();
    const trimmedName = regName.trim();
    const trimmedPin = regPin.trim();

    if (!trimmedName || !trimmedUser || !trimmedPin) {
      setError('Semua kolom pendaftaran wajib diisi.');
      return;
    }

    if (allUsers.some((u) => u.username.toLowerCase() === trimmedUser)) {
      setError(`Username "${trimmedUser}" sudah terdaftar. Silakan gunakan username lain.`);
      return;
    }

    const newUser: AuthUser & { password?: string } = {
      id: `user-${Date.now()}`,
      name: trimmedName,
      username: trimmedUser,
      role: regRole,
      pin: trimmedPin,
      password: trimmedPin,
    };

    try {
      const saved = localStorage.getItem('centpos_registered_users');
      const existing = saved ? JSON.parse(saved) : [];
      const updated = [...existing, newUser];
      localStorage.setItem('centpos_registered_users', JSON.stringify(updated));
      setAllUsers([...DEFAULT_USERS, ...updated]);
    } catch (err) {
      console.error(err);
    }

    setSuccess(`Akun "${trimmedName}" berhasil dibuat! Masuk sekarang...`);
    setTimeout(() => {
      onLogin(newUser);
    }, 800);
  };

  // Quick Login Preset
  const handleQuickLogin = (user: typeof DEFAULT_USERS[0]) => {
    onLogin(user);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 select-none">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 -z-10 pointer-events-none" />

      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        {/* Header Toko */}
        <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center text-white font-bold text-2xl mb-3 shadow-inner border border-white/20">
            CP
          </div>

          <h1 className="text-xl font-bold tracking-tight">{settings.storeName}</h1>
          <p className="text-emerald-100 text-xs mt-1 flex items-center justify-center gap-1.5">
            <Store className="w-3.5 h-3.5" />
            <span>Sistem Kasir Point of Sale (POS)</span>
          </p>
        </div>

        {/* ============================================================ */}
        {/* KONDISI 1: FORM PENDAFTARAN AKUN (SIGN UP)                   */}
        {/* ============================================================ */}
        {isSignUp ? (
          <div className="p-6 space-y-4">
            <div className="text-center pb-1">
              <h2 className="text-base font-bold text-slate-900 flex items-center justify-center gap-1.5">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                <span>Buat Akun Kasir Baru (Sign Up)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftarkan akun kasir atau pengelola toko Anda
              </p>
            </div>

            {/* Error & Success Alerts */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSignUpSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lengkap Kasir / Pemilik *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: budi"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  PIN / Kata Sandi (4–6 Digit) *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Contoh: 1234"
                  value={regPin}
                  onChange={(e) => setRegPin(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Peran Akun (Role)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole('cashier')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      regRole === 'cashier'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🛒 Kasir
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole('owner')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      regRole === 'owner'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    👑 Owner / Admin
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 mt-4"
              >
                <span>Daftar & Masuk Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Back to Sign In button */}
            <div className="text-center pt-2 text-xs text-slate-500 border-t border-slate-100">
              <span>Already have an account? </span>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setError(null);
                  setSuccess(null);
                }}
                className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-all"
              >
                Sign In
              </button>
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* KONDISI 2: FORM MASUK (SIGN IN)                              */
          /* ============================================================ */
          <>
            {/* Tab Pemilih Mode Login */}
            <div className="flex border-b border-slate-100 bg-slate-50/70 p-1.5 gap-1 text-xs font-semibold">
              <button
                onClick={() => {
                  setTab('pin');
                  setError(null);
                }}
                className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  tab === 'pin'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>PIN Cepat Kasir</span>
              </button>
              <button
                onClick={() => {
                  setTab('password');
                  setError(null);
                }}
                className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  tab === 'password'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Username & Sandi</span>
              </button>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Body 1: Mode PIN */}
            {tab === 'pin' && (
              <div className="p-6 flex flex-col items-center space-y-4">
                <div className="text-center">
                  <p className="text-xs font-semibold text-slate-500">Masukkan 4 Digit PIN Kasir</p>
                  
                  {/* Indikator Titik PIN */}
                  <div className="flex justify-center items-center gap-3.5 mt-3">
                    {[0, 1, 2, 3].map((idx) => {
                      const isFilled = idx < pin.length;
                      return (
                        <div
                          key={idx}
                          className={`w-4 h-4 rounded-full transition-all duration-150 ${
                            isFilled
                              ? 'bg-emerald-600 scale-110 shadow-sm'
                              : 'bg-slate-200'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Virtual Numpad (Sangat Ramah HP / Touchscreen) */}
                <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handleNumClick(digit)}
                      className="h-14 rounded-2xl bg-slate-50 hover:bg-emerald-50 active:bg-emerald-600 active:text-white text-slate-800 font-bold text-xl transition-all shadow-xs active:scale-95 border border-slate-100 flex items-center justify-center"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleClear}
                    className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-500 font-semibold text-xs transition-all active:scale-95 border border-slate-100 flex items-center justify-center"
                  >
                    Hapus
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNumClick('0')}
                    className="h-14 rounded-2xl bg-slate-50 hover:bg-emerald-50 active:bg-emerald-600 active:text-white text-slate-800 font-bold text-xl transition-all shadow-xs active:scale-95 border border-slate-100 flex items-center justify-center"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="h-14 rounded-2xl bg-slate-50 hover:bg-rose-50 active:bg-rose-100 text-rose-600 font-bold text-sm transition-all active:scale-95 border border-slate-100 flex items-center justify-center"
                    title="Hapus Satu Angka"
                  >
                    <Delete className="w-5 h-5" />
                  </button>
                </div>

                {/* Don't have account? Sign Up */}
                <div className="text-center pt-2 text-xs text-slate-500">
                  <span>Don&apos;t have account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true);
                      setError(null);
                    }}
                    className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-all"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            )}

            {/* Body 2: Mode Username & Password */}
            {tab === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username Kasir
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="admin atau kasir"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kata Sandi atau PIN
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="Masukkan sandi..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 mt-2"
                >
                  <span>Masuk Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Don't have account? Sign Up */}
                <div className="text-center pt-2 text-xs text-slate-500">
                  <span>Don&apos;t have account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true);
                      setError(null);
                    }}
                    className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-all"
                  >
                    Sign Up
                  </button>
                </div>
              </form>
            )}

            {/* Quick Demo Login Preset Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-2">
              <p className="text-[11px] text-slate-400 text-center font-medium">
                Akun Siap Pakai (Klik untuk Masuk Cepat):
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin(DEFAULT_USERS[0])}
                  className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl hover:border-emerald-400 hover:bg-emerald-50/50 transition-all text-left shadow-2xs group"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-900 block group-hover:text-emerald-700">
                      👑 Owner
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">PIN: 1234</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    Admin
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin(DEFAULT_USERS[1])}
                  className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl hover:border-emerald-400 hover:bg-emerald-50/50 transition-all text-left shadow-2xs group"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-900 block group-hover:text-emerald-700">
                      🛒 Kasir 1
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">PIN: 0000</span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                    Kasir
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-4 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>CentPOS Secure Session & Local Persistence</span>
      </div>
    </div>
  );
};
