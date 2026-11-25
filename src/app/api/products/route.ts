import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET all products from Supabase
export async function GET() {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Format to client model
  const products = data.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    barcode: p.barcode,
    buyPrice: Number(p.buy_price),
    sellPrice: Number(p.sell_price),
    stock: Number(p.stock),
    unit: p.unit,
    color: p.color,
  }));

  return NextResponse.json(products);
}

// POST or update products to Supabase
export async function POST(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const payload = {
      name: body.name,
      category: body.category,
      barcode: body.barcode,
      buy_price: body.buyPrice,
      sell_price: body.sellPrice,
      stock: body.stock,
      unit: body.unit,
      color: body.color,
      updated_at: new Date().toISOString(),
    };

    if (body.id && !body.id.startsWith('prd-')) {
      const { data, error } = await supabase
        .from('products')
        .upsert({ id: body.id, ...payload })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    } else {
      const { data, error } = await supabase
        .from('products')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
