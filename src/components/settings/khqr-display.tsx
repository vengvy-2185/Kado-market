"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

export function KhqrDisplay({
  khqrString,
  size = 220,
  merchantName,
  amountLabel,
  logoUrl = "/logo.png",
}: {
  khqrString: string;
  size?: number;
  merchantName?: string;
  amountLabel?: string;
  /** Small badge drawn in the center of the QR, KHQR-app style. Set to null to render a plain QR with no badge. */
  logoUrl?: string | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // errorCorrectionLevel "H" reserves ~30% of the payload for redundancy —
    // this is the same level Bakong's own app uses for its center-logo QR
    // display. As long as the badge we draw over the middle stays within
    // ~20% of the QR's width (with a solid white plate behind it so no
    // logo pixel is ever mistaken for a dark module), the decoder can
    // reconstruct everything the badge covers from redundancy alone. That
    // margin is what makes it safe to add a logo to a real, scannable
    // payment code instead of a purely decorative one.
    QRCode.toCanvas(canvas, khqrString, {
      width: size,
      margin: 2,
      errorCorrectionLevel: "H",
    })
      .then(() => {
        if (cancelled) return;
        if (!logoUrl) {
          setReady(true);
          return;
        }
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          if (cancelled || !ctx) return;
          const badgeSize = size * 0.2; // ~20% of width — inside the safe zone for H-level correction
          const cx = size / 2;
          const cy = size / 2;
          const plateRadius = badgeSize / 2 + 5;

          // White plate + soft ring so the badge reads cleanly on any QR density
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, plateRadius, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = "rgba(0,0,0,0.08)";
          ctx.stroke();
          ctx.restore();

          // Clip the logo itself to a circle so non-square logos sit neatly
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, badgeSize / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, cx - badgeSize / 2, cy - badgeSize / 2, badgeSize, badgeSize);
          ctx.restore();

          setReady(true);
        };
        img.onerror = () => {
          // Logo failed to load (e.g. CORS on a hotlinked seller image) —
          // fall back to a plain, still fully scannable QR rather than block.
          if (!cancelled) setReady(true);
        };
        img.src = logoUrl;
      })
      .catch(() => setReady(false));

    return () => {
      cancelled = true;
    };
  }, [khqrString, size, logoUrl]);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#fff]" style={{ width: size }}>
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
