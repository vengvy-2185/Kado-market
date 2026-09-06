import { redirect } from "next/navigation";
import { Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { CategoryRow } from "@/components/admin/category-row";
import { NewCategoryForm } from "@/components/admin/new-plan-forms";

export default async function AdminCategoriesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "super_admin") redirect("/");

  const { data: categories } = await supabase.from("categories").select("*").order("sort_order");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-10">
      <div className="mb-6 flex items-center gap-2">
        <Tag className="h-6 w-6 text-accent" />
        <h1 className="text-2xl font-bold">Categories</h1>
      </div>
      <p className="mb-6 text-sm text-white/40">
        These appear as tabs on the home feed. Changes save automatically.
      </p>

      <Card>
        <NewCategoryForm />
        <div className="grid grid-cols-12 gap-2 pb-1 text-[10px] uppercase tracking-wide text-white/30">
          <span className="col-span-2">Icon</span>
          <span className="col-span-4">Name</span>
          <span className="col-span-2">Slug</span>
          <span className="col-span-2">Order</span>
          <span className="col-span-1 text-center">Active</span>
          <span className="col-span-1"></span>
        </div>
        {(categories ?? []).map((c) => (
          <CategoryRow key={c.id} category={c} />
        ))}
      </Card>
    </div>
  );
}
