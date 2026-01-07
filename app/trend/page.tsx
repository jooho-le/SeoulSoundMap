'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { districts as baseDistricts } from '@/data/districts';
import { componentsByYear, years, scoresByYear } from '@/data/riskTimeSeries';
import TrendMap from '@/components/TrendMap';
import TrendEditorialPanel from '@/components/TrendEditorialPanel';
import {
  calculateAverageSeries,
  calculateDeltaScores,
  calculateYearAverage,
  calculateYearOverYearChange
} from '@/lib/stats';
import { getDeltaColor, getRiskColor } from '@/lib/risk';

type HoverPoint = { x: number; y: number };

const districtList = baseDistricts.map((district) => ({
  id: district.id,
  nameKo: district.nameKo,
  svgPath: district.svgPath
}));

const districtIds = districtList.map((district) => district.id);
const districtNameMap = Object.fromEntries(
  districtList.map((district) => [district.id, district.nameKo])
);

const formatScore = (value?: number) =>
  value === undefined ? '--' : Math.round(value).toString();

const formatDelta = (value?: number) => {
  if (value === undefined) return '--';
  const rounded = Math.round(value);
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded}`;
};

const deltaCopy = (value?: number) => {
  if (value === undefined) return '변화 없음';
  if (value > 2) return '증가';
  if (value < -2) return '감소';
  return '변화 적음';
};

export default function TrendPage() {
  const [year, setYear] = useState(years[years.length - 1]);
  const [compareMode, setCompareMode] = useState(false);
  const [yearA, setYearA] = useState(years[0]);
  const [yearB, setYearB] = useState(years[years.length - 1]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltipPoint, setTooltipPoint] = useState<HoverPoint | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(
    null
  );

  const deltaScores = useMemo(
    () => calculateDeltaScores(scoresByYear, yearA, yearB, districtIds),
    [yearA, yearB]
  );

  const activeYear = compareMode ? yearB : year;
  const yearScores = scoresByYear[activeYear] ?? {};

  const mapValues = compareMode ? deltaScores : yearScores;

  const averageSeries = useMemo(
    () => calculateAverageSeries(years, scoresByYear, districtIds),
    []
  );

  const selectedSeries = useMemo(() => {
    if (!selectedDistrictId) return null;
    return years.map((entryYear) => ({
      year: entryYear,
      value: scoresByYear[entryYear]?.[selectedDistrictId] ?? 0
    }));
  }, [selectedDistrictId]);

  const componentSeries = useMemo(() => {
    if (!selectedDistrictId) return null;
    return years.map((entryYear) => ({
      year: entryYear,
      ...(componentsByYear[entryYear]?.[selectedDistrictId] ?? {
        crime: 0,
        five: 0,
        police: 0
      })
    }));
  }, [selectedDistrictId]);

  const average = calculateYearAverage(scoresByYear, activeYear, districtIds);
  const yearOverYear = calculateYearOverYearChange(
    scoresByYear,
    years,
    activeYear,
    districtIds
  );

  const averageA = calculateYearAverage(scoresByYear, yearA, districtIds);
  const averageB = calculateYearAverage(scoresByYear, yearB, districtIds);
  const deltaAverage = Math.round((averageB - averageA) * 10) / 10;

  const selectedName = selectedDistrictId
    ? districtNameMap[selectedDistrictId]
    : null;
  const selectedScore = selectedDistrictId
    ? calculateYearAverage(scoresByYear, activeYear, [selectedDistrictId])
    : null;
  const selectedYoY = selectedDistrictId
    ? calculateYearOverYearChange(
        scoresByYear,
        years,
        activeYear,
        [selectedDistrictId]
      )
    : null;

  const hoveredDistrict =
    districtList.find((district) => district.id === hoveredId) ?? null;
  const hoveredValue =
    hoveredId === null ? undefined : mapValues[hoveredId] ?? undefined;

  const deltaList = useMemo(() => {
    if (!compareMode) return null;
    return districtList
      .map((district) => ({
        id: district.id,
        nameKo: district.nameKo,
        delta: deltaScores[district.id] ?? 0
      }))
      .sort((a, b) => b.delta - a.delta);
  }, [compareMode, deltaScores]);

  const topIncrease = deltaList ? deltaList.slice(0, 5) : [];
  const topDecrease = deltaList ? [...deltaList].reverse().slice(0, 5) : [];
  const highlightUpIds = new Set(topIncrease.map((item) => item.id));
  const highlightDownIds = new Set(topDecrease.map((item) => item.id));

  const handleHover = (id: string | null, point?: HoverPoint) => {
    setHoveredId(id);
    if (!id) {
      setTooltipPoint(null);
      return;
    }
    if (point) setTooltipPoint(point);
  };

  const handleYearSelect = (nextYear: number) => {
    if (compareMode) {
      setYearB(nextYear);
    } else {
      setYear(nextYear);
    }
  };

  const handleToggleCompare = () => {
    setCompareMode((prev) => {
      const next = !prev;
      if (next) {
        setYearB(year);
      } else {
        setYear(yearB);
      }
      return next;
    });
  };

  const handleSelectDistrict = (id: string) => {
    setSelectedDistrictId(id);
  };

  const handleClearDistrict = () => {
    setSelectedDistrictId(null);
  };

  return (
    <main className="min-h-screen px-6 py-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            Trend
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            과거부터 현재까지 서울의 위험점수변화 보기
          </h1>
        </div>
        <Link
          href="/"
          className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs text-white/70 transition hover:border-white/30 hover:text-white"
        >
          서울 사운드 맵으로 돌아가기
        </Link>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
        <section className="rounded-3xl border border-white/10 bg-black/30 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/50">
                Map View
              </p>
              <p className="mt-1 text-sm text-white/70">
                {compareMode
                  ? `${yearA} → ${yearB} 변화`
                  : `${activeYear} 위험도`}
              </p>
            </div>
            <div className="text-xs text-white/50">
              {compareMode ? 'Δ 비교' : '단일 연도'}
            </div>
          </div>
          <div className="mt-4">
            <TrendMap
              districts={districtList}
              hoveredId={hoveredId}
              selectedId={selectedDistrictId}
              highlightUpIds={compareMode ? highlightUpIds : undefined}
              highlightDownIds={compareMode ? highlightDownIds : undefined}
              getFillColor={(id) =>
                compareMode ? getDeltaColor(mapValues[id]) : getRiskColor(mapValues[id])
              }
              getAriaLabel={(id) => {
                const value = mapValues[id];
                const name = districtNameMap[id] ?? id;
                if (compareMode) {
                  return `${name} ${yearA} 대비 ${yearB} 변화 ${formatDelta(value)}`;
                }
                return `${name} ${activeYear} 위험도 ${formatScore(value)}`;
              }}
              onHover={handleHover}
              onSelect={handleSelectDistrict}
            />
          </div>
        </section>

        <TrendEditorialPanel
          years={years}
          activeYear={activeYear}
          compareMode={compareMode}
          yearA={yearA}
          yearB={yearB}
          average={average}
          yearOverYear={yearOverYear}
          averageA={averageA}
          averageB={averageB}
          deltaAverage={deltaAverage}
          selectedDistrictId={selectedDistrictId}
          selectedName={selectedName}
          selectedScore={selectedScore}
          selectedYoY={selectedYoY}
          series={selectedSeries ?? averageSeries}
          componentSeries={componentSeries}
          topIncrease={topIncrease}
          topDecrease={topDecrease}
          districts={districtList.map(({ id, nameKo }) => ({ id, nameKo }))}
          onYearChange={handleYearSelect}
          onToggleCompare={handleToggleCompare}
          onYearAChange={setYearA}
          onYearBChange={setYearB}
          onSelectDistrict={handleSelectDistrict}
          onClearDistrict={handleClearDistrict}
        />
      </div>

      {hoveredDistrict && tooltipPoint && (
        <div
          className="pointer-events-none fixed z-20 rounded-xl border border-white/10 bg-black/70 px-3 py-2 text-white shadow-[0_12px_24px_rgba(0,0,0,0.35)] backdrop-blur-sm"
          style={{ left: tooltipPoint.x + 12, top: tooltipPoint.y + 12 }}
        >
          <div className="text-[11px] uppercase tracking-[0.2em] text-white/50">
            {compareMode ? `${yearA} → ${yearB}` : `${activeYear}년`}
          </div>
          <div className="mt-1 text-sm font-semibold">{hoveredDistrict.nameKo}</div>
          <div className="mt-1 text-xs text-white/70">
            {compareMode
              ? `변화 ${formatDelta(hoveredValue)}`
              : `점수 ${formatScore(hoveredValue)}`}
          </div>
          <div className="mt-1 text-[11px] text-white/45">
            {compareMode ? deltaCopy(hoveredValue) : '서울 위험도 지수'}
          </div>
        </div>
      )}
    </main>
  );
}
