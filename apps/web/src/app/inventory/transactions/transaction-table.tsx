"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

type TxRow = {
  id: string;
  txType: string;
  quantity: string;
  notes: string | null;
  createdAt: Date | null;
  lot: { lotNumber: string };
  material: { name: string; unit: string };
  fromLocation: { code: string } | null;
  toLocation: { code: string } | null;
};

const txTypeMap: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
  inbound: { label: "입고", variant: "success" },
  move: { label: "이동", variant: "default" },
  consume: { label: "소비", variant: "warning" },
  adjust: { label: "조정", variant: "secondary" },
  hold: { label: "보류", variant: "destructive" },
  release: { label: "해제", variant: "success" },
  reject: { label: "부적합", variant: "destructive" },
  return: { label: "반환", variant: "secondary" },
};

const columns: ColumnDef<TxRow, unknown>[] = [
  {
    accessorKey: "createdAt",
    header: "일시",
    cell: ({ getValue }) => formatDateTime(getValue() as Date),
  },
  {
    accessorKey: "txType",
    header: "유형",
    cell: ({ getValue }) => {
      const t = txTypeMap[(getValue() as string)];
      return <Badge variant={t?.variant ?? "secondary"}>{t?.label ?? getValue()}</Badge>;
    },
  },
  {
    id: "material",
    header: "원료",
    cell: ({ row }) => row.original.material.name,
  },
  {
    id: "lot",
    header: "LOT",
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.lot.lotNumber}</span>,
  },
  {
    id: "qty",
    header: "수량",
    cell: ({ row }) => {
      const q = parseFloat(row.original.quantity);
      return (
        <span className={q < 0 ? "text-red-600" : q > 0 ? "text-green-600" : ""}>
          {q > 0 ? "+" : ""}{row.original.quantity} {row.original.material.unit}
        </span>
      );
    },
  },
  {
    id: "from",
    header: "출발",
    cell: ({ row }) => row.original.fromLocation?.code ?? "-",
  },
  {
    id: "to",
    header: "도착",
    cell: ({ row }) => row.original.toLocation?.code ?? "-",
  },
  {
    accessorKey: "notes",
    header: "비고",
    cell: ({ getValue }) => getValue() ?? "-",
  },
];

export function TransactionTable({ data }: { data: TxRow[] }) {
  return <DataTable columns={columns} data={data} />;
}
