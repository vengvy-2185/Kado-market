"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "kado-market-splash-shown";

const KADO_LETTERS = [
  { src: "/splash/k1.png", rot: -20 },
  { src: "/splash/a1.png", rot: 15 },
  { src: "/splash/d1.png", rot: -15 },
  { src: "/splash/o1.png", rot: 20 },
];
const MARKET_LETTERS = [
  { src: "/splash/m2.png", rot: 20 },
  { src: "/splash/a2.png", rot: -15 },
  { src: "/splash/r2.png", rot: 15 },
  { src: "/splash/k2.png", rot: -20 },
  { src: "/splash/e2.png", rot: 15 },
  { src: "/splash/t2.png", rot: -15 },
];

export function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // sessionStorage unavailable (private mode etc) -- just skip the splash
      return;
    }
    setVisible(true);
    const fadeTimer = setTimeout(() => setFadingOut(true), 3400);
    const removeTimer = setTimeout(() => setVisible(false), 3900);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#0a3d91] via-[#1560c4] to-[#3b8ce0] transition-opacity duration-500"
      style={{ opacity: fadingOut ? 0 : 1, visibility: fadingOut ? "hidden" : "visible" }}
    >
      {/* light burst */}
      <span
        className="absolute h-40 w-40 rounded-full bg-white"
        style={{ animation: "splash-burst 1.1s ease-out forwards", animationDelay: "0.1s", opacity: 0 }}
      />

      {/* floating decorative icons */}
      <img
        src="/splash/bag.png"
        alt=""
        className="splash-pop splash-float absolute left-[12%] top-[22%] h-12 w-12 sm:h-16 sm:w-16"
        style={{ animationDelay: "1.6s", ["--splash-rot" as string]: "-25deg" }}
      />
      <img
        src="/splash/gift.png"
        alt=""
        className="splash-pop splash-float absolute right-[14%] top-[26%] h-12 w-12 sm:h-16 sm:w-16"
        style={{ animationDelay: "1.75s", ["--splash-rot" as string]: "25deg", animationDuration: "2.8s" }}
      />
      <img
        src="/splash/heart.png"
        alt=""
        className="splash-pop splash-float absolute bottom-[24%] left-[16%] h-9 w-9 sm:h-12 sm:w-12"
        style={{ animationDelay: "1.9s", ["--splash-rot" as string]: "20deg" }}
      />

      {/* cart icon */}
      <img
        src="/splash/cart.png"
        alt=""
        className="splash-pop relative z-10 mb-3 h-16 w-16 sm:h-20 sm:w-20"
        style={{ animationDelay: "0.15s" }}
      />

      {/* KADO */}
      <div className="relative z-10 flex">
        {KADO_LETTERS.map((l, i) => (
          <img
            key={l.src}
            src={l.src}
            alt=""
            className="splash-pop h-10 w-10 sm:h-14 sm:w-14"
            style={{ animationDelay: `${0.55 + i * 0.1}s`, ["--splash-rot" as string]: `${l.rot}deg` }}
          />
        ))}
      </div>

      {/* MARKET */}
      <div className="relative z-10 mt-1 flex">
        {MARKET_LETTERS.map((l, i) => (
          <img
            key={l.src}
            src={l.src}
            alt=""
            className="splash-pop h-7 w-7 sm:h-9 sm:w-9"
            style={{ animationDelay: `${1.0 + i * 0.08}s`, ["--splash-rot" as string]: `${l.rot}deg` }}
          />
        ))}
      </div>

      {/* tagline */}
      <img
        src="/splash/tagline.png"
        alt="Shop Smarter, Live Better"
        className="splash-pop relative z-10 mt-4 h-8 w-auto sm:h-10"
        style={{ animationDelay: "1.7s" }}
      />
    </div>
  );
}
