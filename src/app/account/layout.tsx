import { AccountSidebar } from "@/components/account/account-sidebar";
import { SiteHeader } from "@/components/site-header";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl">
      <SiteHeader />
      <div className="flex">
        <AccountSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
