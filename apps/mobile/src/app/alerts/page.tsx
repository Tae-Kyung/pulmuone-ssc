"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Bell, XCircle, AlertTriangle, Info } from "lucide-react";
import Link from "next/link";
import { getAlerts, markAsRead } from "./actions";
import { toast } from "sonner";

type Alert = {
  id: string;
  alertType: string;
  severity: string;
  title: string;
  message: string;
  isRead: boolean | null;
  createdAt: Date | null;
};

const severityConfig: Record<string, { icon: typeof AlertTriangle; color: string; bg: string }> = {
  critical: { icon: XCircle, color: "text-red-600", bg: "bg-red-50 border-red-200" },
  warning: { icon: AlertTriangle, color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" },
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
};

export default function MobileAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    getAlerts().then(setAlerts);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/"><button className="p-2 rounded hover:bg-muted"><ArrowLeft className="h-5 w-5" /></button></Link>
        <h1 className="text-lg font-bold">알림</h1>
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-xl border p-8 text-center text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>알림이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.filter((a) => !a.isRead).map((alert) => {
            const config = severityConfig[alert.severity] ?? severityConfig.info;
            const Icon = config.icon;
            return (
              <button
                key={alert.id}
                onClick={async () => {
                  await markAsRead(alert.id);
                  setAlerts((prev) => prev.map((a) => a.id === alert.id ? { ...a, isRead: true } : a));
                  toast.success("읽음 처리");
                }}
                className={`w-full text-left rounded-lg border p-3 ${config.bg}`}
              >
                <div className="flex items-start gap-2">
                  <Icon className={`h-5 w-5 mt-0.5 ${config.color}`} />
                  <div>
                    <p className="font-semibold text-sm">{alert.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
