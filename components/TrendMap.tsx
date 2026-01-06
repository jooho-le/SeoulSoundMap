'use client';

import { District } from '@/data/districts';

type HoverPoint = { x: number; y: number };

type TrendMapProps = {
  districts: Array<Pick<District, 'id' | 'nameKo' | 'svgPath'>>;
  hoveredId: string | null;
  selectedId?: string | null;
  getFillColor: (id: string) => string;
  getAriaLabel: (id: string) => string;
  onHover: (id: string | null, point?: HoverPoint) => void;
  onSelect?: (id: string) => void;
};

const classNames = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ');

export default function TrendMap({
  districts,
  hoveredId,
  selectedId,
  getFillColor,
  getAriaLabel,
  onHover,
  onSelect
}: TrendMapProps) {
  return (
    <div className="map-stage relative mx-auto w-[72vmin] min-w-[240px] max-w-[880px] aspect-square">
      <svg
        className="map-surface h-full w-full"
        viewBox="0 0 1400 1400"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="서울 자치구 위험도 지도"
        onMouseLeave={() => onHover(null)}
      >
        {districts.map((district) => {
          const isHovered = hoveredId === district.id;
          const isSelected = selectedId === district.id;
          return (
            <path
              key={district.id}
              d={district.svgPath}
              role="button"
              tabIndex={0}
              aria-label={getAriaLabel(district.id)}
              vectorEffect="non-scaling-stroke"
              className={classNames(
                'district-path',
                isHovered && 'district-hover',
                isSelected && 'district-selected'
              )}
              style={{ fill: getFillColor(district.id) }}
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
              onClick={() => onSelect?.(district.id)}
              onKeyDown={(event) => {
                if (!onSelect) return;
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
