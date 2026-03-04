interface E2EEOverlayProps {
  message?: string | null;
  onRestore: () => void;
  onCreate: () => void;
}

export function E2EEOverlay({ message, onRestore, onCreate }: E2EEOverlayProps) {
  return (
    <div className="absolute left-0 right-0 top-0 bottom-16 bg-white/80 z-50 flex items-center justify-center p-6">
      <div className="max-w-xl text-center">
        <h3 className="text-lg font-semibold mb-2">Bảo mật đầu cuối yêu cầu khoá</h3>
        <p className="mb-4">
          {message || 'Phòng này yêu cầu E2EE. Vui lòng khôi phục khoá hoặc tạo khoá mới để tiếp tục.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button className="px-4 py-2 bg-etechs-primary text-white rounded" onClick={onRestore}>
            Khôi phục từ backup
          </button>
          <button className="px-4 py-2 border rounded" onClick={onCreate}>
            Tạo &amp; Backup khoá
          </button>
        </div>
      </div>
    </div>
  );
}
