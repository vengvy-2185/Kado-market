"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { updateOrderStatus } from "@/lib/actions/orders";
import type { OrderStatus } from "@/lib/types/database.types";

const STATUSES: OrderStatus[] = ["pending", "paid", "processing", "packed", "shipped", "delivered", "cancelled", "refunded"];

export function OrderStatusControl({ orderId, currentStatus }: { orderId: string; currentStatus: OrderStatus }) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  async function handleChange(status: OrderStatus) {
    setUpdating(true);
    await updateOrderStatus(orderId, status);
    setUpdating(false);
    router.refresh();
  }

  return (
    <Select
      defaultValue={currentStatus}
      disabled={updating}
      onChange={(e) => handleChange(e.target.value as OrderStatus)}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s.charAt(0).toUpperCase() + s.slice(1)}
        </option>
      ))}
    </Select>
  );
}
