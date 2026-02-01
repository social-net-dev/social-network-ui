import { Spinner } from "./spinner";

export function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="xl" />
        <p className="text-muted-foreground animate-pulse font-medium">Đang tải...</p>
      </div>
    </div>
  );
}
