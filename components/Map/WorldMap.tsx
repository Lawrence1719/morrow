"use client";

import React, { useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { useNotesStore } from '@/stores/notesStore';
import NotePin from './NotePin';

// Leaflet CSS is required for the map to render correctly
import 'leaflet/dist/leaflet.css';

// Styling to make sure the leaflet control buttons fit nicely
const mapContainerStyle = {
  height: '100%',
  width: '100%',
};

// Curated Light Positron map tiles for minimal paper-like aesthetic
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const WorldMap: React.FC = () => {
  const { notes, fetchNotes, subscribeToRealtime, isLoading } = useNotesStore();

  useEffect(() => {
    // Initial fetch
    fetchNotes();

    // Subscribe to realtime database changes (inserts, hides, deletes)
    const unsubscribe = subscribeToRealtime();

    return () => {
      unsubscribe();
    };
  }, [fetchNotes, subscribeToRealtime]);

  return (
    <div className="relative w-full h-full bg-[#cbd2d7] overflow-hidden">
      {/* Loading overlay */}
      {isLoading && notes.length === 0 && (
        <div className="absolute inset-0 bg-[#f5f2eb]/85 z-[1000] flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
          <div className="w-10 h-10 border-4 border-[#c9a96e] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-[#4a3e2e]/80 animate-pulse font-mono">mapping world mood...</span>
        </div>
      )}

      {/* React Leaflet Map Container */}
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={1}
        maxZoom={10}
        style={mapContainerStyle}
        zoomControl={false}
        worldCopyJump={true}
        maxBounds={[[-85, -300], [85, 300]]}
        maxBoundsViscosity={1.0}
      >
        <TileLayer
          url={TILE_URL}
          attribution={TILE_ATTRIBUTION}
        />
        
        {/* Render Note Pins across repeated copies of the world (left, center, right) */}
        {notes.flatMap((note) => [
          { ...note, longitude: note.longitude - 360, id: `${note.id}-left` },
          { ...note, id: `${note.id}-center` },
          { ...note, longitude: note.longitude + 360, id: `${note.id}-right` }
        ]).map((note) => (
          <NotePin key={note.id} note={note} />
        ))}
      </MapContainer>

      {/* Decorative Vignette Overlay (faded brown paper edges) */}
      <div className="absolute inset-0 pointer-events-none border-[12px] border-[#f5f2eb]/10 z-[999] shadow-[inset_0_0_120px_rgba(74,62,46,0.15)]" />
    </div>
  );
};

export default WorldMap;
