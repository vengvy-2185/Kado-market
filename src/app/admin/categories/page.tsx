import { redirect } from "next/navigation";
import { Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserRole, isAdminRole } from "@/lib/require-admin";
import { Card } from "@/components/ui/card";
import { CategoryRow } from "@/components/admin/category-row";
import { SubCategoryQuickAdd } from "@/components/admin/subcategory-quick-add";
import { AllCategoryIconForm } from "@/components/admin/all-category-icon-form";
import { NewCategoryForm } from "@/components/admin/new-plan-forms";

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

  const all = categories ?? [];
  const topLevel = all.filter((c) => !c.parent_id);
  const topLevelForSelect = topLevel.map((c) => ({ id: c.id, name: c.name }));
  const childrenByParent = new Map<string, typeof all>();
  for (const c of all) {
    if (!c.parent_id) continue;
    const list = childrenByParent.get(c.parent_id) ?? [];
    list.push(c);
    childrenByParent.set(c.parent_id, list);
  }
  // Any sub-category whose parent no longer exists still needs to render
  // somewhere, instead of silently disappearing from the admin list.
  const orphans = all.filter((c) => c.parent_id && !topLevel.some((p) => p.id === c.parent_id));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-10">
      <div className="mb-6 flex items-center gap-2">
        <Tag className="h-6 w-6 text-accent" />
        <h1 className="text-2xl font-bold">Categories</h1>
      </div>
      <p className="mb-6 text-sm text-white/40">
        Top-level categories appear as tabs on the home feed. Give a category sub-categories
        (e.g. "Food" → "Snacks", "Drinks", "Bakery") to keep the tab row short while still letting
        shoppers drill down — sub-categories show up as a second row once their parent tab is
        selected. Changes save automatically.
      </p>

      <AllCategoryIconForm initialIconUrl={settings?.all_category_icon_url ?? null} />

      <Card>
        <NewCategoryForm topLevelCategories={topLevelForSelect} />
        <div className="hidden md:grid grid-cols-[repeat(14,minmax(0,1fr))] gap-2 pb-1 text-[10px] uppercase tracking-wide text-white/30">
          <span className="col-span-2">Icon</span>
          <span className="col-span-3">Name</span>
          <span className="col-span-3">Parent</span>
          <span className="col-span-2">Slug</span>
          <span className="col-span-2">Order</span>
          <span className="col-span-1 text-center">Active</span>
          <span className="col-span-1"></span>
        </div>
        {topLevel.map((c) => (
          <div key={c.id}>
            <CategoryRow category={c} topLevelCategories={topLevelForSelect} />
            {(childrenByParent.get(c.id) ?? []).map((child) => (
              <CategoryRow key={child.id} category={child} topLevelCategories={topLevelForSelect} isSubcategory />
            ))}
            <SubCategoryQuickAdd parentId={c.id} parentName={c.name} />
          </div>
        ))}
        {orphans.map((c) => (
          <CategoryRow key={c.id} category={c} topLevelCategories={topLevelForSelect} isSubcategory />
        ))}
      </Card>
    </div>
  );
}
