import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { districts } from '@/data/districts';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type CrimeRow = Record<string, string | number> & {
  범죄대분류?: string;
  범죄중분류?: string;
};

type DistrictScore = {
  id: string;
  crimeTotal: number;
  fiveTotal: number;
  policeTotal: number;
  baseScore: number;
};

type PoliceRow = {
  발생년도?: number | string;
  경찰서?: string;
  살인?: number | string;
  강도?: number | string;
  절도?: number | string;
  폭력?: number | string;
};

const DATA_WEIGHTS = {
  crime: 0.45,
  five: 0.35,
  police: 0.2
};

const noStoreHeaders = {
  'Cache-Control': 'no-store, max-age=0'
};

const buildSeoulKeyMap = () => {
  const map: Record<string, string> = {};
  districts.forEach((district) => {
    map[`서울 ${district.nameKo}`] = district.id;
  });
  return map;
};

const buildDistrictNameMap = () => {
  const map: Record<string, string> = {};
  districts.forEach((district) => {
    map[district.nameKo] = district.id;
  });
  return map;
};

const toNumber = (value: unknown) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const normalized = String(value).trim();
  if (!normalized || normalized === '-' || normalized === '—') return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getLatestJsonFile = async (dir: string) => {
  const files = (await fs.readdir(dir))
    .filter((name) => name.endsWith('.json'))
    .sort();
  if (files.length === 0) return null;
  const latest = files[files.length - 1];
  return { fileName: latest, filePath: path.join(dir, latest) };
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

const normalizeTotals = (totals: Record<string, number>) => {
  const values = Object.values(totals);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const normalized: Record<string, number> = {};
  Object.entries(totals).forEach(([id, total]) => {
    normalized[id] = max === min ? 0.5 : (total - min) / (max - min);
  });
  return normalized;
};

const computeBaseScores = (
  crimeTotals: Record<string, number>,
  fiveTotals: Record<string, number>,
  policeTotals: Record<string, number>
) => {
  const crimeNorm = normalizeTotals(crimeTotals);
  const fiveNorm = normalizeTotals(fiveTotals);
  const policeNorm = normalizeTotals(policeTotals);

  const scores: Record<string, DistrictScore> = {};
  districts.forEach((district) => {
    const weighted =
      crimeNorm[district.id] * DATA_WEIGHTS.crime +
      fiveNorm[district.id] * DATA_WEIGHTS.five +
      policeNorm[district.id] * DATA_WEIGHTS.police;
    const baseScore = Math.round(10 + weighted * 80);
    scores[district.id] = {
      id: district.id,
      crimeTotal: crimeTotals[district.id] ?? 0,
      fiveTotal: fiveTotals[district.id] ?? 0,
      policeTotal: policeTotals[district.id] ?? 0,
      baseScore
    };
  });
  return scores;
};

const buildPrompt = (dataset: DistrictScore[]) => {
  return `당신은 데이터 분석가입니다. 아래 3개 데이터셋을 종합하여 서울 각 구의 위험도 점수(riskScore, 0~100)를 산출하세요.

규칙:
- crimeTotal, fiveTotal, policeTotal이 높을수록 riskScore가 높아야 합니다(단조 증가).
- 점수는 0~100 범위를 유지하세요.
- 가능한 한 동점을 피하세요.
- 가중치 가이드: crime 0.45 / five 0.35 / police 0.20.
- baseScore는 위 가중치로 정규화한 기준점입니다. baseScore 근처에서 합리적으로 조정하세요.
- 결과는 JSON 배열만 반환하세요. 예: [{"id":"gangnam","riskScore":78}, ...]

데이터셋 (id, crimeTotal, fiveTotal, policeTotal, baseScore):
${dataset
  .map(
    (item) =>
      `${item.id}: crime=${item.crimeTotal}, five=${item.fiveTotal}, police=${item.policeTotal}, baseScore=${item.baseScore}`
  )
  .join('\n')}
`;
};

const parseScores = (text: string) => {
  try {
    const cleaned = text.trim().replace(/^```json/i, '').replace(/```$/i, '');
    const direct = JSON.parse(cleaned);
    const parsed = Array.isArray(direct) ? direct : null;
    if (!parsed) throw new Error('Direct parse failed');
    const result: Record<string, number> = {};
    parsed.forEach((item) => {
      if (!item || typeof item.id !== 'string') return;
      const score = Number(item.riskScore);
      if (Number.isFinite(score)) {
        result[item.id] = Math.min(100, Math.max(0, Math.round(score)));
      }
    });
    return Object.keys(result).length ? result : null;
  } catch {
    try {
      const start = text.indexOf('[');
      const end = text.lastIndexOf(']');
      if (start === -1 || end === -1 || end <= start) return null;
      const slice = text.slice(start, end + 1);
      const parsed = JSON.parse(slice);
      if (!Array.isArray(parsed)) return null;
      const result: Record<string, number> = {};
      parsed.forEach((item) => {
        if (!item || typeof item.id !== 'string') return;
        const score = Number(item.riskScore);
        if (Number.isFinite(score)) {
          result[item.id] = Math.min(100, Math.max(0, Math.round(score)));
        }
      });
      return Object.keys(result).length ? result : null;
    } catch {
      return null;
    }
  }
};

export async function GET(request: NextRequest) {
  const debug = request.nextUrl.searchParams.get('debug') === '1';
  const apiKey = process.env.OPENAPI_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAPI_KEY is missing in .env' },
      { status: 400, headers: noStoreHeaders }
    );
  }

  const crimeDir = path.join(process.cwd(), 'data', 'crime');
  const crimeFile = await getLatestJsonFile(crimeDir);
  if (!crimeFile) {
    return NextResponse.json(
      { error: 'No crime data files found' },
      { status: 404, headers: noStoreHeaders }
    );
  }

  const crimeRaw = await fs.readFile(crimeFile.filePath, 'utf8');
  const crimeRows = JSON.parse(crimeRaw) as CrimeRow[];

  const keyMap = buildSeoulKeyMap();
  const crimeTotals = computeTotals(crimeRows, keyMap);

  const fiveDir = path.join(process.cwd(), 'data', 'five');
  const fiveFile = await getLatestJsonFile(fiveDir);
  const fiveTotals: Record<string, number> = Object.fromEntries(
    districts.map((district) => [district.id, 0])
  );
  if (fiveFile) {
    const fiveRaw = await fs.readFile(fiveFile.filePath, 'utf8');
    const fiveRows = JSON.parse(fiveRaw) as Record<string, string | number>[];
    const districtNameMap = buildDistrictNameMap();
    const sampleKeys = Object.keys(fiveRows[0] ?? {});
    const yearCandidates = sampleKeys
      .map((key) => key.match(/^(\d{4})(?:\.\d+)?$/)?.[1])
      .filter(Boolean)
      .map((value) => Number(value));
    const latestYear =
      yearCandidates.length > 0 ? Math.max(...yearCandidates) : null;
    const targetKey = latestYear ? String(latestYear) : null;

    if (targetKey) {
      fiveRows.forEach((row) => {
        const name = row['자치구별(2)'];
        if (typeof name !== 'string') return;
        const id = districtNameMap[name];
        if (!id) return;
        fiveTotals[id] = toNumber(row[targetKey]);
      });
    }
  }

  const policeDir = path.join(process.cwd(), 'data', 'policestation');
  const policeFile = await getLatestJsonFile(policeDir);
  const policeTotals: Record<string, number> = Object.fromEntries(
    districts.map((district) => [district.id, 0])
  );
  if (policeFile) {
    const policeRaw = await fs.readFile(policeFile.filePath, 'utf8');
    const policeRows = JSON.parse(policeRaw) as PoliceRow[];
    const districtTokens = districts
      .map((district) => ({
        token: district.nameKo.replace('구', ''),
        id: district.id
      }))
      .filter((item) => item.token.length >= 2)
      .sort((a, b) => b.token.length - a.token.length);
    const stationOverrides: Record<string, string> = {
      서울남대문서: 'jung',
      서울중부서: 'jung',
      서울혜화서: 'jongno',
      서울종암서: 'seongbuk',
      서울서부서: 'eunpyeong',
      서울방배서: 'seocho',
      서울수서서: 'gangnam'
    };

    policeRows.forEach((row) => {
      const station = typeof row.경찰서 === 'string' ? row.경찰서 : '';
      if (!station.startsWith('서울')) return;
      const overrideId = stationOverrides[station];
      let id = overrideId ?? null;
      if (!id) {
        const match = districtTokens.find((item) =>
          station.includes(item.token)
        );
        id = match?.id ?? null;
      }
      if (!id) return;
      const total =
        toNumber(row.살인) +
        toNumber(row.강도) +
        toNumber(row.절도) +
        toNumber(row.폭력);
      policeTotals[id] += total;
    });
  }

  const baseScores = computeBaseScores(
    crimeTotals,
    fiveTotals,
    policeTotals
  );
  const dataset = Object.values(baseScores).sort(
    (a, b) => b.baseScore - a.baseScore
  );

  const prompt = buildPrompt(dataset);

  let response: Response | null = null;
  let responseText = '';
  response = await fetch('https://api.openai.com/v1/chat/completions', {
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
    responseText = await response.text().catch(() => '');
    const fallback: Record<string, number> = {};
    Object.values(baseScores).forEach((item) => {
      fallback[item.id] = item.baseScore;
    });
    return NextResponse.json({
      sources: {
        crime: crimeFile.fileName,
        five: fiveFile?.fileName ?? null,
        policestation: policeFile?.fileName ?? null
      },
      scores: fallback,
      fallback: true,
      debug: debug
        ? {
            status: response.status,
            statusText: response.statusText,
            responseText: responseText.slice(0, 2000)
          }
        : undefined
    }, { headers: noStoreHeaders });
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
      sources: {
        crime: crimeFile.fileName,
        five: fiveFile?.fileName ?? null,
        policestation: policeFile?.fileName ?? null
      },
      scores: fallback,
      fallback: true,
      debug: debug
        ? {
            message: 'Failed to parse OpenAI response',
            content: content.slice(0, 2000)
          }
        : undefined
    }, { headers: noStoreHeaders });
  }

  return NextResponse.json({
    sources: {
      crime: crimeFile.fileName,
      five: fiveFile?.fileName ?? null,
      policestation: policeFile?.fileName ?? null
    },
    scores: parsed,
    fallback: false,
    debug: debug ? { content: content.slice(0, 2000) } : undefined
  }, { headers: noStoreHeaders });
}
