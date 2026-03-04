import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "@/lib/utils/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff, Loader, ArrowLeft } from "lucide-react";
import { useAuthForgotPassword, useAuthResetPassword } from "@/lib/api/hooks/auth.hooks";

type Step = "email" | "otp" | "password";

export function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>("email");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [userId, setUserId] = useState<string>("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const sendOtpMutation = useAuthForgotPassword({
        onSuccess: (res) => {
                const uid = res.user_id || "";
                if (uid) setUserId(uid);
                setStep("otp");
                setSuccessMessage("Mã OTP đã được gửi tới email của bạn");
                setError("");
            },
        onError: (err) => {
                setError(getErrorMessage(err));
            },
    });

    const resetPasswordMutation = useAuthResetPassword({
        onSuccess: () => {
                setSuccessMessage("Mật khẩu đã được thay đổi thành công!");
                setTimeout(() => {
                    navigate("/login", { state: { message: "Mật khẩu đã thay đổi. Vui lòng đăng nhập lại." } });
                }, 1500);
            },
        onError: (err) => {
                const detail = getErrorMessage(err);
                setError(detail);
                if (typeof detail === "string" && detail.toLowerCase().includes("otp")) {
                    setStep("otp");
                }
            },
    });

    const handleSendOtp = () => {
        setError("");
        if (!email.trim()) {
            setError("Vui lòng nhập email");
            return;
        }
        sendOtpMutation.mutate({
            email: email.trim(),
        });
    };

    const handleVerifyOtp = () => {
        setError("");
        if (!otp || otp.length !== 6) {
            setError("Vui lòng nhập mã OTP 6 chữ số");
            return;
        }
        setStep("password");
        setSuccessMessage("Xác thực thành công! Hãy đặt mật khẩu mới.");
    };

    const handleResetPassword = () => {
        setError("");
        setSuccessMessage("");

        if (!password || password.length < 8) {
            setError("Mật khẩu tối thiểu 8 ký tự");
            return;
        }
        if (password !== confirmPassword) {
            setError("Mật khẩu xác nhận không khớp");
            return;
        }
        if (!userId) {
            setError("Thiếu user_id. Vui lòng bấm 'Gửi Mã OTP' lại.");
            setStep("email");
            return;
        }

        resetPasswordMutation.mutate({
            user_id: userId,
            otp,
            new_password: password,
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50 p-4">
            <Card className="w-full max-w-md">
                <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white p-6 rounded-t-lg">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate("/login")} className="hover:bg-white/20 p-1 rounded transition">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-2xl font-bold">Quên Mật Khẩu</h1>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

                    {successMessage && (
                        <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm">{successMessage}</div>
                    )}

                    {step === "email" && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Email</label>
                                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@company.com" />
                            </div>
                            <Button className="w-full" onClick={handleSendOtp} disabled={sendOtpMutation.isPending}>
                                {sendOtpMutation.isPending ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader className="w-4 h-4 animate-spin" />
                                        Đang gửi...
                                    </span>
                                ) : (
                                    "Gửi Mã OTP"
                                )}
                            </Button>
                        </div>
                    )}

                    {step === "otp" && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Mã OTP</label>
                                <Input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" />
                            </div>
                            <Button className="w-full" onClick={handleVerifyOtp}>
                                Xác thực OTP
                            </Button>
                            <Button variant="outline" className="w-full" onClick={() => setStep("email")}>Quay lại</Button>
                        </div>
                    )}

                    {step === "password" && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Mật khẩu mới</label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium">Xác nhận mật khẩu</label>
                                <div className="relative">
                                    <Input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button className="w-full" onClick={handleResetPassword} disabled={resetPasswordMutation.isPending}>
                                {resetPasswordMutation.isPending ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader className="w-4 h-4 animate-spin" />
                                        Đang cập nhật...
                                    </span>
                                ) : (
                                    "Đặt lại mật khẩu"
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
