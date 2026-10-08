'use client';

import { useCallback, useEffect, useState } from 'react';
import AgentChat, { CartItem } from '@/components/AgentChat';
import CartGrid from '@/components/CartGrid';
import CheckoutButton from '@/components/CheckoutButton';
import OrdersGrid from '@/components/OrdersGrid';
import { findProduct } from '@/lib/catalog';

type StoredOrder = {
  id: string;
  paypalOrderId: string;
  items: { name: string; qty: number; unitPrice: number }[];
  total: number;
  status: string;
  payerEmail: string | null;
  createdAt: string;
};

export default function Home() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<StoredOrder[]>([]);

  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (res.ok && Array.isArray(data.orders)) setOrders(data.orders);
    } catch {}
  }, []);

  useEffect(() => {
    fetch('/api/orders')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.orders)) setOrders(d.orders);
      })
      .catch(() => {});
  }, []);

  const total = cart.reduce((s, it) => {
    const p = findProduct(it.id);
    return s + (p ? p.price * it.qty : 0);
  }, 0);

  return (
    <div className="min-h-screen bg-[#07070d] text-gray-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.18),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.12),transparent_50%)]" />

      <header className="relative border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 text-lg shadow-lg shadow-indigo-500/25">🛒</span>
            <div>
              <div className="text-base font-bold tracking-tight text-white">Agentic Cart</div>
              <div className="text-[11px] text-gray-400">AI shopping agent × PayPal sandbox</div>
            </div>
          </div>
          <div className="hidden items-center gap-3 text-[11px] text-gray-400 sm:flex">
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">PayPal AI Hackathon</span>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-300">sandbox mode</span>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-6 pb-16 pt-8">
        <section className="mb-8 max-w-3xl">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
            Shop with words. <span className="bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">Pay with PayPal.</span>
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-400 sm:text-base">
            Tell the agent what you want — a gift, a budget, a vibe. It picks from the catalog, builds your cart, and takes you through a real PayPal sandbox checkout. Orders land in the grid below.
          </p>
        </section>

        <div className="grid gap-5 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="h-[640px]">
              <AgentChat cart={cart} onApplyItems={setCart} />
            </div>
          </div>

          <div className="space-y-5 lg:col-span-8">
            <CartGrid cart={cart} onChange={setCart} />
            <CheckoutButton
              items={cart}
              total={total}
              onCompleted={() => {
                loadOrders();
                setCart([]);
              }}
            />
            <OrdersGrid orders={orders} />
          </div>
        </div>

        <footer className="mt-12 border-t border-white/10 pt-6 text-center text-[11px] text-gray-500">
          Built for the PayPal AI Hackathon · All payments run in sandbox · No real money moves
        </footer>
      </main>
    </div>
  );
}
