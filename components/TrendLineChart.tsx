'use client';

type TrendPoint = {
  year: number;
  value: number;
};

type TrendLineChartProps = {
  points: TrendPoint[];
  selectedYear: number;
  onSelectYear: (year: number) => void;
  title?: string;
  frame?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export default function TrendLineChart({
  points,
  selectedYear,
  onSelectYear,
  title = '서울 평균 위험도 추이',
  frame = true,
  className,
  style
}: TrendLineChartProps) {
  const width = 560;
  const height = 180;
  const padding = 28;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const path = points
    .map((point, index) => {
      const x =
        padding +
        (innerWidth * index) / Math.max(1, points.length - 1);
      const y = padding + innerHeight * (1 - point.value / 100);
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

  const content = (
    <>
      <p className="text-sm text-white/70">{title}</p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-4 h-44 w-full"
        role="img"
        aria-label="서울 평균 위험도 연도별 추이"
      >
        <defs>
          <linearGradient id="trendLine" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#b8f0e7" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffb38a" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <path
          d={path}
          fill="none"
          stroke="url(#trendLine)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="trend-line"
        />
        {points.map((point, index) => {
          const x =
            padding +
            (innerWidth * index) / Math.max(1, points.length - 1);
          const y = padding + innerHeight * (1 - point.value / 100);
          const isActive = point.year === selectedYear;
          return (
            <g key={point.year}>
              <circle
                cx={x}
                cy={y}
                r={isActive ? 5 : 3.5}
                fill={isActive ? '#ffffff' : 'rgba(255,255,255,0.65)'}
              />
              <circle
                cx={x}
                cy={y}
                r={10}
                fill="transparent"
                onClick={() => onSelectYear(point.year)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelectYear(point.year);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`${point.year}년 평균 위험도 ${point.value}`}
              />
              <text
                x={x}
                y={height - 8}
                textAnchor="middle"
                fontSize="10"
                fill="rgba(255,255,255,0.45)"
              >
                {point.year}
              </text>
            </g>
          );
        })}
      </svg>
    </>
  );

  if (!frame) {
    return (
      <div className={className} style={style}>
        {content}
      </div>
    );
  }

  return (
    <div className={`trend-card p-4 ${className ?? ''}`.trim()} style={style}>
      {content}
    </div>
  );
}
