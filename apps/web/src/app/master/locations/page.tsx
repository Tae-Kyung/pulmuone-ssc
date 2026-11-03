import { Header } from "@/components/layout/header";
import { getLocations } from "./actions";
import { LocationTable } from "./location-table";

export default async function LocationsPage() {
  const data = await getLocations();
  return (
    <div>
      <Header title="Location 관리" description="창고/Zone/Rack/단 보관위치 관리" />
      <LocationTable data={data} />
    </div>
  );
}
