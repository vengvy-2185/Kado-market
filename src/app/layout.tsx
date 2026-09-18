import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/language-context";
import { ThemeProvider } from "@/lib/theme/theme-context";
import { SplashScreen } from "@/components/splash-screen";

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
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KADO MARKET",
  },
};

export const viewport = {
  themeColor: "#7C3AED",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${notoSansKhmer.variable}`}>
      <head>
        {/* Runs before paint so a returning visitor's light/system choice
            applies immediately instead of flashing the dark default first
            (the static "dark" class above is only the no-JS/first-paint
            fallback). Kept as a tiny inline script, not a component, since
            it must execute before React hydrates anything. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("kado-market-theme");var resolved=t==="light"||t==="dark"?t:(window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");document.documentElement.classList.remove("light","dark");document.documentElement.classList.add(resolved);}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <SplashScreen />
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
