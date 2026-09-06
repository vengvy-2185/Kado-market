"use client";

import { useState } from "react";
import { MapPin, Crosshair } from "lucide-react";
import { LiveMap } from "./live-map";

const DEFAULT_CENTER = { lat: 11.5564, lng: 104.9282 }; // Phnom Penh — sensible default for KADO MARKET

export function LocationPicker({
  latitude,
  longitude,
  onChange,
}: {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const center = latitude !== null && longitude !== null ? { lat: latitude, lng: longitude } : DEFAULT_CENTER;

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Your browser doesn't support location.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => {
        setError("Couldn't get your location — check permissions, or click the map instead.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs text-white/50">
          <MapPin className="h-3.5 w-3.5" /> Click the map to drop a pin, or:
        </p>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/70 hover:bg-white/10 disabled:opacity-50"
        >
          <Crosshair className="h-3 w-3" />
          {locating ? "Locating..." : "Use my location"}
        </button>
      </div>
      <div className="h-56 overflow-hidden rounded-2xl border border-white/10">
        <LiveMap latitude={center.lat} longitude={center.lng} zoom={latitude !== null ? 15 : 12} onPick={onChange} />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      {latitude !== null && longitude !== null && (
        <p className="text-xs text-white/30">
          Pinned: {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </p>
      )}
    </div>
  );
}
