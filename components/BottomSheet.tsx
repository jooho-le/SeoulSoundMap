'use client';

import { useEffect, useRef, useState } from 'react';
import { District } from '@/data/districts';
import { getRiskMeta } from '@/lib/risk';

type BottomSheetProps = {
  district: District;
  audioEnabled: boolean;
  lockSelection: boolean;
  onToggleAudio: () => void;
  onToggleLock: () => void;
  onClose: () => void;
};

export default function BottomSheet({
  district,
  audioEnabled,
  lockSelection,
  onToggleAudio,
  onToggleLock,
  onClose
}: BottomSheetProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [displayScore, setDisplayScore] = useState<number | null>(
    district.riskScore ?? null
  );
  const previousScoreRef = useRef<number>(district.riskScore ?? 0);
  const meta = getRiskMeta(district.riskScore);
  const labelText = meta.label ? ` · ${meta.label}` : '';

  useEffect(() => {
    const target =
      district.riskScore === null || district.riskScore === undefined
        ? null
        : district.riskScore;
    if (target === null) {
      previousScoreRef.current = 0;
      setDisplayScore(null);
      return;
    }

    const from = previousScoreRef.current;
    const duration = 650;
    const start = performance.now();
    let frame = 0;

    const animate = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(from + (target - from) * eased);
      setDisplayScore(value);
      if (progress < 1) {
        frame = window.requestAnimationFrame(animate);
      } else {
        previousScoreRef.current = target;
      }
    };

    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [district.riskScore, district.id]);

  return (
    <div className="bottom-sheet fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-4">
      <section className="pointer-events-auto w-full max-w-2xl rounded-3xl border border-white/10 bg-black/70 p-5 text-white shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/50">
              Selected
            </p>
            <h2 className="mt-1 text-xl font-semibold">
              {district.nameKo}
              {labelText}
            </h2>
            {meta.copy ? (
              <p className="mt-1 text-sm text-white/65">{meta.copy}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-widest text-white/60 transition hover:text-white"
          >
            닫기
          </button>
        </div>

        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">
              Risk Score
            </p>
            <p className="mt-1 text-sm text-white/55">
              선택된 구의 위험도 지수
            </p>
          </div>
          <div
            key={`${district.id}-${district.riskScore ?? 'none'}`}
            className="score-pop text-5xl font-semibold tracking-tight text-white"
            aria-live="polite"
          >
            {displayScore ?? '--'}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleAudio}
            className={`rounded-full border px-4 py-2 text-sm uppercase tracking-widest transition ${
              audioEnabled
                ? 'border-white/70 bg-white/10 text-white'
                : 'border-white/10 text-white/60 hover:text-white'
            }`}
            aria-pressed={audioEnabled}
          >
            소리 {audioEnabled ? '끄기' : '켜기'}
          </button>
          <button
            type="button"
            onClick={onToggleLock}
            className={`rounded-full border px-4 py-2 text-sm uppercase tracking-widest transition ${
              lockSelection
                ? 'border-white/70 bg-white/10 text-white'
                : 'border-white/10 text-white/60 hover:text-white'
            }`}
            aria-pressed={lockSelection}
          >
            선택 고정 {lockSelection ? 'ON' : 'OFF'}
          </button>
          <button
            type="button"
            onClick={() => setDetailsOpen((prev) => !prev)}
            className="rounded-full border border-white/10 px-4 py-2 text-sm uppercase tracking-widest text-white/60 transition hover:text-white"
          >
            데이터 보기
          </button>
        </div>

        {detailsOpen && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            이 구의 위험도 점수는 data/crime에 넣은 실제 JSON 데이터를 기반으로 산출됩니다.
            프롬프트 로직으로 점수를 계산하며, API 호출이 실패하면 기본 점수로 대체됩니다.
          </div>
        )}
      </section>
    </div>
  );
}
