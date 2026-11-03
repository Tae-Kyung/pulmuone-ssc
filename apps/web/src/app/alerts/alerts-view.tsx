"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, CheckCheck, XCircle, AlertTriangle, Info } from "lucide-react";
import { markAsRead, resolveAlert, markAllRead } from "./actions";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

type Alert = {
  id: string;
  alertType: string;
  severity: string;
  title: string;
  message: string;
  isRead: boolean | null;
  isResolved: boolean | null;
  createdAt: Date | null;
  resolvedAt: Date | null;
};

const severityConfig: Record<string, { icon: typeof AlertTriangle; color: string; bg: string }> = {
  critical: { icon: XCircle, color: "text-red-600", bg: "bg-red-50 border-red-200" },
  warning: { icon: AlertTriangle, color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" },
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
};

const alertTypeLabels: Record<string, string> = {
  expiry_d30: "소비기한 임박 (D-30)",
  expiry_d7: "소비기한 임박 (D-7)",
  low_stock: "재고 부족",
  long_idle: "장기 미이동",
  rejected: "부적합 발생",
  hold: "LOT 보류",
  input_blocked: "투입 차단",
};

export function AlertsView({ data }: { data: Alert[] }) {
  const [filter, setFilter] = useState<"all" | "unread" | "resolved">("all");

  const filtered = data.filter((a) => {
    if (filter === "unread") return !a.isRead;
    if (filter === "resolved") return a.isResolved;
    return true;
  });

  const unreadCount = data.filter((a) => !a.isRead).length;

  return (
    <div className="space-y-4">
      {/* 필터 + 일괄 읽음 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(["all", "unread", "resolved"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "전체" : f === "unread" ? `미읽음 (${unreadCount})` : "처리 완료"}
            </Button>
          ))}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await markAllRead();
              toast.success("전체 읽음 처리되었습니다.");
            }}
          >
            <CheckCheck className="h-4 w-4 mr-1" /> 전체 읽음
          </Button>
        )}
      </div>

      {/* 알림 목록 */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border p-12 text-center text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>알림이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((alert) => {
            const config = severityConfig[alert.severity] ?? severityConfig.info;
            const Icon = config.icon;
            return (
              <div
                key={alert.id}
                className={`rounded-lg border p-4 transition ${alert.isRead ? "opacity-70" : ""} ${alert.isResolved ? "opacity-50" : config.bg}`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`h-5 w-5 mt-0.5 ${config.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">{alert.title}</p>
                      <Badge variant="outline" className="text-[10px]">
                        {alertTypeLabels[alert.alertType] ?? alert.alertType}
                      </Badge>
                      {!alert.isRead && <Badge variant="default" className="text-[10px]">NEW</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDateTime(alert.createdAt)}</p>
                  </div>
                  <div className="flex gap-1">
                    {!alert.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          await markAsRead(alert.id);
                          toast.success("읽음 처리");
                        }}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    {!alert.isResolved && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          await resolveAlert(alert.id);
                          toast.success("처리 완료");
                        }}
                      >
                        <CheckCheck className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
