import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { changePasswordApi } from "../services/changePasswordApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader } from "lucide-react";

const ChangePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
        newPassword: z
            .string()
            .min(8, "Mật khẩu tối thiểu 8 ký tự")
            .regex(/[A-Z]/, "Phải có ít nhất một chữ hoa")
            .regex(/[a-z]/, "Phải có ít nhất một chữ thường")
            .regex(/[0-9]/, "Phải có ít nhất một số")
            .regex(/[!@#$%^&*(),.?":{}|<>]/, "Phải có ít nhất một ký tự đặc biệt"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Mật khẩu xác nhận không khớp",
        path: ["confirmPassword"],
    });

type ChangePasswordFormData = z.infer<typeof ChangePasswordSchema>;

export function ChangePasswordForm() {
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const form = useForm<ChangePasswordFormData>({
        resolver: zodResolver(ChangePasswordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const mutation = useMutation({
        mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
            changePasswordApi.changePassword(currentPassword, newPassword),
        onSuccess: () => {
            setSuccessMessage("Mật khẩu đã được thay đổi thành công!");
            form.reset();
            setTimeout(() => setSuccessMessage(""), 3000);
        },
        onError: (error: any) => {
            console.error("Change password error:", error);
            let errorMsg = "Có lỗi xảy ra. Vui lòng thử lại.";

            // Handle different error response formats
            if (error?.response?.data?.detail) {
                if (typeof error.response.data.detail === "string") {
                    errorMsg = error.response.data.detail;
                } else if (Array.isArray(error.response.data.detail)) {
                    errorMsg = error.response.data.detail.map((e: any) => e.msg).join(", ");
                }
            } else if (error?.response?.data?.message) {
                errorMsg = error.response.data.message;
            } else if (error?.message) {
                errorMsg = error.message;
            }

            form.setError("currentPassword", { message: errorMsg });
        },
    });

    const onSubmit = (data: ChangePasswordFormData) => {
        mutation.mutate({
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
        });
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {successMessage && (
                <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-400">
                    {successMessage}
                </div>
            )}

            {/* Current Password */}
            <div className="space-y-2">
                <Label htmlFor="currentPassword">Mật khẩu hiện tại *</Label>
                <div className="relative">
                    <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="Nhập mật khẩu hiện tại"
                        {...form.register("currentPassword")}
                        className="pr-10 rounded-xl border-gray-200 dark:border-gray-800"
                        disabled={mutation.isPending}
                    />
                    <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                    >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
                {form.formState.errors.currentPassword && <p className="text-sm text-red-500">{form.formState.errors.currentPassword.message}</p>}
            </div>

            {/* New Password */}
            <div className="space-y-2">
                <Label htmlFor="newPassword">Mật khẩu mới *</Label>
                <div className="relative">
                    <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Nhập mật khẩu mới"
                        {...form.register("newPassword")}
                        className="pr-10 rounded-xl border-gray-200 dark:border-gray-800"
                        disabled={mutation.isPending}
                    />
                    <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                    >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
                <p className="text-xs text-gray-500">Tối thiểu 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt</p>
                {form.formState.errors.newPassword && <p className="text-sm text-red-500">{form.formState.errors.newPassword.message}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới *</Label>
                <div className="relative">
                    <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Xác nhận mật khẩu mới"
                        {...form.register("confirmPassword")}
                        className="pr-10 rounded-xl border-gray-200 dark:border-gray-800"
                        disabled={mutation.isPending}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                    >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
                {form.formState.errors.confirmPassword && <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>}
            </div>

            <Button
                type="submit"
                disabled={mutation.isPending}
                className="w-full bg-etechs-primary text-etechs-secondary hover:bg-etechs-primary/90 font-bold py-2 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-etechs-primary/50 active:scale-95"
            >
                {mutation.isPending ? (
                    <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Đang xử lý...
                    </>
                ) : (
                    "Thay đổi mật khẩu"
                )}
            </Button>
        </form>
    );
}
