import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Sidebar } from "@/components/layout/sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pulmuone SSC 2.0",
  description: "AI 기반 원료·재고 통합관리 플랫폼",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-background text-foreground">
        <Sidebar />
        <main className="ml-60 min-h-screen p-6">{children}</main>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
