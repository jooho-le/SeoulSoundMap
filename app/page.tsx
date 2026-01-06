'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { districts } from '@/data/districts';
import SeoulMap from '@/components/SeoulMap';
import InfoPanel from '@/components/InfoPanel';
import { createAudioEngine, AudioEngine } from '@/lib/audioEngine';

export default function Home() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lockSelection, setLockSelection] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const audioRef = useRef<AudioEngine | null>(null);

  useEffect(() => {
    audioRef.current = createAudioEngine();
    return () => {
      audioRef.current?.dispose();
    };
  }, []);

  const hoveredDistrict = useMemo(
    () => districts.find((district) => district.id === hoveredId) ?? null,
    [hoveredId]
  );

  const selectedDistrict = useMemo(
    () => districts.find((district) => district.id === selectedId) ?? null,
    [selectedId]
  );

  const activeDistrict = useMemo(() => {
    if (lockSelection && selectedDistrict) return selectedDistrict;
    return hoveredDistrict ?? selectedDistrict;
  }, [hoveredDistrict, selectedDistrict, lockSelection]);

  useEffect(() => {
    if (!audioEnabled || !activeDistrict) return;
    audioRef.current?.setRisk(activeDistrict.riskScore);
  }, [audioEnabled, activeDistrict]);

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

    if (nextEnabled && activeDistrict) {
      engine.setRisk(activeDistrict.riskScore);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
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

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="absolute left-6 top-6 z-10 max-w-xs rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70">
        Seoul Sound Map
      </div>

      <div className="relative flex flex-1 items-stretch">
        <div className="flex-1 animate-map-reveal p-6 flex items-center justify-center">
          <SeoulMap
            districts={districts}
            hoveredId={hoveredId}
            selectedId={selectedId}
            onHover={setHoveredId}
            onSelect={handleSelect}
          />
        </div>

        <div className="pointer-events-none absolute bottom-6 left-6 z-10">
          <InfoPanel
            district={activeDistrict}
            audioEnabled={audioEnabled}
            onToggleAudio={handleToggleAudio}
            lockSelection={lockSelection}
            onToggleLock={handleToggleLock}
          />
        </div>
      </div>
    </main>
  );
}
