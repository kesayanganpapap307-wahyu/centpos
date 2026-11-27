import { NextResponse } from 'next/server';

// Temporary in-memory OTP storage with expiration
const otpStore = new Map<string, { code: string; expiresAt: number }>();

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
      // Generate 6-digit OTP
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Expire in 10 minutes
      const expiresAt = Date.now() + 10 * 60 * 1000;
      otpStore.set(normalizedEmail, { code: generatedCode, expiresAt });

      console.log(`[CentPOS OTP] Code for ${normalizedEmail}: ${generatedCode}`);

      return NextResponse.json({
        success: true,
        message: `Kode verifikasi telah dikirim ke ${normalizedEmail}`,
        // Sertakan code untuk pengujian langsung/demo instan di Vercel
        debugCode: generatedCode,
      });
    }

    // 2. ACTION: VERIFY OTP
    if (action === 'verify') {
      const stored = otpStore.get(normalizedEmail);

      if (!stored) {
        return NextResponse.json(
          { error: 'Kode verifikasi belum dikirim atau telah kadaluarsa. Silakan kirim ulang.' },
          { status: 400 }
        );
      }

      if (Date.now() > stored.expiresAt) {
        otpStore.delete(normalizedEmail);
        return NextResponse.json(
          { error: 'Kode verifikasi telah kadaluarsa (lebih dari 10 menit). Silakan kirim ulang.' },
          { status: 400 }
        );
      }

      if (stored.code !== (code || '').trim()) {
        return NextResponse.json(
          { error: 'Kode OTP tidak valid atau salah. Silakan periksa kembali email Anda.' },
          { status: 400 }
        );
      }

      // Hapus setelah berhasil diverifikasi
      otpStore.delete(normalizedEmail);

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
