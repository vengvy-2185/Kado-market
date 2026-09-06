"use client";

import { useTransition } from "react";
import { Select } from "@/components/ui/select";
import { setStoreStatus } from "@/lib/actions/admin";
import type { StoreStatus } from "@/lib/types/database.types";

const STATUSES: StoreStatus[] = ["draft", "pending_review", "active", "suspended", "rejected"];

export function StoreStatusSelect({ storeId, currentStatus }: { storeId: string; currentStatus: StoreStatus }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      defaultValue={currentStatus}
      disabled={isPending}
      onChange={(e) => startTransition(() => setStoreStatus(storeId, e.target.value as StoreStatus))}
      className="w-auto py-1.5 text-xs"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s.replace("_", " ")}
        </option>
      ))}
    </Select>
  );
}
