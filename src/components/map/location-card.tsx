"use client";

import { useState, useEffect } from "react";
import { MapPin, X, ExternalLink } from "lucide-react";
import { LiveMap } from "./live-map";

export function LocationCard({ latitude, longitude, label }: { latitude: number; longitude: number; label?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
      >
        <MapPin className="h-4 w-4 flex-shrink-0 text-accent" />
        {label ?? "View location"}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={() => setOpen(false)}>
          <div
            className="relative flex h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <MapPin className="h-4 w-4 text-accent" /> {label ?? "Location"}
              </p>
              <div className="flex items-center gap-2">
                <a
                  href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/60 hover:bg-white/10"
                >
                  Open full map <ExternalLink className="h-3 w-3" />
                </a>
                <button onClick={() => setOpen(false)} className="rounded-full p-1.5 text-white/50 hover:bg-white/10 hover:text-white" aria-label="Close">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex-1">
              <LiveMap latitude={latitude} longitude={longitude} zoom={16} interactive />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
