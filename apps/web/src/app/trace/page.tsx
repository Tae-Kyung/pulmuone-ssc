import { Header } from "@/components/layout/header";
import { TraceView } from "./trace-view";

export const dynamic = "force-dynamic";

export default function TracePage() {
  return (
    <div>
      <Header title="LOT Traceability" description="원료↔제품 정방향/역방향 추적 및 모의회수" />
      <TraceView />
    </div>
  );
}
