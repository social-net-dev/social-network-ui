import { Outlet } from "react-router-dom";
import { MainLayout } from "./MainLayout";

export function AppLayout() {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}
