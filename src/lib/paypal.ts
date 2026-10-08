const API_BASE = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30000) return tokenCache.token;

  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status} ${await res.text().catch(() => '')}`);
  const data = await res.json();
  tokenCache = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

async function api(path: string, init?: RequestInit): Promise<unknown> {
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    signal: AbortSignal.timeout(30000),
  });
  const text = await res.text();
  let data: unknown = null;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) throw new Error(`PayPal API ${init?.method || 'GET'} ${path} failed: ${res.status} ${text.slice(0, 400)}`);
  return data;
}

export type PurchaseItem = { name: string; qty: number; unitPrice: number };

export async function createPayPalOrder(items: PurchaseItem[], description: string): Promise<{ id: string; status: string; approveUrl: string | null }> {
  const total = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
  const value = total.toFixed(2);
  const data = (await api('/v2/checkout/orders', {
    method: 'POST',
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          description,
          amount: {
            currency_code: 'USD',
            value,
            breakdown: { item_total: { currency_code: 'USD', value } },
          },
          items: items.map((it) => ({
            name: it.name.slice(0, 120),
            unit_amount: { currency_code: 'USD', value: it.unitPrice.toFixed(2) },
            quantity: String(it.qty),
            category: 'PHYSICAL_GOODS',
          })),
        },
      ],
    }),
  })) as { id: string; status: string; links?: { rel: string; href: string }[] };

  const approveUrl = data.links?.find((l) => l.rel === 'approve')?.href ?? null;
  return { id: data.id, status: data.status, approveUrl };
}

export async function capturePayPalOrder(orderId: string): Promise<{
  id: string;
  status: string;
  payerEmail: string | null;
  grossAmount: string | null;
}> {
  const data = (await api(`/v2/checkout/orders/${orderId}/capture`, { method: 'POST', body: '{}' })) as {
    id: string;
    status: string;
    payer?: { email_address?: string };
    purchase_units?: { payments?: { captures?: { amount?: { value?: string } }[] } }[];
  };
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    id: data.id,
    status: data.status,
    payerEmail: data.payer?.email_address ?? null,
    grossAmount: capture?.amount?.value ?? null,
  };
}
