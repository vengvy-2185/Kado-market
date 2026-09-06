"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function markNotificationRead(id: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  revalidatePath("/");
}

export async function markAllNotificationsRead() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
  revalidatePath("/");
}
