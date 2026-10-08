import { NextRequest, NextResponse } from 'next/server';
import { findProduct } from '@/lib/catalog';
import { createPayPalOrder, PurchaseItem } from '@/lib/paypal';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawItems = Array.isArray(body.items) ? body.items : [];

    const items: PurchaseItem[] = [];
    for (const it of rawItems) {
      const id = typeof it?.id === 'string' ? it.id : '';
      const qty = Math.max(1, Math.min(20, Number(it?.qty) || 0));
      const product = findProduct(id);
      if (!product || qty < 1) continue;
      items.push({ name: product.name, qty, unitPrice: product.price });
    }
    if (!items.length) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });

    const description = items.map((it) => `${it.qty}x ${it.name}`).join(', ').slice(0, 120);
    const order = await createPayPalOrder(items, description);
    return NextResponse.json(order);
  } catch (e) {
    return NextResponse.json({ error: String(e instanceof Error ? e.message : e).slice(0, 500) }, { status: 500 });
  }
}
