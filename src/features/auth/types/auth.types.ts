import { z } from 'zod'
import type { User } from '@/types'

export const LoginFormDataSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  rememberMe: z.boolean().optional(),
})

export type LoginFormData = z.infer<typeof LoginFormDataSchema>

export const RegisterFormDataSchema = z.object({
  firstName: z.string().min(2, 'Họ tối thiểu 2 ký tự'),
  lastName: z.string().min(2, 'Tên tối thiểu 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z
    .string()
    .min(8, 'Mật khẩu tối thiểu 8 ký tự')
    .regex(/[A-Z]/, 'Phải chứa ít nhất 1 chữ hoa')
    .regex(/[0-9]/, 'Phải chứa ít nhất 1 số'),
  acceptedTerms: z.boolean().refine((val) => val === true, 'Vui lòng đồng ý điều khoản'),
})

export type RegisterFormData = z.infer<typeof RegisterFormDataSchema>

export interface AuthResponse {
  user: User
  token: string
  refreshToken: string
}

export interface AuthError {
  message: string
  code?: string
}
