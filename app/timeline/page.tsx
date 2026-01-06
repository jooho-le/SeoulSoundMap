'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type TimelinePoint = {
  year: number;
  score: number;
  fiveTotal: number;
  oneonetwoTotal: number;
};

type TimelineResponse = {
  sources: {
    five: string;
    oneonetwo: string;
  };
  weights: {
    five: number;
    oneonetwo: number;
  };
  points: TimelinePoint[];
};

const formatNumber = (value: number) => value.toLocaleString('ko-KR');

export default function TimelinePage() {
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch('/api/risk-timeline', {
          cache: 'no-store'
        });
        if (!response.ok) return;
        const payload = (await response.json()) as TimelineResponse;
        if (!cancelled) {
          setData(payload);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const chart = useMemo(() => {
    if (!data?.points?.length) return null;
    const points = data.points;
    const width = 980;
    const height = 320;
    const padding = 36;
    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;

    const path = points
      .map((point, index) => {
        const x =
          padding +
          (innerWidth * index) / Math.max(1, points.length - 1);
        const y = padding + innerHeight * (1 - point.score / 100);
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');

    return { width, height, padding, points, path };
  }, [data]);

  const latest = data?.points?.[data.points.length - 1] ?? null;
  const earliest = data?.points?.[0] ?? null;
  const delta = latest && earliest ? latest.score - earliest.score : null;

  return (
    <main className="min-h-screen px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            Timeline
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            과거부터 현재까지 서울의 위험점수변화 보기
          </h1>
          <p className="mt-2 text-sm text-white/60">
            "서울시 5대 범죄발생 현황"과 "112 신고접수 처리 현황" 데이터로 연도별 흐름을 계산했습니다.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs text-white/70 transition hover:border-white/30 hover:text-white"
        >
          서울 사운드 맵으로 돌아가기
        </Link>
      </header>

      <section className="mt-8 rounded-3xl border border-white/10 bg-black/40 p-6">
        {loading && <p className="text-sm text-white/60">데이터 불러오는 중...</p>}
        {!loading && !data?.points?.length && (
          <p className="text-sm text-white/60">표시할 데이터가 없습니다.</p>
        )}
        {chart && (
          <div>
            <svg
              width="100%"
              viewBox={`0 0 ${chart.width} ${chart.height}`}
              className="h-72 w-full"
              role="img"
              aria-label="서울 위험도 점수 연도별 추이"
            >
              <defs>
                <linearGradient id="riskLine" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#b8f0e7" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#ff8a65" stopOpacity="0.9" />
                </linearGradient>
              </defs>
              <rect
                x="0"
                y="0"
                width={chart.width}
                height={chart.height}
                fill="none"
                stroke="rgba(255,255,255,0.05)"
              />
              <path
                d={chart.path}
                fill="none"
                stroke="url(#riskLine)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {chart.points.map((point, index) => {
                const x =
                  chart.padding +
                  (chart.width - chart.padding * 2) *
                    (index / Math.max(1, chart.points.length - 1));
                const y =
                  chart.padding +
                  (chart.height - chart.padding * 2) *
                    (1 - point.score / 100);
                return (
                  <g key={point.year}>
                    <circle cx={x} cy={y} r="4" fill="#ffffff" opacity="0.8" />
                    <text
                      x={x}
                      y={chart.height - 10}
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

            <div className="mt-4 grid gap-3 text-sm text-white/70 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                  Latest
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {latest ? latest.score : '--'}
                </p>
                <p className="mt-1 text-xs text-white/55">
                  {latest ? `${latest.year} 기준` : ''}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                  Change
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {delta !== null ? `${delta >= 0 ? '+' : ''}${delta}` : '--'}
                </p>
                <p className="mt-1 text-xs text-white/55">초기 대비 변화</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                  Sources
                </p>
                <p className="mt-2 text-xs text-white/60">
                  five: {data?.sources.five ?? '--'}
                </p>
                <p className="mt-1 text-xs text-white/60">
                  oneonetwo: {data?.sources.oneonetwo ?? '--'}
                </p>
              </div>
            </div>

            {data?.points?.length ? (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-xs text-white/70">
                  <thead>
                    <tr className="border-b border-white/10 text-white/50">
                      <th className="py-2">Year</th>
                      <th className="py-2">Score</th>
                      <th className="py-2">Five Total</th>
                      <th className="py-2">112 Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.points.map((point) => (
                      <tr key={point.year} className="border-b border-white/5">
                        <td className="py-2">{point.year}</td>
                        <td className="py-2">{point.score}</td>
                        <td className="py-2">{formatNumber(point.fiveTotal)}</td>
                        <td className="py-2">
                          {formatNumber(point.oneonetwoTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}
