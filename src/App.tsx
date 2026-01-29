import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage, RegisterPage, OTPVerifyPage } from "@/features/auth/routes";
import { FeedPage } from "@/features/home/pages/FeedPage";
import { ProfilePage, ProfileSettingsPage } from "@/features/profile/routes";
import { useAuthStore } from "@/stores/authStore";

function App() {
    const { isAuthenticated, isLoading } = useAuthStore();

    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-otp" element={<OTPVerifyPage />} />

            <Route path="/" element={isLoading ? null : isAuthenticated ? <FeedPage /> : <Navigate to="/login" replace />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/settings" element={<ProfileSettingsPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
