import type { LucideIcon } from "lucide-react";
import type { DictKey } from "@/lib/i18n/dictionary";
import {
  LayoutDashboard,
  Store,
  Users,
  CreditCard,
  LifeBuoy,
  Settings,
  Sparkles,
  AlertTriangle,
  ScrollText,
  Tag,
} from "lucide-react";

export type AdminNavItem = {
  labelKey: DictKey;
  href: string;
  icon: LucideIcon;
  badgeKey?: "pendingStores" | "openTickets" | "recentErrors";
};

export const ADMIN_NAV: AdminNavItem[] = [
  { labelKey: "admin_dashboard", href: "/admin", icon: LayoutDashboard },
  { labelKey: "admin_stores", href: "/admin/stores", icon: Store, badgeKey: "pendingStores" },
  { labelKey: "admin_users", href: "/admin/users", icon: Users },
  { labelKey: "admin_plans", href: "/admin/plans", icon: CreditCard },
  { labelKey: "admin_categories", href: "/admin/categories", icon: Tag },
  { labelKey: "admin_subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { labelKey: "admin_support", href: "/admin/support", icon: LifeBuoy, badgeKey: "openTickets" },
  { labelKey: "admin_insights", href: "/admin/insights", icon: Sparkles },
  { labelKey: "admin_errors", href: "/admin/errors", icon: AlertTriangle, badgeKey: "recentErrors" },
  { labelKey: "admin_audit", href: "/admin/audit", icon: ScrollText },
  { labelKey: "admin_settings", href: "/admin/settings", icon: Settings },
];
