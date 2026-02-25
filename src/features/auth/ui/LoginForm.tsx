import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useLogin } from '../use-cases/useLogin';

interface LoginFormProps {
  initialEmail?: string;
}

export function LoginForm({ initialEmail }: LoginFormProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(location.state?.message || null);
  const { form, onSubmit, error, isLoading } = useLogin();

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (initialEmail) {
      form.setValue('email', initialEmail);
    }
  }, [initialEmail, form]);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {successMessage && (
        <div className="p-4 text-sm text-green-700 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-start gap-2">
          <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p>{successMessage}</p>
        </div>
      )}

      <div>
        <Label htmlFor="email" className="block text-sm font-medium mb-2">
          Địa chỉ email
        </Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            id="email"
            type="email"
            placeholder="name@company.com"
            {...form.register('email')}
            className="pl-10 h-12 rounded-xl bg-input/50 border-border"
            disabled={isLoading}
          />
        </div>
        {form.formState.errors.email && <p className="mt-1 text-sm text-red-500">{form.formState.errors.email.message}</p>}
      </div>

      <div>
        <Label htmlFor="password" className="block text-sm font-medium mb-2">
          Mật khẩu
        </Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            {...form.register('password')}
            className="pl-10 pr-10 h-12 rounded-xl bg-input/50 border-border"
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
        {form.formState.errors.password && <p className="mt-1 text-sm text-red-500">{form.formState.errors.password.message}</p>}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember-me"
            checked={form.watch('rememberMe')}
            onCheckedChange={checked => form.setValue('rememberMe', checked === true)}
            className="h-4 w-4"
            disabled={isLoading}
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-muted-foreground cursor-pointer">
            Ghi nhớ đăng nhập
          </label>
        </div>
        <div className="text-sm">
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="font-medium text-primary hover:underline transition-all"
          >
            Quên mật khẩu?
          </button>
        </div>
      </div>

      {error && <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg">{error}</div>}

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:scale-[1.02] transition-all duration-200"
      >
        {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập vào nền tảng'}
      </Button>
    </form>
  );
}
