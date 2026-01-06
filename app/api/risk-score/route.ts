import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { districts } from '@/data/districts';

type CrimeRow = Record<string, string | number> & {
  범죄대분류?: string;
  범죄중분류?: string;
};

type DistrictScore = {
  id: string;
  total: number;
  baseScore: number;
};

const buildSeoulKeyMap = () => {
  const map: Record<string, string> = {};
  districts.forEach((district) => {
    map[`서울 ${district.nameKo}`] = district.id;
  });
  return map;
};

const computeTotals = (rows: CrimeRow[], keyMap: Record<string, string>) => {
  const totals: Record<string, number> = Object.fromEntries(
    districts.map((district) => [district.id, 0])
  );

  rows.forEach((row) => {
    Object.entries(row).forEach(([key, value]) => {
      if (!key.startsWith('서울 ')) return;
      const id = keyMap[key];
      if (!id) return;
      const numeric = typeof value === 'number' ? value : Number(value);
      if (Number.isFinite(numeric)) {
        totals[id] += numeric;
      }
    });
  });

  return totals;
};

const computeBaseScores = (totals: Record<string, number>) => {
  const values = Object.values(totals);
  const min = Math.min(...values);
  const max = Math.max(...values);

  const scores: Record<string, DistrictScore> = {};
  Object.entries(totals).forEach(([id, total]) => {
    const normalized = max === min ? 0.5 : (total - min) / (max - min);
    const baseScore = Math.round(10 + normalized * 80);
    scores[id] = { id, total, baseScore };
  });
  return scores;
};

const buildPrompt = (dataset: DistrictScore[]) => {
  return `당신은 데이터 분석가입니다. 아래 제공된 합계(total)를 바탕으로 서울 각 구의 위험도 점수(riskScore, 0~100)를 산출하세요.

규칙:
- total이 높을수록 riskScore가 높아야 합니다(단조 증가).
- 점수는 0~100 범위를 유지하세요.
- 가능한 한 동점을 피하세요.
- total을 가장 중요한 신호로 사용하세요.
- 결과는 JSON 배열만 반환하세요. 예: [{"id":"gangnam","riskScore":78}, ...]

데이터셋 (id, total, baseScore):
${dataset.map((item) => `${item.id}: total=${item.total}, baseScore=${item.baseScore}`).join('\n')}
`;
};

const parseScores = (text: string) => {
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) return null;
    const result: Record<string, number> = {};
    parsed.forEach((item) => {
      if (!item || typeof item.id !== 'string') return;
      const score = Number(item.riskScore);
      if (Number.isFinite(score)) {
        result[item.id] = Math.min(100, Math.max(0, Math.round(score)));
      }
    });
    return result;
  } catch {
    return null;
  }
};

export async function GET() {
  const apiKey = process.env.OPENAPI_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAPI_KEY is missing in .env' },
      { status: 400 }
    );
  }

  const crimeDir = path.join(process.cwd(), 'data', 'crime');
  const files = (await fs.readdir(crimeDir))
    .filter((name) => name.endsWith('.json'))
    .sort();

  if (files.length === 0) {
    return NextResponse.json(
      { error: 'No crime data files found' },
      { status: 404 }
    );
  }

  const latest = files[files.length - 1];
  const jsonPath = path.join(crimeDir, latest);
  const raw = await fs.readFile(jsonPath, 'utf8');
  const rows = JSON.parse(raw) as CrimeRow[];

  const keyMap = buildSeoulKeyMap();
  const totals = computeTotals(rows, keyMap);
  const baseScores = computeBaseScores(totals);
  const dataset = Object.values(baseScores).sort((a, b) => b.total - a.total);

  const prompt = buildPrompt(dataset);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        { role: 'system', content: 'You output JSON only.' },
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!response.ok) {
    const fallback: Record<string, number> = {};
    Object.values(baseScores).forEach((item) => {
      fallback[item.id] = item.baseScore;
    });
    return NextResponse.json({
      source: latest,
      scores: fallback,
      fallback: true
    });
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content ?? '';
  const parsed = parseScores(content);

  if (!parsed) {
    const fallback: Record<string, number> = {};
    Object.values(baseScores).forEach((item) => {
      fallback[item.id] = item.baseScore;
    });
    return NextResponse.json({
      source: latest,
      scores: fallback,
      fallback: true
    });
  }

  return NextResponse.json({
    source: latest,
    scores: parsed,
    fallback: false
  });
}
