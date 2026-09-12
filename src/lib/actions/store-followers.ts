"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function followStore(storeId: string, storeSlug: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("store_followers").insert({ store_id: storeId, user_id: user.id });
  // A duplicate (already following) isn't a real error from the user's
  // perspective — the end state they want (following) is already true.
  if (error && !error.message.includes("duplicate")) throw new Error(error.message);

  revalidatePath(`/store/${storeSlug}`);
}

export async function unfollowStore(storeId: string, storeSlug: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("store_followers").delete().eq("store_id", storeId).eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath(`/store/${storeSlug}`);
}
