"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { subscribeToAiPlan } from "@/lib/actions/ai-subscription";

export function SubscribeButton({ planId }: { planId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      onClick={() => startTransition(() => subscribeToAiPlan(planId))}
      loading={isPending}
      className="w-full"
    >
      Subscribe (Demo payment)
    </Button>
  );
}
