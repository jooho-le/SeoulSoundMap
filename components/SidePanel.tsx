'use client';

import { useEffect, useRef, useState } from 'react';
import { District, DistrictBreakdown } from '@/data/districts';
import { getRiskColor, getRiskMeta } from '@/lib/risk';

const breakdownColors = {
  crime: 'rgba(122, 170, 190, 0.9)',
  five: 'rgba(120, 150, 135, 0.9)',
  police: 'rgba(168, 128, 118, 0.9)'
};

const getBreakdownNarrative = (breakdown?: DistrictBreakdown | null) => {
  if (!breakdown) {
    return '근거 데이터를 불러오는 중입니다.';
  }
  const entries = [
    { key: 'crime', value: breakdown.crime },
    { key: 'five', value: breakdown.five },
    { key: 'police', value: breakdown.police }
  ];
  const sorted = [...entries].sort((a, b) => b.value - a.value);
  const top = sorted[0];
  const gap = top.value - (sorted[1]?.value ?? 0);
  if (gap < 8) {
    return '세 지표가 비슷하게 섞여 체감 점수가 만들어집니다.';
  }
  if (top.key === 'crime') {
    return '최근 신고·범죄 기록의 영향이 가장 크게 느껴집니다.';
  }
  if (top.key === 'five') {
    return '5대 범죄 지표가 두드러져 점수에 힘을 더합니다.';
  }
  return '경찰서 발생 통계가 상대적으로 높게 반영되었습니다.';
};

type SidePanelProps = {
  hoveredDistrict: District | null;
  selectedDistrict: District | null;
  audioEnabled: boolean;
  lockSelection: boolean;
  onToggleAudio: () => void;
  onToggleLock: () => void;
};

export default function SidePanel({
  hoveredDistrict,
  selectedDistrict,
  audioEnabled,
  lockSelection,
  onToggleAudio,
  onToggleLock
}: SidePanelProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [displayScore, setDisplayScore] = useState<number | null>(
    selectedDistrict?.riskScore ?? null
  );
  const previousScoreRef = useRef<number>(selectedDistrict?.riskScore ?? 0);

  useEffect(() => {
    if (!selectedDistrict) {
      setDetailsOpen(false);
    }
  }, [selectedDistrict?.id]);

  useEffect(() => {
    const target =
      selectedDistrict?.riskScore === null ||
      selectedDistrict?.riskScore === undefined
        ? null
        : selectedDistrict?.riskScore;
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
  }, [selectedDistrict?.riskScore, selectedDistrict?.id]);

  const currentDistrict = hoveredDistrict ?? selectedDistrict;
  const currentMeta = getRiskMeta(currentDistrict?.riskScore);
  const selectedMeta = getRiskMeta(selectedDistrict?.riskScore);
  const currentLabel = currentMeta.label ? ` · ${currentMeta.label}` : '';
  const selectedLabel = selectedMeta.label ? ` · ${selectedMeta.label}` : '';
  const scoreColor = getRiskColor(selectedDistrict?.riskScore);
  const breakdown = selectedDistrict?.breakdown ?? null;
  const breakdownNarrative = getBreakdownNarrative(breakdown);
  const breakdownItems = breakdown
    ? [
        {
          key: 'crime',
          label: '신고·범죄 기록',
          value: breakdown.crime,
          color: breakdownColors.crime
        },
        {
          key: 'five',
          label: '5대 범죄',
          value: breakdown.five,
          color: breakdownColors.five
        },
        {
          key: 'police',
          label: '경찰서 발생',
          value: breakdown.police,
          color: breakdownColors.police
        }
      ]
    : [];

  return (
    <aside className="panel-section flex h-full w-full flex-col rounded-[28px] border border-white/10 bg-black/40 p-5 text-white shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur-md lg:h-[78vh] lg:max-h-[760px]">
      <div className="panel-section">
        <p className="text-[11px] uppercase tracking-[0.3em] text-white/45">
          Current
        </p>
        <p className="mt-2 text-lg font-semibold text-white">
          {currentDistrict
            ? `${currentDistrict.nameKo}${currentLabel}`
            : '서울의 소리를 고르세요'}
        </p>
        {!currentDistrict && (
          <p className="mt-1 text-sm text-white/55">
            구 위에 커서를 올려 들어보세요
          </p>
        )}
      </div>

      <div className="my-4 h-px w-full bg-white/10" />

      {selectedDistrict ? (
        <div className="panel-section flex h-full flex-col">
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/45">
            Selected
          </p>
          <div className="mt-2">
            <div>
              <p className="text-lg font-semibold text-white">
                {selectedDistrict.nameKo}
                {selectedLabel}
              </p>
              {selectedMeta.copy ? (
                <p className="mt-1 text-sm text-white/60">
                  {selectedMeta.copy}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onToggleAudio}
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-widest transition ${
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
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-widest transition ${
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
              className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-widest text-white/60 transition hover:text-white"
            >
              근거 보기
            </button>
          </div>

          {detailsOpen && (
            <div className="panel-section mt-5 rounded-3xl border border-white/15 bg-gradient-to-br from-white/12 via-white/5 to-black/40 p-5 text-sm text-white/75 shadow-[0_20px_55px_rgba(0,0,0,0.45)] backdrop-blur-md">
              <p className="text-[12px] uppercase tracking-[0.35em] text-white/50">
                근거
              </p>
              <p className="mt-3 text-base leading-relaxed text-white/85">
                이 점수는 최근 신고·범죄 기록, 5대 범죄 지표, 경찰서 발생 통계를
                모아 체감되는 위험감을 표현한 값입니다.
              </p>
              <p className="mt-3 text-base leading-relaxed text-white/80">
                {breakdownNarrative}
              </p>
              {breakdownItems.length > 0 && (
                <div className="mt-5 space-y-4 text-sm text-white/80">
                  {breakdownItems.map((item) => (
                    <div key={item.key} className="flex items-center gap-3">
                      <span className="w-28 text-[12px] text-white/60">
                        {item.label}
                      </span>
                      <div className="relative h-3 flex-1 rounded-full bg-white/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.45)]">
                        <div
                          className="h-3 rounded-full shadow-[0_6px_16px_rgba(0,0,0,0.45)]"
                          style={{
                            width: `${item.value}%`,
                            backgroundColor: item.color
                          }}
                        />
                      </div>
                      <span className="w-10 text-right text-[12px] text-white/65">
                        {item.value}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-auto pt-6 text-right">
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/45">
              Score
            </p>
            <p
              className="score-pop text-[clamp(96px,18vw,180px)] font-semibold leading-none tracking-tight"
              style={{ color: scoreColor }}
            >
              {displayScore ?? '--'}
            </p>
          </div>
        </div>
      ) : (
        <div className="panel-section mt-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
          서울의 소리를 고르세요. 구 위로 움직일 때마다 작은 변화가 시작됩니다.
        </div>
      )}
    </aside>
  );
}
