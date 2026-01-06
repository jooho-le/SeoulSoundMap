import { District } from '@/data/districts';
import { getDistrictBaseColor, getRiskColor } from '@/lib/risk';

type HoverPoint = { x: number; y: number };

type SeoulMapProps = {
  districts: District[];
  hoveredId: string | null;
  selectedId: string | null;
  onHover: (id: string | null, point?: HoverPoint) => void;
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
    <div className="map-stage relative mx-auto w-full min-w-[260px] max-w-[980px] aspect-square">
      <svg
        className="map-surface map-breathe h-full w-full"
        viewBox="0 0 1400 1400"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="서울 자치구 지도"
        onMouseLeave={() => onHover(null)}
      >
        <defs>
          <radialGradient id="mapGlow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>
        <rect width="1400" height="1400" fill="url(#mapGlow)" />
        {districts.map((district) => {
          const isHovered = hoveredId === district.id;
          const isSelected = selectedId === district.id;
          const isDimmed = Boolean(hoveredId) && !isHovered && !isSelected;
          const fillColor =
            isHovered || isSelected
              ? getRiskColor(district.riskScore)
              : getDistrictBaseColor(district.id);

          return (
            <path
              key={district.id}
              d={district.svgPath}
              role="button"
              tabIndex={0}
              aria-label={`${district.nameKo} 위험도 ${district.riskScore ?? '데이터 없음'}`}
              vectorEffect="non-scaling-stroke"
              className={classNames(
                'district-path',
                isHovered && 'district-hover',
                isSelected && 'district-selected',
                isDimmed && 'district-dim'
              )}
              style={{ fill: fillColor }}
              onMouseEnter={(event) =>
                onHover(district.id, {
                  x: event.clientX,
                  y: event.clientY
                })
              }
              onMouseMove={(event) =>
                onHover(district.id, {
                  x: event.clientX,
                  y: event.clientY
                })
              }
              onFocus={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                onHover(district.id, {
                  x: rect.left + rect.width / 2,
                  y: rect.top + rect.height / 2
                });
              }}
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
