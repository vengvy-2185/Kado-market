import { CardSkeleton, ListSkeleton } from "@/components/ui/loading";

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-10">
      <div className="mb-6 h-7 w-40 animate-pulse rounded-lg bg-white/5" />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} className="h-20" />
        ))}
      </div>
      <ListSkeleton count={4} />
    </div>
  );
}
