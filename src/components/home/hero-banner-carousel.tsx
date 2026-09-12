"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, Store, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    icon: ShoppingBag,
    title: "Shop More, Live Better",
    subtitle: "Discover products from verified sellers across Cambodia",
    cta: "Explore Now",
    href: "#categories",
  },
  {
    icon: Store,
    title: "Start Your Own Shop",
    subtitle: "Join KADO MARKET and reach customers across the country",
    cta: "Register Now",
    href: "/dashboard/store/setup",
  },
  {
    icon: Sparkles,
    title: "New Arrivals Daily",
    subtitle: "Fresh listings from our growing seller community",
    cta: "Browse Latest",
    href: "/?sort=",
  },
];

export function HeroBannerCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 5000);
    return () => clearInterval(interval);
  }, []);

  const slide = SLIDES[index];
  const Icon = slide.icon;

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl bg-brand-gradient">
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-10 left-1/3 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div key={index} className="relative flex min-h-[190px] animate-fade-in flex-col justify-center px-6 py-8 md:min-h-[210px] md:px-10 md:py-12">
        <Icon className="mb-3 h-8 w-8 text-white/90" />
        <h2 className="mb-1.5 text-xl font-extrabold text-white md:text-2xl">{slide.title}</h2>
        <p className="mb-4 max-w-md text-sm text-white/80">{slide.subtitle}</p>
        <Link href={slide.href} className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-primary">
          {slide.cta} →
        </Link>
      </div>
      <div className="relative flex justify-center gap-1.5 pb-4">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={cn("h-1.5 rounded-full transition-all", i === index ? "w-5 bg-white" : "w-1.5 bg-white/40")}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
