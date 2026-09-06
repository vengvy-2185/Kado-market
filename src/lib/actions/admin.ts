"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import type { StoreStatus, AccountStatus } from "@/lib/types/database.types";

export async function setStoreStatus(storeId: string, status: StoreStatus) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS only allows this for admins/super_admins (or the store's own owner) —
  // the update will simply no-op if the caller isn't authorized.
  const { error } = await supabase.from("stores").update({ status }).eq("id", storeId);
  if (error) throw new Error(error.message);

  await logAudit(supabase, "store.status_changed", "store", storeId, { new_status: status });

  revalidatePath("/admin/stores");
}

export async function setUserStatus(userId: string, status: AccountStatus) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS (profiles_update_own_or_admin) only allows this for admins or the
  // user themself — updating someone else's status will no-op unless caller is admin.
  const { error } = await supabase.from("profiles").update({ status }).eq("id", userId);
  if (error) throw new Error(error.message);

  await logAudit(supabase, "user.status_changed", "profile", userId, { new_status: status });

  revalidatePath("/admin/users");
}
