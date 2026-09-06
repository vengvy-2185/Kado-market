"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMyStoreOrRedirect } from "@/lib/store";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import type { SupportTicketStatus } from "@/lib/types/database.types";

export async function createSupportTicket(formData: FormData) {
  const { supabase, user, store } = await getMyStoreOrRedirect();

  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  if (!subject || !message) throw new Error("Please fill in both the subject and message.");

  const { error } = await supabase.from("support_tickets").insert({
    store_id: store.id,
    created_by: user.id,
    subject,
    message,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/help");
  revalidatePath("/admin/support");
}

export async function replyToTicket(ticketId: string, reply: string, status: SupportTicketStatus) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("support_tickets")
    .update({ admin_reply: reply, status })
    .eq("id", ticketId);

  if (error) throw new Error(error.message);

  await logAudit(supabase, "support_ticket.replied", "support_ticket", ticketId, { status });

  revalidatePath("/admin/support");
  revalidatePath("/dashboard/help");
}
