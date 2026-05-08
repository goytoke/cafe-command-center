import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Check, X, Layers } from "lucide-react";
import { prettyToast } from "@/components/PrettyToast";
import { useCategories, CategoryRow, SubcategoryRow } from "@/hooks/useCategories";

export default function ManageCategoriesDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { categories, subcategories, reload } = useCategories();
  const [newCat, setNewCat] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [newSubCatId, setNewSubCatId] = useState<string>("");
  const [editing, setEditing] = useState<{ kind: "cat" | "sub"; id: string; value: string } | null>(null);

  const addCategory = async () => {
    const name = newCat.trim().toLowerCase();
    if (!name) return;
    const { error } = await supabase.from("categories").insert({ name });
    if (error) return prettyToast.error("Failed", error.message);
    setNewCat("");
    prettyToast.success("Category added", name);
    reload();
  };

  const addSub = async () => {
    const name = newSubName.trim();
    if (!name || !newSubCatId) return prettyToast.error("Pick a category first");
    const { error } = await supabase.from("subcategories").insert({ name, category_id: newSubCatId });
    if (error) return prettyToast.error("Failed", error.message);
    setNewSubName("");
    prettyToast.success("Subcategory added", name);
    reload();
  };

  const saveEdit = async () => {
    if (!editing) return;
    const value = editing.value.trim();
    if (!value) return;
    const table = editing.kind === "cat" ? "categories" : "subcategories";
    const payload = editing.kind === "cat" ? { name: value.toLowerCase() } : { name: value };
    const { error } = await supabase.from(table).update(payload).eq("id", editing.id);
    if (error) return prettyToast.error("Failed", error.message);
    setEditing(null);
    reload();
  };

  const delCat = async (c: CategoryRow) => {
    if (!confirm(`Delete category "${c.name}" and all its subcategories?`)) return;
    await supabase.from("categories").delete().eq("id", c.id);
    prettyToast.success("Category deleted");
    reload();
  };
  const delSub = async (s: SubcategoryRow) => {
    await supabase.from("subcategories").delete().eq("id", s.id);
    prettyToast.success("Subcategory deleted");
    reload();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel-strong sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="gradient-text text-2xl flex items-center gap-2">
            <Layers className="h-6 w-6" /> Product Management
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-2">
          {/* Categories column */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Categories</h3>
            <div className="flex gap-2">
              <Input placeholder="New category (e.g. drink)" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
              <Button onClick={addCategory} style={{ background: "var(--gradient-primary)" }}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-2">
              {categories.length === 0 && <p className="text-sm text-muted-foreground">No categories yet</p>}
              {categories.map((c) => (
                <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                  {editing?.kind === "cat" && editing.id === c.id ? (
                    <>
                      <Input value={editing.value} onChange={(e) => setEditing({ ...editing, value: e.target.value })} className="h-8" />
                      <button onClick={saveEdit} className="h-8 w-8 grid place-items-center text-success"><Check className="h-4 w-4" /></button>
                      <button onClick={() => setEditing(null)} className="h-8 w-8 grid place-items-center"><X className="h-4 w-4" /></button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 capitalize font-medium">{c.name}</span>
                      <button onClick={() => setEditing({ kind: "cat", id: c.id, value: c.name })} className="h-8 w-8 grid place-items-center text-accent"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => delCat(c)} className="h-8 w-8 grid place-items-center text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Subcategories column */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Subcategories</h3>
            <div className="space-y-2">
              <Label className="text-xs">Add to category</Label>
              <Select value={newSubCatId} onValueChange={setNewSubCatId}>
                <SelectTrigger><SelectValue placeholder="Pick category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id} className="capitalize">{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input placeholder="New subcategory" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} />
                <Button onClick={addSub} style={{ background: "var(--gradient-primary)" }}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {categories.map((c) => {
                const subs = subcategories.filter((s) => s.category_id === c.id);
                return (
                  <div key={c.id}>
                    <div className="text-xs uppercase text-muted-foreground mb-1 capitalize">{c.name}</div>
                    {subs.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic pl-2">No subcategories</p>
                    ) : subs.map((s) => (
                      <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 mb-1">
                        {editing?.kind === "sub" && editing.id === s.id ? (
                          <>
                            <Input value={editing.value} onChange={(e) => setEditing({ ...editing, value: e.target.value })} className="h-8" />
                            <button onClick={saveEdit} className="h-8 w-8 grid place-items-center text-success"><Check className="h-4 w-4" /></button>
                            <button onClick={() => setEditing(null)} className="h-8 w-8 grid place-items-center"><X className="h-4 w-4" /></button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 text-sm">{s.name}</span>
                            <button onClick={() => setEditing({ kind: "sub", id: s.id, value: s.name })} className="h-7 w-7 grid place-items-center text-accent"><Pencil className="h-3.5 w-3.5" /></button>
                            <button onClick={() => delSub(s)} className="h-7 w-7 grid place-items-center text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
