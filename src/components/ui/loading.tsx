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

const LOGO_LETTERS = [
  { src: "/splash/k1.png" },
  { src: "/splash/a1.png" },
  { src: "/splash/d1.png" },
  { src: "/splash/o1.png" },
];

export function FullPageSpinner() {
  return (
    <div className="relative flex min-h-[50vh] flex-col items-center justify-center gap-2 overflow-hidden">
      <img
        src="/splash/heart.png"
        alt=""
        className="splash-float splash-glow absolute left-[30%] top-[30%] h-6 w-6 opacity-80"
        style={{ animationDuration: "2.6s" }}
      />
      <img
        src="/splash/gift.png"
        alt=""
        className="splash-float splash-glow absolute right-[28%] top-[35%] h-7 w-7 opacity-80"
        style={{ animationDuration: "3s", animationDelay: "0.3s" }}
      />
      <div className="relative z-10 flex gap-0.5" role="status" aria-label="Loading">
        {LOGO_LETTERS.map((l, i) => (
          <img
            key={l.src}
            src={l.src}
            alt=""
            className="h-7 w-7 object-contain"
            style={{ animation: "loading-bounce 1s ease-in-out infinite", animationDelay: `${i * 0.12}s` }}
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
