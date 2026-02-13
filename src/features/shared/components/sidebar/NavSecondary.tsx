import { Link, useNavigate } from "react-router-dom"
import { Settings, LogOut } from "lucide-react"
import { useAuthStore } from "@/stores/authStore"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavSecondary() {
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate("/login", { replace: true })
  }

  return (
    <SidebarGroup className="mt-auto">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip="Cài đặt">
            <Link to="/settings">
              <Settings />
              <span>Cài đặt</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={handleLogout}
            tooltip="Đăng xuất"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut />
            <span>Đăng xuất</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
