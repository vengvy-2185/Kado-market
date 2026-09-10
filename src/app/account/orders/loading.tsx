import { ListSkeleton } from "@/components/ui/loading";

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 h-7 w-32 animate-pulse rounded-lg bg-white/5" />
      <ListSkeleton count={4} />
    </div>
  );
}
