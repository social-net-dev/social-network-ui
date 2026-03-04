const WARN_THRESHOLD = 0.8;
const DANGER_THRESHOLD = 0.95;

interface CharRingProps {
  count: number;
  max: number;
}

export function CharRing({ count, max }: CharRingProps) {
  const ratio = count / max;
  const size = 28;
  const stroke = 2.5;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(ratio, 1);

  const color =
    ratio >= DANGER_THRESHOLD ? "#ef4444" : ratio >= WARN_THRESHOLD ? "#f59e0b" : "hsl(var(--primary))";

  if (count === 0) return null;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.15s ease, stroke 0.3s ease" }}
        />
      </svg>
      {ratio >= WARN_THRESHOLD && (
        <span className="absolute text-[9px] font-semibold tabular-nums" style={{ color, lineHeight: 1 }}>
          {max - count}
        </span>
      )}
    </div>
  );
}
