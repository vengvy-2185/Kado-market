"use client";

import { useTransition } from "react";
import { Select } from "@/components/ui/select";
import { setUserStatus } from "@/lib/actions/admin";
import type { AccountStatus } from "@/lib/types/database.types";

const STATUSES: AccountStatus[] = ["active", "suspended", "banned"];

export function UserStatusSelect({ userId, currentStatus }: { userId: string; currentStatus: AccountStatus }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      defaultValue={currentStatus}
      disabled={isPending}
      onChange={(e) => startTransition(() => setUserStatus(userId, e.target.value as AccountStatus))}
      className="w-auto py-1.5 text-xs"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </Select>
  );
}
