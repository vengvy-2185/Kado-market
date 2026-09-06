import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { MessageCircle, Store as StoreIcon, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { MobileBottomNav } from "@/components/home/mobile-bottom-nav";
import { BackButton } from "@/components/dashboard/back-button";

export default async function ChatInboxPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/chat");

  const { data: myStore } = await supabase.from("stores").select("id").eq("seller_id", user.id).maybeSingle();
  const myStoreId = myStore?.id ?? null;

  const orFilter = myStoreId ? `customer_id.eq.${user.id},store_id.eq.${myStoreId}` : `customer_id.eq.${user.id}`;

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, customer_id, store_id, updated_at, stores(store_name, logo_url), profiles(full_name, avatar_url)")
    .or(orFilter)
    .order("updated_at", { ascending: false });

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 md:px-6">
      <div className="mb-4">
        <BackButton />
      </div>
      <h1 className="mb-6 text-2xl font-bold">Chat</h1>

      {!conversations || conversations.length === 0 ? (
        <Card>
          <p className="text-white/60">
            No conversations yet — open a store page and tap &quot;Chat with Seller&quot; to start one.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => {
            const iAmSeller = myStoreId === c.store_id;
            const store = c.stores as unknown as { store_name: string; logo_url: string | null } | null;
            const customer = c.profiles as unknown as { full_name: string | null; avatar_url: string | null } | null;
            const otherName = iAmSeller ? customer?.full_name ?? "Customer" : store?.store_name ?? "Store";
            const otherAvatar = iAmSeller ? customer?.avatar_url : store?.logo_url;

            return (
              <Link key={c.id} href={`/chat/${c.id}`}>
                <Card className="flex items-center gap-3 transition-colors hover:border-primary/40">
                  <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-full bg-white/5">
                    {otherAvatar ? (
                      <Image src={otherAvatar} alt="" fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-white/30">
                        {iAmSeller ? <User className="h-5 w-5" /> : <StoreIcon className="h-5 w-5" />}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{otherName}</p>
                    <p className="text-xs text-white/40">{new Date(c.updated_at).toLocaleString()}</p>
                  </div>
                  <MessageCircle className="h-4 w-4 flex-shrink-0 text-white/20" />
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <div className="h-16 md:hidden" aria-hidden />
      <MobileBottomNav isLoggedIn />
    </main>
  );
}
