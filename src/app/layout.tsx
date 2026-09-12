import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/language-context";

// Explicit Khmer-supporting font. Without this, Khmer text falls back to
// whatever the OS happens to substitute for a script the primary font
// (system-ui / Segoe UI / etc.) doesn't cover at all — which varies by
// platform and can shape complex Khmer consonant stacks incorrectly,
// rendering as garbled/malformed characters especially at small sizes.
// Ordered after the default sans stack in Tailwind's config, so it's
// used as a fallback *only* for characters the primary font lacks —
// Latin text is unaffected.
const notoSansKhmer = localFont({
  src: "./fonts/NotoSansKhmer.ttf",
  variable: "--font-khmer",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "KADO MARKET",
    template: "%s | KADO MARKET",
  },
  description: "Social commerce marketplace — shop, sell, and connect.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${notoSansKhmer.variable}`}>
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
