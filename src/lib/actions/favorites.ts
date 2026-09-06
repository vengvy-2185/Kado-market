"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function toggleFavorite(productId: string, currentlySaved: boolean) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login`);

  if (currentlySaved) {
    await supabase.from("saved_products").delete().eq("user_id", user.id).eq("product_id", productId);
  } else {
    await supabase.from("saved_products").insert({ user_id: user.id, product_id: productId });
  }

  revalidatePath("/account/favorites");
  revalidatePath("/");
}
