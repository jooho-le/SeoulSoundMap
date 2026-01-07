type DistrictInfo = {
  id: string;
  nameKo: string;
};

export const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024];

export const districts: DistrictInfo[] = [
  { id: 'dobong', nameKo: '도봉구' },
  { id: 'dongdaemun', nameKo: '동대문구' },
  { id: 'dongjak', nameKo: '동작구' },
  { id: 'eunpyeong', nameKo: '은평구' },
  { id: 'gangbuk', nameKo: '강북구' },
  { id: 'gangdong', nameKo: '강동구' },
  { id: 'gangseo', nameKo: '강서구' },
  { id: 'geumcheon', nameKo: '금천구' },
  { id: 'guro', nameKo: '구로구' },
  { id: 'gwanak', nameKo: '관악구' },
  { id: 'gwangjin', nameKo: '광진구' },
  { id: 'gangnam', nameKo: '강남구' },
  { id: 'jongno', nameKo: '종로구' },
  { id: 'jung', nameKo: '중구' },
  { id: 'jungnang', nameKo: '중랑구' },
  { id: 'mapo', nameKo: '마포구' },
  { id: 'nowon', nameKo: '노원구' },
  { id: 'seocho', nameKo: '서초구' },
  { id: 'seodaemun', nameKo: '서대문구' },
  { id: 'seongbuk', nameKo: '성북구' },
  { id: 'seongdong', nameKo: '성동구' },
  { id: 'songpa', nameKo: '송파구' },
  { id: 'yangcheon', nameKo: '양천구' },
  { id: 'yeongdeungpo', nameKo: '영등포구' },
  { id: 'yongsan', nameKo: '용산구' }
];

const baseScores: Record<string, number> = {
  dobong: 28,
  dongdaemun: 52,
  dongjak: 38,
  eunpyeong: 50,
  gangbuk: 36,
  gangdong: 55,
  gangseo: 60,
  geumcheon: 32,
  guro: 39,
  gwanak: 68,
  gwangjin: 42,
  gangnam: 78,
  jongno: 41,
  jung: 43,
  jungnang: 47,
  mapo: 58,
  nowon: 45,
  seocho: 62,
  seodaemun: 30,
  seongbuk: 35,
  seongdong: 34,
  songpa: 72,
  yangcheon: 44,
  yeongdeungpo: 64,
  yongsan: 48
};

const yearOffsets: Record<number, number> = {
  2018: -6,
  2019: -3,
  2020: 0,
  2021: 2,
  2022: 5,
  2023: 4,
  2024: 2
};

const clamp = (value: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, value));

const idBias = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return (hash % 5) - 2;
};

export const scoresByYear: Record<number, Record<string, number>> =
  Object.fromEntries(
    years.map((year) => {
      const offset = yearOffsets[year] ?? 0;
      const scores: Record<string, number> = {};
      districts.forEach((district) => {
        const base = baseScores[district.id] ?? 40;
        const score = clamp(base + offset + idBias(district.id));
        scores[district.id] = score;
      });
      return [year, scores];
    })
  );

const componentWeights = {
  crime: 0.45,
  five: 0.35,
  police: 0.2
};

const weightSetFor = (id: string, year: number) => {
  let hash = year;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 33 + id.charCodeAt(i)) >>> 0;
  }
  const jitter = ((hash % 7) - 3) * 0.01;
  const crime = clamp(componentWeights.crime + jitter, 0.3, 0.6);
  const five = clamp(componentWeights.five - jitter * 0.6, 0.2, 0.5);
  const police = clamp(1 - crime - five, 0.12, 0.3);
  const total = crime + five + police;
  return {
    crime: crime / total,
    five: five / total,
    police: police / total
  };
};

export const componentsByYear: Record<
  number,
  Record<string, { crime: number; five: number; police: number }>
> = Object.fromEntries(
  years.map((year) => {
    const components: Record<string, { crime: number; five: number; police: number }> = {};
    districts.forEach((district) => {
      const total = scoresByYear[year][district.id] ?? 0;
      const weights = weightSetFor(district.id, year);
      const crime = Math.round(total * weights.crime);
      const five = Math.round(total * weights.five);
      const police = Math.max(0, total - crime - five);
      components[district.id] = { crime, five, police };
    });
    return [year, components];
  })
);
