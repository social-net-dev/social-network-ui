import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Globe, Users, Lock, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const PRIVACY_OPTIONS = [
  { value: "PUBLIC", label: "Mọi người", icon: Globe, className: "text-green-600" },
  { value: "FRIENDS", label: "Bạn bè", icon: Users, className: "text-blue-600" },
  { value: "PRIVATE", label: "Chỉ mình tôi", icon: Lock, className: "text-muted-foreground" },
] as const;

export type PrivacyValue = (typeof PRIVACY_OPTIONS)[number]["value"];

interface PrivacySelectorProps {
  value: PrivacyValue;
  onChange: (value: PrivacyValue) => void;
}

export function PrivacySelector({ value, onChange }: PrivacySelectorProps) {
  const selected = PRIVACY_OPTIONS.find((p) => p.value === value)!;
  const SelectedIcon = selected.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium",
            "bg-muted hover:bg-muted/80 transition-colors border border-border/50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          )}
        >
          <SelectedIcon className={cn("h-3 w-3", selected.className)} />
          <span>{selected.label}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {PRIVACY_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={cn("gap-2 text-sm", value === opt.value && "bg-muted font-medium")}
            >
              <Icon className={cn("h-4 w-4", opt.className)} />
              {opt.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
