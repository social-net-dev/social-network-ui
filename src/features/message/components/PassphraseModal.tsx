import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  open: boolean;
  mode: 'create' | 'restore';
  onClose: () => void;
  onSubmit: (passphrase: string, remember: boolean) => Promise<void>;
}

export const PassphraseModal: React.FC<Props> = ({ open, mode, onClose, onSubmit }) => {
  const [passphrase, setPassphrase] = useState('');
  const [confirm, setConfirm] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const isCreate = mode === 'create';

  const handleSubmit = async () => {
    // Enforce minimum passphrase length and confirmation for create mode
    if (isCreate) {
      if (passphrase.length < 6) {
        alert('Passphrase quá ngắn — tối thiểu 6 ký tự');
        return;
      }
      if (passphrase !== confirm) {
        alert('Passphrase và xác nhận không khớp');
        return;
      }
    }
    setLoading(true);
    try {
      await onSubmit(passphrase, remember);
      onClose();
    } catch (e) {
      console.error('Passphrase submit failed', e);
      alert('Lỗi: không thể thực hiện. Kiểm tra console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={open ? () => {} : onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isCreate ? 'Tạo passphrase để backup khoá' : 'Nhập passphrase để khôi phục khoá'}</DialogTitle>
          <DialogDescription>{isCreate ? 'Hãy nhập một passphrase (mật khẩu mã hoá) để mã hoá private key và lưu an toàn trên server. Ghi nhớ passphrase này!' : 'Nhập passphrase bạn đã dùng để mã hoá private key trên thiết bị trước đó.'}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <label className="text-sm">Passphrase</label>
          <Input type="password" value={passphrase} onChange={e => setPassphrase(e.target.value)} />

          {isCreate && (
            <>
              <label className="text-sm">Xác nhận passphrase</label>
              <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} />
            </>
          )}

          <label className="flex items-center gap-2 mt-2 text-sm">
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
            <span>Ghi nhớ trên thiết bị này</span>
          </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Huỷ
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {isCreate ? 'Tạo & Backup' : 'Khôi phục'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
