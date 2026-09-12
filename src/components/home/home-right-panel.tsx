import Link from "next/link";
import { Package, MessageSquare, Heart, HelpCircle, ChevronRight, Gift } from "lucide-react";

export function HomeRightPanel({ chatUnreadCount }: { chatUnreadCount: number }) {
  const quickLinks = [
    { href: "/account/orders", label: "Track My Order", icon: Package },
    { href: "/chat", label: "Messages", icon: MessageSquare, badge: chatUnreadCount },
    { href: "/account/favorites", label: "Wishlist", icon: Heart },
    { href: "/dashboard/help", label: "Help Center", icon: HelpCircle },
  ];

  return (
    <aside className="sticky top-20 hidden h-fit w-64 flex-shrink-0 self-start space-y-4 xl:block">
      <div className="rounded-2xl border border-white/10 bg-surface/40 p-4">
        <p className="mb-3 text-sm font-bold text-white/80">Quick Access</p>
        <div className="space-y-1">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.label}
                href={link.href}
                className="flex items-center justify-between rounded-xl px-2.5 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white"
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4" />
                  {link.label}
                </span>
                <span className="flex items-center gap-1.5">
                  {Boolean(link.badge) && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-highlight px-1 text-[10px] font-bold text-white">
                      {link.badge}
                    </span>
                  )}
                  <ChevronRight className="h-3.5 w-3.5 text-white/20" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <Link
        href="/?sort=price_asc"
        className="block rounded-2xl border border-highlight/20 bg-gradient-to-br from-highlight/10 to-primary/10 p-4"
      >
        <Gift className="mb-2 h-6 w-6 text-highlight" />
        <p className="mb-1 text-sm font-bold">Special Offers</p>
        <p className="mb-3 text-xs text-white/50">Browse discounted products from sellers across the marketplace.</p>
        <span className="flex items-center gap-1 text-xs font-semibold text-highlight">
          Shop deals <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </Link>
    </aside>
  );
}
