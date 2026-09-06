import { redirect } from "next/navigation";
import { LifeBuoy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { TicketReplyForm } from "@/components/admin/ticket-reply-form";
import { cn } from "@/lib/utils";

const STATUS_COLOR: Record<string, string> = {
  open: "bg-warning/15 text-warning",
  in_progress: "bg-accent/15 text-accent",
  resolved: "bg-success/15 text-success",
};

export default async function AdminSupportPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "super_admin") redirect("/");

  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("*, stores(store_name), profiles(full_name, email)")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-6 flex items-center gap-2">
        <LifeBuoy className="h-6 w-6 text-accent" />
        <h1 className="text-2xl font-bold">Seller Support</h1>
      </div>

      {!tickets || tickets.length === 0 ? (
        <Card>
          <p className="text-white/60">No support tickets yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => {
            const store = t.stores as unknown as { store_name: string } | null;
            const author = t.profiles as unknown as { full_name: string | null; email: string } | null;
            return (
              <Card key={t.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{t.subject}</p>
                    <p className="text-xs text-white/40">
                      {store?.store_name} · {author?.full_name ?? author?.email} · {new Date(t.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className={cn("flex-shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize", STATUS_COLOR[t.status])}>
                    {t.status.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-2 text-sm text-white/70">{t.message}</p>

                {t.admin_reply && (
                  <div className="mt-2 rounded-xl border border-accent/20 bg-accent/5 p-3 text-sm">
                    <p className="mb-1 text-xs font-semibold text-accent">Your reply</p>
                    {t.admin_reply}
                  </div>
                )}

                <TicketReplyForm ticketId={t.id} currentReply={t.admin_reply} currentStatus={t.status} />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
