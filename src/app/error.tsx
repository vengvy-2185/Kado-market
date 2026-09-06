"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { reportClientError } from "@/lib/report-error";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportClientError(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <AlertTriangle className="h-10 w-10 text-danger" />
      <h1 className="text-xl font-bold">Something went wrong</h1>
      <p className="max-w-sm text-sm text-white/50">
        We've logged this error. You can try again, or head back to the home page.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={reset}>
          Try again
        </Button>
        <Link href="/">
          <Button>Go home</Button>
        </Link>
      </div>
    </main>
  );
}
