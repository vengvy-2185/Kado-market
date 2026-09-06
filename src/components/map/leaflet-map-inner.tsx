"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Leaflet's default marker icon paths break under bundlers (webpack/Next) —
// point them at the CDN copies that ship with the same Leaflet version
// instead of relying on broken relative asset paths.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function ClickHandler({ onPick }: { onPick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LeafletMapInner({
  latitude,
  longitude,
  zoom = 15,
  interactive = true,
  onPick,
  height = "100%",
}: {
  latitude: number;
  longitude: number;
  zoom?: number;
  interactive?: boolean;
  onPick?: (lat: number, lng: number) => void;
  height?: string | number;
}) {
  useEffect(() => {
    // Leaflet sometimes renders with a wrong size if its container wasn't
    // visible at mount (e.g. inside a modal) — nudge it once mounted.
    const id = setTimeout(() => window.dispatchEvent(new Event("resize")), 200);
    return () => clearTimeout(id);
  }, []);

  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={zoom}
      scrollWheelZoom={interactive}
      dragging={interactive}
      doubleClickZoom={interactive}
      touchZoom={interactive}
      style={{ height, width: "100%", borderRadius: "1rem" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[latitude, longitude]} />
      {onPick && <ClickHandler onPick={onPick} />}
    </MapContainer>
  );
}
