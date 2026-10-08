const API_URLS = (process.env.LLM_API_URL || 'https://text.pollinations.ai/openai')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const API_KEY = process.env.LLM_API_KEY || '';
const MODEL = process.env.LLM_MODEL || 'openai';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

async function once(url: string, messages: ChatMessage[], opts?: { temperature?: number; maxTokens?: number }): Promise<string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (API_KEY) headers['Authorization'] = `Bearer ${API_KEY}`;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: opts?.temperature ?? 0.4,
      max_tokens: opts?.maxTokens ?? 900,
    }),
    signal: AbortSignal.timeout(45000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content) {
    throw new Error('empty response');
  }
  return content;
}

export async function chat(messages: ChatMessage[], opts?: { temperature?: number; maxTokens?: number }): Promise<string> {
  const errors: string[] = [];
  for (const url of API_URLS) {
    try {
      return await once(url, messages, opts);
    } catch (e) {
      errors.push(`${url}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  throw new Error(`All LLM endpoints failed — ${errors.join(' | ')}`.slice(0, 500));
}

export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON found in LLM response');
  return JSON.parse(raw.slice(start, end + 1));
}
