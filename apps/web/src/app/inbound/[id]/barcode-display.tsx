"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface BarcodeDisplayProps {
  lotNumber: string;
  barcodeValue: string;
  materialName: string;
  supplierName: string;
  expiryDate: string | null;
}

export function BarcodeDisplay({
  lotNumber,
  barcodeValue,
  materialName,
  supplierName,
  expiryDate,
}: BarcodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    async function renderQR() {
      if (!canvasRef.current) return;
      try {
        const QRCode = (await import("qrcode")).default;
        await QRCode.toCanvas(canvasRef.current, barcodeValue, {
          width: 200,
          margin: 2,
          color: { dark: "#000000", light: "#ffffff" },
        });
      } catch (err) {
        console.error("QR render failed:", err);
      }
    }
    renderQR();
  }, [barcodeValue]);

  function handlePrint() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>라벨 출력 - ${lotNumber}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          .label { border: 2px solid #000; padding: 16px; width: 300px; }
          .label h3 { margin: 0 0 8px; font-size: 14px; }
          .label p { margin: 2px 0; font-size: 11px; }
          .qr { text-align: center; margin: 12px 0; }
          .lot-num { font-family: monospace; font-size: 16px; font-weight: bold; }
          @media print { body { margin: 0; padding: 10px; } }
        </style>
      </head>
      <body>
        <div class="label">
          <h3>Pulmuone SSC 2.0</h3>
          <p class="lot-num">${lotNumber}</p>
          <div class="qr"><canvas id="qr"></canvas></div>
          <p><strong>원료:</strong> ${materialName}</p>
          <p><strong>공급업체:</strong> ${supplierName}</p>
          <p><strong>소비기한:</strong> ${expiryDate ? formatDate(expiryDate) : "-"}</p>
          <p style="font-size:9px;color:#666;margin-top:8px;">Barcode: ${barcodeValue}</p>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js"><\/script>
        <script>
          QRCode.toCanvas(document.getElementById('qr'), '${barcodeValue}', { width: 150, margin: 1 }, function() {
            setTimeout(function() { window.print(); }, 300);
          });
        <\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center p-4 border rounded-lg bg-white">
        <p className="font-mono font-bold text-lg mb-2">{lotNumber}</p>
        <canvas ref={canvasRef} />
        <p className="text-xs text-muted-foreground mt-2">{barcodeValue}</p>
      </div>
      <div className="text-sm space-y-1">
        <p><span className="text-muted-foreground">원료:</span> {materialName}</p>
        <p><span className="text-muted-foreground">공급업체:</span> {supplierName}</p>
        <p><span className="text-muted-foreground">소비기한:</span> {expiryDate ? formatDate(expiryDate) : "-"}</p>
      </div>
      <Button onClick={handlePrint} className="w-full">
        <Printer className="h-4 w-4 mr-1" /> 라벨 인쇄
      </Button>
    </div>
  );
}
