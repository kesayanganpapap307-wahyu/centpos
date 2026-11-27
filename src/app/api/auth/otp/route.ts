import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// In-memory fallback / backup store
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
            console.warn('[Supabase Auth OTP send warning]:', error.message);
            supabaseErrorMsg = error.message;
          }
        } catch (authErr: any) {
          console.warn('[Supabase Auth OTP exception]:', authErr);
          supabaseErrorMsg = authErr?.message || 'Error auth';
        }
      }

      // Generate local backup code as well, so if user is in demo mode or Supabase rate-limits, they can still verify
      const backupCode = Math.floor(100000 + Math.random() * 900000).toString();
      backupOtpStore.set(normalizedEmail, {
        code: backupCode,
        expiresAt: Date.now() + 10 * 60 * 1000,
      });

      if (emailSentViaSupabase) {
        return NextResponse.json({
          success: true,
          sentRealEmail: true,
          message: `Kode verifikasi 6-digit telah dikirim ke email ${normalizedEmail}. Harap periksa Inbox atau folder Spam / Promosi.`,
        });
      } else {
        // Jika Supabase rate-limited atau gagal kirim email
        return NextResponse.json({
          success: true,
          sentRealEmail: false,
          warning: supabaseErrorMsg,
          message: `Kode verifikasi telah dibuat. ${supabaseErrorMsg ? `(Info: ${supabaseErrorMsg})` : ''}`,
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

      // Coba verifikasi dengan Supabase Auth terlebih dahulu
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
            console.warn('[Supabase Auth verify email error]:', error.message);
            // Coba type 'signup' jika diperlukan
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

      // Jika belum terverifikasi oleh Supabase, cek backup store
      if (!isVerified) {
        const stored = backupOtpStore.get(normalizedEmail);
        if (stored && Date.now() <= stored.expiresAt && stored.code === inputCode) {
          isVerified = true;
          backupOtpStore.delete(normalizedEmail);
        }
      }

      if (!isVerified) {
        return NextResponse.json(
          { error: 'Kode verifikasi salah atau telah kadaluarsa. Periksa kembali email Anda atau klik Kirim Ulang.' },
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
