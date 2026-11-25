import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function GET() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    '';

  const hasKey = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_KEY
  );

  let dbConnected = false;
  let errorMsg = null;

  if (supabase) {
    try {
      const { data, error } = await supabase.from('products').select('id').limit(1);
      if (!error) {
        dbConnected = true;
      } else {
        errorMsg = error.message;
      }
    } catch (e: any) {
      errorMsg = e?.message || 'Connection failed';
    }
  }

  return NextResponse.json({
    configured: isSupabaseConfigured,
    hasUrl: Boolean(supabaseUrl),
    hasKey: hasKey,
    dbConnected,
    error: errorMsg,
    mode: 'server-api-ready',
  });
}
