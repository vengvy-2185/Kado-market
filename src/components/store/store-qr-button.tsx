"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { QrCode, X, Download } from "lucide-react";

export function StoreQrButton({ storeUrl, storeName }: { storeUrl: string; storeName: string }) {
  const [open, setOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!open || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, storeUrl, { width: 240, margin: 2 }).catch(() => {});
  }, [open, storeUrl]);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${storeName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-qr-code.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
        aria-label="Show QR code"
      >
        <QrCode className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-xs rounded-2xl border border-white/10 bg-surface p-5 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">{storeName}</p>
              <button onClick={() => setOpen(false)} className="rounded-full p-1 text-white/40 hover:bg-white/10 hover:text-white" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mx-auto flex w-fit items-center justify-center rounded-xl bg-[#fff] p-3">
              <canvas ref={canvasRef} />
            </div>
            <p className="mb-3 mt-3 text-xs text-white/40">Scan to open this shop — great for printouts, business cards, or social posts.</p>
            <button
              onClick={handleDownload}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-gradient py-2.5 text-sm font-semibold text-white shadow-glow"
            >
              <Download className="h-4 w-4" /> Download PNG
            </button>
          </div>
        </div>
      )}
    </>
  );
}
