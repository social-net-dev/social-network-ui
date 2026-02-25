import { Link, useLocation } from "react-router-dom";
import { LoginForm } from "../ui/LoginForm";
import { AuthLayout } from "../ui/AuthLayout";
import { LoginLeftPanel } from "../ui/LoginLeftPanel";

export function LoginPage() {
    const location = useLocation();
    const emailFromState = location.state?.email as string | undefined;

    return (
        <AuthLayout
            leftPanel={<LoginLeftPanel />}
            rightPanel={
                <>
                    <div className="bg-card p-8 md:p-10 rounded-2xl shadow-xl border border-border">
                        <div className="mb-8 text-center">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Chào mừng trở lại</h2>
                            <p className="text-muted-foreground">Vui lòng nhập chi tiết để đăng nhập</p>
                        </div>

                        <LoginForm initialEmail={emailFromState} />

                        <div className="mt-8 text-center text-sm">
                            <span className="text-muted-foreground">Chưa có tài khoản?</span>
                            <Link
                                to="/register"
                                className="font-bold text-primary hover:underline ml-1"
                            >
                                Tạo tài khoản mới
                            </Link>
                        </div>
                    </div>
                </>
            }
        />
    );
}
