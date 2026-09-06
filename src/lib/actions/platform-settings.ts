"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function savePlatformKhqr(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "super_admin") throw new Error("Not authorized.");

  const bakongAccountId = String(formData.get("bakong_account_id") ?? "").trim() || null;
  const bakongPhone = String(formData.get("bakong_phone") ?? "").trim() || null;
  const platformName = String(formData.get("platform_name") ?? "").trim() || "KADO MARKET";
  const platformCity = String(formData.get("platform_city") ?? "").trim() || "Phnom Penh";

  const { error } = await supabase
    .from("platform_settings")
    .update({
      bakong_account_id: bakongAccountId,
      bakong_phone: bakongPhone,
      platform_name: platformName,
      platform_city: platformCity,
    })
    .eq("id", 1);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/settings");
  revalidatePath("/dashboard/subscription");
  revalidatePath("/dashboard/ai-assistant");
  revalidatePath("/dashboard/boost");
}
