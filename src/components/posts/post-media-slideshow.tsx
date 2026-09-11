"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function PostMediaSlideshow({ media }: { media: { url: string }[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (media.length < 2) return;
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % media.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [media.length]);

  if (media.length === 0) return null;

  if (media.length === 1) {
    return (
      <div className="mb-3 max-w-sm">
        <div className="aspect-square overflow-hidden rounded-xl bg-white/5">
          <Image src={media[0].url} alt="" width={400} height={400} className="h-full w-full object-cover" />
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3 max-w-sm">
      <div className="group relative aspect-square overflow-hidden rounded-xl bg-white/5">
        {media.map((m, i) => (
          <Image
            key={m.url}
            src={m.url}
            alt=""
            width={400}
            height={400}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out",
              i === index ? "opacity-100" : "opacity-0"
            )}
          />
        ))}
        <button
          onClick={() => setIndex((i) => (i - 1 + media.length) % media.length)}
          className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100"
          aria-label="Previous image"
        >
          ‹
        </button>
        <button
          onClick={() => setIndex((i) => (i + 1) % media.length)}
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100"
          aria-label="Next image"
        >
          ›
        </button>
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
          {media.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={cn("h-1.5 rounded-full transition-all", i === index ? "w-4 bg-white" : "w-1.5 bg-white/40")}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
