import { NextRequest, NextResponse } from 'next/server';
import { findProduct } from '@/lib/catalog';
import { capturePayPalOrder } from '@/lib/paypal';
import { saveOrder, StoredOrder } from '@/lib/store';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const paypalOrderId = typeof body.orderId === 'string' ? body.orderId : '';
    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (!paypalOrderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });

    const result = await capturePayPalOrder(paypalOrderId);

    const items: StoredOrder['items'] = [];
    for (const it of rawItems) {
      const id = typeof it?.id === 'string' ? it.id : '';
      const qty = Math.max(1, Math.min(20, Number(it?.qty) || 0));
      const product = findProduct(id);
      if (!product) continue;
      items.push({ id: product.id, name: product.name, qty, unitPrice: product.price });
    }
    const total = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);

    const stored: StoredOrder = {
      id: `${paypalOrderId}-${Date.now()}`,
      paypalOrderId,
      items,
      total,
      status: result.status,
      payerEmail: result.payerEmail,
      createdAt: new Date().toISOString(),
    };
    if (result.status === 'COMPLETED') saveOrder(stored);

    return NextResponse.json({ ...result, order: result.status === 'COMPLETED' ? stored : null });
  } catch (e) {
    return NextResponse.json({ error: String(e instanceof Error ? e.message : e).slice(0, 500) }, { status: 500 });
  }
}
