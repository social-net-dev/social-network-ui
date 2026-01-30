import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage, RegisterPage, OTPVerifyPage, ForgotPasswordPage } from "@/features/auth/routes";
import { FeedPage } from "@/features/home/pages/FeedPage";
import { ProfilePage, ProfileSettingsPage } from "@/features/profile/routes";
import { AdminAccountsPage } from "@/features/admin/pages/AdminAccountsPage";
import { useAuthStore } from "@/stores/authStore";

function App() {
    const { isAuthenticated, isLoading, user } = useAuthStore();
    const isAdmin = user?.role === "ADMIN";

    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-otp" element={<OTPVerifyPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            <Route path="/" element={isLoading ? null : isAuthenticated ? <FeedPage /> : <Navigate to="/login" replace />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/me" element={<PersonalProfilePage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/settings" element={<ProfileSettingsPage />} />

            {/* Admin routes - Protected */}
            <Route
                path="/admin/accounts"
                element={isLoading ? null : isAuthenticated && isAdmin ? <AdminAccountsPage /> : <Navigate to="/login" replace />}
            />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
