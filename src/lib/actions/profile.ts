"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const full_name = String(formData.get("full_name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim() || null;
  const bio = String(formData.get("bio") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const avatar_url = String(formData.get("avatar_url") ?? "").trim() || null;

  if (!full_name) throw new Error("Full name is required.");

  const { error } = await supabase
    .from("profiles")
    .update({ full_name, username, bio, phone, avatar_url })
    .eq("id", user.id);

  if (error) {
    if (error.message.includes("duplicate") || error.message.includes("unique")) {
      throw new Error("That username is already taken.");
    }
    throw new Error(error.message);
  }

  revalidatePath("/account/profile");
  revalidatePath("/");
}
