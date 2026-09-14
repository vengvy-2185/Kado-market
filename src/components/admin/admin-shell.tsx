"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { AdminSidebarNav, AdminSidebarHeader, AdminSidebarLogout } from "./admin-sidebar-nav";
import { BackButton } from "@/components/dashboard/back-button";
import { LanguageToggle } from "@/components/dashboard/language-toggle";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";

export function AdminShell({
  badges,
  children,
}: {
  badges: { pendingStores: number; openTickets: number; recentErrors: number };
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 flex-shrink-0 flex-col border-r border-white/10 bg-surface/60 backdrop-blur-sm md:flex">
        <AdminSidebarHeader />
        <AdminSidebarNav badges={badges} />
        <AdminSidebarLogout />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} aria-hidden />
          <aside className="relative flex h-full w-72 flex-col border-r border-white/10 bg-surface">
            <div className="flex items-center justify-between px-4 pt-4">
              <span className="text-sm font-semibold text-white/50">Menu</span>
              <button onClick={() => setDrawerOpen(false)} className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <AdminSidebarHeader />
            <AdminSidebarNav badges={badges} onNavigate={() => setDrawerOpen(false)} />
            <AdminSidebarLogout />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/10 bg-background/80 px-4 py-3 backdrop-blur-sm md:px-6">
          <button
            onClick={() => setDrawerOpen(true)}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <BackButton />
          <div className="ml-auto flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <span className="text-sm font-semibold text-white/70 md:hidden">
              <span className="bg-brand-gradient bg-clip-text text-transparent">Admin</span>
            </span>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
