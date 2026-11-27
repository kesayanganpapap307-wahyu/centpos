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
    agentPrice: p.agent_price ? Number(p.agent_price) : undefined,
    memberPrice: p.member_price ? Number(p.member_price) : undefined,
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
    const payload: Record<string, any> = {
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

    if (body.agentPrice !== undefined) payload.agent_price = body.agentPrice || null;
    if (body.memberPrice !== undefined) payload.member_price = body.memberPrice || null;

    // If UUID (not a temporary client id like prd-123)
    const isRealUuid =
      body.id &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id);

    let dataResult: any = null;

    if (isRealUuid) {
      let { data, error } = await supabase
        .from('products')
        .upsert({ id: body.id, ...payload })
        .select()
        .single();

      if (error && error.message?.toLowerCase().includes('column')) {
        // Fallback jika column agent_price belum dibuat di Supabase
        delete payload.agent_price;
        delete payload.member_price;
        const retry = await supabase
          .from('products')
          .upsert({ id: body.id, ...payload })
          .select()
          .single();
        if (retry.error) throw retry.error;
        dataResult = retry.data;
      } else if (error) {
        throw error;
      } else {
        dataResult = data;
      }
    } else {
      let { data, error } = await supabase
        .from('products')
        .insert(payload)
        .select()
        .single();

      if (error && error.message?.toLowerCase().includes('column')) {
        delete payload.agent_price;
        delete payload.member_price;
        const retry = await supabase
          .from('products')
          .insert(payload)
          .select()
          .single();
        if (retry.error) throw retry.error;
        dataResult = retry.data;
      } else if (error) {
        throw error;
      } else {
        dataResult = data;
      }
    }

    return NextResponse.json({
      id: dataResult.id,
      name: dataResult.name,
      category: dataResult.category,
      barcode: dataResult.barcode,
      buyPrice: Number(dataResult.buy_price),
      sellPrice: Number(dataResult.sell_price),
      agentPrice: dataResult.agent_price ? Number(dataResult.agent_price) : body.agentPrice,
      memberPrice: dataResult.member_price ? Number(dataResult.member_price) : body.memberPrice,
      stock: Number(dataResult.stock),
      unit: dataResult.unit,
      color: dataResult.color,
    });
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
