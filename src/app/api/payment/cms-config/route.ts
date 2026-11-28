import { NextResponse } from 'next/server';
import {
  getCentCmsPublicConfig,
  getCentCmsServerKeyWithDebug,
  getCentCmsSettings,
} from '@/lib/centCms';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const envParam = searchParams.get('env');
    const env: 'sandbox' | 'production' =
      envParam === 'production' ? 'production' : 'sandbox';
    const isProduction = env === 'production';

    const { supabaseUrl, supabaseKey } = getCentCmsSettings();
    const hasSupabaseCmsConfig = Boolean(supabaseUrl && supabaseKey);

    const [publicConfig, serverKeyResult] = await Promise.all([
      getCentCmsPublicConfig(env),
      getCentCmsServerKeyWithDebug('midtrans', isProduction),
    ]);

    const midtransProvider = publicConfig?.providers?.find(
      (p) => p.provider.toLowerCase() === 'midtrans'
    );

    const hasServerKey = Boolean(
      serverKeyResult.serverKey || process.env.MIDTRANS_SERVER_KEY
    );

    return NextResponse.json({
      connected: Boolean(publicConfig),
      environment: env,
      app: publicConfig?.app || null,
      midtransClientKey: midtransProvider?.client_key || '',
      midtransMerchantId: midtransProvider?.merchant_id || '',
      integrationMode: midtransProvider?.integration_mode || 'snap',
      paymentMethods: publicConfig?.payment_methods || [],
      providers: publicConfig?.providers || [],
      hasSupabaseCmsConfig,
      hasServerKey,
      serverKeyDebug: hasServerKey ? undefined : serverKeyResult.debugReason,
    });
  } catch (error: any) {
    if (error?.digest === 'NEXT_PRERENDER_INTERRUPTED') {
      throw error;
    }
    console.error('CMS config route error:', error);
    return NextResponse.json(
      {
        connected: false,
        error: error?.message || 'Gagal mengambil konfigurasi CentPay CMS.',
      },
      { status: 500 }
    );
  }
}
