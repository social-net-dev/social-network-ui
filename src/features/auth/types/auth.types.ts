import { z } from "zod";
import type { User } from "@/types";

export const LoginFormDataSchema = z.object({
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(1, "Mật khẩu không được để trống"),
    rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof LoginFormDataSchema>;

export const RegisterFormDataSchema = z.object({
    email: z.string().email("Email không hợp lệ"),
    password: z
        .string()
        .min(8, "Mật khẩu tối thiểu 8 ký tự")
        .regex(/[A-Z]/, "Phải chứa ít nhất 1 chữ hoa")
        .regex(/[a-z]/, "Phải chứa ít nhất 1 chữ thường")
        .regex(/[0-9]/, "Phải chứa ít nhất 1 số")
        .regex(/[!@#$%^&*(),.?":{}|<>]/, "Phải chứa ít nhất 1 ký tự đặc biệt"),
    displayName: z.string().min(2, "Tên hiển thị tối thiểu 2 ký tự"),
    phone: z.string().optional(),
    role: z.enum(["USER", "STUDENT", "TEACHER"]),
    idCardFront: z.instanceof(File, { message: "Vui lòng upload ảnh CCCD mặt trước" }),
    idCardBack: z.instanceof(File, { message: "Vui lòng upload ảnh CCCD mặt sau" }),
    consent: z.boolean().refine((val) => val === true, "Vui lòng đồng ý điều khoản"),
});

export type RegisterFormData = z.infer<typeof RegisterFormDataSchema>;

export const OTPVerifySchema = z.object({
    email: z.string().email("Email không hợp lệ"),
    otpCode: z.string().length(6, "Mã OTP phải có 6 chữ số"),
});

export type OTPVerifyData = z.infer<typeof OTPVerifySchema>;

export interface AuthResponse {
    user: User;
    token: string;
    refreshToken: string;
}

export interface RegisterResponse {
    message: string;
    user_id: number;
    email: string;
}

export interface OTPResponse {
    message: string;
}

export interface RefreshTokenResponse {
    access_token: string;
    token_type: string;
}

export interface AuthError {
    message: string;
    code?: string;
}
