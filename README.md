# Agentic Cart

**Talk to an AI agent, build a cart, and check out with PayPal sandbox.**

Built for the [PayPal AI Hackathon: Build what's next with PayPal and AI](https://paypalaihackathon.devpost.com/).

Tell the agent what you want — *"a gift for my girlfriend under $100"*, *"desk setup essentials under $60"* — and it picks from the store catalog, builds your cart, and takes you through a real PayPal sandbox checkout. Captured orders land in an AG Grid order history.

## How it works

```
You ──natural language──▶ AI agent ──structured cart──▶ Your cart (AG Grid, editable)
                                                          │
                                                          ▼
                                              PayPal Orders API (sandbox)
                                              create → approve → capture
                                                          │
                                                          ▼
                                              Order history (AG Grid)
```

1. **Agent** (`/api/agent`): an LLM parses your request against the product catalog and returns a full cart (OpenAI-compatible API; defaults to a free endpoint, no key required).
2. **Checkout** (`/api/paypal/order`, `/api/paypal/capture`): the server prices items from the catalog (client prices are never trusted), creates a PayPal order, and captures it after you approve in the sandbox flow.
3. **Order history** (`/api/orders`): captured sandbox payments are stored locally and displayed in AG Grid.

## Tech stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS 4)
- **PayPal JavaScript SDK** + **Orders API v2** (sandbox)
- **AG Grid 36** (cart editing + order history)
- **Any OpenAI-compatible LLM** (defaults to `text.pollinations.ai` — zero setup)

## Quick start

```bash
git clone <repo-url> agentic-cart
cd agentic-cart
npm install
cp .env.example .env.local   # then fill in your values (see below)
npm run dev
```

Open http://localhost:3000 and ask the agent to build your cart.

### Environment variables (`.env.local`)

| Variable | Required | Where to get it |
| --- | --- | --- |
| `PAYPAL_CLIENT_ID` | yes | [developer.paypal.com](https://developer.paypal.com) → Apps & Credentials → your sandbox app |
| `PAYPAL_CLIENT_SECRET` | yes | same page (click *Show*) |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | yes | same as `PAYPAL_CLIENT_ID` (public, safe to expose) |
| `LLM_API_URL` | no | OpenAI-compatible endpoint. Default: `https://text.pollinations.ai/openai` (works without a key) |
| `LLM_API_KEY` | no | only if your LLM endpoint needs one |
| `LLM_MODEL` | no | model name for your endpoint (default `openai`) |

### PayPal sandbox

1. Create a free account at [developer.paypal.com](https://developer.paypal.com).
2. Create a **REST App** in *Apps & Credentials → Sandbox* (or use the default app).
3. Copy the **Client ID** and **Secret** into `.env.local`.
4. Pay with the sandbox test card on the PayPal sheet, or log in with a sandbox buyer account (Testing Tools → sandbox accounts).

## AI tools used

- **LLM via OpenAI-compatible API** — the agent that turns natural language into a validated cart (catalog-grounded, budget-aware).
- Built and iterated with AI coding assistants.

## AG Grid usage

- **Cart**: inline quantity editing with validation (1–20), live line totals, remove actions.
- **Order history**: captured sandbox payments with status chips and PayPal deep links.

## License

MIT — see [LICENSE](./LICENSE).
