import Image from "next/image";

export function Logo({ size = 32, showText = false }: { size?: number; showText?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Image src="/logo.png" alt="KADO MARKET" width={size} height={size} className="rounded-lg" priority />
      {showText && (
        <span className="bg-brand-gradient bg-clip-text font-extrabold text-transparent" style={{ fontSize: size * 0.5 }}>
          KADO MARKET
        </span>
      )}
    </span>
  );
}
