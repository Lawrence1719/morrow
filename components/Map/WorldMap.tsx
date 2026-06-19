"use client";

import React, { useEffect, useRef, useState } from 'react';
import { geoOrthographic, geoPath, geoGraticule, geoDistance } from 'd3-geo';
import { useNotesStore, Note } from '@/stores/notesStore';
import { MOOD_STYLES } from '@/lib/moods';
import GlobeDetailsCard from './GlobeDetailsCard';

const PLACE_LABELS = [
  // Continents
  { name: 'North America', coordinates: [-100, 45], type: 'continent' },
  { name: 'South America', coordinates: [-60, -20], type: 'continent' },
  { name: 'Europe', coordinates: [20, 50], type: 'continent' },
  { name: 'Africa', coordinates: [20, 10], type: 'continent' },
  { name: 'Asia', coordinates: [90, 40], type: 'continent' },
  { name: 'Australia', coordinates: [135, -25], type: 'continent' },
  { name: 'Antarctica', coordinates: [0, -82], type: 'continent' },
  // Oceans & Seas
  { name: 'Pacific Ocean', coordinates: [-150, 0], type: 'ocean' },
  { name: 'Atlantic Ocean', coordinates: [-30, 20], type: 'ocean' },
  { name: 'Indian Ocean', coordinates: [80, -15], type: 'ocean' },
  { name: 'Southern Ocean', coordinates: [0, -65], type: 'ocean' },
];

interface WorldMapProps {
  onNoteSelectChange?: (selected: boolean) => void;
}

const WorldMap: React.FC<WorldMapProps> = ({ onNoteSelectChange }) => {
  const { notes, fetchNotes, subscribeToRealtime, isLoading } = useNotesStore();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 600 });
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [geoJson, setGeoJson] = useState<any>(null);
  
  const [rotation, setRotation] = useState<[number, number, number]>([0, -15, 0]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  // Sync selectedNote status changes back to parent component
  useEffect(() => {
    onNoteSelectChange?.(!!selectedNote);
  }, [selectedNote, onNoteSelectChange]);

  // Refs for tracking interactive dragging and physics
  const isDragging = useRef(false);
  const pointerStart = useRef({ x: 0, y: 0 });
  const rotationStart = useRef<[number, number, number]>([0, -15, 0]);
  const clickStart = useRef({ x: 0, y: 0, time: 0 });
  const targetRotation = useRef<[number, number, number]>([0, -15, 0]);
  const dragVelocity = useRef<[number, number]>([0, 0]);
  const inertiaVelocity = useRef<[number, number]>([0, 0]);
  const lastMoveTime = useRef<number>(0);
  const lastPointerPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Animation focus targets
  const focusTarget = useRef<[number, number] | null>(null);
  const selectedNoteRef = useRef<Note | null>(null);
  const isHoveringPin = useRef(false);
  const isHoveringNoteCard = useRef(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const isDesktopRef = useRef(false);

  // Detect if device supports hover (desktop mouse/trackpad)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(hover: hover)');
    setIsDesktop(media.matches);
    isDesktopRef.current = media.matches;
    const handler = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
      isDesktopRef.current = e.matches;
    };
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  // Sync selectedNote to ref to avoid stale closures in animation loop
  useEffect(() => {
    selectedNoteRef.current = selectedNote;
  }, [selectedNote]);

  // Resize boundaries
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const size = Math.min(rect.width, rect.height) || 600;
        setDimensions({ width: size, height: size });
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Fetch GeoJSON and notes
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => setGeoJson(data))
      .catch((err) => console.error('Failed to load world map GeoJSON:', err));

    fetchNotes();
    const unsubscribe = subscribeToRealtime();
    return () => {
      unsubscribe();
    };
  }, [fetchNotes, subscribeToRealtime]);

  // Animation Loop (Auto-rotation, Inertia, and Smoothing Easing)
  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      // 1. Update targetRotation based on current interaction state
      if (!isDragging.current) {
        if (focusTarget.current) {
          const [targetLng, targetLat] = focusTarget.current;
          targetRotation.current = [-targetLng, -targetLat, 0];
        } else {
          // Apply inertia if the user flicked the globe
          const [yawInertia, pitchInertia] = inertiaVelocity.current;
          if (Math.abs(yawInertia) > 0.005 || Math.abs(pitchInertia) > 0.005) {
            targetRotation.current[0] += yawInertia;
            targetRotation.current[1] = Math.max(-50, Math.min(50, targetRotation.current[1] + pitchInertia));
            
            // Apply friction/decay to inertia
            inertiaVelocity.current[0] *= 0.95;
            inertiaVelocity.current[1] *= 0.95;
          } else {
            inertiaVelocity.current = [0, 0];
            
            // Idle auto-rotation (only when not dragged, focused, or hovered)
            if (!selectedNoteRef.current && !isHoveringPin.current && !isHoveringNoteCard.current) {
              targetRotation.current[0] += 0.15;
            }
          }
        }
      }

      // 2. Always ease the actual state rotation towards targetRotation
      setRotation((prev) => {
        const [targetYaw, targetPitch] = targetRotation.current;
        const [currentYaw, currentPitch] = prev;

        const diffYaw = targetYaw - currentYaw;
        // Wrap diffYaw to take the shortest path around the sphere (-180 to +180 deg)
        const normalizedDiffYaw = Math.atan2(
          Math.sin(diffYaw * Math.PI / 180),
          Math.cos(diffYaw * Math.PI / 180)
        ) * 180 / Math.PI;

        const diffPitch = targetPitch - currentPitch;

        // Arrived at focus target check
        if (focusTarget.current) {
          if (Math.abs(normalizedDiffYaw) < 0.1 && Math.abs(diffPitch) < 0.1) {
            focusTarget.current = null;
          }
        }

        // Smooth damping/easing factor (snappier during drags, smoother on idle/focus)
        const easing = isDragging.current ? 0.28 : 0.12;
        const nextYaw = currentYaw + normalizedDiffYaw * easing;
        const nextPitch = currentPitch + diffPitch * easing;

        return [nextYaw, nextPitch, 0];
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Set up D3 projections
  const radius = (dimensions.width / 2) * 0.9;
  const projection = geoOrthographic()
    .scale(radius)
    .translate([dimensions.width / 2, dimensions.height / 2])
    .rotate(rotation);

  const pathGenerator = geoPath().projection(projection);

  // Generate paths
  const spherePath = pathGenerator({ type: 'Sphere' }) || '';
  const graticulePath = pathGenerator(geoGraticule()()) || '';

  // Drag handlers
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    isDragging.current = true;
    pointerStart.current = { x: e.clientX, y: e.clientY };
    rotationStart.current = rotation;
    targetRotation.current = rotation; // Sync target to the current visual rotation state
    clickStart.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    focusTarget.current = null;
    e.currentTarget.setPointerCapture(e.pointerId);

    // Initialize tracking variables for flick momentum/inertia
    lastPointerPos.current = { x: e.clientX, y: e.clientY };
    lastMoveTime.current = Date.now();
    dragVelocity.current = [0, 0];
    inertiaVelocity.current = [0, 0];
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging.current) return;
    
    const deltaX = e.clientX - pointerStart.current.x;
    const deltaY = e.clientY - pointerStart.current.y;
    
    const sensitivity = 360 / (dimensions.width * 1.5);
    const newYaw = rotationStart.current[0] + deltaX * sensitivity;
    const newPitch = Math.max(-50, Math.min(50, rotationStart.current[1] - deltaY * sensitivity));
    
    targetRotation.current = [newYaw, newPitch, 0];

    // Measure drag speed
    const now = Date.now();
    const dt = now - lastMoveTime.current;
    if (dt > 0) {
      const moveDeltaX = e.clientX - lastPointerPos.current.x;
      const moveDeltaY = e.clientY - lastPointerPos.current.y;
      
      const stepYawVel = (moveDeltaX * sensitivity) / dt;
      const stepPitchVel = (-moveDeltaY * sensitivity) / dt;
      
      // Exponential moving average filter for velocity signals
      const alpha = 0.25;
      dragVelocity.current = [
        dragVelocity.current[0] * (1 - alpha) + stepYawVel * alpha,
        dragVelocity.current[1] * (1 - alpha) + stepPitchVel * alpha
      ];
    }
    
    lastPointerPos.current = { x: e.clientX, y: e.clientY };
    lastMoveTime.current = now;
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isDragging.current) {
      isDragging.current = false;
      e.currentTarget.releasePointerCapture(e.pointerId);

      const dragDuration = Date.now() - clickStart.current.time;
      const dragDistance = Math.sqrt(
        Math.pow(e.clientX - clickStart.current.x, 2) +
        Math.pow(e.clientY - clickStart.current.y, 2)
      );

      // Tap on empty space of SVG closes card
      if (dragDuration < 250 && dragDistance < 6) {
        setSelectedNote(null);
        focusTarget.current = null;
        inertiaVelocity.current = [0, 0];
      } else {
        // Trigger inertia momentum if cursor was moving on release
        const timeSinceLastMove = Date.now() - lastMoveTime.current;
        if (timeSinceLastMove < 80) {
          // Convert from degrees/ms to degrees/frame (~60fps) and clamp speed
          const maxVel = 8;
          const yawVel = Math.max(-maxVel, Math.min(maxVel, dragVelocity.current[0] * 16));
          const pitchVel = Math.max(-maxVel, Math.min(maxVel, dragVelocity.current[1] * 16));
          inertiaVelocity.current = [yawVel, pitchVel];
        } else {
          inertiaVelocity.current = [0, 0];
        }
      }
    }
  };

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
    focusTarget.current = [note.longitude, note.latitude];
  };

  // Find selected note coordinates on the globe relative to container bounds
  let pinX: number | null = null;
  let pinY: number | null = null;

  if (selectedNote) {
    const distance = geoDistance(
      [selectedNote.longitude, selectedNote.latitude],
      [-rotation[0], -rotation[1]]
    );
    const isVisible = distance < Math.PI / 2;
    if (isVisible) {
      const projected = projection([selectedNote.longitude, selectedNote.latitude]);
      if (projected) {
        const svgOffsetX = (containerSize.width - dimensions.width) / 2;
        const svgOffsetY = (containerSize.height - dimensions.height) / 2;
        pinX = svgOffsetX + projected[0];
        pinY = svgOffsetY + projected[1];
      }
    }
  }

  const isMapLoading = isLoading || !geoJson;

  return (
    <div className="relative w-full h-full bg-[#fbf9f4] overflow-hidden">
      {/* Loading overlay */}
      {isMapLoading && (
        <div className="absolute inset-0 bg-[#f5f2eb]/85 z-[100] flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
          <div className="w-10 h-10 border-4 border-[#c9a96e] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-[#4a3e2e]/80 animate-pulse font-mono">mapping world mood...</span>
        </div>
      )}

      {/* SVG Container */}
      <div ref={containerRef} className="w-full h-full flex items-center justify-center overflow-hidden">
        {geoJson && (
          <svg
            width={dimensions.width}
            height={dimensions.height}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              cursor: isDragging.current ? 'grabbing' : 'grab',
              touchAction: 'none', // Prevents screen scroll jitter during mobile drags
            }}
          >
            {/* Sphere Background / Ocean */}
            <path
              d={spherePath}
              fill="#f5f2eb"
            />

            {/* Graticule / Gridlines */}
            <path
              d={graticulePath}
              fill="none"
              stroke="#c9a96e"
              strokeWidth={0.5}
              opacity={0.15}
            />

            {/* Landmasses / Countries */}
            {geoJson.features?.map((feature: any, index: number) => {
              const path = pathGenerator(feature);
              if (!path) return null;
              return (
                <path
                  key={index}
                  d={path}
                  fill="#eae6db"
                  stroke="#f5f2eb"
                  strokeWidth={0.5}
                  className="hover:fill-[#e0d6c1] transition-colors duration-150"
                />
              );
            })}

            {/* Continent and Ocean Placeholders */}
            {PLACE_LABELS.map((label) => {
              const projected = projection(label.coordinates as [number, number]);
              if (!projected) return null;

              // Check if label is on the visible front-hemisphere
              const distance = geoDistance(
                label.coordinates as [number, number],
                [-rotation[0], -rotation[1]]
              );
              // Fade out near the edges of the sphere to prevent layout glitches
              const isVisible = distance < Math.PI / 3.2;
              if (!isVisible) return null;

              const [x, y] = projected;
              const isOcean = label.type === 'ocean';

              // Easing decay opacity near the horizon edge of the globe
              const edgeFade = Math.max(0, Math.min(1, (Math.PI / 3.2 - distance) / 0.15));

              return (
                <text
                  key={label.name}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  pointerEvents="none"
                  style={{
                    fill: isOcean ? '#c3af91' : '#7d6c56',
                    fontSize: isOcean ? '9px' : '10px',
                    fontFamily: isOcean ? 'Georgia, serif' : 'var(--font-mono), monospace',
                    fontStyle: isOcean ? 'italic' : 'normal',
                    fontWeight: isOcean ? 'normal' : '600',
                    letterSpacing: isOcean ? '1.5px' : '2px',
                    textTransform: 'uppercase',
                    opacity: (isOcean ? 0.45 : 0.6) * edgeFade,
                    userSelect: 'none',
                    transition: 'opacity 0.2s',
                  }}
                >
                  {label.name}
                </text>
              );
            })}

            {/* Note Pins */}
            {notes.map((note) => {
              const projected = projection([note.longitude, note.latitude]);
              if (!projected) return null;

              // Check if marker is on the visible front-hemisphere
              const distance = geoDistance(
                [note.longitude, note.latitude],
                [-rotation[0], -rotation[1]]
              );
              const isVisible = distance < Math.PI / 2;
              if (!isVisible) return null;

              const [x, y] = projected;
              const isSelected = selectedNote?.id === note.id;
              const style = MOOD_STYLES[note.mood.toLowerCase()] || MOOD_STYLES.happy;

              return (
                <g
                  key={note.id}
                  transform={`translate(${x}, ${y})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNoteClick(note);
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                  }}
                  onPointerUp={(e) => {
                    e.stopPropagation();
                  }}
                  onMouseEnter={() => {
                    if (isDesktopRef.current) {
                      isHoveringPin.current = true;
                    }
                  }}
                  onMouseLeave={() => {
                    if (isDesktopRef.current) {
                      isHoveringPin.current = false;
                    }
                  }}
                  className="group cursor-pointer"
                >
                  {/* Ping Animation Ring */}
                  <circle
                    r={isSelected ? 14 : 9}
                    fill={style.color}
                    opacity={isSelected ? 0.4 : 0.25}
                    className={isSelected ? "animate-pulse" : "group-hover:scale-125 transition-transform duration-200"}
                  />
                  {/* Pulse Ping ring for active pin */}
                  {isSelected && (
                    <circle
                      r={24}
                      fill={style.color}
                      opacity={0.15}
                      className="animate-ping"
                    />
                  )}
                  {/* Core Center Dot */}
                  <circle
                    r={isSelected ? 5.5 : 3.5}
                    fill={style.color}
                    stroke="#fbf9f4"
                    strokeWidth={1.5}
                    className="shadow-md"
                  />
                </g>
              );
            })}
          </svg>
        )}
      </div>

      {/* Full-screen SVG for connector lines and other overlay decorations */}
      {selectedNote && pinX !== null && pinY !== null && isDesktop && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-[500]">
          <style>{`
            @keyframes dasharray-move {
              to {
                stroke-dashoffset: -20;
              }
            }
          `}</style>
          {/* Connector Bezier Line */}
          <path
            d={`M ${pinX} ${pinY} C ${(pinX + (containerSize.width - 408)) / 2} ${pinY}, ${(pinX + (containerSize.width - 408)) / 2} 130, ${containerSize.width - 408} 130`}
            fill="none"
            stroke="#c9a96e"
            strokeWidth={1.5}
            strokeDasharray="5 5"
            style={{
              animation: 'dasharray-move 1.5s linear infinite',
            }}
            opacity={0.6}
          />
          {/* Start Point Dot */}
          <circle cx={pinX} cy={pinY} r={3} fill="#c9a96e" />
          {/* End Point Dot */}
          <circle cx={containerSize.width - 408} cy={130} r={3} fill="#c9a96e" />
        </svg>
      )}

      {/* Selected Note Details Card Overlay */}
      {selectedNote && (
        <GlobeDetailsCard 
          note={selectedNote} 
          onClose={() => {
            setSelectedNote(null);
            focusTarget.current = null;
            isHoveringNoteCard.current = false;
          }} 
          onMouseEnter={() => {
            if (isDesktopRef.current) {
              isHoveringNoteCard.current = true;
            }
          }}
          onMouseLeave={() => {
            if (isDesktopRef.current) {
              isHoveringNoteCard.current = false;
            }
          }}
        />
      )}

      {/* Decorative Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none border-[12px] border-[#f5f2eb]/10 z-[99] shadow-[inset_0_0_120px_rgba(74,62,46,0.15)]" />
    </div>
  );
};

export default WorldMap;

