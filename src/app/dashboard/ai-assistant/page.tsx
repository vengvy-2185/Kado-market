import Link from "next/link";
import { Bot, FileText, CheckCircle2, AlertCircle, MessageSquare } from "lucide-react";
import { getMyStoreOrRedirect } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { SubscribeButton } from "@/components/ai/subscribe-button";
import { UploadDocumentForm } from "@/components/ai/upload-document-form";
import { DeleteDocumentButton } from "@/components/ai/delete-document-button";
import { getOrStartAiThread } from "@/lib/actions/ai-assistant";
import { PlatformKhqrToggle } from "@/components/platform-khqr-toggle";

function currentMonthStart() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

export default async function AiAssistantPage() {
  const { supabase, store } = await getMyStoreOrRedirect();

  const { data: subscription } = await supabase
    .from("ai_subscriptions")
    .select("*, ai_plans(name, message_limit, duration_months)")
    .eq("store_id", store.id)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false })
    .maybeSingle();

  const { data: plans } = await supabase.from("ai_plans").select("*").eq("is_active", true).order("sort_order");
  const { data: platformSettingsRows } = await supabase.rpc("get_public_platform_khqr");
  const platformSettings = platformSettingsRows?.[0] ?? null;
  const hasPlatformKhqr = Boolean(platformSettings?.bakong_account_id && platformSettings?.bakong_phone);

  const { data: documents } = await supabase
    .from("ai_documents")
    .select("*")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  let usageThisMonth = 0;
  if (subscription) {
    const { data: usage } = await supabase
      .from("ai_usage")
      .select("messages_used")
      .eq("store_id", store.id)
      .eq("month", currentMonthStart())
      .maybeSingle();
    usageThisMonth = usage?.messages_used ?? 0;
  }

  const plan = subscription?.ai_plans as unknown as { name: string; message_limit: number; duration_months: number } | null;

  let conversations: { id: string; customerName: string; updatedAt: string; unreadCount: number }[] = [];
  if (subscription) {
    const { data: threads } = await supabase
      .from("ai_threads")
      .select("id, updated_at, profiles(full_name)")
      .eq("store_id", store.id)
      .order("updated_at", { ascending: false });

    conversations = await Promise.all(
      (threads ?? []).map(async (t) => {
        const { count } = await supabase
          .from("ai_messages")
          .select("*", { count: "exact", head: true })
          .eq("thread_id", t.id)
          .eq("role", "user")
          .is("read_at", null);
        const profile = t.profiles as unknown as { full_name: string | null } | null;
        return {
          id: t.id,
          customerName: profile?.full_name ?? "Customer",
          updatedAt: t.updated_at,
          unreadCount: count ?? 0,
        };
      })
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6 md:py-10">
      <div className="mb-6 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-accent" />
          <h1 className="text-2xl font-bold">AI Assistant</h1>
        </div>
        {subscription && (
          <form action={getOrStartAiThread.bind(null, store.id)}>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium hover:bg-white/10"
            >
              <MessageSquare className="h-4 w-4" />
              Test Your Assistant
            </button>
          </form>
        )}
      </div>

      {subscription && plan ? (
        <Card className="mb-6">
          <div className="mb-2 flex items-center gap-2 text-success">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-semibold">Active — {plan.name}</span>
          </div>
          <p className="text-sm text-white/50">Expires {new Date(subscription.expires_at).toLocaleDateString()}</p>
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs text-white/50">
              <span>Messages this month</span>
              <span>
                {usageThisMonth} / {plan.message_limit}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-brand-gradient"
                style={{ width: `${Math.min(100, (usageThisMonth / plan.message_limit) * 100)}%` }}
              />
            </div>
          </div>
        </Card>
      ) : (
        <Card className="mb-6">
          <div className="mb-3 flex items-center gap-2 text-warning">
            <AlertCircle className="h-5 w-5" />
            <span className="font-semibold">Not subscribed</span>
          </div>
          <p className="mb-4 text-sm text-white/60">
            Subscribe to enable an AI assistant that answers customer questions using only your
            store&apos;s own information.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {(plans ?? []).map((p) => (
              <div key={p.id} className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                <p className="text-sm font-semibold">{p.name}</p>
                <p className="my-2 text-2xl font-bold text-accent">${p.price}</p>
                <p className="mb-3 text-xs text-white/40">{p.message_limit} messages/mo</p>
                <SubscribeButton planId={p.id} />
                {hasPlatformKhqr && (
                  <PlatformKhqrToggle
                    accountId={platformSettings!.bakong_account_id!}
                    phone={platformSettings!.bakong_phone!}
                    merchantName={platformSettings!.platform_name}
                    merchantCity={platformSettings!.platform_city}
                    amount={p.price}
                  />
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h2 className="mb-1 text-sm font-semibold text-white/70">Knowledge base</h2>
        <p className="mb-4 text-xs text-white/40">
          Upload your product list, FAQ, shipping policy, or business info. Plain text files
          (.txt, .csv, .md, .json) are searchable immediately; PDF/Word files are stored but not
          yet parsed for search — export those as .txt for now if you need the assistant to read
          them.
        </p>

        <UploadDocumentForm />

        <div className="mt-4 space-y-2">
          {!documents || documents.length === 0 ? (
            <p className="text-sm text-white/40">No documents uploaded yet.</p>
          ) : (
            documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <FileText className="h-4 w-4 flex-shrink-0 text-white/40" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{doc.file_name}</p>
                  <p className="text-xs text-white/40">
                    {doc.status === "processed" ? `${doc.char_count} characters indexed` : "Not searchable (unsupported file type)"}
                  </p>
                </div>
                <DeleteDocumentButton documentId={doc.id} />
              </div>
            ))
          )}
        </div>
      </Card>

      {subscription && (
        <Card className="mt-6">
          <h2 className="mb-3 text-sm font-semibold text-white/70">Customer conversations</h2>
          {conversations.length === 0 ? (
            <p className="text-sm text-white/40">No customers have asked your AI assistant anything yet.</p>
          ) : (
            <div className="space-y-2">
              {conversations.map((c) => (
                <Link
                  key={c.id}
                  href={`/ai-chat/${c.id}`}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3 hover:bg-white/[0.06]"
                >
                  <span className="truncate text-sm">{c.customerName}</span>
                  <div className="flex items-center gap-2">
                    {c.unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-highlight px-1.5 text-[10px] font-bold text-white">
                        {c.unreadCount}
                      </span>
                    )}
                    <span className="text-xs text-white/40">{new Date(c.updatedAt).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
