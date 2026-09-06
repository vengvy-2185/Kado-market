"use client";

import dynamic from "next/dynamic";

const LeafletMapInner = dynamic(() => import("./leaflet-map-inner"), {
  ssr: false,
  loading: () => <div className="flex h-full w-full items-center justify-center rounded-2xl bg-white/5 text-sm text-white/30">Loading map...</div>,
});

export function LiveMap(props: {
  latitude: number;
  longitude: number;
  zoom?: number;
  interactive?: boolean;
  onPick?: (lat: number, lng: number) => void;
  height?: string | number;
}) {
  return <LeafletMapInner {...props} />;
}
