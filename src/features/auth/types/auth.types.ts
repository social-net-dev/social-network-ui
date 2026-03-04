import { z } from "zod";
export type RegisterResponse = {
  id: string;
  email: string;
  username: string;
}

/**
 * UI-specific Form Schemas
 */

export const LoginFormDataSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof LoginFormDataSchema>;

export const RegisterFormDataSchema = z
  .object({
    email: z.string().email('Email không hợp lệ'),
    password: z
      .string()
      .min(8, 'Mật khẩu tối thiểu 8 ký tự')
      .regex(/[A-Z]/, 'Phải chứa ít nhất 1 chữ hoa')
      .regex(/[a-z]/, 'Phải chứa ít nhất 1 chữ thường')
      .regex(/[0-9]/, 'Phải chứa ít nhất 1 số')
      .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Phải chứa ít nhất 1 ký tự đặc biệt'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
    displayName: z.string().min(2, 'Tên hiển thị tối thiểu 2 ký tự'),
    phone: z
      .string()
      .min(1, 'Số điện thoại không được để trống')
      .refine(value => /^0\d{9}$/.test(value), 'Số điện thoại phải gồm 10 chữ số, bắt đầu bằng 0, không có khoảng trắng'),
    role: z.enum(['STUDENT', 'INSTRUCTOR']),
    gender: z
      .string()
      .min(1, 'Vui lòng chọn giới tính')
      .refine(value => ['MALE', 'FEMALE', 'OTHER'].includes(value), 'Giới tính không hợp lệ'),
    // Giấy tờ tùy thân (không bắt buộc)
    personalDocuments: z.array(z.instanceof(File)).optional(),
    consent: z.boolean().refine(val => val === true, 'Vui lòng đồng ý điều khoản'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof RegisterFormDataSchema>;

export const OTPVerifySchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  otpCode: z.string().length(6, 'Mã OTP phải có 6 chữ số'),
});

export type OTPVerifyData = z.infer<typeof OTPVerifySchema>;

/**
 * Re-exporting Backend Models using unified names
 */

export type AuthResponse = {
    user: {
        id: string;
        display_name: string;
        username?: string;
        avatar_path?: string;
    };
    token: string;
    refreshToken: string;
}



export interface AuthError {
  message: string;
  code?: string;
  detail?: any;
}
