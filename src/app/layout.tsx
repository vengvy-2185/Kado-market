import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/language-context";

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
    <html lang="en" className="dark">
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
