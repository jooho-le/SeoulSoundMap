'use client';

import { useState } from 'react';
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
  const meta = getRiskMeta(district.riskScore);
  const labelText = meta.label ? ` · ${meta.label}` : '';

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
            이 구의 위험도 점수는 여러 신호를 종합한 결과입니다. 현재는 샘플 데이터로 구성되어 있으며,
            추후 실제 지표와 프롬프트 기반 산출 로직으로 교체할 수 있습니다.
          </div>
        )}
      </section>
    </div>
  );
}
