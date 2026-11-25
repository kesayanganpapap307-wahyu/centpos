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
  const products = (data || []).map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    barcode: p.barcode,
    buyPrice: Number(p.buy_price || 0),
    sellPrice: Number(p.sell_price || 0),
    stock: Number(p.stock || 0),
    unit: p.unit || 'pcs',
    color: p.color || 'bg-emerald-500',
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
      category: body.category || 'Lainnya',
      barcode: body.barcode || null,
      buy_price: body.buyPrice || 0,
      sell_price: body.sellPrice || 0,
      stock: body.stock || 0,
      unit: body.unit || 'pcs',
      color: body.color || 'bg-emerald-500',
      updated_at: new Date().toISOString(),
    };

    // If UUID (not a temporary client id like prd-123)
    const isRealUuid =
      body.id &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id);

    if (isRealUuid) {
      const { data, error } = await supabase
        .from('products')
        .upsert({ id: body.id, ...payload })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({
        id: data.id,
        name: data.name,
        category: data.category,
        barcode: data.barcode,
        buyPrice: Number(data.buy_price),
        sellPrice: Number(data.sell_price),
        stock: Number(data.stock),
        unit: data.unit,
        color: data.color,
      });
    } else {
      const { data, error } = await supabase
        .from('products')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({
        id: data.id,
        name: data.name,
        category: data.category,
        barcode: data.barcode,
        buyPrice: Number(data.buy_price),
        sellPrice: Number(data.sell_price),
        stock: Number(data.stock),
        unit: data.unit,
        color: data.color,
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE product from Supabase
export async function DELETE(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const isRealUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (isRealUuid) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
