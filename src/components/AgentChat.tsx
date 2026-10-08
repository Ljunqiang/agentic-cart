'use client';

import { useEffect, useRef, useState } from 'react';

export type CartItem = { id: string; qty: number };
export type ChatMsg = { role: 'user' | 'assistant'; content: string };

type Props = {
  cart: CartItem[];
  onApplyItems: (items: CartItem[]) => void;
};

export default function AgentChat({ cart, onApplyItems }: Props) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your shopping agent. Tell me what you need — a gift, a budget, an occasion — and I'll build your cart. Try one of the suggestions below.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || loading) return;
    setInput('');
    setError('');
    const nextMessages: ChatMsg[] = [...messages, { role: 'user', content: message }];
    setMessages(nextMessages);
    setLoading(true);
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          cart,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply || 'Done!' }]);
      if (Array.isArray(data.items)) onApplyItems(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  const suggestions = [
    'A gift for my girlfriend under $100',
    'Desk setup essentials under $60',
    'Starter fitness kit',
    'Clear my cart',
  ];

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-black/40 backdrop-blur">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400/20 text-sm">🤖</span>
        <div>
          <div className="text-sm font-semibold text-white">Agentic Cart</div>
          <div className="text-[11px] text-emerald-300/80">AI shopping agent · online</div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={
                'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ' +
                (m.role === 'user'
                  ? 'rounded-br-md bg-indigo-500 text-white'
                  : 'rounded-bl-md bg-white/10 text-gray-100')
              }
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-white/10 px-3.5 py-2.5 text-sm text-gray-300">
              <span className="inline-flex gap-1">
                <span className="animate-bounce [animation-delay:0ms]">●</span>
                <span className="animate-bounce [animation-delay:150ms]">●</span>
                <span className="animate-bounce [animation-delay:300ms]">●</span>
              </span>
            </div>
          </div>
        )}
        {error && <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>}
      </div>

      <div className="border-t border-white/10 px-3 pb-2 pt-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              disabled={loading}
              className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-gray-300 transition hover:border-indigo-400/60 hover:text-white disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Ask the agent to build your cart…"
            className="flex-1 rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-400/70"
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
