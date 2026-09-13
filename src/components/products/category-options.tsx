import type { Database } from "@/lib/types/database.types";

type Category = Database["public"]["Tables"]["categories"]["Row"];

/**
 * Renders <option>/<optgroup> elements for a flat category list, grouping
 * sub-categories underneath their parent so a seller picking "Food →
 * Snacks" sees the hierarchy instead of one long, unstructured list.
 * Top-level categories with no children of their own still get a plain
 * top-level option; uncategorized top-level categories are listed first.
 */
export function CategoryOptions({ categories }: { categories: Category[] }) {
  const topLevel = categories.filter((c) => !c.parent_id);
  const childrenByParent = new Map<string, Category[]>();
  for (const c of categories) {
    if (!c.parent_id) continue;
    const list = childrenByParent.get(c.parent_id) ?? [];
    list.push(c);
    childrenByParent.set(c.parent_id, list);
  }

  return (
    <>
      {topLevel.map((parent) => {
        const children = childrenByParent.get(parent.id) ?? [];
        if (children.length === 0) {
          return (
            <option key={parent.id} value={parent.id}>
              {parent.name}
            </option>
          );
        }
        return (
          <optgroup key={parent.id} label={parent.name}>
            <option value={parent.id}>All {parent.name}</option>
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
          </optgroup>
        );
      })}
    </>
  );
}
