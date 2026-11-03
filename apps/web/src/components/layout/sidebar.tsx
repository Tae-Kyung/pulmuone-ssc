"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Building2,
  FlaskConical,
  MapPin,
  Users,
  Truck,
  FileCheck,
  Warehouse,
  Factory,
  GitFork,
  Bell,
  Settings,
} from "lucide-react";

const navigation = [
  { name: "대시보드", href: "/dashboard", icon: LayoutDashboard },
  {
    name: "마스터 관리",
    children: [
      { name: "원료 관리", href: "/master/materials", icon: Package },
      { name: "공급업체 관리", href: "/master/suppliers", icon: Building2 },
      { name: "규격 관리", href: "/master/specs", icon: FlaskConical },
      { name: "Location 관리", href: "/master/locations", icon: MapPin },
      { name: "사용자 관리", href: "/master/users", icon: Users },
    ],
  },
  { name: "입고 관리", href: "/inbound", icon: Truck },
  { name: "COA 검수", href: "/coa", icon: FileCheck },
  {
    name: "재고 관리",
    children: [
      { name: "재고 현황", href: "/inventory", icon: Warehouse },
      { name: "재고 이력", href: "/inventory/transactions", icon: Warehouse },
    ],
  },
  { name: "생산 관리", href: "/production", icon: Factory },
  { name: "Traceability", href: "/trace", icon: GitFork },
  { name: "알림", href: "/alerts", icon: Bell },
  { name: "설정", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 border-r bg-card flex flex-col h-screen fixed left-0 top-0">
      <div className="h-14 flex items-center px-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">Pulmuone</p>
            <p className="text-[10px] text-muted-foreground leading-tight">SSC 2.0</p>
          </div>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {navigation.map((item) => {
          if ("children" in item && item.children) {
            return (
              <div key={item.name} className="mb-2">
                <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {item.name}
                </p>
                {item.children.map((child) => {
                  const isActive = pathname.startsWith(child.href);
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-accent text-accent-foreground font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <child.icon className="h-4 w-4" />
                      {child.name}
                    </Link>
                  );
                })}
              </div>
            );
          }
          const isActive = pathname.startsWith(item.href!);
          const Icon = item.icon!;
          return (
            <Link
              key={item.href}
              href={item.href!}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors mb-0.5",
                isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
