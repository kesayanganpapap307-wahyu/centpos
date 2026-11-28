import { createClient } from '@supabase/supabase-js';

export interface CentCmsPaymentMethod {
  channel_code: string;
  name: string;
  category: string;
  provider: string;
  admin_fee: string;
}

export interface CentCmsProvider {
  provider: string;
  is_default: boolean;
  integration_mode: string;
  merchant_id: string;
  client_key: string;
}

export interface CentCmsPublicConfig {
  app?: {
    slug: string;
    name: string;
    app_code: string;
  };
  environment: 'sandbox' | 'production';
  payment_methods: CentCmsPaymentMethod[];
  providers: CentCmsProvider[];
}

const DEFAULT_CMS_API_URL = 'https://cent-cms.vercel.app';
const DEFAULT_APP_SLUG = 'centpos';
const DEFAULT_APP_KEY = 'ck_live_centpos_9921a8b';

export function getCentCmsSettings() {
  return {
    apiUrl: (process.env.CENT_CMS_API_URL || DEFAULT_CMS_API_URL).replace(/\/$/, ''),
    appSlug: process.env.CENT_CMS_APP_SLUG || DEFAULT_APP_SLUG,
    appKey: process.env.CENT_CMS_APP_KEY || DEFAULT_APP_KEY,
    supabaseUrl: process.env.CENT_CMS_SUPABASE_URL || '',
    supabaseKey:
      process.env.CENT_CMS_SUPABASE_SERVICE_KEY ||
      process.env.CENT_CMS_SUPABASE_ANON_KEY ||
      '',
  };
}

/**
 * Mengambil konfigurasi publik (client_key, payment_methods, providers)
 * dari endpoint CentPay CMS.
 */
export async function getCentCmsPublicConfig(
  env: 'sandbox' | 'production'
): Promise<CentCmsPublicConfig | null> {
  const { apiUrl, appSlug, appKey } = getCentCmsSettings();
  const url = `${apiUrl}/api/v1/apps/${encodeURIComponent(appSlug)}/payment-config?env=${env}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'x-app-key': appKey,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('CentPay CMS API error:', res.status);
      return null;
    }

    const data = await res.json();
    return data as CentCmsPublicConfig;
  } catch (error) {
    console.error('Failed to fetch CentPay CMS public config:', error);
    return null;
  }
}

/**
 * Mengambil Server Key langsung dari database Supabase milik CentPay CMS
 * pada tabel `app_gateaway_providers` (kolom `sandbox_server_key` / `prod_server_key`).
 * Hanya dijalankan di sisi server (API Route) agar Server Key tidak terekspos ke browser.
 */
export async function getCentCmsServerKey(
  providerName: string,
  isProduction: boolean
): Promise<string | null> {
  const { appSlug, supabaseUrl, supabaseKey } = getCentCmsSettings();

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  try {
    const cmsSupabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // 1. Cari app_id dari tabel apps jika tersedia
    let appId: string | null = null;
    try {
      const { data: appRow } = await cmsSupabase
        .from('apps')
        .select('id, slug')
        .eq('slug', appSlug)
        .maybeSingle();

      if (appRow?.id) {
        appId = String(appRow.id);
      }
    } catch {
      // Abaikan jika tabel apps tidak ada atau menggunakan app_slug langsung
    }

    // 2. Ambil baris dari tabel app_gateaway_providers
    const { data: rows, error } = await cmsSupabase
      .from('app_gateaway_providers')
      .select('*');

    if (error || !Array.isArray(rows)) {
      console.error('Error querying app_gateaway_providers:', error?.message);
      return null;
    }

    const targetProvider = providerName.toLowerCase();

    const matchedRow = rows.find((row: Record<string, any>) => {
      const rowProvider = String(
        row.provider || row.provider_code || row.provider_name || ''
      ).toLowerCase();
      if (rowProvider !== targetProvider) return false;

      if (appId && row.app_id) {
        return String(row.app_id) === appId;
      }
      if (row.app_slug) {
        return String(row.app_slug).toLowerCase() === appSlug.toLowerCase();
      }
      return true;
    });

    if (!matchedRow) {
      return null;
    }

    const key = isProduction
      ? matchedRow.prod_server_key
      : matchedRow.sandbox_server_key;

    return typeof key === 'string' && key.trim() !== '' ? key.trim() : null;
  } catch (error) {
    console.error('Failed to get server key from CentPay CMS Supabase:', error);
    return null;
  }
}
