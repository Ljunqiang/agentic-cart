import fs from 'fs';
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

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'orders.json');

function readAll(): StoredOrder[] {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8')) as StoredOrder[];
  } catch {
    return [];
  }
}

function writeAll(orders: StoredOrder[]): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(orders, null, 2));
}

export function listOrders(): StoredOrder[] {
  return readAll().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function saveOrder(order: StoredOrder): void {
  const orders = readAll().filter((o) => o.id !== order.id && o.paypalOrderId !== order.paypalOrderId);
  orders.push(order);
  writeAll(orders);
}
