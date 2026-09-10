import { CardSkeleton } from "@/components/ui/loading";

export default function Loading() {
  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6 h-7 w-32 animate-pulse rounded-lg bg-white/5" />
      <CardSkeleton className="mb-4 h-40" />
      <CardSkeleton className="h-24" />
    </div>
  );
}
