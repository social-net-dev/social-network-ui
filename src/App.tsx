import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage, RegisterPage, OTPVerifyPage, ForgotPasswordPage } from "@/features/auth/routes";
import { FeedPage } from "@/features/home/pages/FeedPage";
import { ProfilePage, ProfileSettingsPage, PersonalProfilePage } from "@/features/profile/routes";
import { AdminAccountsPage } from "@/features/admin/pages/AdminAccountsPage";
import { AdminVerificationPage } from "@/features/admin/pages/VerificationPage";
import { DevToolsPage } from "@/features/dev/pages/DevToolsPage";
import { useAuthStore } from "@/stores/authStore";
import { AppLayout } from "@/features/shared/layouts/AppLayout";
import { GlobalLoading } from "@/components/ui/global-loading";

function App() {
    const { isAuthenticated, isLoading, user } = useAuthStore();
    const isAdmin = user?.role === "ADMIN";

    if (isLoading) {
        return <GlobalLoading />;
    }

    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-otp" element={<OTPVerifyPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* DevTools - accessible in development only */}
            {import.meta.env.DEV && (
                <Route path="/devtools" element={<DevToolsPage />} />
            )}

            {/* Protected Routes */}
            <Route element={isAuthenticated ? <AppLayout /> : <Navigate to="/login" replace />}>
                <Route path="/" element={<FeedPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/me" element={<PersonalProfilePage />} />
                <Route path="/profile/:userId" element={<ProfilePage />} />
                <Route path="/settings" element={<ProfileSettingsPage />} />

                {/* Admin routes */}
                <Route
                    path="/admin/accounts"
                    element={isAdmin ? <AdminAccountsPage /> : <Navigate to="/" replace />}
                />
                <Route
                    path="/admin/verification"
                    element={isAdmin ? <AdminVerificationPage /> : <Navigate to="/" replace />}
                />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
