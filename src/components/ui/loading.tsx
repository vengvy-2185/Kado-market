import Image from "next/image";

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

export function FullPageSpinner() {
  return (
    <div className="relative flex min-h-[50vh] flex-col items-center justify-center gap-3 overflow-hidden">
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
      <Image src="/logo.png" alt="" width={48} height={48} className="splash-float relative z-10 rounded-xl" style={{ animationDuration: "2s" }} priority />
      <Spinner size="sm" />
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
