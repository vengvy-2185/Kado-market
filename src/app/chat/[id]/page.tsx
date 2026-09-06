import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { Store as StoreIcon, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ChatThread } from "@/components/chat/chat-thread";
import { BackButton } from "@/components/dashboard/back-button";

export default async function ChatThreadPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/chat/${params.id}`);

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, customer_id, store_id, stores(store_name, logo_url), profiles(full_name, avatar_url)")
    .eq("id", params.id)
    .single();

  if (!conversation) notFound();

  const iAmSeller = conversation.customer_id !== user.id;
  const store = conversation.stores as unknown as { store_name: string; logo_url: string | null } | null;
  const customer = conversation.profiles as unknown as { full_name: string | null; avatar_url: string | null } | null;
  const otherName = iAmSeller ? customer?.full_name ?? "Customer" : store?.store_name ?? "Store";
  const otherAvatar = iAmSeller ? customer?.avatar_url : store?.logo_url;

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true });

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 md:px-6">
      <div className="mb-4 flex items-center gap-3">
        <BackButton />
        <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-white/5">
          {otherAvatar ? (
            <Image src={otherAvatar} alt="" fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/30">
              {iAmSeller ? <User className="h-4 w-4" /> : <StoreIcon className="h-4 w-4" />}
            </div>
          )}
        </div>
        <h1 className="font-semibold">{otherName}</h1>
      </div>

      <ChatThread conversationId={conversation.id} initialMessages={messages ?? []} currentUserId={user.id} />
    </main>
  );
}
