const fs = require('fs');

const svg = fs.readFileSync('/Users/leejooho/Desktop/Yeosu/data/Seoul.svg', 'utf8');
const re = /<path[^>]*id="([^"]+)"[^>]*d="([^"]+)"[^>]*>/g;

const meta = {
  'Dobong-gu': { id: 'dobong', nameKo: '도봉구', riskScore: 30 },
  'Dongdaemun-gu': { id: 'dongdaemun', nameKo: '동대문구', riskScore: 57 },
  'Dongjak-gu': { id: 'dongjak', nameKo: '동작구', riskScore: 62 },
  'Eunpyeong-gu': { id: 'eunpyeong', nameKo: '은평구', riskScore: 41 },
  'Gangbuk-gu': { id: 'gangbuk', nameKo: '강북구', riskScore: 33 },
  'Gangdong-gu': { id: 'gangdong', nameKo: '강동구', riskScore: 71 },
  'Gangseo-gu': { id: 'gangseo', nameKo: '강서구', riskScore: 47 },
  'Geumcheon-gu': { id: 'geumcheon', nameKo: '금천구', riskScore: 55 },
  'Guro-gu': { id: 'guro', nameKo: '구로구', riskScore: 58 },
  'Gwanak-gu': { id: 'gwanak', nameKo: '관악구', riskScore: 68 },
  'Gwangjin-gu': { id: 'gwangjin', nameKo: '광진구', riskScore: 54 },
  'Gangnam-gu': { id: 'gangnam', nameKo: '강남구', riskScore: 78 },
  'Jongno-gu': { id: 'jongno', nameKo: '종로구', riskScore: 38 },
  'Jung-gu': { id: 'jung', nameKo: '중구', riskScore: 45 },
  'Jungnang-gu': { id: 'jungnang', nameKo: '중랑구', riskScore: 48 },
  'Mapo-gu': { id: 'mapo', nameKo: '마포구', riskScore: 46 },
  'Nowon-gu': { id: 'nowon', nameKo: '노원구', riskScore: 35 },
  'Seocho-gu': { id: 'seocho', nameKo: '서초구', riskScore: 70 },
  'Seodaemun-gu': { id: 'seodaemun', nameKo: '서대문구', riskScore: 44 },
  'Seongbuk-gu': { id: 'seongbuk', nameKo: '성북구', riskScore: 49 },
  'Seongdong-gu': { id: 'seongdong', nameKo: '성동구', riskScore: 53 },
  'Songpa-gu': { id: 'songpa', nameKo: '송파구', riskScore: 84 },
  'Yangcheon-gu': { id: 'yangcheon', nameKo: '양천구', riskScore: 43 },
  'Yeongdeungpo-gu_1_': { id: 'yeongdeungpo', nameKo: '영등포구', riskScore: 61 },
  'Yongsan-gu': { id: 'yongsan', nameKo: '용산구', riskScore: 52 }
};

let match;
const items = [];
while ((match = re.exec(svg))) {
  const id = match[1];
  const d = match[2].replace(/\s+/g, ' ').trim();
  const info = meta[id];
  if (!info) {
    throw new Error('Missing meta for ' + id);
  }
  items.push({ info, d });
}

const lines = [];
lines.push('export type District = {');
lines.push('  id: string;');
lines.push('  nameKo: string;');
lines.push('  riskScore: number;');
lines.push('  svgPath: string;');
lines.push('};');
lines.push('');
lines.push('export const districts: District[] = [');
for (const { info, d } of items) {
  lines.push('  {');
  lines.push(`    id: '${info.id}',`);
  lines.push(`    nameKo: '${info.nameKo}',`);
  lines.push(`    riskScore: ${info.riskScore},`);
  lines.push(`    svgPath: '${d}'`);
  lines.push('  },');
}
lines.push('];');

fs.writeFileSync('/Users/leejooho/Desktop/Yeosu/data/districts.ts', lines.join('\n'));
