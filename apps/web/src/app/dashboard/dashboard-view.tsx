"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, FileCheck, AlertTriangle, Bell, Package, Eye } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";

type DashboardData = {
  kpi: {
    todayReceipts: number;
    ocrCompleted: number;
    coaErrors: number;
    coaPending: number;
  };
  recentReceipts: {
    id: string;
    receiptNumber: string;
    receivedDate: string;
    material: { name: string };
    supplier: { name: string };
    lots: {
      coaInspection: {
        ocrStatus: string | null;
        overallResult: string | null;
        avgConfidence: string | null;
      } | null;
    }[];
  }[];
  recentAlerts: {
    id: string;
    alertType: string;
    severity: string;
    title: string;
    message: string;
    createdAt: Date | null;
  }[];
  inventorySummary: { status: string; count: number }[];
};

const ocrStatusLabel: Record<string, { label: string; color: string }> = {
  completed: { label: "자동승인", color: "bg-green-100 text-green-800" },
  pending: { label: "미제출", color: "bg-yellow-100 text-yellow-800" },
  processing: { label: "처리 중", color: "bg-blue-100 text-blue-800" },
  failed: { label: "실패", color: "bg-red-100 text-red-800" },
};

const resultLabel: Record<string, { label: string; color: string }> = {
  pass: { label: "적합", color: "bg-green-100 text-green-800" },
  fail: { label: "규격오차", color: "bg-red-100 text-red-800" },
  review: { label: "검토필요", color: "bg-yellow-100 text-yellow-800" },
};

const severityIcon: Record<string, string> = {
  critical: "bg-red-500",
  warning: "bg-yellow-500",
  info: "bg-blue-500",
};

export function DashboardView({ data }: { data: DashboardData }) {
  const totalInv = data.inventorySummary.reduce((s, i) => s + Number(i.count), 0);

  return (
    <div className="space-y-6">
      {/* KPI 카드 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">금일 입고</p>
          </div>
          <p className="text-3xl font-bold">{data.kpi.todayReceipts}<span className="text-base font-normal text-muted-foreground ml-1">건</span></p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileCheck className="h-4 w-4 text-green-600" />
            <p className="text-sm text-muted-foreground">AI-OCR 검증 완료</p>
          </div>
          <p className="text-3xl font-bold text-green-600">{data.kpi.ocrCompleted}<span className="text-base font-normal text-muted-foreground ml-1">건</span></p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <p className="text-sm text-muted-foreground">COA 부적합</p>
          </div>
          <p className="text-3xl font-bold text-red-600">{data.kpi.coaErrors}<span className="text-base font-normal text-muted-foreground ml-1">건</span></p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Package className="h-4 w-4 text-yellow-600" />
            <p className="text-sm text-muted-foreground">COA 미제출</p>
          </div>
          <p className="text-3xl font-bold text-yellow-600">{data.kpi.coaPending}<span className="text-base font-normal text-muted-foreground ml-1">건</span></p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 최근 입고 현황 */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">실시간 입고 원료 & AI-OCR 판독 현황</h2>
            <Link href="/inbound"><Button variant="ghost" size="sm">전체보기</Button></Link>
          </div>
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left">공급업체</th>
                  <th className="px-3 py-2 text-left">원료명</th>
                  <th className="px-3 py-2 text-left">입고일</th>
                  <th className="px-3 py-2 text-left">AI 판독상태</th>
                  <th className="px-3 py-2 text-left">판독 신뢰도</th>
                  <th className="px-3 py-2 text-left"></th>
                </tr>
              </thead>
              <tbody>
                {data.recentReceipts.slice(0, 8).map((r) => {
                  const coa = r.lots[0]?.coaInspection;
                  const status = coa?.ocrStatus ?? "pending";
                  const result = coa?.overallResult;
                  const confidence = coa?.avgConfidence;

                  return (
                    <tr key={r.id} className="border-b hover:bg-muted/30">
                      <td className="px-3 py-2">{r.supplier.name}</td>
                      <td className="px-3 py-2">{r.material.name}</td>
                      <td className="px-3 py-2">{formatDate(r.receivedDate)}</td>
                      <td className="px-3 py-2">
                        {result ? (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${resultLabel[result]?.color ?? ""}`}>
                            {resultLabel[result]?.label ?? result}
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${ocrStatusLabel[status]?.color ?? ""}`}>
                            {ocrStatusLabel[status]?.label ?? status}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {confidence ? `${Number(confidence).toFixed(1)}%` : "-"}
                      </td>
                      <td className="px-3 py-2">
                        <Link href={`/inbound/${r.id}`}>
                          <Button variant="ghost" size="sm"><Eye className="h-3 w-3" /></Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 우측 패널 */}
        <div className="space-y-4">
          {/* 재고 상태 */}
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" /> 재고 현황
            </h3>
            <p className="text-2xl font-bold mb-2">{totalInv}<span className="text-sm font-normal text-muted-foreground ml-1">건</span></p>
            <div className="space-y-1">
              {data.inventorySummary.map((s) => (
                <div key={s.status} className="flex items-center justify-between text-sm">
                  <Badge variant={s.status === "available" ? "success" : s.status === "hold" ? "warning" : "secondary"}>
                    {s.status}
                  </Badge>
                  <span className="font-medium">{Number(s.count)}건</span>
                </div>
              ))}
            </div>
          </div>

          {/* 최근 알림 */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4" /> 주요 알림
              </h3>
              <Link href="/alerts"><Button variant="ghost" size="sm">전체</Button></Link>
            </div>
            {data.recentAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">알림 없음</p>
            ) : (
              <div className="space-y-2">
                {data.recentAlerts.map((a) => (
                  <div key={a.id} className="flex items-start gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${severityIcon[a.severity] ?? "bg-gray-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(a.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
