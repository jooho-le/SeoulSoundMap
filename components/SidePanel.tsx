'use client';

import { useEffect, useRef, useState } from 'react';
import { District } from '@/data/districts';
import { getRiskColor, getRiskMeta } from '@/lib/risk';

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
              데이터 보기
            </button>
          </div>

          {detailsOpen && (
            <div className="panel-section mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              이 구의 위험도 점수는 data/crime, data/five, data/policestation에
              넣은 실제 JSON 데이터를 기반으로 산출됩니다. 프롬프트 로직으로 점수를
              계산하며, API 호출이 실패하면 기본 점수로 대체됩니다.
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
