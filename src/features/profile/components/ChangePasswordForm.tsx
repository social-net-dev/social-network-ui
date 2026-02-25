import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthChangePassword } from "@/lib/api/generated/auth/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader } from "lucide-react";
import { getErrorMessage } from "@/lib/utils/api";

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

    const mutation = useAuthChangePassword({
        mutation: {
            onSuccess: () => {
                setSuccessMessage("Mật khẩu đã được thay đổi thành công!");
                form.reset();
                setTimeout(() => setSuccessMessage(""), 3000);
            },
            onError: (error: unknown) => {
                form.setError("currentPassword", { message: getErrorMessage(error) });
            },
        },
    });

    const onSubmit = (data: ChangePasswordFormData) => {
        mutation.mutate({
            data: { current_password: data.currentPassword, new_password: data.newPassword },
        });
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {successMessage && (
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-400">
                    {successMessage}
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-sm font-medium">Mật khẩu hiện tại *</Label>
                <div className="relative">
                    <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="Nhập mật khẩu hiện tại"
                        {...form.register("currentPassword")}
                        className="pr-10 rounded-lg h-10"
                        disabled={mutation.isPending}
                    />
                    <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
                {form.formState.errors.currentPassword && <p className="text-sm text-destructive">{form.formState.errors.currentPassword.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-medium">Mật khẩu mới *</Label>
                <div className="relative">
                    <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Nhập mật khẩu mới"
                        {...form.register("newPassword")}
                        className="pr-10 rounded-lg h-10"
                        disabled={mutation.isPending}
                    />
                    <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
                {form.formState.errors.newPassword && <p className="text-sm text-destructive">{form.formState.errors.newPassword.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Xác nhận mật khẩu mới *</Label>
                <div className="relative">
                    <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Xác nhận mật khẩu mới"
                        {...form.register("confirmPassword")}
                        className="pr-10 rounded-lg h-10"
                        disabled={mutation.isPending}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
                {form.formState.errors.confirmPassword && <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>}
            </div>

            <Button
                type="submit"
                disabled={mutation.isPending}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg h-10 font-medium gap-2"
            >
                {mutation.isPending && <Loader className="w-4 h-4 animate-spin" />}
                Thay đổi mật khẩu
            </Button>
        </form>
    );
}
