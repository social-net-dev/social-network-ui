import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Search, Store, Sun, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import etechsLogo from "@/assets/logo-etechs-ETS.svg";

interface NavbarProps {
    children?: ReactNode;
}

export function Navbar({ children }: NavbarProps) {
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const user = useAuthStore((state) => state.user);
    const displayName = user?.displayName || user?.email || "Tài khoản";

    const navItems = [
        { label: "Nhóm cộng đồng", path: "/groups", icon: Users },
        { label: "Marketplace", path: "/marketplace", icon: Store },
    ];

    return (
        <nav className="fixed w-full z-50 top-0 start-0 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-etechs-bg-dark/90 backdrop-blur-md transition-colors duration-300">
            <div className="w-full flex flex-wrap items-center justify-between mx-3 px-12 py-2">
                <div className="flex items-center gap-4">
                    <Link to="/" className="flex items-center gap-3">
                        <img src={etechsLogo} alt="ETECHS" className="h-9 w-auto" />
                        <span className="text-2xl font-extrabold tracking-wide text-etechs-secondary dark:text-white">ETECHS</span>
                    </Link>
                </div>

                <div className="hidden lg:flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Tìm kiếm người dùng, nhóm, bài viết..."
                            className="pl-9 w-[320px] rounded-full bg-white/80 dark:bg-white/5 border-gray-100 dark:border-gray-800"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                title={item.label}
                                className={cn(
                                    "group relative flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-white/5 shadow-sm",
                                    location.pathname.startsWith(item.path)
                                        ? "bg-etechs-primary text-etechs-secondary shadow"
                                        : "text-gray-600 dark:text-gray-300 hover:bg-etechs-primary/10 hover:text-etechs-primary",
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                <span className="absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gray-900 text-white text-xs px-3 py-1 opacity-0 pointer-events-none transition group-hover:opacity-100">
                                    {item.label}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {children}
                    <Link to="/profile/me" className="flex items-center gap-3 rounded-full px-2 py-1 hover:bg-etechs-primary/10 transition">
                        <Avatar className="size-9">
                            <AvatarImage src={user?.avatar || undefined} alt={displayName} />
                            <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="hidden sm:block">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{displayName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Hồ sơ</p>
                        </div>
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        className="rounded-full w-10 h-10 text-etechs-secondary dark:text-etechs-primary hover:bg-etechs-primary/10 dark:hover:bg-white/5"
                        title={theme === "light" ? "Chuyển sang chế độ tối" : "Chuyển sang chế độ sáng"}
                    >
                        {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </Button>
                </div>
            </div>
        </nav>
    );
}
