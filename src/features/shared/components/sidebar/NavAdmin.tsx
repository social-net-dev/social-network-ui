import { Link, useLocation } from "react-router-dom"
import { Users, Shield } from "lucide-react"
import { useAuthStore } from "@/stores/authStore"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavAdmin() {
  const user = useAuthStore((state) => state.user)
  const location = useLocation()

  // Chỉ hiển thị nếu user là admin
  if (user?.role !== "ADMIN") {
    return null
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Quản trị</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton 
            asChild 
            isActive={location.pathname === "/admin/accounts"}
            tooltip="Quản lý tài khoản"
          >
            <Link to="/admin/accounts">
              <Users />
              <span>Quản lý tài khoản</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton 
            asChild 
            isActive={location.pathname === "/admin/verification"}
            tooltip="Xác minh tài khoản"
          >
            <Link to="/admin/verification">
              <Shield />
              <span>Xác minh</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
