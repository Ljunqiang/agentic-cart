import fs from 'fs';
import os from 'os';
import path from 'path';

export type StoredOrder = {
  id: string;
  paypalOrderId: string;
  items: { id: string; name: string; qty: number; unitPrice: number }[];
  total: number;
  status: string;
  payerEmail: string | null;
  createdAt: string;
};

const CANDIDATES: string[] = [
  ...(process.env.ORDERS_DIR ? [path.join(process.env.ORDERS_DIR, 'orders.json')] : []),
  path.join(process.cwd(), 'data', 'orders.json'),
  path.join(os.tmpdir(), 'agentic-cart', 'orders.json'),
];

let activeFile: string | null = null;

function resolveFile(): string {
  if (activeFile) return activeFile;
  for (const file of CANDIDATES) {
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const probe = file + '.probe';
      fs.writeFileSync(probe, 'ok');
      fs.unlinkSync(probe);
      activeFile = file;
      return file;
    } catch {
      // try next candidate (e.g. read-only filesystem on serverless hosts)
    }
  }
  activeFile = CANDIDATES[CANDIDATES.length - 1];
  return activeFile;
}

function readAll(): StoredOrder[] {
  try {
    return JSON.parse(fs.readFileSync(resolveFile(), 'utf8')) as StoredOrder[];
  } catch {
    return [];
  }
}

function writeAll(orders: StoredOrder[]): void {
  try {
    const file = resolveFile();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(orders, null, 2));
  } catch {
    // storage must never break checkout; order is still captured at PayPal
  }
}

export function listOrders(): StoredOrder[] {
  return readAll().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function saveOrder(order: StoredOrder): void {
  try {
    const orders = readAll().filter((o) => o.id !== order.id && o.paypalOrderId !== order.paypalOrderId);
    orders.push(order);
    writeAll(orders);
  } catch {
    // ignore
  }
}
