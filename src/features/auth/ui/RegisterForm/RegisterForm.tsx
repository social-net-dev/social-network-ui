import { useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, User, Phone, Upload, X, Eye, EyeOff } from "lucide-react";
import { useRegister } from "../../use-cases/useRegister";

export function RegisterForm() {
    const { form, onSubmit, error, isLoading } = useRegister();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [personalDocumentsPreviews, setPersonalDocumentsPreviews] = useState<string[]>([]);

    const handlePersonalDocumentsChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            const currentFiles = form.getValues("personalDocuments") || [];
            const newFiles = [...currentFiles, ...files];
            form.setValue("personalDocuments", newFiles);
            const previews: string[] = [...personalDocumentsPreviews];
            let loadedCount = 0;
            files.forEach((file) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    previews.push(reader.result as string);
                    loadedCount++;
                    if (loadedCount === files.length) {
                        setPersonalDocumentsPreviews(previews);
                    }
                };
                reader.readAsDataURL(file as Blob);
            });
        }
    };

    const removePersonalDocument = (index: number) => {
        const currentFiles = form.getValues("personalDocuments") || [];
        const newFiles = currentFiles.filter((_: File, i: number) => i !== index);
        form.setValue("personalDocuments", newFiles.length > 0 ? newFiles : undefined);
        setPersonalDocumentsPreviews((prev: string[]) => prev.filter((_: string, i: number) => i !== index));
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Input
                        id="email"
                        type="email"
                        placeholder="example@company.com"
                        {...form.register("email")}
                        className="pl-10"
                        disabled={isLoading}
                    />
                </div>
                {form.formState.errors.email && <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="password">Mật khẩu *</Label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...form.register("password")}
                            className="pl-10 pr-10"
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                    {form.formState.errors.password && <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Xác nhận mật khẩu *</Label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...form.register("confirmPassword")}
                            className="pl-10 pr-10"
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                    {form.formState.errors.confirmPassword && (
                        <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>
                    )}
                </div>
            </div>

            <p className="text-xs text-slate-500 -mt-2">Mật khẩu tối thiểu 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="displayName">Tên hiển thị *</Label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <Input
                            id="displayName"
                            type="text"
                            placeholder="Nguyễn Văn A"
                            {...form.register("displayName")}
                            className="pl-10"
                            disabled={isLoading}
                        />
                    </div>
                    {form.formState.errors.displayName && (
                        <p className="text-sm text-red-500">{form.formState.errors.displayName.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone">Số điện thoại</Label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="0123456789"
                            value={form.watch("phone") || ""}
                            onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                form.setValue("phone", value);
                            }}
                            className="pl-10"
                            disabled={isLoading}
                        />
                    </div>
                    {form.formState.errors.phone && <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="role">Loại tài khoản *</Label>
                    <select
                        id="role"
                        {...form.register("role")}
                        className="w-full px-3 py-2 border border-border rounded-md bg-input/50 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        disabled={isLoading}
                    >
                        <option value="STUDENT">Người học</option>
                        <option value="INSTRUCTOR">Người dạy</option>
                    </select>
                    {form.formState.errors.role && <p className="text-sm text-red-500">{form.formState.errors.role.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="gender">Giới tính</Label>
                    <select
                        id="gender"
                        {...form.register("gender")}
                        className="w-full px-3 py-2 border border-border rounded-md bg-input/50 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        disabled={isLoading}
                    >
                        <option defaultValue="" value="">-- Chọn giới tính --</option>
                        <option value="MALE">Nam</option>
                        <option value="FEMALE">Nữ</option>
                        <option value="OTHER">Khác</option>
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="personalDocuments">Giấy tờ tùy thân (CCCD, thẻ sinh viên, thẻ học sinh)</Label>
                {personalDocumentsPreviews.length > 0 ? (
                    <div className="space-y-2">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {personalDocumentsPreviews.map((preview, index) => (
                                <div key={index} className="relative">
                                    <img src={preview} alt={`Giấy tờ ${index + 1}`} className="w-full h-24 object-cover rounded-md border" />
                                    <button
                                        type="button"
                                        onClick={() => removePersonalDocument(index)}
                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                        disabled={isLoading}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                            {personalDocumentsPreviews.length < 5 && (
                                <label
                                    htmlFor="personalDocuments"
                                    className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-md cursor-pointer hover:border-primary transition-colors"
                                >
                                    <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                                    <span className="text-xs text-muted-foreground">Thêm ảnh</span>
                                </label>
                            )}
                        </div>
                        <input
                            id="personalDocuments"
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handlePersonalDocumentsChange}
                            disabled={isLoading}
                        />
                    </div>
                ) : (
                    <label
                        htmlFor="personalDocuments"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-md cursor-pointer hover:border-primary transition-colors"
                    >
                        <Upload className="h-8 w-8 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">Click để upload (tuỳ chọn)</span>
                        <input
                            id="personalDocuments"
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handlePersonalDocumentsChange}
                            disabled={isLoading}
                        />
                    </label>
                )}
                {form.formState.errors.personalDocuments && (
                    <p className="text-sm text-red-500">{form.formState.errors.personalDocuments.message}</p>
                )}
            </div>

            <div className="flex items-center gap-2">
                <div className="flex items-center h-4 flex-shrink-0">
                    <Checkbox
                        id="consent"
                        checked={form.watch("consent")}
                        onCheckedChange={(checked) => form.setValue("consent", checked as boolean)}
                        disabled={isLoading}
                    />
                </div>
                <Label htmlFor="consent" className="font-normal text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
                    Tôi đồng ý với{" "}
                    <a href="#" className="font-medium text-primary hover:underline">
                        Điều khoản sử dụng
                    </a>{" "}
                    và{" "}
                    <a href="#" className="font-medium text-primary hover:underline">
                        Chính sách bảo mật
                    </a>
                </Label>
            </div>
            {form.formState.errors.consent && <p className="text-sm text-red-500">{form.formState.errors.consent.message}</p>}

            {error && <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg">{error}</div>}

            <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
                {isLoading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
            </Button>
        </form>
    );
}
