"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type Story = {
  id: string;
  media_type: "image" | "video" | "text";
  media_url: string | null;
  caption: string | null;
  text_content: string | null;
  product: { name: string; slug: string } | null;
};

export type StoryGroup = {
  storeId: string;
  storeName: string;
  storeSlug: string;
  logoUrl: string | null;
  verified: boolean;
  stories: Story[];
};

const STORY_DURATION_MS = 5000;

export function StoryBar({ groups }: { groups: StoryGroup[] }) {
  const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const activeGroup = activeGroupIndex !== null ? groups[activeGroupIndex] : null;
  const activeStory = activeGroup?.stories[activeStoryIndex];

  useEffect(() => {
    if (!activeGroup) return;
    setProgress(0);
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / STORY_DURATION_MS) * 100);
      setProgress(pct);
      if (pct >= 100) {
        goNext();
      }
    }, 50);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroupIndex, activeStoryIndex]);

  function open(groupIndex: number) {
    setActiveGroupIndex(groupIndex);
    setActiveStoryIndex(0);
  }

  function close() {
    setActiveGroupIndex(null);
    setActiveStoryIndex(0);
  }

  function goNext() {
    if (activeGroupIndex === null) return;
    const group = groups[activeGroupIndex];
    if (activeStoryIndex < group.stories.length - 1) {
      setActiveStoryIndex((i) => i + 1);
    } else if (activeGroupIndex < groups.length - 1) {
      setActiveGroupIndex((i) => (i as number) + 1);
      setActiveStoryIndex(0);
    } else {
      close();
    }
  }

  function goPrev() {
    if (activeGroupIndex === null) return;
    if (activeStoryIndex > 0) {
      setActiveStoryIndex((i) => i - 1);
    } else if (activeGroupIndex > 0) {
      const prevGroup = groups[activeGroupIndex - 1];
      setActiveGroupIndex((i) => (i as number) - 1);
      setActiveStoryIndex(prevGroup.stories.length - 1);
    }
  }

  if (groups.length === 0) return null;

  return (
    <>
      <div className="no-scrollbar mb-6 flex gap-4 overflow-x-auto py-1">
        {groups.map((g, i) => (
          <button key={g.storeId} onClick={() => open(i)} className="flex flex-shrink-0 flex-col items-center gap-1">
            <div className="relative h-16 w-16 rounded-full bg-brand-gradient p-[2px]">
              <div className="relative h-full w-full overflow-hidden rounded-full border-2 border-background bg-white/5">
                {g.logoUrl ? (
                  <Image src={g.logoUrl} alt="" fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-bold">
                    {g.storeName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <span className="max-w-[64px] truncate text-[11px] text-white/60">{g.storeName}</span>
          </button>
        ))}
      </div>

      {activeGroup && activeStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="relative flex h-full w-full max-w-md flex-col">
            {/* progress bars */}
            <div className="flex gap-1 p-3">
              {activeGroup.stories.map((_, i) => (
                <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full bg-white transition-[width] duration-75"
                    style={{ width: i < activeStoryIndex ? "100%" : i === activeStoryIndex ? `${progress}%` : "0%" }}
                  />
                </div>
              ))}
            </div>

            {/* header */}
            <div className="flex items-center justify-between px-3 pb-2">
              <div className="flex items-center gap-2">
                <div className="relative h-7 w-7 overflow-hidden rounded-full bg-white/10">
                  {activeGroup.logoUrl && <Image src={activeGroup.logoUrl} alt="" fill className="object-cover" />}
                </div>
                <span className="flex items-center gap-1 text-sm font-medium text-white">
                  {activeGroup.storeName}
                  {activeGroup.verified && <ShieldCheck className="h-3.5 w-3.5 text-accent" />}
                </span>
              </div>
              <button onClick={close} className="rounded-full p-1.5 text-white/70 hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* content */}
            <div className="relative flex-1 overflow-hidden bg-black">
              {activeStory.media_type === "image" && activeStory.media_url && (
                <Image src={activeStory.media_url} alt="" fill className="object-contain" />
              )}
              {activeStory.media_type === "video" && activeStory.media_url && (
                <video src={activeStory.media_url} className="h-full w-full object-contain" autoPlay muted playsInline />
              )}
              {activeStory.media_type === "text" && (
                <div className="flex h-full items-center justify-center bg-brand-gradient p-8">
                  <p className="text-center text-xl font-semibold text-white">{activeStory.text_content}</p>
                </div>
              )}

              {/* tap zones */}
              <button onClick={goPrev} className="absolute inset-y-0 left-0 w-1/3" aria-label="Previous story" />
              <button onClick={goNext} className="absolute inset-y-0 right-0 w-1/3" aria-label="Next story" />
            </div>

            {(activeStory.caption || activeStory.product) && (
              <div className="space-y-2 p-3">
                {activeStory.caption && <p className="text-sm text-white">{activeStory.caption}</p>}
                {activeStory.product && (
                  <Link
                    href={`/product/${activeStory.product.slug}`}
                    className="inline-block rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black"
                  >
                    View Product
                  </Link>
                )}
              </div>
            )}

            {/* desktop nav arrows */}
            <button onClick={goPrev} className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/40 p-2 text-white md:block">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={goNext} className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/40 p-2 text-white md:block">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
