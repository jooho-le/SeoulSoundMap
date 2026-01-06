'use client';

type CompareToggleProps = {
  enabled: boolean;
  years: number[];
  yearA: number;
  yearB: number;
  onToggle: () => void;
  onChangeA: (year: number) => void;
  onChangeB: (year: number) => void;
};

export default function CompareToggle({
  enabled,
  years,
  yearA,
  yearB,
  onToggle,
  onChangeA,
  onChangeB
}: CompareToggleProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/70">비교 모드</p>
          <p className="text-xs text-white/40">두 연도를 비교합니다.</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`rounded-full border px-4 py-1.5 text-xs uppercase tracking-widest transition ${
            enabled
              ? 'border-white/70 bg-white/10 text-white'
              : 'border-white/10 text-white/60 hover:text-white'
          }`}
          aria-pressed={enabled}
        >
          {enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {enabled && (
        <div className="mt-4 grid gap-3 text-sm text-white/70 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-white/40">
              Year A
            </span>
            <select
              value={yearA}
              onChange={(event) => onChangeA(Number(event.target.value))}
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-white/40">
              Year B
            </span>
            <select
              value={yearB}
              onChange={(event) => onChangeB(Number(event.target.value))}
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </div>
  );
}
