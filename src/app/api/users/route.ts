import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET all users from Supabase for authentication verification
export async function GET() {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, display_name, email, password, pin, role, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

// POST: Register new user to Supabase
export async function POST(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { display_name, email, password, pin, role } = body;

    if (!display_name || !email || !password || !pin) {
      return NextResponse.json(
        { error: 'display_name, email, password, dan pin wajib diisi.' },
        { status: 400 }
      );
    }

    const payload = {
      display_name: display_name.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
      pin: pin.trim(),
      role: role || 'cashier',
    };

    const { data, error } = await supabase
      .from('users')
      .insert(payload)
      .select('id, display_name, email, pin, role, created_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mendaftarkan pengguna';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
