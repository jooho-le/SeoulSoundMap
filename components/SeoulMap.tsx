import { District } from '@/data/districts';
import { getRiskColor } from '@/lib/risk';

type SeoulMapProps = {
  districts: District[];
  hoveredId: string | null;
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
};

const classNames = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ');

export default function SeoulMap({
  districts,
  hoveredId,
  selectedId,
  onHover,
  onSelect
}: SeoulMapProps) {
  return (
    <div className="map-stage relative mx-auto w-[90vw] max-w-[920px] aspect-square">
      <svg
        className="map-surface h-full w-full"
        viewBox="0 0 1400 1400"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="서울 자치구 지도"
        onMouseLeave={() => onHover(null)}
      >
        <defs>
          <radialGradient id="mapGlow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>
        <rect width="600" height="600" fill="url(#mapGlow)" />
        {districts.map((district) => {
          const isHovered = hoveredId === district.id;
          const isSelected = selectedId === district.id;
          const isDimmed = Boolean(hoveredId) && !isHovered && !isSelected;

          return (
            <path
              key={district.id}
              d={district.svgPath}
              role="button"
              tabIndex={0}
              aria-label={`${district.nameKo} 위험도 ${district.riskScore}`}
              vectorEffect="non-scaling-stroke"
              className={classNames(
                'district-path',
                isHovered && 'district-hover',
                isSelected && 'district-selected',
                isDimmed && 'district-dim'
              )}
              style={{ fill: getRiskColor(district.riskScore) }}
              onMouseEnter={() => onHover(district.id)}
              onFocus={() => onHover(district.id)}
              onBlur={() => onHover(null)}
              onClick={() => onSelect(district.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect(district.id);
                }
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}
