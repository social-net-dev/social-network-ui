import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useLogin } from '../hooks/useLogin'

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const { form, onSubmit, error, isLoading } = useLogin()

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="email" className="block text-sm font-medium mb-2">
          Địa chỉ email
        </Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            id="email"
            type="email"
            placeholder="name@company.com"
            {...form.register('email')}
            className="pl-10 h-12 rounded-xl bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-gray-600"
            disabled={isLoading}
          />
        </div>
        {form.formState.errors.email && (
          <p className="mt-1 text-sm text-red-500">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="password" className="block text-sm font-medium mb-2">
          Mật khẩu
        </Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            {...form.register('password')}
            className="pl-10 pr-10 h-12 rounded-xl bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-gray-600"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer hover:text-gray-600 dark:hover:text-gray-200 text-gray-400 transition-colors"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {form.formState.errors.password && (
          <p className="mt-1 text-sm text-red-500">{form.formState.errors.password.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember-me"
            checked={form.watch('rememberMe')}
            onCheckedChange={(checked) => form.setValue('rememberMe', checked === true)}
            className="h-4 w-4"
            disabled={isLoading}
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
            Ghi nhớ đăng nhập
          </label>
        </div>
        <div className="text-sm">
          <a className="font-medium text-[#0E4E5A] dark:text-[#E2F046] hover:underline transition-all" href="#">
            Quên mật khẩu?
          </a>
        </div>
      </div>

      {error && <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg">{error}</div>}

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 rounded-xl font-bold text-[#0E4E5A] bg-[#E2F046] hover:bg-[#cedd30] shadow-sm transform hover:scale-[1.02] transition-all duration-200"
      >
        {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập vào nền tảng'}
      </Button>
    </form>
  )
}
