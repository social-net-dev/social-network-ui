import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthAPI } from "@/lib/api/generated";
import { getErrorMessage } from "@/lib/api/transforms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff, Loader, ArrowLeft } from "lucide-react";

type Step = "email" | "otp" | "password";

export function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>("email");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const sendOtpMutation = AuthAPI.useOtpSendAuthOtpSendPost({
        mutation: {
            onSuccess: () => {
                setStep("otp");
                setSuccessMessage("Mã OTP đã được gửi tới email của bạn");
                setError("");
            },
            onError: (err: any) => {
                setError(getErrorMessage(err));
            },
        }
    });

    const resetPasswordMutation = AuthAPI.useResetPasswordAuthResetPasswordPost({
        mutation: {
            onSuccess: () => {
                setSuccessMessage("Mật khẩu đã được thay đổi thành công!");
                setTimeout(() => {
                    navigate("/login", { state: { message: "Mật khẩu đã thay đổi. Vui lòng đăng nhập lại." } });
                }, 1500);
            },
            onError: (err: any) => {
                const detail = getErrorMessage(err);
                setError(detail);
                if (typeof detail === "string" && detail.toLowerCase().includes("otp")) {
                    setStep("otp");
                }
            },
        }
    });

    const handleSendOtp = () => {
        setError("");
        if (!email.trim()) {
            setError("Vui lòng nhập email");
            return;
        }
        sendOtpMutation.mutate({ data: { email: email.trim() } });
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
        // ... (validation logic keeps same)
        if (password !== confirmPassword) {
            setError("Mật khẩu xác nhận không khớp");
            return;
        }

        resetPasswordMutation.mutate({ 
            data: {
                email: email.trim(),
                otp_code: otp,
                new_password: password
            }
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50 p-4">
            <Card className="w-full max-w-md">
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white p-6 rounded-t-lg">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate("/login")} className="hover:bg-white/20 p-1 rounded transition">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-2xl font-bold">Quên Mật Khẩu</h1>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6">
                    {/* Error Alert */}
                    {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

                    {/* Success Alert */}
                    {successMessage && (
                        <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm">{successMessage}</div>
                    )}

                    {/* Step 1: Email */}
                    {step === "email" && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <Input
                                    type="email"
                                    placeholder="Nhập email của bạn"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={sendOtpMutation.isPending}
                                />
                            </div>
                            <Button onClick={handleSendOtp} disabled={sendOtpMutation.isPending} className="w-full bg-teal-600 hover:bg-teal-700">
                                {sendOtpMutation.isPending ? (
                                    <>
                                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                                        Đang gửi...
                                    </>
                                ) : (
                                    "Gửi Mã OTP"
                                )}
                            </Button>
                        </div>
                    )}

                    {/* Step 2: OTP */}
                    {step === "otp" && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Mã OTP 6 Chữ Số</label>
                                <Input
                                    type="text"
                                    placeholder="Nhập mã OTP"
                                    value={otp}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                                        setOtp(val);
                                    }}
                                    maxLength={6}
                                    className="text-center text-2xl tracking-widest"
                                />
                            </div>
                            <p className="text-xs text-gray-500">Mã OTP đã được gửi tới {email}</p>
                            <Button onClick={handleVerifyOtp} className="w-full bg-teal-600 hover:bg-teal-700">
                                Xác Thực OTP
                            </Button>
                            <Button onClick={handleSendOtp} variant="outline" disabled={sendOtpMutation.isPending} className="w-full">
                                {sendOtpMutation.isPending ? "Đang gửi..." : "Gửi Lại OTP"}
                            </Button>
                            <Button onClick={() => setStep("email")} variant="outline" className="w-full">
                                Quay Lại
                            </Button>
                        </div>
                    )}

                    {/* Step 3: Password Reset */}
                    {step === "password" && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Mật Khẩu Mới</label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Nhập mật khẩu mới"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    • Ít nhất 8 ký tự
                                    <br />• 1 chữ hoa, 1 chữ thường, 1 chữ số
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Xác Nhận Mật Khẩu</label>
                                <div className="relative">
                                    <Input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Nhập lại mật khẩu"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                onClick={handleResetPassword}
                                disabled={resetPasswordMutation.isPending}
                                className="w-full bg-teal-600 hover:bg-teal-700"
                            >
                                {resetPasswordMutation.isPending ? (
                                    <>
                                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                                        Đang thay đổi...
                                    </>
                                ) : (
                                    "Thay Đổi Mật Khẩu"
                                )}
                            </Button>
                            <Button onClick={() => setStep("otp")} variant="outline" className="w-full">
                                Quay Lại
                            </Button>
                        </div>
                    )}

                    {/* Progress Indicator */}
                    <div className="flex gap-2 justify-center pt-4">
                        <div
                            className={`w-2 h-2 rounded-full transition-colors ${
                                step === "email" || step === "otp" || step === "password" ? "bg-teal-600" : "bg-gray-300"
                            }`}
                        />
                        <div
                            className={`w-2 h-2 rounded-full transition-colors ${
                                step === "otp" || step === "password" ? "bg-teal-600" : "bg-gray-300"
                            }`}
                        />
                        <div className={`w-2 h-2 rounded-full transition-colors ${step === "password" ? "bg-teal-600" : "bg-gray-300"}`} />
                    </div>
                </div>
            </Card>
        </div>
    );
}
