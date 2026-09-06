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

    QRCode.toCanvas(canvas, khqrString, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "H", // high correction — leaves room for a center logo without breaking scans
    })
      .then(() => {
        if (cancelled) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Center logo mark — a simple KADO badge, not a Bakong/bank logo
        const logoSize = size * 0.22;
        const cx = size / 2;
        const cy = size / 2;

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(cx, cy, logoSize / 2 + 4, 0, Math.PI * 2);
        ctx.fill();

        const gradient = ctx.createLinearGradient(cx - logoSize / 2, cy - logoSize / 2, cx + logoSize / 2, cy + logoSize / 2);
        gradient.addColorStop(0, "#7C3AED");
        gradient.addColorStop(1, "#EC4899");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, logoSize / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${Math.round(logoSize * 0.55)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("K", cx, cy + 1);

        setReady(true);
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
