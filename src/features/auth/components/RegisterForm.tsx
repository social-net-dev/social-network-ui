import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Mail, Lock } from 'lucide-react'
import { useRegister } from '../hooks/useRegister'

export function RegisterForm() {
  const { form, onSubmit, error, isLoading } = useRegister()

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Họ</Label>
          <Input
            id="firstName"
            type="text"
            placeholder="Nguyễn"
            {...form.register('firstName')}
            disabled={isLoading}
          />
          {form.formState.errors.firstName && (
            <p className="text-sm text-red-500">{form.formState.errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Tên</Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Văn A"
            {...form.register('lastName')}
            disabled={isLoading}
          />
          {form.formState.errors.lastName && (
            <p className="text-sm text-red-500">{form.formState.errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email doanh nghiệp</Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            id="email"
            type="email"
            placeholder="name@company.com"
            {...form.register('email')}
            className="pl-10"
            disabled={isLoading}
          />
        </div>
        {form.formState.errors.email && (
          <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mật khẩu</Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            {...form.register('password')}
            className="pl-10"
            disabled={isLoading}
          />
        </div>
        {form.formState.errors.password && (
          <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
        )}
        <p className="text-xs text-slate-500 dark:text-slate-400">Tối thiểu 8 ký tự, bao gồm chữ hoa và số.</p>
      </div>

      <div className="flex items-start">
        <div className="flex items-center h-5">
          <Checkbox
            id="terms"
            checked={form.watch('acceptedTerms')}
            onCheckedChange={(checked) => form.setValue('acceptedTerms', checked as boolean)}
            disabled={isLoading}
          />
        </div>
        <div className="ml-3 text-sm">
          <Label htmlFor="terms" className="font-normal text-slate-600 dark:text-slate-300 cursor-pointer">
            Tôi đồng ý với{' '}
            <a href="#" className="font-medium text-[#1b7a78] hover:underline">
              Điều khoản sử dụng
            </a>{' '}
            và{' '}
            <a href="#" className="font-medium text-[#1b7a78] hover:underline">
              Chính sách bảo mật
            </a>
          </Label>
        </div>
      </div>
      {form.formState.errors.acceptedTerms && (
        <p className="text-sm text-red-500">{form.formState.errors.acceptedTerms.message}</p>
      )}

      {error && <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg">{error}</div>}

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#1b7a78] hover:bg-teal-700 focus:ring-4 focus:outline-none focus:ring-teal-300 dark:bg-[#1b7a78] dark:hover:bg-teal-600 dark:focus:ring-teal-800 shadow-lg hover:shadow-teal-500/30"
      >
        {isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
      </Button>
    </form>
  )
}
