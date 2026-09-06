import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { StoreStatusSelect } from "@/components/admin/store-status-select";
import { cn } from "@/lib/utils";

export default async function AdminStoresPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "super_admin") redirect("/");

  const { data: stores } = await supabase
    .from("stores")
    .select("id, store_name, slug, status, verified, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-bold">Stores</h1>

      {!stores || stores.length === 0 ? (
        <Card>
          <p className="text-white/60">No stores yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {stores.map((s) => (
            <Card key={s.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{s.store_name}</p>
                <p className="text-xs text-white/40">/store/{s.slug}</p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                    s.status === "active" && "bg-success/15 text-success",
                    s.status === "pending_review" && "bg-warning/15 text-warning",
                    s.status === "draft" && "bg-white/10 text-white/60",
                    (s.status === "suspended" || s.status === "rejected") && "bg-danger/15 text-danger"
                  )}
                >
                  {s.status.replace("_", " ")}
                </span>
                <StoreStatusSelect storeId={s.id} currentStatus={s.status} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
