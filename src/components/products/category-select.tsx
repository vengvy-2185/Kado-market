"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useLanguage } from "@/lib/i18n/language-context";
import type { Database } from "@/lib/types/database.types";

type Category = Database["public"]["Tables"]["categories"]["Row"];

/**
 * Two dependent selects instead of one flat list: choosing a top-level
 * Category narrows the second Sub-category select down to only that
 * category's own children -- previously a single <select> with
 * <optgroup>s showed every category's children at once, which made it
 * easy to end up picking a sub-category that didn't belong to the
 * category you thought you'd chosen.
 */
export function CategorySelect({ categories, defaultCategoryId }: { categories: Category[]; defaultCategoryId?: string | null }) {
  const { t } = useLanguage();
  const topLevel = useMemo(() => categories.filter((c) => !c.parent_id), [categories]);
  const childrenByParent = useMemo(() => {
    const map = new Map<string, Category[]>();
    for (const c of categories) {
      if (!c.parent_id) continue;
      const list = map.get(c.parent_id) ?? [];
      list.push(c);
      map.set(c.parent_id, list);
    }
    return map;
  }, [categories]);

  const initialRow = categories.find((c) => c.id === defaultCategoryId) ?? null;
  const initialParentId = initialRow ? (initialRow.parent_id ?? initialRow.id) : "";
  const initialChildId = initialRow?.parent_id ? initialRow.id : "";

  const [parentId, setParentId] = useState(initialParentId);
  const [childId, setChildId] = useState(initialChildId);

  const children = parentId ? childrenByParent.get(parentId) ?? [] : [];
  const finalCategoryId = childId || parentId;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="category_parent">{t("product_form_category")}</Label>
        <Select
          id="category_parent"
          value={parentId}
          onChange={(e) => {
            setParentId(e.target.value);
            setChildId("");
          }}
        >
          <option value="">{t("product_form_uncategorized")}</option>
          {topLevel.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      {children.length > 0 && (
        <div>
          <Label htmlFor="category_child">{t("product_form_subcategory")}</Label>
          <Select id="category_child" value={childId} onChange={(e) => setChildId(e.target.value)}>
            <option value="">{t("product_form_no_subcategory")}</option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      )}
      <input type="hidden" name="category_id" value={finalCategoryId} />
    </div>
  );
}
