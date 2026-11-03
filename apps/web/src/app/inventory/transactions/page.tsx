import { Header } from "@/components/layout/header";
import { getTransactions } from "../actions";
import { TransactionTable } from "./transaction-table";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const data = await getTransactions(200);
  return (
    <div>
      <Header title="재고 이력" description="입출고/이동/상태변경 전체 이력" />
      <TransactionTable data={data} />
    </div>
  );
}
