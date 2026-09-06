"use client";

import { useState } from "react";
import { QrCode } from "lucide-react";
import { generateKhqr } from "@/lib/khqr";
import { KhqrDisplay } from "@/components/settings/khqr-display";

export function PlatformKhqrToggle({
  accountId,
  phone,
  merchantName,
  merchantCity,
  amount,
}: {
  accountId: string;
  phone: string;
  merchantName: string;
  merchantCity: string;
  amount: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-medium text-white/60 hover:bg-white/10"
      >
        <QrCode className="h-3.5 w-3.5" />
        {open ? "Hide KHQR" : "Pay via KHQR"}
      </button>
      {open && (
        <div className="mt-2 flex justify-center">
          <KhqrDisplay
            khqrString={generateKhqr({ bakongAccountId: accountId, accountInformation: phone, merchantName, merchantCity, amount, currency: "USD" })}
            size={140}
            merchantName={merchantName}
            amountLabel={`$${amount.toFixed(2)}`}
          />
        </div>
      )}
    </div>
  );
}
