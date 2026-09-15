export function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const px = size === "sm" ? "h-5 w-5" : size === "lg" ? "h-10 w-10" : "h-7 w-7";
  return (
    <div
      className={`${px} animate-spin rounded-full border-2 border-white/15 border-t-primary`}
      role="status"
      aria-label="Loading"
    />
  );
}

const KADO_LETTERS = [{ src: "/splash/k1.png" }, { src: "/splash/a1.png" }, { src: "/splash/d1.png" }, { src: "/splash/o1.png" }];
const MARKET_LETTERS = [
  { src: "/splash/m2.png" },
  { src: "/splash/a2.png" },
  { src: "/splash/r2.png" },
  { src: "/splash/k2.png" },
  { src: "/splash/e2.png" },
  { src: "/splash/t2.png" },
];

export function FullPageSpinner() {
  return (
    <div className="relative flex min-h-[60vh] flex-col items-center justify-center gap-3 overflow-hidden py-10">
      <img
        src="/splash/heart.png"
        alt=""
        className="splash-float splash-glow absolute left-[20%] top-[22%] h-10 w-10 opacity-90 sm:h-14 sm:w-14"
        style={{ animationDuration: "2.6s" }}
      />
      <img
        src="/splash/gift.png"
        alt=""
        className="splash-float splash-glow absolute right-[18%] top-[26%] h-11 w-11 opacity-90 sm:h-16 sm:w-16"
        style={{ animationDuration: "3s", animationDelay: "0.3s" }}
      />

      <img src="/splash/mascot2.png" alt="" className="splash-float relative z-10 h-20 w-20 object-contain sm:h-28 sm:w-28" style={{ animationDuration: "2.4s" }} />

      <div className="relative z-10 flex gap-1 sm:gap-1.5" role="status" aria-label="Loading">
        {KADO_LETTERS.map((l, i) => (
          <img
            key={l.src}
            src={l.src}
            alt=""
            className="h-8 w-8 object-contain sm:h-11 sm:w-11"
            style={{ animation: "loading-bounce 1s ease-in-out infinite", animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </div>
      <div className="relative z-10 flex gap-0.5 sm:gap-1">
        {MARKET_LETTERS.map((l, i) => (
          <img
            key={l.src}
            src={l.src}
            alt=""
            className="h-5 w-5 object-contain sm:h-7 sm:w-7"
            style={{ animation: "loading-bounce 1s ease-in-out infinite", animationDelay: `${0.5 + i * 0.1}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/5 ${className}`} />;
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} className="aspect-square" />
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} className="h-16" />
      ))}
    </div>
  );
}
