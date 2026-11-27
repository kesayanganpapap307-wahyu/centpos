import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// In-memory backup OTP store
const backupOtpStore = new Map<string, { code: string; expiresAt: number }>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, email, code } = body;

    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Format alamat email tidak valid.' },
        { status: 400 }
      );
    }

    // 1. ACTION: SEND OTP
    if (action === 'send') {
      let emailSentViaSupabase = false;
      let isRateLimited = false;
      let supabaseErrorMsg = '';

      if (supabase) {
        try {
          const { error } = await supabase.auth.signInWithOtp({
            email: normalizedEmail,
            options: {
              shouldCreateUser: true,
            },
          });

          if (!error) {
            emailSentViaSupabase = true;
            console.log(`[CentPOS OTP] Real email sent to: ${normalizedEmail}`);
          } else {
            console.warn('[Supabase Auth OTP send warning]:', error.message, error.status);
            supabaseErrorMsg = error.message;
            if (error.status === 429 || error.message?.toLowerCase().includes('rate limit')) {
              isRateLimited = true;
            }
          }
        } catch (authErr: any) {
          console.warn('[Supabase Auth OTP exception]:', authErr);
          supabaseErrorMsg = authErr?.message || 'Error auth';
          if (supabaseErrorMsg.toLowerCase().includes('rate limit')) {
            isRateLimited = true;
          }
        }
      }

      // Generate local backup code
      const backupCode = Math.floor(100000 + Math.random() * 900000).toString();
      backupOtpStore.set(normalizedEmail, {
        code: backupCode,
        expiresAt: Date.now() + 15 * 60 * 1000,
      });

      if (emailSentViaSupabase) {
        return NextResponse.json({
          success: true,
          sentRealEmail: true,
          message: `Kode verifikasi 6-digit telah dikirim ke email ${normalizedEmail}. Harap periksa Inbox atau folder Spam.`,
        });
      } else {
        return NextResponse.json({
          success: true,
          sentRealEmail: false,
          isRateLimited: isRateLimited,
          warning: supabaseErrorMsg,
          message: isRateLimited
            ? 'Batas kuota email bawaan Supabase (3 email/jam) sedang penuh. Gunakan kode verifikasi di bawah ini untuk melanjutkan pendaftaran:'
            : `Gagal mengirim email: ${supabaseErrorMsg}. Gunakan kode verifikasi di bawah ini:`,
          debugCode: backupCode,
        });
      }
    }

    // 2. ACTION: VERIFY OTP
    if (action === 'verify') {
      const inputCode = (code || '').trim();

      if (!inputCode || inputCode.length !== 6) {
        return NextResponse.json(
          { error: 'Masukkan 6 digit kode OTP verifikasi.' },
          { status: 400 }
        );
      }

      let isVerified = false;

      // Coba verifikasi dengan Supabase Auth terlebih dahulu jika berhasil terkirim via Supabase
      if (supabase) {
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            email: normalizedEmail,
            token: inputCode,
            type: 'email',
          });

          if (!error && (data?.user || data?.session)) {
            isVerified = true;
          } else if (error) {
            const retry = await supabase.auth.verifyOtp({
              email: normalizedEmail,
              token: inputCode,
              type: 'signup',
            });
            if (!retry.error && (retry.data?.user || retry.data?.session)) {
              isVerified = true;
            }
          }
        } catch (authErr) {
          console.warn('[Supabase Auth verify exception]:', authErr);
        }
      }

      // Jika belum terverifikasi oleh Supabase (atau fallback karena rate limit), cek backup store
      if (!isVerified) {
        const stored = backupOtpStore.get(normalizedEmail);
        if (stored && Date.now() <= stored.expiresAt && stored.code === inputCode) {
          isVerified = true;
          backupOtpStore.delete(normalizedEmail);
        }
      }

      if (!isVerified) {
        return NextResponse.json(
          { error: 'Kode verifikasi salah atau telah kadaluarsa. Periksa kembali atau klik Kirim Ulang.' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        verified: true,
        message: 'Email berhasil diverifikasi!',
      });
    }

    return NextResponse.json({ error: 'Aksi tidak dikenal.' }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Terjadi kesalahan sistem';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
