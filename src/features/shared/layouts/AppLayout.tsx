import { Outlet, useLocation } from "react-router-dom";
import { MainLayout } from "./MainLayout";

export function AppLayout() {
  const location = useLocation();

  return (
    <MainLayout>
      {/* key forces remount on route change, CSS handles the fade+slide */}
      <div key={location.pathname} className="page-transition">
        <Outlet />
      </div>
    </MainLayout>
  );
}
