"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, Store, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    icon: ShoppingBag,
    title: "Shop More, Live Better",
    subtitle: "Discover products from verified sellers across Cambodia",
    cta: "Explore Now",
    href: "#categories",
    gradient: "from-primary via-accent to-highlight",
  },
  {
    icon: Store,
    title: "Start Your Own Shop",
    subtitle: "Join KADO MARKET and reach customers across the country",
    cta: "Register Now",
    href: "/dashboard/store/setup",
    gradient: "from-accent via-highlight to-pink-500",
  },
  {
    icon: Sparkles,
    title: "New Arrivals Daily",
    subtitle: "Fresh listings from our growing seller community",
    cta: "Browse Latest",
    href: "/?sort=",
    gradient: "from-highlight via-primary to-accent",
  },
];

export function HeroBannerCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 5000);
    return () => clearInterval(interval);
  }, []);

  function prev() {
    setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length);
  }
  function next() {
    setIndex((i) => (i + 1) % SLIDES.length);
  }

  const slide = SLIDES[index];
  const Icon = slide.icon;

  return (
    <div className={cn("group relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br shadow-glow transition-colors duration-700", slide.gradient)}>
      <div className="absolute -right-10 -top-10 h-48 w-48 animate-float rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-14 left-1/4 h-40 w-40 rounded-full bg-white/10 blur-3xl" style={{ animationDelay: "1.5s" }} />
      <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] [background-size:24px_24px]" />

      <div key={index} className="relative flex min-h-[190px] animate-fade-in flex-col justify-center px-6 py-8 md:min-h-[210px] md:px-10 md:py-12">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
          <Icon className="h-6 w-6 text-white" />
        </span>
        <h2 className="mb-1.5 text-xl font-extrabold text-white drop-shadow-sm md:text-2xl">{slide.title}</h2>
        <p className="mb-4 max-w-md text-sm text-white/85">{slide.subtitle}</p>
        <Link
          href={slide.href}
          className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-primary shadow-lg transition-transform hover:scale-105"
        >
          {slide.cta} →
        </Link>
      </div>

      <button
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/20 p-1.5 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/20 p-1.5 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
        aria-label="Next slide"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

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
