import { Routes, Route } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { OTPVerifyPage } from "./pages/OTPVerifyPage";

export function AuthRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-otp" element={<OTPVerifyPage />} />
        </Routes>
    );
}

export { LoginPage, RegisterPage, OTPVerifyPage };
