import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AiChatThread } from "@/components/ai/ai-chat-thread";
import { BackButton } from "@/components/dashboard/back-button";
import { AppShell } from "@/components/app-shell";

export default async function AiChatPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/ai-chat/${params.id}`);

  const { data: thread } = await supabase
    .from("ai_threads")
    .select("id, customer_id, store_id, stores(store_name)")
    .eq("id", params.id)
    .single();

  if (!thread) notFound();

  const store = thread.stores as unknown as { store_name: string } | null;

  const { data: messages } = await supabase
    .from("ai_messages")
    .select("*")
    .eq("thread_id", thread.id)
    .order("created_at", { ascending: true });

  return (
    <AppShell>
      <main className="mx-auto max-w-2xl px-4 py-10 md:px-6">
        <div className="mb-4">
          <BackButton />
        </div>
        <AiChatThread threadId={thread.id} initialMessages={messages ?? []} storeName={store?.store_name ?? "Store"} />
      </main>
    </AppShell>
  );
}
