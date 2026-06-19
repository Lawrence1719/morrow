"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { geoOrthographic, geoPath, geoGraticule, geoDistance } from 'd3-geo';
import { useNotesStore, Note } from '@/stores/notesStore';
import { MOOD_STYLES } from '@/lib/moods';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
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
  isNight?: boolean;
}

const WorldMap: React.FC<WorldMapProps> = ({ onNoteSelectChange, isNight = false }) => {
  const { notes, fetchNotes, subscribeToRealtime, isLoading } = useNotesStore();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [geoJson, setGeoJson] = useState<any>(null);
  
  const [rotation, setRotation] = useState<[number, number, number]>([0, -15, 0]);
  const [zoom, setZoom] = useState<number>(1.0);
  const targetZoom = useRef<number>(1.0);
  
  // Multitouch gesture tracking for pinch-to-zoom
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const initialPinchDistance = useRef<number | null>(null);
  const initialZoom = useRef<number>(1.0);
  
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  
  // Cluster properties state
  const [activeClusterNotes, setActiveClusterNotes] = useState<Note[]>([]);
  const [activeClusterIndex, setActiveClusterIndex] = useState<number>(0);

  // Track dynamic card height for connector line centering
  const [cardHeight, setCardHeight] = useState<number>(212); // Default matches vertical center of 130px
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Close card or update indices if notes are deleted/changed in realtime
  useEffect(() => {
    if (selectedNote) {
      const stillExists = notes.some((n) => n.id === selectedNote.id);
      if (!stillExists) {
        setSelectedNote(null);
        setActiveClusterNotes([]);
        setActiveClusterIndex(0);
        focusTarget.current = null;
      } else if (activeClusterNotes.length > 0) {
        const updatedCluster = activeClusterNotes.filter((cn) => notes.some((n) => n.id === cn.id));
        if (updatedCluster.length !== activeClusterNotes.length) {
          if (updatedCluster.length === 0) {
            setSelectedNote(null);
            setActiveClusterNotes([]);
            setActiveClusterIndex(0);
            focusTarget.current = null;
          } else {
            setActiveClusterNotes(updatedCluster);
            const newIndex = Math.min(activeClusterIndex, updatedCluster.length - 1);
            setActiveClusterIndex(newIndex);
            setSelectedNote(updatedCluster[newIndex]);
          }
        }
      }
    }
  }, [notes, selectedNote, activeClusterNotes, activeClusterIndex]);

  const cardRef = useCallback((node: HTMLDivElement | null) => {
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }

    if (node) {
      setCardHeight(node.offsetHeight);
      const observer = new ResizeObserver((entries) => {
        if (entries[0]) {
          setCardHeight(node.offsetHeight);
        }
      });
      observer.observe(node);
      resizeObserverRef.current = observer;
    } else {
      setCardHeight(212);
    }
  }, []);

  // Sync selectedNote status changes back to parent component
  useEffect(() => {
    onNoteSelectChange?.(!!selectedNote);
  }, [selectedNote, onNoteSelectChange]);

  // Clean up resize observer on unmount
  useEffect(() => {
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, []);

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

      // 3. Always ease the actual state zoom towards targetZoom
      setZoom((currentZoom) => {
        const diffZoom = targetZoom.current - currentZoom;
        if (Math.abs(diffZoom) < 0.001) {
          return targetZoom.current;
        }
        const easing = isDragging.current ? 0.25 : 0.15;
        return currentZoom + diffZoom * easing;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Set up D3 projections
  const radius = (Math.min(containerSize.width, containerSize.height) / 2) * 0.9;
  const projection = geoOrthographic()
    .scale(radius * zoom)
    .translate([containerSize.width / 2, containerSize.height / 2])
    .rotate(rotation);

  const pathGenerator = geoPath().projection(projection);

  // Generate paths
  const spherePath = pathGenerator({ type: 'Sphere' }) || '';
  const graticulePath = pathGenerator(geoGraticule()()) || '';

  // Drag, wheel and gesture handlers
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {
      // Ignore setPointerCapture failures
    }

    if (activePointers.current.size === 1) {
      isDragging.current = true;
      pointerStart.current = { x: e.clientX, y: e.clientY };
      rotationStart.current = rotation;
      targetRotation.current = rotation; // Sync target to the current visual rotation state
      clickStart.current = { x: e.clientX, y: e.clientY, time: Date.now() };
      focusTarget.current = null;

      // Initialize tracking variables for flick momentum/inertia
      lastPointerPos.current = { x: e.clientX, y: e.clientY };
      lastMoveTime.current = Date.now();
      dragVelocity.current = [0, 0];
      inertiaVelocity.current = [0, 0];
    } else if (activePointers.current.size === 2) {
      // Transition from drag to pinch-to-zoom
      isDragging.current = false;
      const pointers = Array.from(activePointers.current.values());
      const dx = pointers[0].x - pointers[1].x;
      const dy = pointers[0].y - pointers[1].y;
      initialPinchDistance.current = Math.sqrt(dx * dx + dy * dy);
      initialZoom.current = targetZoom.current;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!activePointers.current.has(e.pointerId)) return;
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Handle pinch-to-zoom if 2 fingers are down
    if (activePointers.current.size === 2 && initialPinchDistance.current !== null) {
      const pointers = Array.from(activePointers.current.values());
      const dx = pointers[0].x - pointers[1].x;
      const dy = pointers[0].y - pointers[1].y;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);

      if (initialPinchDistance.current > 0) {
        const factor = currentDistance / initialPinchDistance.current;
        targetZoom.current = Math.max(0.8, Math.min(5.0, initialZoom.current * factor));
      }
      return;
    }

    if (!isDragging.current) return;
    
    const deltaX = e.clientX - pointerStart.current.x;
    const deltaY = e.clientY - pointerStart.current.y;
    
    // Adjust drag sensitivity based on zoom level (zoomed in = slower panning/rotation)
    const sensitivity = (360 / (Math.min(containerSize.width, containerSize.height) * 1.5)) / targetZoom.current;
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
    const wasDragging = isDragging.current;
    activePointers.current.delete(e.pointerId);
    
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {
      // Ignore releasePointerCapture failures
    }

    if (activePointers.current.size === 1) {
      // Re-initialize drag for the single remaining pointer to prevent jumping
      const remainingId = Array.from(activePointers.current.keys())[0];
      const remainingPointer = activePointers.current.get(remainingId)!;
      isDragging.current = true;
      pointerStart.current = { x: remainingPointer.x, y: remainingPointer.y };
      rotationStart.current = rotation;
      lastPointerPos.current = { x: remainingPointer.x, y: remainingPointer.y };
      lastMoveTime.current = Date.now();
      dragVelocity.current = [0, 0];
      initialPinchDistance.current = null;
    } else if (activePointers.current.size === 0) {
      initialPinchDistance.current = null;
      isDragging.current = false;

      if (wasDragging) {
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
    }
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    const zoomSensitivity = 0.05;
    const direction = e.deltaY < 0 ? 1 : -1;
    targetZoom.current = Math.max(0.8, Math.min(5.0, targetZoom.current + direction * zoomSensitivity * targetZoom.current));
  };

  const handleDoubleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    // Zoom in on double click
    targetZoom.current = Math.min(5.0, targetZoom.current * 1.5);
  };

  // Group notes into clusters based on distance to handle overlapping/jittered pins
  const clusters: {
    key: string;
    representative: Note;
    allNotes: Note[];
    count: number;
    latitude: number;
    longitude: number;
  }[] = [];
  const distanceThreshold = 1.5; // degrees (~150km) to group overlapping pins

  // Sort notes latest first
  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  sortedNotes.forEach((note) => {
    const match = clusters.find((c) => {
      const latDiff = Math.abs(c.latitude - note.latitude);
      const lngDiff = Math.abs(c.longitude - note.longitude);
      return latDiff < distanceThreshold && lngDiff < distanceThreshold;
    });

    if (match) {
      match.allNotes.push(note);
      match.count = match.allNotes.length;
    } else {
      clusters.push({
        key: `${note.latitude.toFixed(4)}_${note.longitude.toFixed(4)}`,
        representative: note,
        allNotes: [note],
        count: 1,
        latitude: note.latitude,
        longitude: note.longitude,
      });
    }
  });

  const clusterPins = clusters;

  const handleClusterClick = (clusterNotes: Note[]) => {
    setActiveClusterNotes(clusterNotes);
    setActiveClusterIndex(0);
    const firstNote = clusterNotes[0];
    setSelectedNote(firstNote);
    focusTarget.current = [firstNote.longitude, firstNote.latitude];
  };

  // Find selected note coordinates on the globe relative to container bounds
  let pinX: number | null = null;
  let pinY: number | null = null;

  if (selectedNote) {
    // Find the cluster that contains the selected note
    const matchingCluster = clusterPins.find((cp) => cp.allNotes.some((n) => n.id === selectedNote.id));
    const targetLng = matchingCluster?.longitude ?? selectedNote.longitude;
    const targetLat = matchingCluster?.latitude ?? selectedNote.latitude;

    const distance = geoDistance(
      [targetLng, targetLat],
      [-rotation[0], -rotation[1]]
    );
    const isVisible = distance < Math.PI / 2;
    if (isVisible) {
      const projected = projection([targetLng, targetLat]);
      if (projected) {
        pinX = projected[0];
        pinY = projected[1];
      }
    }
  }

  const isMapLoading = isLoading || !geoJson;
  const oceanOpacity = Math.max(0, Math.min(1, (2.0 - zoom) / 0.8));

  return (
    <div className="relative w-full h-full bg-transparent overflow-hidden">
      {/* Loading overlay */}
      {isMapLoading && (
        <div className={`absolute inset-0 z-[100] flex flex-col items-center justify-center gap-3 backdrop-blur-sm theme-transition ${
          isNight ? 'bg-[#0b0f19]/85 text-[#eae6db]' : 'bg-[#f5f2eb]/85 text-[#4a3e2e]'
        }`}>
          <div className={`w-10 h-10 border-4 border-t-transparent rounded-full animate-spin theme-transition ${
            isNight ? 'border-[#eae6db]' : 'border-[#c9a96e]'
          }`}></div>
          <span className="text-sm font-semibold animate-pulse font-mono">mapping world mood...</span>
        </div>
      )}

      {/* SVG Container */}
      <div ref={containerRef} className="w-full h-full flex items-center justify-center overflow-hidden">
        {geoJson && (
          <svg
            width={containerSize.width}
            height={containerSize.height}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
            onDoubleClick={handleDoubleClick}
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
              fill={isNight ? '#0d131a' : '#f5f2eb'}
              opacity={oceanOpacity}
              className="theme-transition"
              style={{ transition: 'fill 1s ease-in-out, opacity 0.3s ease-out' }}
            />

            {/* Graticule / Gridlines */}
            <path
              d={graticulePath}
              fill="none"
              stroke="#c9a96e"
              strokeWidth={0.5}
              opacity={(isNight ? 0.08 : 0.15) * oceanOpacity}
              className="theme-transition"
              style={{ transition: 'opacity 0.3s ease-out' }}
            />

            {/* Landmasses / Countries */}
            {geoJson.features?.map((feature: any, index: number) => {
              const path = pathGenerator(feature);
              if (!path) return null;
              return (
                <path
                  key={index}
                  d={path}
                  fill={isNight ? '#1e293b' : '#eae6db'}
                  stroke={isNight ? '#0d131a' : '#f5f2eb'}
                  strokeWidth={0.5}
                  className={`theme-transition transition-colors duration-1000 ${
                    isNight ? 'hover:fill-[#2d3a4f]' : 'hover:fill-[#e0d6c1]'
                  }`}
                  style={{ transition: 'fill 1s ease-in-out, stroke 1s ease-in-out' }}
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

              // Fade out labels at high zoom levels to reduce clutter
              const zoomFade = Math.max(0, Math.min(1, (2.5 - zoom) / 1.0));

              return (
                <text
                  key={label.name}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  pointerEvents="none"
                  style={{
                    fill: isOcean 
                      ? (isNight ? '#3b4b60' : '#c3af91') 
                      : (isNight ? '#a1a1aa' : '#7d6c56'),
                    fontSize: isOcean ? '9px' : '10px',
                    fontFamily: isOcean ? 'Georgia, serif' : 'var(--font-mono), monospace',
                    fontStyle: isOcean ? 'italic' : 'normal',
                    fontWeight: isOcean ? 'normal' : '600',
                    letterSpacing: isOcean ? '1.5px' : '2px',
                    textTransform: 'uppercase',
                    opacity: (isOcean ? 0.45 : 0.6) * edgeFade * zoomFade,
                    userSelect: 'none',
                    transition: 'fill 1s ease-in-out, opacity 0.2s',
                  }}
                >
                  {label.name}
                </text>
              );
            })}

            {/* Note Pins */}
            {clusterPins.map((pin) => {
              const projected = projection([pin.longitude, pin.latitude]);
              if (!projected) return null;

              // Check if marker is on the visible front-hemisphere
              const distance = geoDistance(
                [pin.longitude, pin.latitude],
                [-rotation[0], -rotation[1]]
              );
              const isVisible = distance < Math.PI / 2;
              if (!isVisible) return null;

              const [x, y] = projected;
              // Check if this specific pin's coordinates are currently selected
              const isSelected = selectedNote && pin.allNotes.some((n) => n.id === selectedNote.id);
              
              const note = pin.representative;
              const style = MOOD_STYLES[note.mood.toLowerCase()] || MOOD_STYLES.happy;
              const isCluster = pin.count > 1;

              return (
                <g
                  key={pin.key}
                  transform={`translate(${x}, ${y})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClusterClick(pin.allNotes);
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
                  {isCluster ? (
                    // CLUSTER PIN RENDER (Multiple Notes at one location)
                    <>
                      {/* Transparent hit target to make clicking much easier */}
                      <circle
                        r={24}
                        fill="transparent"
                        className="cursor-pointer"
                      />
                      {/* Outer pulse ring */}
                      <circle
                        r={isSelected ? 18 : 14}
                        fill="#c9a96e"
                        opacity={isSelected ? 0.35 : 0.2}
                        className={isSelected ? "animate-pulse" : "group-hover:scale-110 transition-transform duration-200"}
                      />
                      {isSelected && (
                        <circle
                          r={28}
                          fill="#c9a96e"
                          opacity={0.12}
                          className="animate-ping"
                        />
                      )}
                      {/* Core center circle */}
                      <circle
                        r={isSelected ? 10 : 8}
                        fill="#c9a96e"
                        stroke="#fbf9f4"
                        strokeWidth={1.5}
                        className="shadow-md"
                      />
                      {/* Count inside cluster */}
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        style={{
                          fontSize: '8px',
                          fontWeight: '800',
                          fill: '#fbf9f4',
                          fontFamily: 'var(--font-mono), monospace',
                          pointerEvents: 'none',
                          userSelect: 'none',
                        }}
                      >
                        {pin.count}
                      </text>
                    </>
                  ) : (
                    // SINGLE PIN RENDER (Only one note at this location)
                    <>
                      {/* Transparent hit target to make clicking much easier */}
                      <circle
                        r={20}
                        fill="transparent"
                        className="cursor-pointer"
                      />
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
                    </>
                  )}
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
            d={`M ${pinX} ${pinY} C ${(pinX + (containerSize.width - 408)) / 2} ${pinY}, ${(pinX + (containerSize.width - 408)) / 2} ${24 + cardHeight / 2}, ${containerSize.width - 408} ${24 + cardHeight / 2}`}
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
          <circle cx={containerSize.width - 408} cy={24 + cardHeight / 2} r={3} fill="#c9a96e" />
        </svg>
      )}

      {/* Selected Note Details Card Overlay */}
      {selectedNote && (
        <GlobeDetailsCard 
          note={selectedNote} 
          cardRef={cardRef}
          totalNotes={activeClusterNotes.length}
          activeIndex={activeClusterIndex}
          onPrevNote={() => {
            const nextIndex = activeClusterIndex - 1;
            if (nextIndex >= 0) {
              setActiveClusterIndex(nextIndex);
              setSelectedNote(activeClusterNotes[nextIndex]);
            }
          }}
          onNextNote={() => {
            const nextIndex = activeClusterIndex + 1;
            if (nextIndex < activeClusterNotes.length) {
              setActiveClusterIndex(nextIndex);
              setSelectedNote(activeClusterNotes[nextIndex]);
            }
          }}
          onClose={() => {
            setSelectedNote(null);
            setActiveClusterNotes([]);
            setActiveClusterIndex(0);
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
          isNight={isNight}
        />
      )}

      {/* Zoom Controls Overlay */}
      <div className={`absolute bottom-24 left-6 md:bottom-10 md:left-10 z-[1000] flex flex-col gap-2 rounded-2xl border p-1.5 backdrop-blur-xl shadow-2xl theme-transition select-none ${
        isNight
          ? 'border-white/10 bg-[#16222f]/35 text-[#eae6db]'
          : 'border-[#eae6db] bg-white/20 text-[#4a3e2e]'
      }`}>
        <button
          onClick={() => {
            targetZoom.current = Math.min(5.0, targetZoom.current + 0.5);
          }}
          className={`p-2 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer ${
            isNight
              ? 'hover:bg-white/10 text-[#eae6db] active:bg-white/20'
              : 'hover:bg-[#4a3e2e]/5 text-[#4a3e2e] active:bg-[#4a3e2e]/10'
          }`}
          title="Zoom In"
        >
          <ZoomIn className="h-4.5 w-4.5" />
        </button>
        <button
          onClick={() => {
            targetZoom.current = Math.max(0.8, targetZoom.current - 0.5);
          }}
          className={`p-2 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer ${
            isNight
              ? 'hover:bg-white/10 text-[#eae6db] active:bg-white/20'
              : 'hover:bg-[#4a3e2e]/5 text-[#4a3e2e] active:bg-[#4a3e2e]/10'
          }`}
          title="Zoom Out"
        >
          <ZoomOut className="h-4.5 w-4.5" />
        </button>
        <div className={`h-px mx-1 my-0.5 ${isNight ? 'bg-white/10' : 'bg-[#4a3e2e]/10'}`} />
        <button
          onClick={() => {
            targetZoom.current = 1.0;
            targetRotation.current = [0, -15, 0];
            focusTarget.current = null;
          }}
          className={`p-2 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer ${
            isNight
              ? 'hover:bg-white/10 text-[#eae6db] active:bg-white/20'
              : 'hover:bg-[#4a3e2e]/5 text-[#4a3e2e] active:bg-[#4a3e2e]/10'
          }`}
          title="Reset View"
        >
          <RotateCcw className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Decorative Vignette Overlay */}
      <div className={`absolute inset-0 pointer-events-none border-[12px] z-[99] theme-transition ${
        isNight 
          ? 'border-[#0b0f19]/25 shadow-[inset_0_0_120px_rgba(0,0,0,0.6)]' 
          : 'border-[#f5f2eb]/10 shadow-[inset_0_0_120px_rgba(74,62,46,0.15)]'
      }`} />
    </div>
  );
};

export default WorldMap;

