import { District } from '@/data/districts';
import { getRiskMeta } from '@/lib/risk';

type TooltipPosition = {
  x: number;
  y: number;
};

type HoverTooltipProps = {
  district: District | null;
  position: TooltipPosition | null;
  visible: boolean;
};

export default function HoverTooltip({
  district,
  position,
  visible
}: HoverTooltipProps) {
  if (!district || !position) return null;
  const meta = getRiskMeta(district.riskScore);
  const labelText = meta.label ? ` · ${meta.label}` : '';

  return (
    <div
      className={`pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-4 rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-white shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md transition duration-200 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
      }`}
      style={{ left: position.x, top: position.y }}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-white/80">
        <span className="font-semibold text-white">
          {district.nameKo}
          {labelText}
        </span>
      </div>
      {meta.copy ? (
        <div className="mt-0.5 text-[11px] text-white/60">{meta.copy}</div>
      ) : null}
    </div>
  );
}
