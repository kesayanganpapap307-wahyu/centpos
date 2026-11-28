import { NextResponse } from 'next/server';
import { getCentCmsFeatureInfo, getCentCmsServerKey } from '@/lib/centCms';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      orderId,
      featureCode,
      grossAmount,
      serverKey: customServerKey,
      isProduction: customIsProduction,
      storeName,
      customerEmail,
      customerPhone,
    } = body;

    const isProduction =
      typeof customIsProduction === 'boolean'
        ? customIsProduction
        : process.env.MIDTRANS_IS_PRODUCTION === 'true';
    const env = isProduction ? 'production' : 'sandbox';
    const targetFeatureCode =
      typeof featureCode === 'string' && featureCode.trim() !== ''
        ? featureCode.trim()
        : 'multi_tier_pricing';

    // Ambil Server Key & harga resmi fitur secara paralel di server
    const [cmsServerKey, cmsFeature] = await Promise.all([
      getCentCmsServerKey('midtrans', isProduction),
      getCentCmsFeatureInfo(targetFeatureCode, env),
    ]);

    const serverKey =
      cmsServerKey ||
      process.env.MIDTRANS_SERVER_KEY ||
      customServerKey ||
      '';

    if (!serverKey || serverKey.trim() === '') {
      return NextResponse.json(
        {
          error:
            'Server Key Midtrans belum tersedia. Pastikan CENT_CMS_SUPABASE_URL & CENT_CMS_SUPABASE_SERVICE_KEY sudah diatur, atau isi Server Key di menu Pengaturan.',
        },
        { status: 400 }
      );
    }

    const snapBaseUrl = isProduction
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    const finalOrderId =
      orderId || `CENTPOS-${targetFeatureCode.toUpperCase().slice(0, 12)}-${Date.now()}`;
    // Prioritaskan harga resmi dari CentPay CMS agar tidak bisa dimanipulasi browser
    const finalAmount =
      cmsFeature && Number(cmsFeature.price) > 0
        ? Math.round(Number(cmsFeature.price))
        : Number(grossAmount) > 0
          ? Math.round(Number(grossAmount))
          : 99000;
    const itemName = (
      cmsFeature?.name || 'Modul Multi-Tier Pricing (Permanen)'
    ).slice(0, 50);

    const payload = {
      transaction_details: {
        order_id: finalOrderId,
        gross_amount: finalAmount,
      },
      item_details: [
        {
          id: `ADDON-${targetFeatureCode.toUpperCase().slice(0, 30)}`,
          price: finalAmount,
          quantity: 1,
          name: itemName,
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
