import { Header } from "@/components/layout/header";
import { getUsers } from "./actions";
import { UserTable } from "./user-table";

export default async function UsersPage() {
  const data = await getUsers();
  return (
    <div>
      <Header title="사용자 관리" description="시스템 사용자 및 역할 관리" />
      <UserTable data={data} />
    </div>
  );
}
