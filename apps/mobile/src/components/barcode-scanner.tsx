"use client";

import { useEffect, useRef, useState } from "react";

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
}

export function BarcodeScanner({ onScan, onError }: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<unknown>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function startScanner() {
      if (!scannerRef.current || !mounted) return;
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const scanner = new Html5Qrcode("barcode-reader");
        html5QrCodeRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText) => {
            onScan(decodedText);
            scanner.stop().catch(() => {});
            setIsScanning(false);
          },
          () => {}
        );
        if (mounted) setIsScanning(true);
      } catch (err) {
        if (mounted) {
          onError?.("카메라를 시작할 수 없습니다. 카메라 권한을 확인해주세요.");
        }
      }
    }

    startScanner();

    return () => {
      mounted = false;
      const scanner = html5QrCodeRef.current as { stop?: () => Promise<void> } | null;
      if (scanner?.stop) {
        scanner.stop().catch(() => {});
      }
    };
  }, [onScan, onError]);

  return (
    <div className="space-y-2">
      <div
        id="barcode-reader"
        ref={scannerRef}
        className="rounded-lg overflow-hidden bg-black"
        style={{ width: "100%", minHeight: 300 }}
      />
      <p className="text-center text-sm text-muted-foreground">
        {isScanning ? "바코드/QR을 카메라에 비춰주세요" : "카메라 시작 중..."}
      </p>
    </div>
  );
}
