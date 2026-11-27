'use client';

import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Mail,
  KeyRound, 
  ShieldCheck, 
  Delete, 
  ArrowRight, 
  AlertCircle,
  Store,
  UserPlus,
  CheckCircle2,
  User,
  Eye,
  EyeOff,
  Check,
  Send,
  Sparkles
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
    display_name: 'Wahyu (Owner)',
    name: 'Wahyu (Owner)',
    email: 'admin@centpos.com',
    role: 'owner',
    pin: '1234',
    password: 'admin',
  },
  {
    id: 'user-cashier-1',
    display_name: 'Kasir Utama',
    name: 'Kasir Utama',
    email: 'kasir@centpos.com',
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
  
  // State Sign In Email/Password
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  
  // ==========================================
  // State Sign Up Form
  // ==========================================
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<'owner' | 'cashier'>('cashier');

  // ==========================================
  // State Email Verification (OTP)
  // ==========================================
  // 'idle' = Belum kirim kode
  // 'sent' = Kode dikirim, tombol berubah jadi "Verify OTP" & muncul input OTP
  // 'verified' = Email sukses diverifikasi
  const [otpState, setOtpState] = useState<'idle' | 'sent' | 'verified'>('idle');
  const [otpCode, setOtpCode] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpDebugHint, setOtpDebugHint] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Toggle Pilihan Keamanan (Use Password & Use PIN)
  const [usePassword, setUsePassword] = useState(true);
  const [usePin, setUsePin] = useState(true);

  // Input Password & Confirm Password
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Input PIN & Confirm PIN
  const [regPin, setRegPin] = useState('');
  const [regConfirmPin, setRegConfirmPin] = useState('');
  const [showRegPin, setShowRegPin] = useState(false);
  const [showRegConfirmPin, setShowRegConfirmPin] = useState(false);
  
  // List user terdaftar (Supabase Cloud + LocalStorage + Default)
  const [allUsers, setAllUsers] = useState<(AuthUser & { password?: string })[]>(DEFAULT_USERS);

  // Status pesan
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Countdown timer untuk kirim ulang kode OTP
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  // 1. Fetch users from Supabase Cloud on mount
  useEffect(() => {
    const fetchCloudUsers = async () => {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const cloudUsers: any[] = await res.json();
          if (Array.isArray(cloudUsers) && cloudUsers.length > 0) {
            const mapped = cloudUsers.map((u) => ({
              id: u.id,
              display_name: u.display_name,
              name: u.display_name,
              email: u.email,
              role: u.role || 'cashier',
              pin: u.pin,
              password: u.password,
            }));
            setAllUsers([...DEFAULT_USERS, ...mapped]);
            return;
          }
        }
      } catch (err) {
        console.warn('Could not fetch cloud users:', err);
      }

      // Fallback: load from localStorage
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
    };

    fetchCloudUsers();
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

  // Verifikasi PIN Sign In
  const verifyPin = (pinToTest: string) => {
    const matched = allUsers.find((u) => u.pin === pinToTest);
    if (matched) {
      onLogin({
        ...matched,
        name: matched.display_name || matched.name || 'Kasir',
      });
    } else {
      setError('PIN tidak valid. Coba PIN: 1234 (Owner) atau 0000 (Kasir)');
      setTimeout(() => setPin(''), 600);
    }
  };

  // Verifikasi Email & Password Sign In
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = emailOrUser.trim().toLowerCase();
    const matched = allUsers.find(
      (u) =>
        (u.email?.toLowerCase() === query ||
         u.username?.toLowerCase() === query ||
         u.display_name?.toLowerCase() === query) &&
        (u.password === password || u.pin === password)
    );

    if (matched) {
      onLogin({
        ...matched,
        name: matched.display_name || matched.name || 'Kasir',
      });
    } else {
      setError('Email/Username atau Kata Sandi salah.');
    }
  };

  // ============================================================
  // FUNGSI 1: SEND VERIFICATION CODE
  // ============================================================
  const handleSendVerificationCode = async () => {
    setError(null);
    setOtpError(null);
    const displayName = regDisplayName.trim();
    const email = regEmail.trim().toLowerCase();

    if (!displayName) {
      setError('Nama Tampilan (display_name) wajib diisi terlebih dahulu.');
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Masukkan alamat email yang valid terlebih dahulu.');
      return;
    }

    // Validasi: Minimal salah satu (Password atau PIN) harus dipilih
    if (!usePassword && !usePin) {
      setError('Pilih minimal salah satu metode keamanan: Gunakan Password atau Gunakan PIN.');
      return;
    }

    // Validasi Password jika dipilih
    if (usePassword) {
      if (!regPassword.trim()) {
        setError('Kata Sandi wajib diisi karena toggle "Use Password" diaktifkan.');
        return;
      }
      if (regPassword !== regConfirmPassword) {
        setError('Konfirmasi Kata Sandi tidak cocok. Harap periksa kembali.');
        return;
      }
    }

    // Validasi PIN jika dipilih
    if (usePin) {
      if (!regPin.trim() || regPin.trim().length < 4) {
        setError('PIN Kasir wajib diisi minimal 4 digit angka.');
        return;
      }
      if (regPin !== regConfirmPin) {
        setError('Konfirmasi PIN tidak cocok. Harap periksa kembali.');
        return;
      }
    }

    // Cek duplikasi email
    if (allUsers.some((u) => u.email?.toLowerCase() === email)) {
      setError(`Email "${email}" sudah terdaftar. Silakan gunakan email lain.`);
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', email }),
      });

      const data = await res.json();
      if (res.ok) {
        setOtpState('sent');
        setOtpCountdown(30);
        if (data.debugCode) {
          setOtpDebugHint(data.debugCode);
        } else {
          setOtpDebugHint(null);
        }
        if (data.sentRealEmail) {
          setSuccess(data.message || `Kode verifikasi telah dikirim ke ${email}! Silakan cek Inbox atau folder Spam.`);
        }
      } else {
        setError(data.error || 'Gagal mengirim kode verifikasi.');
      }
    } catch (err) {
      console.error(err);
      setError('Terjadi kendala saat mengirim kode ke email.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // ============================================================
  // FUNGSI 2: EKSEKUSI PENDAFTARAN KE DATABASE SUPABASE
  // ============================================================
  const executeRegister = async () => {
    setError(null);
    setIsLoading(true);

    const displayName = regDisplayName.trim();
    const email = regEmail.trim().toLowerCase();
    const finalPass = usePassword ? regPassword.trim() : '';
    const finalPin = usePin ? regPin.trim() : '';

    const payload = {
      display_name: displayName,
      email: email,
      password: finalPass,
      pin: finalPin,
      role: regRole,
    };

    let createdUser: AuthUser = {
      id: `user-${Date.now()}`,
      display_name: displayName,
      name: displayName,
      email: email,
      role: regRole,
      pin: finalPin,
      password: finalPass,
    };

    // 1. Simpan ke Supabase cloud (tabel users)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const cloudData = await res.json();
        if (cloudData?.id) {
          createdUser = {
            id: cloudData.id,
            display_name: cloudData.display_name,
            name: cloudData.display_name,
            email: cloudData.email,
            role: cloudData.role,
            pin: cloudData.pin,
            password: finalPass,
          };
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn('Supabase users table insert response:', errJson);
      }
    } catch (cloudErr) {
      console.warn('Cloud sync error, saving locally:', cloudErr);
    }

    // 2. Simpan juga ke LocalStorage untuk offline tolerance
    try {
      const saved = localStorage.getItem('centpos_registered_users');
      const existing = saved ? JSON.parse(saved) : [];
      const updated = [...existing, createdUser];
      localStorage.setItem('centpos_registered_users', JSON.stringify(updated));
      setAllUsers((prev) => [...prev, createdUser]);
    } catch (localErr) {
      console.error(localErr);
    }

    setIsLoading(false);
    setSuccess(`Akun "${displayName}" berhasil diverifikasi dan terdaftar! Mengalihkan ke sistem kasir...`);
    setTimeout(() => {
      onLogin(createdUser);
    }, 700);
  };

  // ============================================================
  // FUNGSI 3: VERIFY OTP & LANGSUNG DAFTAR / MASUK
  // ============================================================
  const handleVerifyAndRegister = async () => {
    setError(null);
    setOtpError(null);
    const code = otpCode.trim();
    const email = regEmail.trim().toLowerCase();

    if (!code || code.length !== 6) {
      setOtpError('Masukkan 6 digit kode OTP verifikasi.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', email, code }),
      });

      const data = await res.json();
      if (res.ok && data.verified) {
        setOtpState('verified');
        setOtpError(null);
        setOtpDebugHint(null);
        // Langsung selesaikan pendaftaran akun & login
        await executeRegister();
      } else {
        setOtpError(data.error || 'Kode OTP salah atau telah kadaluarsa.');
      }
    } catch (err) {
      console.error(err);
      setOtpError('Gagal memverifikasi kode OTP.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Quick Login Preset
  const handleQuickLogin = (user: typeof DEFAULT_USERS[0]) => {
    onLogin({
      ...user,
      name: user.display_name,
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 select-none">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 -z-10 pointer-events-none" />

      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col my-4">
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
                <span>Pendaftaran Akun Baru (Sign Up)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Lengkapi data akun kasir atau pemilik toko Anda
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

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (otpState === 'sent') {
                  handleVerifyAndRegister();
                } else {
                  handleSendVerificationCode();
                }
              }}
              className="space-y-3.5 text-xs"
            >
              {/* Nama Tampilan */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Tampilan (display_name) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={regDisplayName}
                    onChange={(e) => setRegDisplayName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* ============================================================ */}
              {/* ALAMAT EMAIL                                                 */}
              {/* ============================================================ */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Alamat Email (email) *
                  </label>
                  {otpState === 'sent' && (
                    <span className="text-[11px] font-medium text-emerald-700">
                      Menunggu Verifikasi OTP
                    </span>
                  )}
                  {otpState === 'verified' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Email Terverifikasi</span>
                    </span>
                  )}
                </div>

                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    disabled={otpState === 'verified'}
                    placeholder="Contoh: budi@gmail.com"
                    value={regEmail}
                    onChange={(e) => {
                      setRegEmail(e.target.value);
                      if (otpState !== 'idle') {
                        setOtpState('idle');
                        setOtpCode('');
                        setOtpError(null);
                        setOtpDebugHint(null);
                      }
                    }}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                      otpState === 'verified'
                        ? 'bg-emerald-50/50 border border-emerald-300 text-slate-700'
                        : 'bg-slate-50 border border-slate-200 focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              {/* TOGGLE BUTTON: Use Password & Use PIN */}
              <div className="pt-1">
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Metode Keamanan (Pilih salah satu atau keduanya):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUsePassword(!usePassword)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      usePassword
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Lock className={`w-3.5 h-3.5 ${usePassword ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span>Use Password</span>
                    </div>
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                      usePassword ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {usePassword && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUsePin(!usePin)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      usePin
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <KeyRound className={`w-3.5 h-3.5 ${usePin ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span>Use PIN</span>
                    </div>
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                      usePin ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {usePin && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                </div>
              </div>

              {/* ============================================================ */}
              {/* INPUT KATA SANDI (Hanya muncul jika Use Password Aktif)      */}
              {/* ============================================================ */}
              {usePassword && (
                <div className="space-y-2.5 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Password Input */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Kata Sandi (Password) *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        placeholder="Masukkan kata sandi..."
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        title={showRegPassword ? 'Sembunyikan' : 'Lihat'}
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Input */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Konfirmasi Kata Sandi (Confirm Password) *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showRegConfirmPassword ? 'text' : 'password'}
                        placeholder="Ketik ulang kata sandi..."
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        title={showRegConfirmPassword ? 'Sembunyikan' : 'Lihat'}
                      >
                        {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* INPUT PIN (Hanya muncul jika Use PIN Aktif)                  */}
              {/* ============================================================ */}
              {usePin && (
                <div className="space-y-2.5 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* PIN Input */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      PIN Kasir Cepat (4–6 Digit) *
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showRegPin ? 'text' : 'password'}
                        maxLength={6}
                        placeholder="Contoh: 1234"
                        value={regPin}
                        onChange={(e) => setRegPin(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPin(!showRegPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        title={showRegPin ? 'Sembunyikan' : 'Lihat'}
                      >
                        {showRegPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm PIN Input */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Konfirmasi PIN Kasir (Confirm PIN) *
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showRegConfirmPin ? 'text' : 'password'}
                        maxLength={6}
                        placeholder="Ketik ulang PIN..."
                        value={regConfirmPin}
                        onChange={(e) => setRegConfirmPin(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegConfirmPin(!showRegConfirmPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        title={showRegConfirmPin ? 'Sembunyikan' : 'Lihat'}
                      >
                        {showRegConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Peran Akun (Role) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Peran Akun (role)
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

              {/* ============================================================ */}
              {/* AREA INPUT OTP (Muncul saat kode verifikasi sudah terkirim)   */}
              {/* ============================================================ */}
              {otpState === 'sent' && (
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-300 rounded-2xl space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-150 mt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Masukkan Kode OTP Email</span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">6 Digit</span>
                  </div>

                  <div>
                    <input
                      type="text"
                      maxLength={6}
                      autoFocus
                      placeholder="Contoh: 849201"
                      value={otpCode}
                      onChange={(e) => {
                        setOtpCode(e.target.value.replace(/[^0-9]/g, ''));
                        setOtpError(null);
                      }}
                      className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-base font-mono tracking-widest text-center font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                    />
                  </div>

                  {/* Hint Demo Code untuk kemudahan pengujian instan */}
                  {otpDebugHint && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-center justify-between">
                      <span className="flex items-center gap-1 font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Kode OTP Anda:</span>
                      </span>
                      <span className="font-mono font-bold text-sm tracking-wider bg-white px-2 py-0.5 rounded border border-amber-300 text-slate-900">
                        {otpDebugHint}
                      </span>
                    </div>
                  )}

                  {/* Resend & Status text */}
                  <div className="flex items-center justify-between text-[11px] pt-0.5">
                    <span className="text-emerald-800 truncate mr-2">
                      Kode dikirim ke <span className="font-semibold">{regEmail}</span> (Cek Inbox & Spam)
                    </span>
                    <button
                      type="button"
                      disabled={otpCountdown > 0 || isSendingOtp}
                      onClick={handleSendVerificationCode}
                      className="text-emerald-700 hover:underline font-bold disabled:text-slate-400 disabled:no-underline shrink-0"
                    >
                      {otpCountdown > 0 ? `Kirim Ulang (${otpCountdown}s)` : 'Kirim Ulang'}
                    </button>
                  </div>

                  {otpError && (
                    <p className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{otpError}</span>
                    </p>
                  )}
                </div>
              )}

              {/* ============================================================ */}
              {/* TOMBOL UTAMA: MENGGANTIKAN TOMBOL DAFTAR & MASUK SEKARANG    */}
              {/* ============================================================ */}
              {otpState !== 'sent' ? (
                <button
                  type="submit"
                  disabled={isSendingOtp}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSendingOtp ? 'Mengirim Kode...' : 'Send Verification Code'}</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isVerifyingOtp || isLoading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 mt-3 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {isVerifyingOtp
                      ? 'Memverifikasi Kode OTP...'
                      : isLoading
                      ? 'Menyimpan & Masuk...'
                      : 'Verify OTP'}
                  </span>
                </button>
              )}
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
                <Mail className="w-3.5 h-3.5" />
                <span>Email & Sandi</span>
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

            {/* Body 2: Mode Email & Password */}
            {tab === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alamat Email Kasir
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="admin@centpos.com atau kasir@centpos.com"
                      value={emailOrUser}
                      onChange={(e) => setEmailOrUser(e.target.value)}
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
                      type={showSignInPassword ? 'text' : 'password'}
                      required
                      placeholder="Masukkan sandi..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      title={showSignInPassword ? 'Sembunyikan' : 'Lihat'}
                    >
                      {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
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
        <span>CentPOS Cloud Database & Local Persistence</span>
      </div>
    </div>
  );
};
