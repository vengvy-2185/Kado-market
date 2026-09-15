import { FullPageSpinner } from "@/components/ui/loading";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <FullPageSpinner />
    </div>
  );
}
