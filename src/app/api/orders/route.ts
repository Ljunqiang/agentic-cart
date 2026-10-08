import { NextResponse } from 'next/server';
import { connection } from 'next/server';
import { listOrders } from '@/lib/store';

export async function GET() {
  await connection();
  return NextResponse.json({ orders: listOrders() });
}
