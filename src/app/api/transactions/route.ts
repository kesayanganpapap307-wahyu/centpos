import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET transactions from Supabase
export async function GET() {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('*, transaction_items(*)')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const transactions = data.map((t) => ({
    id: t.id,
    invoiceNumber: t.invoice_number,
    createdAt: t.created_at,
    cashierName: t.cashier_name,
    customerName: t.customer_name,
    subtotal: Number(t.subtotal),
    discountAmount: Number(t.discount_amount),
    taxAmount: Number(t.tax_amount),
    totalAmount: Number(t.total_amount),
    paymentMethod: t.payment_method,
    amountPaid: Number(t.amount_paid),
    changeAmount: Number(t.change_amount),
    items: (t.transaction_items || []).map((item: any) => ({
      productId: item.product_id,
      productName: item.product_name,
      quantity: Number(item.quantity),
      sellPrice: Number(item.sell_price),
      subtotal: Number(item.subtotal),
    })),
  }));

  return NextResponse.json(transactions);
}

// POST new transaction to Supabase
export async function POST(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();

    // 1. Insert transaction
    const { data: trxData, error: trxError } = await supabase
      .from('transactions')
      .insert({
        invoice_number: body.invoiceNumber,
        cashier_name: body.cashierName,
        customer_name: body.customerName,
        subtotal: body.subtotal,
        discount_amount: body.discountAmount,
        tax_amount: body.taxAmount,
        total_amount: body.totalAmount,
        payment_method: body.paymentMethod,
        amount_paid: body.amountPaid,
        change_amount: body.changeAmount,
      })
      .select()
      .single();

    if (trxError) throw trxError;

    // 2. Insert transaction items
    if (body.items && body.items.length > 0) {
      const itemsPayload = body.items.map((item: any) => ({
        transaction_id: trxData.id,
        product_name: item.productName,
        quantity: item.quantity,
        sell_price: item.sellPrice,
        subtotal: item.subtotal,
      }));

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(itemsPayload);

      if (itemsError) throw itemsError;
    }

    return NextResponse.json({ success: true, transaction: trxData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
