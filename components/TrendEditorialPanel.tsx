'use client';

import { useMemo } from 'react';

type TrendPoint = {
  year: number;
  value: number;
};

type TrendEditorialPanelProps = {
  years: number[];
  activeYear: number;
  compareMode: boolean;
  yearA: number;
  yearB: number;
  average: number;
  yearOverYear: number | null;
  averageA: number;
  averageB: number;
  deltaAverage: number;
  selectedDistrictId: string | null;
  selectedName: string | null;
  selectedScore: number | null;
  selectedYoY: number | null;
  series: TrendPoint[];
  componentSeries: Array<{ year: number; crime: number; five: number; police: number }> | null;
  topIncrease: Array<{ id: string; nameKo: string; delta: number }>;
  topDecrease: Array<{ id: string; nameKo: string; delta: number }>;
  districts: Array<{ id: string; nameKo: string }>;
  onYearChange: (year: number) => void;
  onToggleCompare: () => void;
  onYearAChange: (year: number) => void;
  onYearBChange: (year: number) => void;
  onSelectDistrict: (id: string) => void;
  onClearDistrict: () => void;
};

const formatDelta = (value: number) => {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}`;
};

const describeDelta = (value: number) => {
  const abs = Math.abs(value);
  if (abs < 0.6) return '큰 변화는 없었습니다';
  if (value > 0) return '전년 대비 소폭 높아졌습니다';
  return '전년 대비 소폭 낮아졌습니다';
};

const describeCompare = (value: number) => {
  const abs = Math.abs(value);
  if (abs < 0.6) return '비교 기준에서도 큰 차이는 보이지 않습니다.';
  if (value > 0) return `비교 결과 평균은 ${abs.toFixed(1)}만큼 높습니다.`;
  return `비교 결과 평균은 ${abs.toFixed(1)}만큼 낮습니다.`;
};

const MiniSparkline = ({
  points,
  selectedYear,
  onSelectYear
}: {
  points: TrendPoint[];
  selectedYear: number;
  onSelectYear: (year: number) => void;
}) => {
  const width = 260;
  const height = 90;
  const padding = 8;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const path = points
    .map((point, index) => {
      const x =
        padding +
        (innerWidth * index) / Math.max(1, points.length - 1);
      const y = padding + innerHeight * (1 - point.value / 100);
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mini-sparkline"
      role="img"
      aria-label="서울 평균 위험도 추이"
    >
      <path d={path} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" />
      {points.map((point, index) => {
        const x =
          padding +
          (innerWidth * index) / Math.max(1, points.length - 1);
        const y = padding + innerHeight * (1 - point.value / 100);
        const isActive = point.year === selectedYear;
        return (
          <g key={point.year}>
            <circle
              cx={x}
              cy={y}
              r={isActive ? 3.4 : 2.2}
              fill={isActive ? '#ffffff' : 'rgba(255,255,255,0.45)'}
            />
            <circle
              cx={x}
              cy={y}
              r={9}
              fill="transparent"
              onClick={() => onSelectYear(point.year)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelectYear(point.year);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`${point.year}년 평균 위험도 ${point.value}`}
            />
          </g>
        );
      })}
    </svg>
  );
};

export default function TrendEditorialPanel({
  years,
  activeYear,
  compareMode,
  yearA,
  yearB,
  average,
  yearOverYear,
  averageA,
  averageB,
  deltaAverage,
  selectedDistrictId,
  selectedName,
  selectedScore,
  selectedYoY,
  series,
  componentSeries,
  topIncrease,
  topDecrease,
  districts,
  onYearChange,
  onToggleCompare,
  onYearAChange,
  onYearBChange,
  onSelectDistrict,
  onClearDistrict
}: TrendEditorialPanelProps) {
  const summarySentence = useMemo(() => {
    if (yearOverYear === null) {
      return `${activeYear}년 서울의 평균 위험도는 ${average.toFixed(
        1
      )}이며, 전년도와의 비교 데이터가 없습니다.`;
    }
    return `${activeYear}년 서울의 평균 위험도는 ${average.toFixed(
      1
    )}로, ${describeDelta(yearOverYear)}.`;
  }, [activeYear, average, yearOverYear]);

  const compareSentence = useMemo(() => {
    if (!compareMode) return null;
    return `${yearA}년과 ${yearB}년을 비교하면 평균 위험도는 ${formatDelta(
      deltaAverage
    )}입니다. ${describeCompare(deltaAverage)}`;
  }, [compareMode, yearA, yearB, deltaAverage]);

  const regionSentence = useMemo(() => {
    if (!selectedName || selectedScore === null) return null;
    if (selectedYoY === null) {
      return `${selectedName}의 현재 점수는 ${Math.round(
        selectedScore
      )}입니다.`;
    }
    return `${selectedName}의 현재 점수는 ${Math.round(
      selectedScore
    )}이며, 전년 대비 ${formatDelta(selectedYoY)}입니다.`;
  }, [selectedName, selectedScore, selectedYoY]);

  const summaryKey = `${activeYear}-${compareMode}-${selectedDistrictId ?? 'all'}`;

  const stackedBars = componentSeries?.map((item) => {
    const total = item.crime + item.five + item.police || 1;
    return {
      year: item.year,
      crime: (item.crime / total) * 100,
      five: (item.five / total) * 100,
      police: (item.police / total) * 100
    };
  });

  return (
    <aside className="editorial-panel panel-divider">
      <div className="editorial-block">
        <p className="eyebrow">{activeYear}년의 서울</p>
        <div key={summaryKey} className="editorial-fade">
          <p className="editorial-title">{activeYear}년의 서울</p>
          <p className="editorial-body">{summarySentence}</p>
          {compareSentence && (
            <p className="editorial-body-muted">{compareSentence}</p>
          )}
          {regionSentence && (
            <p className="editorial-body-muted">{regionSentence}</p>
          )}
        </div>
      </div>

      <div className="editorial-block">
        <div className="editorial-row">
          <p className="eyebrow">시간의 흐름</p>
          <span className="year-pill">{activeYear}</span>
        </div>
        <input
          type="range"
          min={0}
          max={Math.max(0, years.length - 1)}
          value={Math.max(0, years.indexOf(compareMode ? yearB : activeYear))}
          onChange={(event) => {
            const nextIndex = Number(event.target.value);
            const nextYear = years[nextIndex];
            if (nextYear) onYearChange(nextYear);
          }}
          className="mini-timeline"
          aria-label="연도 선택"
          aria-valuetext={`${activeYear}년`}
        />
        <div className="mini-timeline-labels">
          <span>{years[0]}</span>
          <span>{years[years.length - 1]}</span>
        </div>
        <MiniSparkline
          points={series}
          selectedYear={compareMode ? yearB : activeYear}
          onSelectYear={onYearChange}
        />
      </div>

      {selectedName && (
        <div className="editorial-block">
          <p className="eyebrow">지역의 흐름</p>
          <p className="editorial-body">
            {selectedName}의 연도별 점수 변화와 구성 비율입니다.
          </p>
          {stackedBars && (
            <div className="stacked-chart">
              {stackedBars.map((item) => (
                <div key={item.year} className="stacked-col">
                  <div className="stacked-bar">
                    <span style={{ height: `${item.crime}%` }} className="stacked-segment crime" />
                    <span style={{ height: `${item.five}%` }} className="stacked-segment five" />
                    <span style={{ height: `${item.police}%` }} className="stacked-segment police" />
                  </div>
                  <span className="stacked-year">{item.year}</span>
                </div>
              ))}
            </div>
          )}
          <div className="stacked-legend">
            <span className="crime">crime</span>
            <span className="five">five</span>
            <span className="police">police</span>
          </div>
        </div>
      )}

      <div className="editorial-block">
        <details className="collapsible" open={compareMode}>
          <summary className="collapsible-title">비교하기(선택)</summary>
          <div className="collapsible-body">
            <p className="editorial-body-muted">
              두 연도를 비교해 지도와 요약 문장을 갱신합니다.
            </p>
            <button
              type="button"
              onClick={onToggleCompare}
              className="pill-button mt-3"
              aria-pressed={compareMode}
            >
              {compareMode ? '비교 모드 종료' : '비교 모드 시작'}
            </button>
            {compareMode && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="select-label">
                  <span>기준 연도 A</span>
                  <select
                    value={yearA}
                    onChange={(event) => onYearAChange(Number(event.target.value))}
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="select-label">
                  <span>비교 연도 B</span>
                  <select
                    value={yearB}
                    onChange={(event) => onYearBChange(Number(event.target.value))}
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="compare-note">
                  평균 기준: {averageA.toFixed(1)} → {averageB.toFixed(1)}
                </div>
              </div>
            )}
            {compareMode && (
              <div className="compare-grid">
                <div>
                  <p className="compare-title">상위 상승 Top5</p>
                  <ul className="compare-list">
                    {topIncrease.map((item) => (
                      <li key={item.id}>
                        <span>{item.nameKo}</span>
                        <span className="delta up">
                          {formatDelta(item.delta)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="compare-title">상위 하락 Top5</p>
                  <ul className="compare-list">
                    {topDecrease.map((item) => (
                      <li key={item.id}>
                        <span>{item.nameKo}</span>
                        <span className="delta down">
                          {formatDelta(item.delta)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </details>

        <details className="collapsible">
          <summary className="collapsible-title">지역 기준 보기(선택)</summary>
          <div className="collapsible-body">
            <p className="editorial-body-muted">
              특정 구를 선택하면 오른쪽 타임라인이 해당 구 기준으로 전환됩니다.
            </p>
            <select
              value={selectedDistrictId ?? ''}
              onChange={(event) => {
                const nextValue = event.target.value;
                if (!nextValue) {
                  onClearDistrict();
                  return;
                }
                onSelectDistrict(nextValue);
              }}
              className="region-select"
            >
              <option value="">서울 전체 평균</option>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.nameKo}
                </option>
              ))}
            </select>
            {selectedDistrictId && (
              <button type="button" onClick={onClearDistrict} className="pill-button mt-3">
                지역 기준 해제
              </button>
            )}
          </div>
        </details>
      </div>
    </aside>
  );
}
