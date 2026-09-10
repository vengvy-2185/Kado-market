import { CardSkeleton, GridSkeleton } from "@/components/ui/loading";

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 md:px-6">
      <CardSkeleton className="-mx-4 h-40 w-[calc(100%+2rem)] md:-mx-6 md:h-56 md:w-[calc(100%+3rem)]" />
      <div className="relative -mt-10 mb-6 flex items-end gap-4">
        <div className="h-20 w-20 animate-pulse rounded-2xl bg-white/10" />
        <div className="mb-1 h-6 w-40 animate-pulse rounded-lg bg-white/10" />
      </div>
      <GridSkeleton count={6} />
    </div>
  );
}
