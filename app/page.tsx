'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { districts } from '@/data/districts';
import SeoulMap from '@/components/SeoulMap';
import TopStatus from '@/components/TopStatus';
import HoverTooltip from '@/components/HoverTooltip';
import BottomSheet from '@/components/BottomSheet';
import { createAudioEngine, AudioEngine } from '@/lib/audioEngine';

type HoverPoint = { x: number; y: number };

export default function Home() {
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
    const timer = window.setTimeout(() => setShowHint(false), 3000);
    return () => window.clearTimeout(timer);
  }, []);

  const hoveredDistrict = useMemo(
    () => districts.find((district) => district.id === hoveredId) ?? null,
    [hoveredId]
  );

  const selectedDistrict = useMemo(
    () => districts.find((district) => district.id === selectedId) ?? null,
    [selectedId]
  );

  const audioDistrict = useMemo(() => {
    if (lockSelection && selectedDistrict) return selectedDistrict;
    return hoveredDistrict ?? selectedDistrict;
  }, [hoveredDistrict, selectedDistrict, lockSelection]);

  const pulseIntensity =
    hoveredDistrict && hoveredDistrict.riskScore !== null
      ? hoveredDistrict.riskScore / 100
      : 0.35;
  const pulseActive = Boolean(hoveredDistrict);

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

  const handleCloseSheet = () => {
    setSelectedId(null);
    setLockSelection(false);
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <TopStatus
        district={audioDistrict}
        pulseActive={pulseActive}
        pulseIntensity={pulseIntensity}
      />

      <div className="relative flex min-h-screen items-center justify-center px-6 py-16">
        <div
          className={`pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5 bg-black/20 px-4 py-2 text-xs text-white/55 backdrop-blur-sm transition-opacity duration-500 ${
            showHint ? 'opacity-70' : 'opacity-0'
          }`}
          aria-hidden={!showHint}
        >
          구를 가리키면 소리가 변합니다
        </div>
        <SeoulMap
          districts={districts}
          hoveredId={hoveredId}
          selectedId={selectedId}
          onHover={handleHover}
          onSelect={handleSelect}
        />
        <HoverTooltip
          district={hoveredDistrict}
          position={tooltipPoint}
          visible={Boolean(hoveredDistrict)}
        />
      </div>

      {selectedDistrict && (
        <BottomSheet
          district={selectedDistrict}
          audioEnabled={audioEnabled}
          lockSelection={lockSelection}
          onToggleAudio={handleToggleAudio}
          onToggleLock={handleToggleLock}
          onClose={handleCloseSheet}
        />
      )}
    </main>
  );
}
