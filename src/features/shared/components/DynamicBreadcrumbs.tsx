import { useLocation, Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";
import React from "react";

const routeLabels: Record<string, string> = {
  "": "Trang chủ",
  "explore": "Lĩnh vực",
  "recommendations": "Gợi ý kết nối",
  "messages": "Tin nhắn",
  "notifications": "Thông báo",
  "profile": "Trang cá nhân",
  "me": "Hồ sơ của tôi",
  "settings": "Cài đặt",
  "admin": "Quản trị",
  "accounts": "Tài khoản",
  "verification": "Xác minh",
  "groups": "Cộng đồng",
  "marketplace": "Chợ sinh viên",
  "search": "Tìm kiếm",
  "friends": "Bạn bè",
  "requests": "Lời mời kết bạn",
};

export function DynamicBreadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  if (location.pathname === "/") {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="flex items-center gap-1.5">
              <Home className="h-3.5 w-3.5" />
              <span>Trang chủ</span>
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/" className="flex items-center gap-1.5">
              <Home className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Trang chủ</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join("/")}`;
          const label = routeLabels[value] || value;

          return (
            <React.Fragment key={to}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {last ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={to}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
