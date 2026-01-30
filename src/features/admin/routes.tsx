import { Routes, Route } from "react-router-dom";
import { AdminVerificationPage } from "./pages/VerificationPage";
import { AdminAccountsPage } from "./pages/AdminAccountsPage";

export default (
    <Routes>
        <Route path="/verification" element={<AdminVerificationPage />} />
        <Route path="/accounts" element={<AdminAccountsPage />} />
    </Routes>
);
