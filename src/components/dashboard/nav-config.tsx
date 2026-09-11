import type { LucideIcon } from "lucide-react";
import type { DictKey } from "@/lib/i18n/dictionary";
import {
  LayoutDashboard,
  Store,
  Package,
  Boxes,
  ShoppingBag,
  Image as ImageIcon,
  Clapperboard,
  Users,
  MessageSquare,
  Bot,
  BarChart3,
  Megaphone,
  Star,
  Zap,
  CreditCard,
  CircleDollarSign,
  Settings,
  HelpCircle,
  User,
} from "lucide-react";

export type NavItem = {
  labelKey: DictKey;
  href?: string; // omit for "coming soon" (not yet built) items — never a fake/dead link
  icon: LucideIcon;
};

export const SELLER_NAV: NavItem[] = [
  { labelKey: "nav_dashboard", href: "/dashboard", icon: LayoutDashboard },
  { labelKey: "nav_my_store", href: "/dashboard/store", icon: Store },
  { labelKey: "nav_profile", href: "/account/profile", icon: User },
  { labelKey: "nav_products", href: "/dashboard/products", icon: Package },
  { labelKey: "nav_inventory", href: "/dashboard/inventory", icon: Boxes },
  { labelKey: "nav_orders", href: "/dashboard/orders", icon: ShoppingBag },
  { labelKey: "nav_posts", href: "/dashboard/posts", icon: ImageIcon },
  { labelKey: "nav_stories", href: "/dashboard/stories", icon: Clapperboard },
  { labelKey: "nav_customers", href: "/dashboard/customers", icon: Users },
  { labelKey: "nav_reviews", href: "/dashboard/reviews", icon: Star },
  { labelKey: "nav_messages", href: "/chat", icon: MessageSquare },
  { labelKey: "nav_ai_assistant", href: "/dashboard/ai-assistant", icon: Bot },
  { labelKey: "nav_analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { labelKey: "nav_marketing", href: "/dashboard/marketing", icon: Megaphone },
  { labelKey: "nav_boost", href: "/dashboard/boost", icon: Zap },
  { labelKey: "nav_payments", href: "/dashboard/payments", icon: CreditCard },
  { labelKey: "nav_subscription", href: "/dashboard/subscription", icon: CircleDollarSign },
  { labelKey: "nav_settings", href: "/dashboard/settings", icon: Settings },
  { labelKey: "nav_help_center", href: "/dashboard/help", icon: HelpCircle },
];
