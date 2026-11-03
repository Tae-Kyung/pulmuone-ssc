import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pulmuone SSC 2.0 Mobile",
  description: "스마트폰 Scan 기반 현장 업무",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#16a34a",
};

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-background text-foreground max-w-md mx-auto">
        <header className="sticky top-0 z-50 bg-primary text-primary-foreground px-4 py-3 flex items-center gap-2">
          <div className="w-7 h-7 bg-white/20 rounded flex items-center justify-center">
            <span className="font-bold text-sm">P</span>
          </div>
          <span className="font-semibold text-sm">SSC 2.0 Mobile</span>
        </header>
        <main className="p-4 pb-20">{children}</main>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
