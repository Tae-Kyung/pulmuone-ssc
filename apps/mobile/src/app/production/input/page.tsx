"use client";

import { useState, useEffect, useCallback } from "react";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { getTodayOrders, scanAndInput } from "./actions";
import { ArrowLeft, Factory, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type Order = {
  id: string;
  orderNumber: string;
  productName: string;
  productLot: string | null;
  status: string | null;
  requiredMaterials: {
    materialId: string;
    requiredQty: string;
    unit: string;
    material: { name: string; code: string };
  }[];
};

export default function ProductionInputPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [step, setStep] = useState<"select" | "scan" | "quantity" | "result">("select");
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [inputQty, setInputQty] = useState("");
  const [result, setResult] = useState<{ success: boolean; error?: string; errorCode?: string; lotNumber?: string } | null>(null);

  useEffect(() => {
    getTodayOrders().then(setOrders);
  }, []);

  const handleScan = useCallback((barcode: string) => {
    setScannedBarcode(barcode);
    setStep("quantity");
    toast.info(`스캔 완료: ${barcode}`);
  }, []);

  async function handleSubmit() {
    if (!selectedOrder) return;
    const res = await scanAndInput({
      orderId: selectedOrder.id,
      barcode: scannedBarcode,
      inputQuantity: inputQty,
    });
    setResult(res);
    setStep("result");
  }

  function reset() {
    setSelectedOrder(null);
    setScannedBarcode("");
    setInputQty("");
    setResult(null);
    setStep("select");
    getTodayOrders().then(setOrders);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/"><button className="p-2 rounded hover:bg-muted"><ArrowLeft className="h-5 w-5" /></button></Link>
        <h1 className="text-lg font-bold">생산 투입</h1>
      </div>

      {/* Step 1: 작업지시 선택 */}
      {step === "select" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">작업지시를 선택하세요</p>
          {orders.length === 0 ? (
            <div className="rounded-xl border p-6 text-center text-muted-foreground">
              <Factory className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>진행 가능한 작업지시가 없습니다.</p>
            </div>
          ) : (
            orders.map((order) => (
              <button
                key={order.id}
                onClick={() => { setSelectedOrder(order); setStep("scan"); }}
                className="w-full text-left rounded-lg border p-4 hover:bg-muted/50 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{order.productName}</p>
                    <p className="text-xs text-muted-foreground">{order.orderNumber}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${order.status === "in_progress" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}`}>
                    {order.status === "in_progress" ? "진행 중" : "계획"}
                  </span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  필요 원료: {order.requiredMaterials.map((m) => m.material.name).join(", ")}
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Step 2: 바코드 스캔 */}
      {step === "scan" && (
        <div className="space-y-3">
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="font-semibold">{selectedOrder?.productName}</p>
            <p className="text-xs text-muted-foreground">{selectedOrder?.orderNumber}</p>
          </div>
          <p className="text-sm text-muted-foreground">원료 바코드를 스캔하세요</p>
          <BarcodeScanner onScan={handleScan} onError={(e) => toast.error(e)} />
        </div>
      )}

      {/* Step 3: 수량 입력 */}
      {step === "quantity" && (
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="font-semibold">{selectedOrder?.productName}</p>
            <p className="text-xs">바코드: <span className="font-mono">{scannedBarcode}</span></p>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">투입 수량</label>
            <input
              type="number"
              step="0.001"
              value={inputQty}
              onChange={(e) => setInputQty(e.target.value)}
              className="w-full h-14 text-2xl text-center border rounded-lg"
              autoFocus
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!inputQty}
            className="w-full bg-primary text-primary-foreground py-4 rounded-lg font-bold text-lg disabled:opacity-50"
          >
            투입 실행
          </button>
        </div>
      )}

      {/* Step 4: 결과 */}
      {step === "result" && result && (
        <div className="space-y-4">
          {result.success ? (
            <div className="rounded-xl bg-green-50 border-2 border-green-200 p-6 text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-3" />
              <p className="font-bold text-xl text-green-800">투입 완료</p>
              <p className="text-green-600 mt-2">LOT: {result.lotNumber}</p>
              <p className="text-green-600">수량: {inputQty}</p>
            </div>
          ) : (
            <div className={`rounded-xl p-6 text-center ${result.errorCode === "ERR-012" ? "bg-red-50 border-2 border-red-200" : result.errorCode === "ERR-045" ? "bg-orange-50 border-2 border-orange-200" : "bg-red-50 border-2 border-red-200"}`}>
              {result.errorCode === "ERR-012" ? (
                <XCircle className="h-16 w-16 text-red-600 mx-auto mb-3" />
              ) : (
                <AlertTriangle className="h-16 w-16 text-orange-600 mx-auto mb-3" />
              )}
              <p className="font-bold text-xl">
                {result.errorCode === "ERR-012" ? "투입 불가" : result.errorCode === "ERR-045" ? "원료 불일치" : "오류"}
              </p>
              {result.errorCode && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-red-200 text-red-800 rounded text-xs font-mono">
                  {result.errorCode}
                </span>
              )}
              <p className="mt-3 text-sm">{result.error}</p>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => { setScannedBarcode(""); setStep("scan"); setResult(null); }} className="flex-1 border border-border py-3 rounded-lg font-semibold">
              재스캔
            </button>
            <button onClick={reset} className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg font-semibold">
              완료
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
