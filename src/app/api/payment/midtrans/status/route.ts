import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, serverKey: customServerKey, isProduction: customIsProduction } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID wajib diisi.' }, { status: 400 });
    }

    const serverKey =
      customServerKey ||
      process.env.MIDTRANS_SERVER_KEY ||
      '';

    const isProduction =
      typeof customIsProduction === 'boolean'
        ? customIsProduction
        : process.env.MIDTRANS_IS_PRODUCTION === 'true';

    if (!serverKey) {
      return NextResponse.json({ error: 'Server Key Midtrans belum dikonfigurasi.' }, { status: 400 });
    }

    const apiBaseUrl = isProduction
      ? `https://api.midtrans.com/v2/${encodeURIComponent(orderId)}/status`
      : `https://api.sandbox.midtrans.com/v2/${encodeURIComponent(orderId)}/status`;

    const authHeader = `Basic ${Buffer.from(`${serverKey.trim()}:`).toString('base64')}`;

    const res = await fetch(apiBaseUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: authHeader,
      },
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Payment status route error:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal mengecek status transaksi ke Midtrans.' },
      { status: 500 }
    );
  }
}
