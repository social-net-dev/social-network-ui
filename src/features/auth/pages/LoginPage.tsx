import { LoginForm } from "../components/LoginForm";
import { AuthLayout } from "../components/AuthLayout";
import { LoginLeftPanel } from "../components/LoginLeftPanel";
import { Link } from "react-router-dom";

export function LoginPage() {
    return (
        <AuthLayout
            leftPanel={<LoginLeftPanel />}
            rightPanel={
                <>
                    <div className="bg-white dark:bg-[#0A2737] p-8 md:p-10 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                        <div className="mb-8 text-center">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Chào mừng trở lại</h2>
                            <p className="text-gray-500 dark:text-gray-400">Vui lòng nhập chi tiết để đăng nhập</p>
                        </div>

                        <LoginForm />

                        <div className="mt-8 text-center text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Chưa có tài khoản?</span>
                            <Link to="/register" className="font-bold text-[#0E4E5A] dark:text-[#E2F046] hover:underline ml-1">
                                Tạo tài khoản mới
                            </Link>
                        </div>
                    </div>
                </>
            }
        />
    );
}
