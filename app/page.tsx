'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { districts } from '@/data/districts';
import SeoulMap from '@/components/SeoulMap';
import SidePanel from '@/components/SidePanel';
import { createAudioEngine, AudioEngine } from '@/lib/audioEngine';

type HoverPoint = { x: number; y: number };

export default function Home() {
  const [districtData, setDistrictData] = useState(districts);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lockSelection, setLockSelection] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [tooltipPoint, setTooltipPoint] = useState<HoverPoint | null>(null);
  const [showHint, setShowHint] = useState(true);
  const audioRef = useRef<AudioEngine | null>(null);

  useEffect(() => {
    audioRef.current = createAudioEngine();
    return () => {
      audioRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchScores = async () => {
      try {
        const response = await fetch('/api/risk-score', { cache: 'no-store' });
        if (!response.ok) return;
        const payload = await response.json();
        if (!payload?.scores || cancelled) return;

        setDistrictData((prev) =>
          prev.map((district) => ({
            ...district,
            riskScore: payload.scores[district.id] ?? district.riskScore
          }))
        );
      } catch {
        // Ignore fetch failures for local testing.
      }
    };
    fetchScores();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowHint(false), 3000);
    return () => window.clearTimeout(timer);
  }, []);

  const hoveredDistrict = useMemo(
    () => districtData.find((district) => district.id === hoveredId) ?? null,
    [hoveredId, districtData]
  );

  const selectedDistrict = useMemo(
    () => districtData.find((district) => district.id === selectedId) ?? null,
    [selectedId, districtData]
  );

  const audioDistrict = useMemo(() => {
    if (lockSelection && selectedDistrict) return selectedDistrict;
    return hoveredDistrict ?? selectedDistrict;
  }, [hoveredDistrict, selectedDistrict, lockSelection]);

  useEffect(() => {
    if (!audioEnabled || !audioDistrict) return;
    audioRef.current?.setRisk(audioDistrict.riskScore);
  }, [audioEnabled, audioDistrict]);

  const handleToggleAudio = () => {
    const engine = audioRef.current;
    if (!engine) return;

    if (!audioReady) {
      // Initialize audio only after a click to satisfy browser policies.
      engine.init();
      setAudioReady(true);
    }

    const nextEnabled = !audioEnabled;
    setAudioEnabled(nextEnabled);
    engine.setEnabled(nextEnabled);

    if (nextEnabled && audioDistrict) {
      engine.setRisk(audioDistrict.riskScore);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
    setShowHint(false);
  };

  const handleToggleLock = () => {
    setLockSelection((prev) => {
      const next = !prev;
      if (next && !selectedId && hoveredId) {
        setSelectedId(hoveredId);
      }
      return next;
    });
  };

  const handleHover = (id: string | null, point?: HoverPoint) => {
    setHoveredId(id);
    if (id) {
      setShowHint(false);
    }
    if (!id) {
      setTooltipPoint(null);
      return;
    }
    if (point) {
      setTooltipPoint(point);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <header className="absolute left-1/2 top-6 z-10 -translate-x-1/2">
        <Link
          href="/trend"
          className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs text-white/70 transition hover:border-white/30 hover:text-white"
        >
          과거부터 현재까지 서울의 위험점수변화 보기
        </Link>
      </header>

      <div className="grid min-h-screen grid-cols-1 items-center gap-8 px-6 py-16 lg:grid-cols-[minmax(320px,420px)_1fr] lg:gap-12">
        <div className="order-2 flex w-full items-center lg:order-1 lg:items-start">
          <SidePanel
            hoveredDistrict={hoveredDistrict}
            selectedDistrict={selectedDistrict}
            audioEnabled={audioEnabled}
            lockSelection={lockSelection}
            onToggleAudio={handleToggleAudio}
            onToggleLock={handleToggleLock}
          />
        </div>

        <div className="relative order-1 flex w-full justify-end lg:order-2 lg:pl-10">
          <div className="pointer-events-none absolute inset-y-6 left-0 w-px bg-white/10" />
          <div className="pointer-events-none absolute inset-y-0 -left-6 w-16 bg-gradient-to-r from-black/35 to-transparent" />
          <div className="relative flex w-full justify-end">
            <div
              className={`pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5 bg-black/20 px-4 py-2 text-xs text-white/55 backdrop-blur-sm transition-opacity duration-500 ${
                showHint ? 'opacity-70' : 'opacity-0'
              }`}
              aria-hidden={!showHint}
            >
              구를 가리키면 소리가 변합니다
            </div>
            <SeoulMap
              districts={districtData}
              hoveredId={hoveredId}
              selectedId={selectedId}
              onHover={handleHover}
              onSelect={handleSelect}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
