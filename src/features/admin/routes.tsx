import { Routes, Route } from "react-router-dom";
import { AdminVerificationPage } from "./pages/VerificationPage";

export default (
    <Routes>
        <Route path="/verification" element={<AdminVerificationPage />} />
    </Routes>
);
