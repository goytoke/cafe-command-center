import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CategoryRow = { id: string; name: string };
export type SubcategoryRow = { id: string; category_id: string; name: string };

export function useCategories() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: c }, { data: s }] = await Promise.all([
      supabase.from("categories").select("*").order("created_at"),
      supabase.from("subcategories").select("*").order("created_at"),
    ]);
    setCategories((c ?? []) as CategoryRow[]);
    setSubcategories((s ?? []) as SubcategoryRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const subsOf = useCallback(
    (catName: string) => {
      const cat = categories.find((c) => c.name === catName);
      if (!cat) return [];
      return subcategories.filter((s) => s.category_id === cat.id);
    },
    [categories, subcategories]
  );

  return { categories, subcategories, subsOf, reload: load, loading };
}
