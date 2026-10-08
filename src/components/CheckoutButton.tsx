'use client';

import { useEffect, useRef, useState } from 'react';
import type { CartItem } from './CartGrid';

declare global {
  interface Window {
    paypal?: {
      Buttons: (opts: Record<string, unknown>) => { render: (el: string | HTMLElement) => Promise<void> };
    };
  }
}

type Props = {
  items: CartItem[];
  total: number;
  onCompleted: () => void;
};

const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';

export default function CheckoutButton({ items, total, onCompleted }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'idle' | 'loading-sdk' | 'ready' | 'working' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const itemsRef = useRef(items);
  const onCompletedRef = useRef(onCompleted);
  const sdkLoaded = useRef(false);

  useEffect(() => {
    itemsRef.current = items;
    onCompletedRef.current = onCompleted;
  });

  const disabled = items.length === 0 || total <= 0;

  useEffect(() => {
    if (disabled || !containerRef.current) return;
    let cancelled = false;

    async function renderButtons() {
      if (!window.paypal) return;
      if (cancelled || !containerRef.current) return;
      containerRef.current.innerHTML = '';
      try {
        await window.paypal!.Buttons({
          style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal', height: 44 },
          createOrder: async () => {
            setStatus('working');
            setMessage('Creating PayPal order…');
            const res = await fetch('/api/paypal/order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ items: itemsRef.current }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create order');
            return data.id;
          },
          onApprove: async (data: { orderID: string }) => {
            setMessage('Capturing payment…');
            const res = await fetch('/api/paypal/capture', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: data.orderID, items: itemsRef.current }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Capture failed');
            if (result.status !== 'COMPLETED') throw new Error(`Capture status: ${result.status}`);
            setStatus('done');
            setMessage(`Payment captured! Order ${data.orderID.slice(0, 12)}…`);
            onCompletedRef.current();
          },
          onError: (err: unknown) => {
            setStatus('error');
            setMessage(String(err).slice(0, 200));
          },
          onCancel: () => {
            setStatus('ready');
            setMessage('Checkout cancelled — you can try again.');
          },
        }).render(containerRef.current);
        if (!cancelled) {
          setStatus('ready');
          setMessage('');
        }
      } catch (e) {
        if (!cancelled) {
          setStatus('error');
          setMessage(e instanceof Error ? e.message : 'Button render failed');
        }
      }
    }

    if (window.paypal) {
      renderButtons();
    } else if (!sdkLoaded.current && CLIENT_ID) {
      sdkLoaded.current = true;
      setStatus('loading-sdk');
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(CLIENT_ID)}&currency=USD&intent=capture`;
      script.onload = () => renderButtons();
      script.onerror = () => {
        if (!cancelled) {
          setStatus('error');
          setMessage('Failed to load PayPal SDK');
        }
      };
      document.body.appendChild(script);
    }

    return () => {
      cancelled = true;
    };
  }, [disabled]);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Checkout</h2>
          <p className="text-[11px] text-gray-400">Pay with PayPal sandbox · test card or sandbox account</p>
        </div>
        <div className="text-right text-[11px] text-gray-400">
          Total <span className="text-sm font-bold text-white">${total.toFixed(2)}</span>
        </div>
      </div>

      {disabled && (
        <div className="rounded-xl border border-dashed border-white/15 px-4 py-5 text-center text-sm text-gray-400">
          Add items to the cart to enable checkout
        </div>
      )}

      {!disabled && (
        <>
          <div ref={containerRef} id="paypal-button-container" className="min-h-[50px]" />
          {status === 'loading-sdk' && <div className="text-xs text-gray-400">Loading PayPal SDK…</div>}
          {status === 'working' && <div className="text-xs text-amber-300">{message || 'Working…'}</div>}
          {status === 'done' && (
            <div className="mt-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
              ✅ {message}
            </div>
          )}
          {status === 'error' && (
            <div className="mt-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">❌ {message}</div>
          )}
          {status === 'ready' && message && <div className="mt-2 text-xs text-gray-400">{message}</div>}
        </>
      )}

      {!CLIENT_ID && (
        <div className="mt-2 text-[11px] text-amber-300/80">NEXT_PUBLIC_PAYPAL_CLIENT_ID not set — copy .env.example to .env.local</div>
      )}
    </div>
  );
}
