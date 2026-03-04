import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaGridProps {
  files: File[];
  onRemove: (index: number) => void;
}

function renderItem(
  file: File,
  index: number,
  className: string,
  onRemove: (i: number) => void,
  overlay?: React.ReactNode
) {
  const url = URL.createObjectURL(file);
  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");

  return (
    <div key={index} className={cn("relative group overflow-hidden rounded-lg bg-muted", className)}>
      {isImage ? (
        <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
      ) : isVideo ? (
        <video src={url} className="w-full h-full object-cover" controls />
      ) : (
        <div className="w-full h-full flex items-center justify-center p-2">
          <p className="text-xs text-center text-muted-foreground break-all">{file.name}</p>
        </div>
      )}
      {overlay}
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute top-1.5 right-1.5 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white shadow transition-opacity opacity-0 group-hover:opacity-100"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

export function MediaGrid({ files, onRemove }: MediaGridProps) {
  if (files.length === 0) return null;

  const shown = files.slice(0, 4);
  const extra = files.length - 4;

  if (files.length === 1) {
    return <div className="rounded-lg overflow-hidden max-h-80">{renderItem(files[0], 0, "h-72 w-full", onRemove)}</div>;
  }
  if (files.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden h-60">
        {shown.map((f, i) => renderItem(f, i, "h-full", onRemove))}
      </div>
    );
  }
  if (files.length === 3) {
    return (
      <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden h-60">
        {renderItem(files[0], 0, "row-span-2 h-full", onRemove)}
        <div className="grid grid-rows-2 gap-1 h-full">
          {renderItem(files[1], 1, "h-full", onRemove)}
          {renderItem(files[2], 2, "h-full", onRemove)}
        </div>
      </div>
    );
  }
  // 4+
  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden h-60">
      {shown.map((f, i) =>
        renderItem(f, i, "h-full", onRemove,
          i === 3 && extra > 0 ? (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
              <span className="text-white font-bold text-2xl">+{extra}</span>
            </div>
          ) : undefined
        )
      )}
    </div>
  );
}
