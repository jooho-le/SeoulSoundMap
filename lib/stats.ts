type ScoreMap = Record<string, number>;
type ScoresByYear = Record<number, ScoreMap>;

const clamp = (value: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, value));

export const calculateAverage = (scores: ScoreMap, ids?: string[]) => {
  const values = ids
    ? ids.map((id) => scores[id]).filter((value) => Number.isFinite(value))
    : Object.values(scores).filter((value) => Number.isFinite(value));
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, value) => acc + value, 0);
  return clamp(Math.round((sum / values.length) * 10) / 10);
};

export const calculateYearAverage = (
  scoresByYear: ScoresByYear,
  year: number,
  ids?: string[]
) => {
  const scores = scoresByYear[year];
  if (!scores) return 0;
  return calculateAverage(scores, ids);
};

export const calculateYearOverYearChange = (
  scoresByYear: ScoresByYear,
  years: number[],
  year: number,
  ids?: string[]
) => {
  const index = years.indexOf(year);
  if (index <= 0) return null;
  const prevYear = years[index - 1];
  const prevAvg = calculateYearAverage(scoresByYear, prevYear, ids);
  const currentAvg = calculateYearAverage(scoresByYear, year, ids);
  return clamp(Math.round((currentAvg - prevAvg) * 10) / 10, -100, 100);
};

export const calculateDeltaScores = (
  scoresByYear: ScoresByYear,
  yearA: number,
  yearB: number,
  ids?: string[]
) => {
  const scoresA = scoresByYear[yearA] ?? {};
  const scoresB = scoresByYear[yearB] ?? {};
  const keys = ids ?? Array.from(new Set([...Object.keys(scoresA), ...Object.keys(scoresB)]));
  const deltas: ScoreMap = {};
  keys.forEach((id) => {
    const valueA = scoresA[id] ?? 0;
    const valueB = scoresB[id] ?? 0;
    deltas[id] = Math.round((valueB - valueA) * 10) / 10;
  });
  return deltas;
};

export const calculateAverageSeries = (
  years: number[],
  scoresByYear: ScoresByYear,
  ids?: string[]
) => {
  return years.map((year) => ({
    year,
    value: calculateYearAverage(scoresByYear, year, ids)
  }));
};
