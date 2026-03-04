import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Eye, EyeOff, Loader2 } from 'lucide-react';

interface DeactivateAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  isPending: boolean;
  error: string | null;
}

export function DeactivateAccountDialog({
  isOpen,
  onClose,
  onConfirm,
  isPending,
  error,
}: DeactivateAccountDialogProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(password);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-card p-6 rounded-xl max-w-md w-full shadow-2xl space-y-4 border border-border">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Xác nhận vô hiệu hóa</h3>
            <p className="text-sm text-muted-foreground mt-1">Bạn sẽ bị đăng xuất ngay lập tức. Vui lòng nhập mật khẩu để xác nhận.</p>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Mật khẩu xác nhận</Label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu..."
              className="pr-10 rounded-lg h-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <label className="flex items-start gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={e => setConfirmed(e.target.checked)}
            className="mt-1"
          />
          <span className="text-muted-foreground">Tôi xác nhận và hiểu rằng dữ liệu sẽ bị ẩn.</span>
        </label>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-900/40">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="rounded-lg">Hủy</Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!password || !confirmed || isPending}
            className="rounded-lg"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Xác nhận vô hiệu hóa
          </Button>
        </div>
      </div>
    </div>
  );
}
