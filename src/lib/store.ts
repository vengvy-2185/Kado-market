import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getMyStoreOrRedirect() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("seller_id", user.id)
    .single();

  if (!store) redirect("/dashboard");

  return { supabase, user, store };
}
