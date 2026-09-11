import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <Image src="/logo.png" alt="KADO MARKET" width={120} height={120} className="animate-scale-in rounded-2xl" priority />
      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
    </div>
  );
}
