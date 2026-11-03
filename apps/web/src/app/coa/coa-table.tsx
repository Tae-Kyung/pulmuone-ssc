"use client";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

type CoaRow = {
  id: string;
  ocrStatus: string | null;
  overallResult: string | null;
  avgConfidence: string | null;
  createdAt: Date | null;
  lot: { lotNumber: string; receipt: { supplier: { name: string } } };
  material: { name: string; code: string };
  items: { status: string }[];
};

const ocrStatusMap: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" | "default" }> = {
  pending: { label: "대기", variant: "secondary" },
  processing: { label: "처리 중", variant: "warning" },
  completed: { label: "완료", variant: "success" },
  failed: { label: "실패", variant: "destructive" },
};

const resultMap: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
  pass: { label: "적합", variant: "success" },
  fail: { label: "부적합", variant: "destructive" },
  review: { label: "검토필요", variant: "warning" },
};

const columns: ColumnDef<CoaRow, unknown>[] = [
  {
    id: "lot",
    header: "LOT 번호",
    cell: ({ row }) => <span className="font-mono">{row.original.lot.lotNumber}</span>,
  },
  {
    id: "material",
    header: "원료",
    cell: ({ row }) => `${row.original.material.name} (${row.original.material.code})`,
  },
  {
    id: "supplier",
    header: "공급업체",
    cell: ({ row }) => row.original.lot.receipt.supplier.name,
  },
  {
    accessorKey: "ocrStatus",
    header: "OCR 상태",
    cell: ({ getValue }) => {
      const s = ocrStatusMap[(getValue() as string) ?? "pending"];
      return <Badge variant={s?.variant ?? "secondary"}>{s?.label ?? getValue()}</Badge>;
    },
  },
  {
    accessorKey: "overallResult",
    header: "판정",
    cell: ({ getValue }) => {
      const val = getValue() as string | null;
      if (!val) return "-";
      const s = resultMap[val];
      return <Badge variant={s?.variant ?? "secondary"}>{s?.label ?? val}</Badge>;
    },
  },
  {
    id: "confidence",
    header: "OCR 신뢰도",
    cell: ({ row }) =>
      row.original.avgConfidence
        ? `${Number(row.original.avgConfidence).toFixed(1)}%`
        : "-",
  },
  {
    id: "itemCount",
    header: "항목",
    cell: ({ row }) => {
      const pass = row.original.items.filter((i) => i.status === "pass").length;
      const total = row.original.items.length;
      if (total === 0) return "-";
      return (
        <span>
          <span className="text-green-600 font-medium">{pass}</span>
          <span className="text-muted-foreground">/{total}</span>
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "등록일시",
    cell: ({ getValue }) => formatDateTime(getValue() as Date),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Link href={`/coa/${row.original.id}`}>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4 mr-1" /> 상세
        </Button>
      </Link>
    ),
  },
];

export function CoaTable({ data }: { data: CoaRow[] }) {
  return <DataTable columns={columns} data={data} />;
}
