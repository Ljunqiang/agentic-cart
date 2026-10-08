import { NextRequest, NextResponse } from 'next/server';
import { CATALOG, findProduct } from '@/lib/catalog';
import { chat, extractJson } from '@/lib/llm';
import { heuristicCart } from '@/lib/heuristic';

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are Agentic Cart, a shopping agent inside a demo store.
You help the user build a shopping cart by choosing from the product catalog below.

Rules:
- Only pick products that exist in the catalog (use their exact id).
- Respect budget, preferences, occasion and recipient hints from the user message.
- Pick sensible quantities (default 1 unless told otherwise).
- Reply with a short friendly message (max 3 sentences) explaining your picks, then the JSON.
- The items array is the FULL new cart state: keep items already in the current cart unless the user asked to remove or replace them, and add new picks.
- If the user wants to remove items, output the remaining cart (or an empty array if they want to clear it).
- Never output prices; the system computes them.

Catalog:
CATALOG_JSON

Respond with EXACTLY this JSON shape and nothing else:
{"reply":"<short friendly message>","items":[{"id":"<catalog id>","qty":1}]}`;

function parseItems(raw: unknown): { id: string; qty: number }[] {
  if (!raw || typeof raw !== 'object') return [];
  const items = (raw as { items?: unknown }).items;
  if (!Array.isArray(items)) return [];
  return items
    .map((it) => {
      const o = it as { id?: unknown; qty?: unknown };
      const id = typeof o.id === 'string' ? o.id : '';
      const qty = Math.max(1, Math.min(20, Number(o.qty) || 1));
      return { id, qty };
    })
    .filter((it) => !!findProduct(it.id))
    .slice(0, 12);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const currentCart = Array.isArray(body.cart) ? body.cart : [];
    if (!message) return NextResponse.json({ error: 'Empty message' }, { status: 400 });

    const system = SYSTEM_PROMPT.replace('CATALOG_JSON', JSON.stringify(CATALOG, null, 1));
    const history = Array.isArray(body.history)
      ? body.history.slice(-6).filter((m: { role?: string; content?: string }) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      : [];

    let content: string;
    try {
      content = await chat(
        [
          { role: 'system', content: system },
          ...history,
          { role: 'user', content: `Current cart: ${JSON.stringify(currentCart)}\n\nUser message: ${message}` },
        ],
        { temperature: 0.3 }
      );
    } catch (llmErr) {
      const fb = heuristicCart(message, /clear/i.test(message));
      return NextResponse.json({
        reply: fb.reply,
        items: fb.items,
        itemsProvided: true,
        offline: true,
        llmError: String(llmErr instanceof Error ? llmErr.message : llmErr).slice(0, 300),
      });
    }

    let parsed: unknown;
    try {
      parsed = extractJson(content);
    } catch {
      return NextResponse.json({ reply: content.slice(0, 500), items: null });
    }

    const reply = typeof (parsed as { reply?: string }).reply === 'string' ? (parsed as { reply: string }).reply : content.slice(0, 500);
    const items = parseItems(parsed);
    return NextResponse.json({ reply, items, itemsProvided: Array.isArray((parsed as { items?: unknown }).items) });
  } catch (e) {
    return NextResponse.json({ error: String(e instanceof Error ? e.message : e).slice(0, 400) }, { status: 500 });
  }
}
