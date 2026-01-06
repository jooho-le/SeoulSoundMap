import { District } from '@/data/districts';
import { getRiskMeta } from '@/lib/risk';

type TopStatusProps = {
  district: District | null;
  pulseActive: boolean;
  pulseIntensity: number;
};

export default function TopStatus({
  district,
  pulseActive,
  pulseIntensity
}: TopStatusProps) {
  const meta = district ? getRiskMeta(district.riskScore) : null;
  const intensity =
    pulseIntensity > 0 ? Math.min(pulseIntensity, 1) : 0.2;
  const labelText = meta?.label ? ` · ${meta.label}` : '';
  const duration = pulseActive ? 1.7 - intensity * 0.8 : 2.6;
  const ringOpacity = pulseActive ? 0.3 + intensity * 0.25 : 0.12;

  return (
    <div className="absolute left-6 top-6 z-10 flex items-center gap-4 rounded-2xl border border-white/10 bg-black/30 px-6 py-3.5 backdrop-blur-sm">
      <div className="relative flex h-4 w-4 items-center justify-center">
        <span
          className="pulse-ring"
          style={{
            animationDuration: `${duration}s`,
            opacity: ringOpacity,
            animationPlayState: pulseActive ? 'running' : 'paused'
          }}
        />
        <span
          className="pulse-dot"
          style={{ opacity: pulseActive ? 0.9 : 0.35 }}
        />
      </div>
      <div className="leading-tight">
        <p className="text-[11px] uppercase tracking-[0.28em] text-white/55">
          Current
        </p>
        <p className="text-base font-semibold text-white">
          {district ? `${district.nameKo}${labelText}` : '서울의 소리를 고르세요'}
        </p>
        {district ? (
          meta?.copy ? (
            <p className="text-sm text-white/60">{meta.copy}</p>
          ) : null
        ) : (
          <p className="text-sm text-white/60">구 위에 커서를 올려 들어보세요</p>
        )}
      </div>
    </div>
  );
}
