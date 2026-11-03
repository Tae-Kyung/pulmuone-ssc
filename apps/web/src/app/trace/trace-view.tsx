"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, AlertTriangle, Search, GitFork } from "lucide-react";
import { traceForward, traceBackward, simulateRecall } from "./actions";
import { formatDate, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

type ForwardResult = Awaited<ReturnType<typeof traceForward>>;
type BackwardResult = Awaited<ReturnType<typeof traceBackward>>;
type RecallResult = Awaited<ReturnType<typeof simulateRecall>>;

export function TraceView() {
  const [mode, setMode] = useState<"forward" | "backward" | "recall">("forward");
  const [query, setQuery] = useState("");
  const [forwardData, setForwardData] = useState<ForwardResult | null>(null);
  const [backwardData, setBackwardData] = useState<BackwardResult | null>(null);
  const [recallData, setRecallData] = useState<RecallResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setForwardData(null);
    setBackwardData(null);
    setRecallData(null);

    try {
      if (mode === "forward") {
        const r = await traceForward(query.trim());
        setForwardData(r);
        if (!r.found) toast.error("해당 LOT를 찾을 수 없습니다.");
      } else if (mode === "backward") {
        const r = await traceBackward(query.trim());
        setBackwardData(r);
        if (!r.found) toast.error("해당 제품 LOT를 찾을 수 없습니다.");
      } else {
        const r = await simulateRecall(query.trim());
        setRecallData(r);
        if (!r.found) toast.error("해당 LOT를 찾을 수 없습니다.");
      }
    } catch {
      toast.error("조회 실패");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      {/* 모드 선택 */}
      <div className="flex gap-2">
        {[
          { key: "forward" as const, label: "정방향 추적", desc: "원료 LOT → 제품", icon: ArrowRight },
          { key: "backward" as const, label: "역방향 추적", desc: "제품 LOT → 원료", icon: ArrowLeft },
          { key: "recall" as const, label: "모의회수", desc: "리콜 시뮬레이션", icon: AlertTriangle },
        ].map((m) => (
          <button
            key={m.key}
            onClick={() => { setMode(m.key); setForwardData(null); setBackwardData(null); setRecallData(null); }}
            className={`flex-1 rounded-lg border p-4 text-left transition ${mode === m.key ? "border-primary bg-accent" : "hover:bg-muted/50"}`}
          >
            <m.icon className={`h-5 w-5 mb-1 ${mode === m.key ? "text-primary" : "text-muted-foreground"}`} />
            <p className="font-semibold text-sm">{m.label}</p>
            <p className="text-xs text-muted-foreground">{m.desc}</p>
          </button>
        ))}
      </div>

      {/* 검색 */}
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={mode === "backward" ? "제품 LOT 번호 입력" : "원료 LOT 번호 입력 (예: LOT-20261027-0001)"}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={loading}>
          <Search className="h-4 w-4 mr-1" /> {loading ? "조회 중..." : "추적"}
        </Button>
      </div>

      {/* 정방향 결과 */}
      {forwardData?.found && (
        <div className="space-y-4">
          <div className="rounded-lg border p-4 bg-blue-50">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <GitFork className="h-4 w-4" /> 원료 LOT 정보
            </h3>
            <div className="grid grid-cols-4 gap-3 text-sm">
              <div><p className="text-muted-foreground">LOT</p><p className="font-mono font-bold">{forwardData.lot.lotNumber}</p></div>
              <div><p className="text-muted-foreground">원료</p><p className="font-medium">{forwardData.lot.materialName}</p></div>
              <div><p className="text-muted-foreground">공급업체</p><p>{forwardData.lot.supplierName}</p></div>
              <div><p className="text-muted-foreground">상태</p><Badge variant={forwardData.lot.status === "available" ? "success" : forwardData.lot.status === "hold" ? "warning" : "secondary"}>{forwardData.lot.status}</Badge></div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">투입된 제품 ({forwardData.products.length}건)</h3>
            {forwardData.products.length === 0 ? (
              <p className="text-muted-foreground text-sm p-4 border rounded-lg text-center">투입 이력이 없습니다.</p>
            ) : (
              <div className="rounded-lg border">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-muted/50">
                    <th className="px-4 py-2 text-left">제품명</th>
                    <th className="px-4 py-2 text-left">제품 LOT</th>
                    <th className="px-4 py-2 text-left">작업지시</th>
                    <th className="px-4 py-2 text-left">투입량</th>
                    <th className="px-4 py-2 text-left">투입일시</th>
                  </tr></thead>
                  <tbody>
                    {forwardData.products.map((p, i) => (
                      <tr key={i} className="border-b">
                        <td className="px-4 py-2">{p.productName}</td>
                        <td className="px-4 py-2 font-mono">{p.productLot || "-"}</td>
                        <td className="px-4 py-2">{p.orderNumber}</td>
                        <td className="px-4 py-2">{p.inputQuantity} {p.unit}</td>
                        <td className="px-4 py-2">{formatDateTime(p.inputAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 역방향 결과 */}
      {backwardData?.found && (
        <div className="space-y-4">
          <div className="rounded-lg border p-4 bg-purple-50">
            <h3 className="font-semibold mb-2">제품 정보</h3>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div><p className="text-muted-foreground">제품명</p><p className="font-medium">{backwardData.product.productName}</p></div>
              <div><p className="text-muted-foreground">제품 LOT</p><p className="font-mono font-bold">{backwardData.product.productLot}</p></div>
              <div><p className="text-muted-foreground">작업지시</p><p>{backwardData.product.orderNumber}</p></div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">사용된 원료 ({backwardData.materials.length}건)</h3>
            <div className="rounded-lg border">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left">원료</th>
                  <th className="px-4 py-2 text-left">원료 LOT</th>
                  <th className="px-4 py-2 text-left">공급업체</th>
                  <th className="px-4 py-2 text-left">공급사 LOT</th>
                  <th className="px-4 py-2 text-left">제조일</th>
                  <th className="px-4 py-2 text-left">소비기한</th>
                  <th className="px-4 py-2 text-left">투입량</th>
                </tr></thead>
                <tbody>
                  {backwardData.materials.map((m, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-4 py-2">{m.materialName} ({m.materialCode})</td>
                      <td className="px-4 py-2 font-mono">{m.lotNumber}</td>
                      <td className="px-4 py-2">{m.supplierName}</td>
                      <td className="px-4 py-2">{m.supplierLot || "-"}</td>
                      <td className="px-4 py-2">{formatDate(m.manufactureDate)}</td>
                      <td className="px-4 py-2">{formatDate(m.expiryDate)}</td>
                      <td className="px-4 py-2">{m.inputQuantity} {m.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 모의회수 결과 */}
      {recallData?.found && (
        <div className="space-y-4">
          <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="font-bold text-red-800 text-lg">모의회수 결과</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-red-600">회수 대상 원료</p>
                <p className="font-bold">{recallData.recallTarget.materialName}</p>
                <p className="font-mono">{recallData.recallTarget.lotNumber}</p>
              </div>
              <div>
                <p className="text-red-600">공급업체</p>
                <p className="font-medium">{recallData.recallTarget.supplierName}</p>
              </div>
              <div>
                <p className="text-red-600">영향받는 제품</p>
                <p className="text-3xl font-bold text-red-700">{recallData.affectedProductCount}건</p>
              </div>
            </div>
          </div>

          {recallData.affectedProducts.map((product, idx) => (
            <div key={idx} className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold">{product.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    LOT: {product.productLot} / 작업지시: {product.orderNumber}
                  </p>
                </div>
                <Badge variant="destructive">회수 대상</Badge>
              </div>
              <div className="text-sm space-y-1">
                <p className="text-muted-foreground text-xs mb-1">사용된 원료:</p>
                {product.allMaterials.map((mat, mi) => (
                  <div
                    key={mi}
                    className={`flex items-center justify-between px-2 py-1 rounded ${mat.isRecallTarget ? "bg-red-100 border border-red-200" : "bg-muted/50"}`}
                  >
                    <span>
                      {mat.materialName}
                      {mat.isRecallTarget && <Badge variant="destructive" className="ml-2 text-[10px]">회수원인</Badge>}
                    </span>
                    <span className="font-mono text-xs">{mat.lotNumber}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
