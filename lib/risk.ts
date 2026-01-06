export type RiskLevel = 'LOW' | 'MID' | 'HIGH';

const LOW_COLOR = { r: 190, g: 234, b: 215 };
const MID_COLOR = { r: 244, g: 200, b: 118 };
const HIGH_COLOR = { r: 214, g: 92, b: 76 };

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const mixColor = (a: typeof LOW_COLOR, b: typeof LOW_COLOR, t: number) => {
  const mix = {
    r: Math.round(lerp(a.r, b.r, t)),
    g: Math.round(lerp(a.g, b.g, t)),
    b: Math.round(lerp(a.b, b.b, t))
  };
  return `rgb(${mix.r}, ${mix.g}, ${mix.b})`;
};

export const getRiskLevel = (score: number): RiskLevel => {
  if (score <= 33) return 'LOW';
  if (score <= 66) return 'MID';
  return 'HIGH';
};

export const getRiskLabelKo = (level: RiskLevel) => {
  switch (level) {
    case 'LOW':
      return '낮음';
    case 'MID':
      return '중간';
    case 'HIGH':
      return '높음';
    default:
      return '알 수 없음';
  }
};

export const getRiskColor = (score: number) => {
  const safe = clamp(score, 0, 100);
  const mix = safe <= 50 ? safe / 50 : (safe - 50) / 50;
  if (safe <= 50) {
    return mixColor(LOW_COLOR, MID_COLOR, mix);
  }
  return mixColor(MID_COLOR, HIGH_COLOR, mix);
};
