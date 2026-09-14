"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, alt }: { images: { url: string }[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const current = images[index];

  function go(delta: number) {
    setIndex((i) => (i + delta + images.length) % images.length);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => current && setOpen(true)}
        className="group relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-white/5"
      >
        {current ? (
          <>
            <Image src={current.url} alt={alt} fill className="object-contain p-4" priority />
            <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
              <ZoomIn className="h-3 w-3" /> View full image
            </span>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-white/20">No image</div>
        )}
      </button>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.url}
              onClick={() => setIndex(i)}
              className={cn(
                "h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 bg-white/5",
                i === index ? "border-primary" : "border-transparent"
              )}
            >
              <Image src={img.url} alt="" width={64} height={64} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {open && current && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setOpen(false)}>
          <button onClick={() => setOpen(false)} className="absolute right-4 top-4 rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Close">
            <X className="h-6 w-6" />
          </button>
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.url}
            alt={alt}
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
