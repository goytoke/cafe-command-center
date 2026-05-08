import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Upload, Package, Settings2 } from "lucide-react";
import { money } from "@/lib/format";
import { prettyToast } from "@/components/PrettyToast";
import { useCategories } from "@/hooks/useCategories";
import ManageCategoriesDialog from "@/components/ManageCategoriesDialog";

export default function Product() {
  const [items, setItems] = useState<any[]>([]);
  const { categories, subsOf, reload: reloadCats } = useCategories();
  const [cat, setCat] = useState<string>("");
  const [sub, setSub] = useState<string>("All");
  const [open, setOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", category: "", subcategory: "", price: "", cost: "", status: "available" });
  const [img, setImg] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  // Sync default selected category when categories load
  useEffect(() => {
    if (!cat && categories.length > 0) setCat(categories[0].name);
  }, [categories, cat]);

  const subs = useMemo(() => subsOf(cat), [cat, subsOf]);
  const filtered = items.filter((i) => i.category === cat && (sub === "All" || i.subcategory === sub));

  const openAdd = () => {
    if (categories.length === 0) return prettyToast.error("Add a category first", "Open Product Management");
    const firstSubs = subsOf(cat || categories[0].name);
    setEditing(null);
    setForm({ name: "", description: "", category: cat || categories[0].name, subcategory: firstSubs[0]?.name ?? "", price: "", cost: "", status: "available" });
    setImg(null); setPreview(null);
    setOpen(true);
  };
  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description ?? "", category: p.category, subcategory: p.subcategory, price: String(p.price), cost: String(p.cost ?? 0), status: p.status });
    setPreview(p.image_url); setImg(null);
    setOpen(true);
  };

  const save = async () => {
    let image_url = editing?.image_url ?? null;
    if (img) {
      const path = `${Date.now()}-${img.name}`;
      const { error } = await supabase.storage.from("product-images").upload(path, img);
      if (!error) image_url = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
    }
    const payload = { ...form, price: Number(form.price), cost: Number(form.cost), image_url };
    if (editing) {
      await supabase.from("products").update(payload).eq("id", editing.id);
      prettyToast.success(`"${form.name}" updated`, "Product saved successfully");
    } else {
      await supabase.from("products").insert(payload);
      prettyToast.success(`"${form.name}" added`, "Added successfully");
    }
    setOpen(false);
    load();
  };

  const del = async (id: string, name: string) => {
    await supabase.from("products").delete().eq("id", id);
    prettyToast.success(`"${name}" deleted`);
    load();
  };

  const formSubs = subsOf(form.category);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold gradient-text">Our Products</h1>
        <p className="text-muted-foreground">Manage your menu</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => { setCat(c.name); setSub("All"); }}
              className={`px-5 py-2 rounded-xl capitalize text-sm font-medium transition-all ${cat === c.name ? "text-white shadow-lg" : "bg-muted/50 hover:bg-muted"}`}
              style={cat === c.name ? { background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" } : {}}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setManageOpen(true)}>
            <Settings2 className="h-4 w-4 mr-2" /> Manage
          </Button>
          <Button onClick={openAdd} style={{ background: "var(--gradient-primary)" }} className="btn-glow">
            <Plus className="h-4 w-4 mr-2" /> Add Product
          </Button>
        </div>
      </div>

      <div className="glass-panel-strong p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {["All", ...subs.map((s) => s.name)].map((s) => (
            <button
              key={s}
              onClick={() => setSub(s)}
              className={`px-4 py-1.5 rounded-lg text-sm transition ${sub === s ? "bg-accent text-accent-foreground font-semibold" : "bg-muted/50 hover:bg-muted"}`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="p-3">Image</th><th className="p-3">Name</th><th className="p-3">Description</th>
                <th className="p-3">Cost</th><th className="p-3">Price</th><th className="p-3">Profit</th><th className="p-3">Subcategory</th><th className="p-3">Status</th><th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="p-12 text-center text-muted-foreground"><Package className="h-10 w-10 mx-auto mb-2 opacity-40" />No products yet</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="p-3">
                    {p.image_url ? <img src={p.image_url} alt={p.name} className="h-12 w-12 rounded-lg object-cover" /> : <div className="h-12 w-12 rounded-lg bg-muted" />}
                  </td>
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 text-muted-foreground max-w-xs truncate">{p.description}</td>
                  <td className="p-3">{money(p.cost)}</td>
                  <td className="p-3 font-semibold">{money(p.price)}</td>
                  <td className="p-3 font-semibold text-success">{money(Number(p.price) - Number(p.cost ?? 0))}</td>
                  <td className="p-3">{p.subcategory}</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded-full text-xs bg-success/20 text-success">{p.status}</span></td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-muted text-accent"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => del(p.id, p.name)} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-muted text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-panel-strong sm:max-w-lg">
          <DialogHeader><DialogTitle className="gradient-text text-2xl">{editing ? "Edit" : "Add"} Product</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="col-span-2 space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => { const fs = subsOf(v); setForm({ ...form, category: v, subcategory: fs[0]?.name ?? "" }); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.name} className="capitalize">{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subcategory</Label>
              <Select value={form.subcategory} onValueChange={(v) => setForm({ ...form, subcategory: v })}>
                <SelectTrigger><SelectValue placeholder="Pick subcategory" /></SelectTrigger>
                <SelectContent>{formSubs.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Cost (per unit)</Label><Input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></div>
            <div className="space-y-2"><Label>Price</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            <div className="space-y-2"><Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="available">Available</SelectItem><SelectItem value="out_of_stock">Out of stock</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Image</Label>
              <label className="mt-2 flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed cursor-pointer hover:bg-muted/40">
                {preview ? <img src={preview} alt="" className="h-12 w-12 rounded object-cover" /> : <Upload className="h-5 w-5" />}
                <span className="text-sm text-muted-foreground">{img?.name ?? "Click to attach image"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0] ?? null; setImg(f); if (f) setPreview(URL.createObjectURL(f)); }} />
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} style={{ background: "var(--gradient-primary)" }}>{editing ? "Save" : "Add Product"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ManageCategoriesDialog open={manageOpen} onOpenChange={(v) => { setManageOpen(v); if (!v) reloadCats(); }} />
    </div>
  );
}
