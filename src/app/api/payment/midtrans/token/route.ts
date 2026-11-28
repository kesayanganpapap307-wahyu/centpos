import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      orderId,
      grossAmount,
      serverKey: customServerKey,
      isProduction: customIsProduction,
      storeName,
      customerEmail,
      customerPhone,
    } = body;

    // Ambil server key dari payload pengaturan toko, atau environment variable
    const serverKey =
      customServerKey ||
      process.env.MIDTRANS_SERVER_KEY ||
      '';

    const isProduction =
      typeof customIsProduction === 'boolean'
        ? customIsProduction
        : process.env.MIDTRANS_IS_PRODUCTION === 'true';

    if (!serverKey || serverKey.trim() === '') {
      return NextResponse.json(
        {
          error:
            'Server Key Midtrans belum diisi. Silakan masukkan Server Key di menu Pengaturan > Lisensi & Payment Gateway.',
        },
        { status: 400 }
      );
    }

    const snapBaseUrl = isProduction
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    const finalOrderId =
      orderId || `CENTPOS-TIER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const finalAmount = Number(grossAmount) > 0 ? Number(grossAmount) : 99000;

    const payload = {
      transaction_details: {
        order_id: finalOrderId,
        gross_amount: finalAmount,
      },
      item_details: [
        {
          id: 'ADDON-MULTITIER-PRICING',
          price: finalAmount,
          quantity: 1,
          name: 'Modul Multi-Tier Pricing (Permanen)',
        },
      ],
      customer_details: {
        first_name: storeName || 'Pelanggan CentPOS',
        email: customerEmail || 'owner@centpos.app',
        phone: customerPhone || '081234567890',
      },
    };

    const authHeader = `Basic ${Buffer.from(`${serverKey.trim()}:`).toString('base64')}`;

    const midtransRes = await fetch(snapBaseUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    });

    const data = await midtransRes.json();

    if (!midtransRes.ok) {
      console.error('Midtrans API error:', midtransRes.status, data);
      const detailMsg =
        (Array.isArray(data?.error_messages) && data.error_messages.join(', ')) ||
        data?.status_message ||
        data?.message ||
        data?.error ||
        `HTTP ${midtransRes.status}`;
      return NextResponse.json(
        {
          error: `Gagal membuat token pembayaran Midtrans (${detailMsg}). Pastikan Server Key dan Mode (Sandbox/Production) sudah sesuai.`,
        },
        { status: midtransRes.status }
      );
    }

    return NextResponse.json({
      token: data.token,
      redirect_url: data.redirect_url,
      orderId: finalOrderId,
    });
  } catch (error: any) {
    console.error('Payment token route error:', error);
    return NextResponse.json(
      { error: error?.message || 'Terjadi kesalahan pada server saat menghubungi Midtrans.' },
      { status: 500 }
    );
  }
}
