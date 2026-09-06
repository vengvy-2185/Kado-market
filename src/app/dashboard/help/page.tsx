import { HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getMyStoreOrRedirect } from "@/lib/store";
import { SupportTicketForm } from "@/components/settings/support-ticket-form";

const FAQS: { q: string; a: string }[] = [
  {
    q: "How do I add my first product?",
    a: "Go to Products in the sidebar and click \"+ Add product\". Fill in the name, price, and stock, upload at least one photo, then set the status to Active so it's visible to customers.",
  },
  {
    q: "Why isn't my product showing up on the homepage?",
    a: "Check three things: the product's status is \"Active\" (not Draft), your store's status is \"Active\" (check My Store), and the product has stock greater than 0.",
  },
  {
    q: "How does the demo payment mode work?",
    a: "KADO MARKET doesn't have a real payment gateway connected yet, so orders are marked \"Paid\" automatically when placed. To collect real money, share your KHQR code (Settings → KHQR payment) so the customer can pay you directly via their banking app, or arrange cash on delivery.",
  },
  {
    q: "How do I get notified about new orders instantly?",
    a: "Go to Settings and connect Telegram. Once connected, you'll get a message the moment a customer places an order — no need to keep the dashboard open.",
  },
  {
    q: "What's the difference between the AI Assistant and Chat?",
    a: "Chat is a real conversation between you and a customer. The AI Assistant automatically answers customer questions using only documents you've uploaded to your store's knowledge base — it requires a separate subscription (AI Assistant in the sidebar).",
  },
  {
    q: "How do discount codes work?",
    a: "Create a code in Marketing with a percent or fixed discount, an optional minimum order amount, usage limit, and expiry date. Customers enter it at checkout on the \"Buy Now\" flow to get the discount applied automatically.",
  },
  {
    q: "What does \"Boost\" do?",
    a: "Boosting a post pays to show a \"Sponsored\" tag on it in the public feed for the duration you choose. It doesn't guarantee placement at the top of the feed yet — it currently marks the post as sponsored for visibility.",
  },
  {
    q: "Can I sell in Khmer?",
    a: "Yes — product names, descriptions, and posts can be written in Khmer. The storefront language toggle (EN/ខ្មែរ) translates the interface labels; your own content stays exactly as you typed it.",
  },
  {
    q: "How do I change my store's logo, cover photo, or policies?",
    a: "Go to My Store → Edit store, which reopens the setup wizard at the step you need.",
  },
  {
    q: "Someone placed an order — what do I do next?",
    a: "Open Orders, find it, and move its status forward (Processing → Packed → Shipped → Delivered) as you fulfill it. The customer sees the same status on their own Orders page in real time.",
  },
];

export default async function HelpCenterPage() {
  const { supabase, store } = await getMyStoreOrRedirect();
  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6 md:py-10">
      <div className="mb-6 flex items-center gap-2">
        <HelpCircle className="h-6 w-6 text-accent" />
        <h1 className="text-2xl font-bold">Help Center</h1>
      </div>

      <div className="space-y-3">
        {FAQS.map((item) => (
          <Card key={item.q}>
            <p className="mb-1.5 font-semibold">{item.q}</p>
            <p className="text-sm text-white/60">{item.a}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <h2 className="mb-1 font-semibold">Still stuck? Contact support</h2>
        <p className="mb-4 text-sm text-white/60">
          Send a message directly to the KADO MARKET admin team about a problem with your store,
          an order, or anything else.
        </p>
        <SupportTicketForm />
      </Card>

      {tickets && tickets.length > 0 && (
        <div className="mt-6 space-y-2">
          <h2 className="text-sm font-semibold text-white/70">Your tickets</h2>
          {tickets.map((t) => (
            <Card key={t.id}>
              <div className="flex items-center justify-between">
                <p className="font-medium">{t.subject}</p>
                <span className="text-xs capitalize text-white/40">{t.status.replace("_", " ")}</span>
              </div>
              <p className="mt-1 text-sm text-white/60">{t.message}</p>
              {t.admin_reply && (
                <div className="mt-2 rounded-xl border border-accent/20 bg-accent/5 p-3 text-sm">
                  <p className="mb-1 text-xs font-semibold text-accent">Admin reply</p>
                  {t.admin_reply}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
