import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getErrorMessage } from '@/lib/api/transforms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, RefreshCw } from 'lucide-react';
import { useAuthResendOtp, useAuthVerifyOtp } from '@/lib/api/generated/auth/auth';

const OTP_STORAGE_EMAIL = 'otp_verify_email';
const OTP_STORAGE_USER_ID = 'otp_verify_user_id';

function getStoredEmail(): string {
  if (typeof sessionStorage === 'undefined') return '';
  return sessionStorage.getItem(OTP_STORAGE_EMAIL) ?? '';
}

function getStoredUserId(): string {
  if (typeof sessionStorage === 'undefined') return '';
  return sessionStorage.getItem(OTP_STORAGE_USER_ID) ?? '';
}

export function OTPVerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { email?: string; user_id?: string } | null;

  const email = state?.email ?? getStoredEmail();
  const user_id = state?.user_id ?? getStoredUserId();

  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);

  const verifyMutation = useAuthVerifyOtp({
    mutation: {
      onSuccess: async () => {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem(OTP_STORAGE_EMAIL);
          sessionStorage.removeItem(OTP_STORAGE_USER_ID);
        }
        navigate('/login', {
          state: {
            email,
            message: 'Xác thực OTP thành công! Vui lòng đăng nhập.',
          },
        });
      },
      onError: err => {
        setError(getErrorMessage(err));
      },
    },
  });

  const resendMutation = useAuthResendOtp({
    mutation: {
      onSuccess: () => {
        setResendSuccess(true);
        setError('');
        setTimeout(() => setResendSuccess(false), 3000);
      },
      onError: err => {
        setError(getErrorMessage(err));
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otpCode.length !== 6) {
      setError('Mã OTP phải có 6 chữ số');
      return;
    }
    if (!email) {
      setError('Thiếu thông tin email. Vui lòng đăng ký lại.');
      return;
    }

    verifyMutation.mutate({
      data: {
        user_id,
        otp: otpCode,
      },
    });
  };

  const handleResend = () => {
    if (!email) {
      setError('Thiếu email. Vui lòng đăng ký lại.');
      return;
    }

    resendMutation.mutate({
      data: {
        user_id,
      },
    });
  };

  if (!user_id || !email) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Thiếu thông tin xác thực</h2>
            <p className="mt-2 text-gray-600">Trang nhập mã OTP chỉ dùng sau khi bạn đăng ký thành công.</p>
            <Button className="mt-4" onClick={() => navigate('/register')}>
              Quay lại đăng ký
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <Mail className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">Xác thực OTP</h2>
          <p className="mt-2 text-sm text-gray-600">
            Chúng tôi đã gửi mã OTP đến email: <strong>{email}</strong>
          </p>
          <p className="mt-1 text-xs text-gray-500">Vui lòng kiểm tra hộp thư đến (hoặc spam) để lấy mã OTP</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {resendSuccess && (
            <div className="rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800">Đã gửi lại mã OTP thành công!</p>
            </div>
          )}

          <div>
            <Label htmlFor="otpCode">Mã OTP (6 chữ số)</Label>
            <Input
              id="otpCode"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otpCode}
              onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="mt-1 text-center text-2xl tracking-widest"
              required
              autoFocus
            />
          </div>

          <div>
            <Button type="submit" className="w-full" disabled={verifyMutation.isPending || otpCode.length !== 6}>
              {verifyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xác thực...
                </>
              ) : (
                'Xác thực OTP'
              )}
            </Button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendMutation.isPending}
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 disabled:text-gray-400"
            >
              {resendMutation.isPending ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-1 h-4 w-4" />
                  Gửi lại mã OTP
                </>
              )}
            </button>
          </div>

          <div className="text-center text-sm">
            <button type="button" onClick={() => navigate('/register')} className="text-gray-600 hover:text-gray-900">
              ← Quay lại đăng ký
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
