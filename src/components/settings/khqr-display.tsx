"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

export function KhqrDisplay({
  khqrString,
  size = 220,
  merchantName,
  amountLabel,
}: {
  khqrString: string;
  size?: number;
  merchantName?: string;
  amountLabel?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // No center logo overlay here on purpose — KHQR payloads are long
    // (merchant name, city, amount, timestamp all encoded in), which
    // pushes the QR to a higher version with smaller modules. A logo that
    // looks like a small, safe decoration at a glance can end up
    // obscuring more actual data modules than expected at that density,
    // and real banking-app scanners are often less forgiving than ideal
    // decoders. For an actual payment code, scan reliability matters more
    // than a logo — so this renders a clean, standard QR only.
    QRCode.toCanvas(canvas, khqrString, {
      width: size,
      margin: 2,
      errorCorrectionLevel: "M",
    })
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => setReady(false));

    return () => {
      cancelled = true;
    };
  }, [khqrString, size]);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white" style={{ width: size }}>
      <div className="bg-brand-gradient px-3 py-2 text-center">
        <p className="text-xs font-extrabold tracking-wide text-white">KHQR</p>
      </div>
      {(merchantName || amountLabel) && (
        <div className="border-b border-black/5 px-3 py-2 text-center">
          {merchantName && <p className="text-sm font-semibold text-black">{merchantName}</p>}
          {amountLabel && <p className="text-xs text-black/50">{amountLabel}</p>}
        </div>
      )}
      <div className="flex items-center justify-center p-3" style={{ minHeight: size, opacity: ready ? 1 : 0.3 }}>
        <canvas ref={canvasRef} width={size} height={size} />
      </div>
    </div>
  );
}
