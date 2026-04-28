import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, Category } from "@/lib/categories";
import { money, today } from "@/lib/format";
import { Plus } from "lucide-react";
import { prettyToast } from "@/components/PrettyToast";

export default function Store() {
  const [items, setItems] = useState<any[]>([]);
  const [cat, setCat] = useState<Category>("drink");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", category: "drink", unit: "kg", quantity: "", amount: "", purchase_price: "", expiry_date: today() });

  const load = async () => {
    const { data } = await supabase.from("store_items").select("*").order("created_at", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter((i) => i.category === cat);

  const save = async () => {
    const qty = Number(form.quantity), amt = Number(form.amount);
    await supabase.from("store_items").insert({
      ...form, quantity: qty, amount: amt,
      purchase_price: form.purchase_price ? Number(form.purchase_price) : qty * amt,
    });
    prettyToast.success(`"${form.name}" added`, "Material added successfully");
    setOpen(false);
    setForm({ name: "", category: cat, unit: "kg", quantity: "", amount: "", purchase_price: "", expiry_date: today() });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold gradient-text">Store Inventory</h1>
        <Button onClick={() => { setForm((f) => ({ ...f, category: cat })); setOpen(true); }} style={{ background: "var(--gradient-primary)" }} className="btn-glow">
          <Plus className="h-4 w-4 mr-2" /> Add Item
        </Button>
      </div>

      <div className="flex gap-2">
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-5 py-2 rounded-xl capitalize text-sm font-medium ${cat === c ? "text-white" : "bg-muted/50 hover:bg-muted"}`}
            style={cat === c ? { background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" } : {}}>{c}</button>
        ))}
      </div>

      <div className="glass-panel-strong p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="p-3">Name</th><th className="p-3">Quantity</th><th className="p-3">Unit Price</th><th className="p-3">Total</th><th className="p-3">Expiry</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">No items in this category</td></tr> :
                filtered.map((i) => (
                  <tr key={i.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-3 font-medium">{i.name}</td>
                    <td className="p-3">{i.quantity} {i.unit}</td>
                    <td className="p-3">{money(i.amount)}</td>
                    <td className="p-3 font-semibold">{money(i.purchase_price)}</td>
                    <td className="p-3">{i.expiry_date ?? "—"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-panel-strong">
          <DialogHeader><DialogTitle className="gradient-text text-2xl">Add Material</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Unit</Label>
              <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="kg">kg</SelectItem><SelectItem value="g">gram</SelectItem><SelectItem value="l">liter</SelectItem><SelectItem value="pcs">pcs</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
            <div className="space-y-2"><Label>Unit price (Birr)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            <div className="col-span-2 space-y-2"><Label>Purchase price (auto = qty × amount)</Label>
              <Input type="number" placeholder={String((Number(form.quantity) || 0) * (Number(form.amount) || 0))} value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-2"><Label>Expiry date</Label><Input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} style={{ background: "var(--gradient-primary)" }}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
