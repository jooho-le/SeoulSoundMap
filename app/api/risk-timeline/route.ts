import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type OneonetwoRow = Record<string, string | number> & {
  '현황별(1)'?: string;
  '현황별(2)'?: string;
};

type FiveRow = Record<string, string | number> & {
  '자치구별(1)'?: string;
  '자치구별(2)'?: string;
};

const DATA_WEIGHTS = {
  five: 0.6,
  oneonetwo: 0.4
};

const noStoreHeaders = {
  'Cache-Control': 'no-store, max-age=0'
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

const extractYearValues = (row: Record<string, string | number>) => {
  const entries = Object.entries(row);
  const result: Record<number, number> = {};
  entries.forEach(([key, value]) => {
    if (!/^\d{4}$/.test(key)) return;
    result[Number(key)] = toNumber(value);
  });
  return result;
};

const normalize = (values: Record<number, number>) => {
  const numbers = Object.values(values);
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  const normalized: Record<number, number> = {};
  Object.entries(values).forEach(([year, value]) => {
    const numeric = Number(year);
    if (max === min) {
      normalized[numeric] = 0.5;
    } else {
      normalized[numeric] = (value - min) / (max - min);
    }
  });
  return normalized;
};

export async function GET() {
  const fiveDir = path.join(process.cwd(), 'data', 'five');
  const oneDir = path.join(process.cwd(), 'data', 'oneonetwo');

  const fiveFile = await getLatestJsonFile(fiveDir);
  const oneFile = await getLatestJsonFile(oneDir);

  if (!fiveFile || !oneFile) {
    return NextResponse.json(
      {
        error: 'Missing data files for five or oneonetwo.'
      },
      { status: 404, headers: noStoreHeaders }
    );
  }

  const fiveRaw = await fs.readFile(fiveFile.filePath, 'utf8');
  const oneRaw = await fs.readFile(oneFile.filePath, 'utf8');
  const fiveRows = JSON.parse(fiveRaw) as FiveRow[];
  const oneRows = JSON.parse(oneRaw) as OneonetwoRow[];

  const fiveTarget =
    fiveRows.find(
      (row) =>
        row['자치구별(1)'] === '합계' && row['자치구별(2)'] === '소계'
    ) ??
    fiveRows.find((row) => row['자치구별(1)'] === '합계') ??
    fiveRows[0];

  const oneTarget =
    oneRows.find(
      (row) =>
        row['현황별(1)']?.includes('112') && row['현황별(2)'] === '소계'
    ) ?? oneRows[0];

  const fiveValues = extractYearValues(fiveTarget);
  const oneValues = extractYearValues(oneTarget);

  const years = Object.keys(fiveValues)
    .map(Number)
    .filter((year) => year in oneValues)
    .sort((a, b) => a - b);

  const fiveNorm = normalize(
    Object.fromEntries(years.map((year) => [year, fiveValues[year]]))
  );
  const oneNorm = normalize(
    Object.fromEntries(years.map((year) => [year, oneValues[year]]))
  );

  const points = years.map((year) => {
    const score =
      (fiveNorm[year] * DATA_WEIGHTS.five +
        oneNorm[year] * DATA_WEIGHTS.oneonetwo) *
      100;
    return {
      year,
      score: Math.round(score),
      fiveTotal: fiveValues[year],
      oneonetwoTotal: oneValues[year]
    };
  });

  return NextResponse.json(
    {
      sources: {
        five: fiveFile.fileName,
        oneonetwo: oneFile.fileName
      },
      weights: DATA_WEIGHTS,
      points
    },
    { headers: noStoreHeaders }
  );
}
