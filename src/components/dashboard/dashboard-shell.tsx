"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ShieldCheck } from "lucide-react";
import { SidebarNav, SidebarLogout } from "./sidebar-nav";
import { BackButton } from "./back-button";
import { LanguageToggle } from "./language-toggle";
import { LiveClock } from "./live-clock";
import { DashboardMobileNav } from "./dashboard-mobile-nav";
import { useLanguage } from "@/lib/i18n/language-context";

export function DashboardShell({
  storeName,
  planName,
  logoUrl,
  badges = {},
  children,
}: {
  storeName: string | null;
  planName: string | null;
  logoUrl: string | null;
  badges?: Partial<Record<string, number>>;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-shrink-0 flex-col border-r border-white/10 bg-surface/60 backdrop-blur-sm md:flex">
        <SidebarHeader storeName={storeName} planName={planName} logoUrl={logoUrl} />
        <SidebarNav badges={badges} />
        <SidebarLogout />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <aside className="relative flex h-full w-72 flex-col border-r border-white/10 bg-surface">
            <div className="flex items-center justify-between px-4 pt-4">
              <span className="text-sm font-semibold text-white/50">Menu</span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarHeader storeName={storeName} planName={planName} logoUrl={logoUrl} />
            <SidebarNav badges={badges} onNavigate={() => setDrawerOpen(false)} />
            <SidebarLogout />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/10 bg-background/80 px-4 py-3 backdrop-blur-sm md:px-6">
          <button
            onClick={() => setDrawerOpen(true)}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <BackButton />
          <div className="flex items-center gap-2 text-sm font-semibold text-white/70 md:hidden">
            <span className="bg-brand-gradient bg-clip-text text-transparent">KADO MARKET</span>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <LiveClock />
            <LanguageToggle />
          </div>
        </header>

        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <DashboardMobileNav />
      </div>
    </div>
  );
}

function SidebarHeader({
  storeName,
  planName,
  logoUrl,
}: {
  storeName: string | null;
  planName: string | null;
  logoUrl: string | null;
}) {
  const { t } = useLanguage();

  return (
    <div className="border-b border-white/10 p-4">
      <Link href="/dashboard" className="mb-4 block">
        <span className="bg-brand-gradient bg-clip-text text-lg font-extrabold text-transparent">
          KADO MARKET
        </span>
      </Link>
      {storeName && (
        <div className="flex items-center gap-2.5 rounded-xl bg-white/5 px-3 py-2.5">
          <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-gradient text-sm font-bold ring-2 ring-white/10">
            {logoUrl ? (
              <Image src={logoUrl} alt={storeName} fill sizes="40px" className="object-cover" />
            ) : (
              storeName.charAt(0).toUpperCase()
            )}
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface bg-success" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{storeName}</p>
            <p className="flex items-center gap-1 text-xs text-white/50">
              <ShieldCheck className="h-3 w-3 text-accent" />
              {planName ?? t("seller")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
