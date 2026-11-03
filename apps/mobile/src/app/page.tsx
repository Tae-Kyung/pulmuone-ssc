import Link from "next/link";
import { Truck, Camera, Package, Factory, Bell } from "lucide-react";

const menuItems = [
  { name: "스캔 입고", href: "/inbound/scan", icon: Truck, desc: "Barcode Scan으로 원료 입고", color: "bg-blue-500" },
  { name: "COA 촬영", href: "/coa/capture", icon: Camera, desc: "시험성적서 촬영 및 업로드", color: "bg-purple-500" },
  { name: "재고 조회", href: "/inventory/scan", icon: Package, desc: "원료 Scan → 재고 즉시 확인", color: "bg-green-500" },
  { name: "생산 투입", href: "/production/input", icon: Factory, desc: "작업지시 → 원료 Scan → 투입", color: "bg-orange-500" },
  { name: "알림", href: "/alerts", icon: Bell, desc: "소비기한/부적합 알림 확인", color: "bg-red-500" },
];

export default function MobileHome() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">현장 업무</h1>
      <div className="grid grid-cols-2 gap-3">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl border p-4 hover:shadow-md transition-shadow"
          >
            <div className={`w-10 h-10 ${item.color} rounded-lg flex items-center justify-center mb-3`}>
              <item.icon className="h-5 w-5 text-white" />
            </div>
            <p className="font-semibold text-sm">{item.name}</p>
            <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
