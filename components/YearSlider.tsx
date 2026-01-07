'use client';

type YearSliderProps = {
  years: number[];
  value: number;
  label?: string;
  onChange: (year: number) => void;
  frame?: boolean;
  className?: string;
};

export default function YearSlider({
  years,
  value,
  label = '연도 선택',
  onChange,
  frame = true,
  className
}: YearSliderProps) {
  const index = Math.max(0, years.indexOf(value));

  const content = (
    <>
      <div className="flex items-center justify-between text-sm text-white/70">
        <span className="text-xs uppercase tracking-[0.24em] text-white/45">
          {label}
        </span>
        <span className="text-base font-semibold text-white">{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={Math.max(0, years.length - 1)}
        value={index}
        onChange={(event) => {
          const nextIndex = Number(event.target.value);
          const nextYear = years[nextIndex];
          if (nextYear) onChange(nextYear);
        }}
        className="mt-4 w-full accent-white/80"
        aria-label={label}
        aria-valuetext={`${value}년`}
      />
      <div className="mt-2 flex justify-between text-[11px] text-white/40">
        <span>{years[0]}</span>
        <span>{years[years.length - 1]}</span>
      </div>
    </>
  );

  if (!frame) {
    return <div className={className}>{content}</div>;
  }

  return (
    <div className={`trend-card p-4 ${className ?? ''}`.trim()}>
      {content}
    </div>
  );
}
