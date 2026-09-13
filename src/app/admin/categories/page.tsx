import { redirect } from "next/navigation";
import { Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserRole, isAdminRole } from "@/lib/require-admin";
import { AllCategoryIconForm } from "@/components/admin/all-category-icon-form";
import { CategoryManager } from "@/components/admin/category-manager";

export default async function AdminCategoriesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const role = await getUserRole(supabase, user.id);
  if (!isAdminRole(role)) redirect("/");

  const { data: categories } = await supabase.from("categories").select("*").order("sort_order");
  const { data: settings } = await supabase.from("platform_settings").select("all_category_icon_url").eq("id", 1).single();
  const { data: productRows } = await supabase.from("products").select("category_id");

  const counts: Record<string, number> = {};
  for (const p of productRows ?? []) {
    if (!p.category_id) continue;
    counts[p.category_id] = (counts[p.category_id] ?? 0) + 1;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <div className="mb-6 flex items-center gap-2">
        <Tag className="h-6 w-6 text-accent" />
        <div>
          <h1 className="text-2xl font-bold">Product Categories</h1>
          <p className="text-sm text-white/40">Manage your product categories and child categories</p>
        </div>
      </div>

      <div className="mb-4">
        <AllCategoryIconForm initialIconUrl={settings?.all_category_icon_url ?? null} />
      </div>

      <CategoryManager categories={categories ?? []} counts={counts} />
    </div>
  );
}
