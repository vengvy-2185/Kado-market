import { CardSkeleton } from "@/components/ui/loading";

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <div className="grid gap-8 md:grid-cols-2">
        <CardSkeleton className="aspect-square" />
        <div className="space-y-4">
          <div className="h-7 w-3/4 animate-pulse rounded-lg bg-white/5" />
          <div className="h-5 w-1/3 animate-pulse rounded-lg bg-white/5" />
          <CardSkeleton className="h-32" />
        </div>
      </div>
    </div>
  );
}
