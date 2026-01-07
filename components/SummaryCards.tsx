'use client';

type SummaryCardsProps = {
  compareMode: boolean;
  year: number;
  average: number;
  yearOverYear: number | null;
  yearA: number;
  yearB: number;
  averageA: number;
  averageB: number;
  deltaAverage: number;
  className?: string;
};

const formatDelta = (value: number) => {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}`;
};

export default function SummaryCards({
  compareMode,
  year,
  average,
  yearOverYear,
  yearA,
  yearB,
  averageA,
  averageB,
  deltaAverage,
  className
}: SummaryCardsProps) {
  if (compareMode) {
    return (
      <div className={`grid gap-3 sm:grid-cols-3 ${className ?? ''}`.trim()}>
        <div className="trend-metric p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-white/45">
            Year A
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">{averageA}</p>
          <p className="mt-1 text-xs text-white/55">{yearA} 평균</p>
        </div>
        <div className="trend-metric p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-white/45">
            Year B
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">{averageB}</p>
          <p className="mt-1 text-xs text-white/55">{yearB} 평균</p>
        </div>
        <div className="trend-metric p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-white/45">
            Delta
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {formatDelta(deltaAverage)}
          </p>
          <p className="mt-1 text-xs text-white/55">B - A 변화</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`grid gap-3 sm:grid-cols-2 ${className ?? ''}`.trim()}>
      <div className="trend-metric p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-white/45">
          Average
        </p>
        <p className="mt-2 text-2xl font-semibold text-white">{average}</p>
        <p className="mt-1 text-xs text-white/55">{year} 평균</p>
      </div>
      <div className="trend-metric p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-white/45">
          Change
        </p>
        <p className="mt-2 text-2xl font-semibold text-white">
          {yearOverYear === null ? '--' : formatDelta(yearOverYear)}
        </p>
        <p className="mt-1 text-xs text-white/55">전년도 대비</p>
      </div>
    </div>
  );
}
