import { CATALOG, Product } from './catalog';

export type HeuristicResult = { items: { id: string; qty: number }[]; reply: string };

const SYNONYMS: { words: RegExp; tags: string[]; boost?: number }[] = [
  { words: /girl|girlfriend|wife|mom|mother|her|女生|女友|女朋友/i, tags: ['beauty', 'food'], boost: 2 },
  { words: /boy|boyfriend|husband|dad|father|him|男生|男友/i, tags: ['tech', 'food'], boost: 2 },
  { words: /desk|office|work|study|办公|书桌/i, tags: ['tech', 'home'], boost: 2 },
  { words: /fitness|gym|workout|sport|run|健身|运动/i, tags: ['sports'], boost: 3 },
  { words: /gift|present|birthday|anniversary|礼物|生日/i, tags: ['beauty', 'food', 'home'], boost: 2 },
  { words: /coffee|tea|mug|咖啡/i, tags: ['home'], boost: 3 },
  { words: /music|audio|headphone|earbud|listen|音乐|耳机/i, tags: ['tech'], boost: 4 },
  { words: /chocolate|choco|candy|sweet|糖|巧克力/i, tags: ['food'], boost: 4 },
  { words: /perfume|fragrance|scent|香水/i, tags: ['beauty'], boost: 4 },
  { words: /plant|flower|green|植物|花/i, tags: ['home'], boost: 3 },
  { words: /cloth|wear|tee|shirt|sock|fashion|穿|衣服/i, tags: ['fashion'], boost: 3 },
  { words: /water|bottle|hydration|水/i, tags: ['sports'], boost: 3 },
  { words: /charge|power|battery|充电/i, tags: ['tech'], boost: 4 },
  { words: /light|lamp|mood|氛围|灯/i, tags: ['home'], boost: 3 },
];

function scoreProduct(p: Product, message: string, boosts: Map<string, number>): number {
  let score = 0;
  const msg = message.toLowerCase();
  const nameWords = p.name.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  for (const w of nameWords) if (msg.includes(w)) score += 3;
  if (msg.includes(p.category)) score += 2;
  const synBoost = boosts.get(p.category) || 0;
  score += synBoost;
  return score;
}

export function heuristicCart(message: string, clearOnly = false): HeuristicResult {
  const msg = message;

  if (clearOnly || /\b(clear|empty|remove all|wipe)\b.*\bcart\b|\bcart\b.*\b(clear|empty)\b|清空/i.test(msg)) {
    return { items: [], reply: 'Cart cleared.' };
  }

  const budgetMatch = msg.match(/(?:under|below|within|max|budget(?: of)?|no more than|up to)\s*\$?\s*(\d+(?:\.\d+)?)|\$\s*(\d+(?:\.\d+)?)\s*(?:or less|budget|total)?/i);
  const budget = budgetMatch ? parseFloat(budgetMatch[1] || budgetMatch[2]) : Infinity;

  const boosts = new Map<string, number>();
  for (const s of SYNONYMS) {
    if (s.words.test(msg)) {
      for (const t of s.tags) boosts.set(t, Math.max(boosts.get(t) || 0, s.boost || 2));
    }
  }

  const removeWords = /\b(no|without|not|skip|remove|drop)\b\s+([a-z]+)/gi;
  const excluded = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = removeWords.exec(msg))) excluded.add(m[2]);

  const candidates = CATALOG.map((p) => ({ p, score: scoreProduct(p, msg, boosts) }))
    .filter(({ p }) => !excluded.has(p.name.toLowerCase().split(' ')[0].toLowerCase()))
    .sort((a, b) => b.score - a.score);

  const qtyMatch = msg.match(/(\d+)\s*(?:x|pcs|pieces|sets?|pack)/i);
  const qty = qtyMatch ? Math.min(20, Math.max(1, parseInt(qtyMatch[1], 10))) : 1;

  const items: { id: string; qty: number }[] = [];
  let total = 0;
  const maxItems = Math.min(5, Math.max(1, candidates.length));
  let bestName = '';
  for (const { p } of candidates) {
    if (items.length >= maxItems) break;
    const line = p.price * qty;
    if (total + line > budget) continue;
    items.push({ id: p.id, qty });
    total += line;
    if (!bestName) bestName = p.name;
    if (items.length >= 3 && total >= budget * 0.6) break;
  }

  if (!items.length && candidates.length && budget < candidates[0].p.price) {
    const cheapest = [...CATALOG].sort((a, b) => a.price - b.price)[0];
    items.push({ id: cheapest.id, qty: 1 });
    return {
      items,
      reply: `Nothing in the catalog fits $${budget.toFixed(0)}, so I picked the most affordable option: ${cheapest.name} ($${cheapest.price}).`,
    };
  }

  const names = items
    .map((it) => CATALOG.find((c) => c.id === it.id)?.name)
    .filter(Boolean)
    .join(', ');
  const reply = items.length
    ? `Picked for you: ${names}${Number.isFinite(budget) ? ` — total $${total.toFixed(2)} under your $${budget.toFixed(0)} budget` : ''}. (Offline assist — AI endpoint unreachable.)`
    : "I couldn't match anything from the catalog — try mentioning a budget, occasion, or category.";

  return { items, reply };
}
