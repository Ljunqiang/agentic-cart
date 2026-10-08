'use client';

import { useMemo } from 'react';
import { AllCommunityModule, ModuleRegistry, ValidationModule } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule, ValidationModule]);
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';



type Order = {
  id: string;
  paypalOrderId: string;
  items: { name: string; qty: number; unitPrice: number }[];
  total: number;
  status: string;
  payerEmail: string | null;
  createdAt: string;
};

type Row = {
  createdAt: string;
  summary: string;
  count: number;
  total: number;
  status: string;
  payerEmail: string | null;
  paypalOrderId: string;
};

type Props = { orders: Order[] };

export default function OrdersGrid({ orders }: Props) {
  const rows = useMemo<Row[]>(
    () =>
      orders.map((o) => ({
        createdAt: new Date(o.createdAt).toLocaleString(),
        summary: o.items.map((i) => `${i.qty}× ${i.name}`).join(', ').slice(0, 90),
        count: o.items.reduce((s, i) => s + i.qty, 0),
        total: o.total,
        status: o.status,
        payerEmail: o.payerEmail,
        paypalOrderId: o.paypalOrderId,
      })),
    [orders]
  );

  const columnDefs = useMemo(
    () => [
      { field: 'createdAt' as const, headerName: 'When', width: 165 },
      { field: 'summary' as const, headerName: 'Items', flex: 1, minWidth: 200 },
      { field: 'count' as const, width: 75 },
      { field: 'total' as const, width: 100, valueFormatter: (p: { value?: number }) => `$${(p.value ?? 0).toFixed(2)}` },
      {
        field: 'status' as const,
        width: 120,
        cellRenderer: (p: { value?: string }) => (
          <span className={'rounded-full px-2 py-0.5 text-[11px] ' + (p.value === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-gray-300')}>
            {p.value}
          </span>
        ),
      },
      { field: 'payerEmail' as const, headerName: 'Payer', width: 200 },
      {
        field: 'paypalOrderId' as const,
        headerName: 'PayPal ID',
        width: 150,
        cellRenderer: (p: { value?: string }) =>
          p.value ? (
            <a
              href={`https://sandbox.paypal.com/checkoutnow?token=${p.value}`}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-300 underline-offset-2 hover:underline"
            >
              {p.value.slice(0, 10)}…
            </a>
          ) : null,
      },
    ],
    []
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Order history</h2>
          <p className="text-[11px] text-gray-400">Captured sandbox payments · AG Grid view</p>
        </div>
        <span className="rounded-full bg-indigo-500/20 px-2.5 py-1 text-[11px] text-indigo-300">{orders.length} orders</span>
      </div>
      <div className="ag-theme-quartz h-[220px] w-full rounded-xl border border-white/10 [--ag-background-color:transparent] [--ag-foreground-color:#e5e7eb] [--ag-border-color:rgba(255,255,255,0.08)] [--ag-header-background-color:rgba(255,255,255,0.04)] [--ag-odd-row-background-color:transparent] [--ag-row-hover-color:rgba(99,102,241,0.12)] [--ag-font-family:inherit]">
        <AgGridReact<Row> theme="legacy"
          rowData={rows}
          columnDefs={columnDefs}
          animateRows
          domLayout="autoHeight"
          getRowId={(p) => p.data.paypalOrderId + p.data.createdAt}
          overlayNoRowsTemplate="<span style='color:#9ca3af'>No orders yet — complete a sandbox checkout</span>"
        />
      </div>
    </div>
  );
}
