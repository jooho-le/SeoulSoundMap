export type RiskLevel = 'LOW' | 'MID' | 'HIGH';

type RiskMeta = {
  level: RiskLevel | null;
  label: string;
  copy: string;
};

type RGB = { r: number; g: number; b: number };

const NEUTRAL_TONES = [
  'rgb(66, 72, 80)',
  'rgb(72, 78, 86)',
  'rgb(78, 84, 92)'
];

const LOW_BASE: RGB = { r: 78, g: 132, b: 164 };
const LOW_LIGHT: RGB = { r: 102, g: 155, b: 188 };

const MID_BASE: RGB = { r: 86, g: 114, b: 108 };
const MID_LIGHT: RGB = { r: 110, g: 138, b: 130 };

const HIGH_BASE: RGB = { r: 126, g: 76, b: 92 };
const HIGH_LIGHT: RGB = { r: 150, g: 94, b: 112 };

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const mixColor = (from: RGB, to: RGB, t: number) => {
  const safe = clamp(t, 0, 1);
  const mix = {
    r: Math.round(lerp(from.r, to.r, safe)),
    g: Math.round(lerp(from.g, to.g, safe)),
    b: Math.round(lerp(from.b, to.b, safe))
  };
  return `rgb(${mix.r}, ${mix.g}, ${mix.b})`;
};

export const getRiskLevel = (
  score: number | null | undefined
): RiskLevel | null => {
  if (score === null || score === undefined) return null;
  if (score <= 33) return 'LOW';
  if (score <= 66) return 'MID';
  return 'HIGH';
};

export const getRiskMeta = (score: number | null | undefined): RiskMeta => {
  if (score === null || score === undefined) {
    return { level: null, label: '', copy: '' };
  }
  const level = getRiskLevel(score);
  if (level === 'LOW') {
    return { level, label: 'LOW', copy: '잔잔한 흐름' };
  }
  if (level === 'MID') {
    return { level, label: 'MID', copy: '경계의 리듬' };
  }
  return { level, label: 'HIGH', copy: '긴장된 파동' };
};

export const getDistrictBaseColor = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return NEUTRAL_TONES[hash % NEUTRAL_TONES.length];
};

export const getRiskColor = (score: number | null | undefined) => {
  if (score === null || score === undefined) {
    return 'rgb(90, 98, 106)';
  }
  const safe = clamp(score, 0, 100);
  if (safe <= 33) {
    const t = safe / 33;
    return mixColor(LOW_BASE, LOW_LIGHT, 0.25 + t * 0.5);
  }
  if (safe <= 66) {
    const t = (safe - 33) / 33;
    return mixColor(MID_BASE, MID_LIGHT, 0.25 + t * 0.5);
  }
  const t = (safe - 66) / 34;
  return mixColor(HIGH_BASE, HIGH_LIGHT, 0.25 + t * 0.5);
};
