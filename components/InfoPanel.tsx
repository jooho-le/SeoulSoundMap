'use client';

import { useState } from 'react';
import { District } from '@/data/districts';
import { getRiskLabelKo, getRiskLevel } from '@/lib/risk';

type InfoPanelProps = {
  district: District | null;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  lockSelection: boolean;
  onToggleLock: () => void;
};

export default function InfoPanel({
  district,
  audioEnabled,
  onToggleAudio,
  lockSelection,
  onToggleLock
}: InfoPanelProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const level = district ? getRiskLevel(district.riskScore) : null;
  const levelLabel = level ? getRiskLabelKo(level) : '대기 중';

  return (
    <section className="panel-enter pointer-events-auto w-full max-w-md rounded-2xl border border-white/20 bg-black/40 p-5 shadow-[0_20px_45px_rgba(0,0,0,0.45)] backdrop-blur-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">
            District
          </p>
          <h2 className="mt-1 text-xl font-semibold">
            {district ? district.nameKo : '서울 지도 탐색'}
          </h2>
        </div>
        <button
          type="button"
          onClick={onToggleLock}
          className={`rounded-full border px-3 py-1 text-xs uppercase tracking-widest transition ${
            lockSelection
              ? 'border-white/60 bg-white/20 text-white'
              : 'border-white/10 text-white/60 hover:text-white'
          }`}
          aria-pressed={lockSelection}
        >
          Lock
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between text-base text-white/70">
        <span>Risk Level</span>
        <span className="font-semibold text-white">
          {levelLabel}
          {district ? ` · ${district.riskScore}` : ''}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleAudio}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm uppercase tracking-widest transition ${
            audioEnabled
              ? 'border-white/70 bg-white/10 text-white'
              : 'border-white/10 text-white/60 hover:text-white'
          }`}
          aria-pressed={audioEnabled}
        >
          Audio {audioEnabled ? 'On' : 'Off'}
        </button>
        <button
          type="button"
          onClick={() => setDetailsOpen((prev) => !prev)}
          className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-sm uppercase tracking-widest text-white/70 transition hover:text-white"
        >
          Details
        </button>
      </div>

      {detailsOpen && (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3 text-xs leading-relaxed text-white/70">
          이 패널은 추후 API 기반 상세 위험 분석 데이터로 확장할 수 있습니다.
          지금은 소리와 색의 변화에 집중한 MVP 상태입니다.
        </div>
      )}
    </section>
  );
}
