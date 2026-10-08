'use client';

import { useMemo } from 'react';
import { AllCommunityModule, ModuleRegistry, ValidationModule } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule, ValidationModule]);
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { CATALOG, findProduct } from '@/lib/catalog';



export type CartItem = { id: string; qty: number };

type Row = {
  id: string;
  emoji: string;
  name: string;
  qty: number;
  price: number;
  lineTotal: number;
};

type Props = {
  cart: CartItem[];
  onChange: (cart: CartItem[]) => void;
};

export default function CartGrid({ cart, onChange }: Props) {
  const rows = useMemo<Row[]>(
    () =>
      cart
        .map((it) => {
          const p = findProduct(it.id);
          if (!p) return null;
          return { id: p.id, emoji: p.emoji, name: p.name, qty: it.qty, price: p.price, lineTotal: +(p.price * it.qty).toFixed(2) };
        })
        .filter(Boolean) as Row[],
    [cart]
  );

  const columnDefs = useMemo(
    () => [
      {
        field: 'emoji' as const,
        width: 60,
        sortable: false,
        valueGetter: (p: { data?: Row }) => p.data?.emoji ?? '',
      },
      { field: 'name' as const, flex: 1, minWidth: 180 },
      {
        field: 'qty' as const,
        width: 90,
        editable: true,
        cellDataType: 'number',
        cellEditor: 'agNumberCellEditor',
        cellEditorParams: { min: 1, max: 20 },
        valueParser: (p: { newValue: unknown }) => Math.max(1, Math.min(20, Math.round(Number(p.newValue) || 1))),
      },
      { field: 'price' as const, width: 100, cellDataType: 'number', valueFormatter: (p: { value?: number }) => `$${(p.value ?? 0).toFixed(2)}` },
      {
        field: 'lineTotal' as const,
        width: 110,
        cellDataType: 'number',
        valueFormatter: (p: { value?: number }) => `$${(p.value ?? 0).toFixed(2)}`,
        valueGetter: (p: { data?: Row }) => +( (p.data?.price ?? 0) * (p.data?.qty ?? 0) ).toFixed(2),
      },
      {
        field: 'id' as const,
        width: 80,
        sortable: false,
        headerName: '',
        cellRenderer: (p: { data?: Row }) => {
          if (!p.data) return null;
          return (
            <button
              className="rounded-md px-2 py-0.5 text-xs text-red-300 transition hover:bg-red-500/20"
              onClick={() => onChange(cart.filter((c) => c.id !== p.data!.id))}
            >
              Remove
            </button>
          );
        },
      },
    ],
    [cart, onChange]
  );

  const total = rows.reduce((s, r) => s + r.price * r.qty, 0);
  const count = rows.reduce((s, r) => s + r.qty, 0);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Your cart</h2>
          <p className="text-[11px] text-gray-400">Edit quantities inline · prices from catalog</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-white">${total.toFixed(2)}</div>
          <div className="text-[11px] text-gray-400">{count} item{count === 1 ? '' : 's'}</div>
        </div>
      </div>

      <div className="ag-theme-quartz h-[240px] w-full rounded-xl border border-white/10 [--ag-background-color:transparent] [--ag-foreground-color:#e5e7eb] [--ag-border-color:rgba(255,255,255,0.08)] [--ag-header-background-color:rgba(255,255,255,0.04)] [--ag-odd-row-background-color:transparent] [--ag-row-hover-color:rgba(99,102,241,0.12)] [--ag-selected-row-background-color:rgba(99,102,241,0.18)] [--ag-input-focus-border-color:#6366f1] [--ag-font-family:inherit]">
        <AgGridReact<Row> theme="legacy"
          rowData={rows}
          columnDefs={columnDefs}
          animateRows
          domLayout="autoHeight"
          onCellValueChanged={(e) => {
            if (!e.data) return;
            const qty = Math.max(1, Math.min(20, Math.round(Number(e.data.qty) || 1)));
            onChange(cart.map((c) => (c.id === e.data!.id ? { ...c, qty } : c)));
          }}
          getRowId={(p) => p.data.id}
          overlayNoRowsTemplate="<span style='color:#9ca3af'>Cart is empty — ask the agent to fill it</span>"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {CATALOG.slice(0, 6).map((p) => (
          <button
            key={p.id}
            onClick={() => {
              const existing = cart.find((c) => c.id === p.id);
              onChange(existing ? cart.map((c) => (c.id === p.id ? { ...c, qty: Math.min(20, c.qty + 1) } : c)) : [...cart, { id: p.id, qty: 1 }]);
            }}
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-gray-300 transition hover:border-emerald-400/50 hover:text-white"
            title={`Add ${p.name}`}
          >
            {p.emoji} +{p.name.split(' ')[0]}
          </button>
        ))}
      </div>
    </div>
  );
}
