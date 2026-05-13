import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { money, today } from "@/lib/format";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { prettyToast } from "@/components/PrettyToast";

export default function Expense() {
  const { ymd, date } = useDateFilter();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ reason: "", category: "", quantity: "1", amount: "", purchase_date: today() });

  const load = async () => {
    const { data } = await supabase.from("expenses").select("*").eq("purchase_date", ymd).order("created_at", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [ymd]);

  const save = async () => {
    const q = Number(form.quantity), a = Number(form.amount);
    await supabase.from("expenses").insert({ reason: form.reason, category: form.category || null, quantity: q, amount: a, total: q * a, purchase_date: form.purchase_date });
    prettyToast.success(`"${form.reason}" added`, "Expense recorded");
    setOpen(false);
    setForm({ reason: "", category: "", quantity: "1", amount: "", purchase_date: today() });
    load();
  };

  const del = async (id: string) => { await supabase.from("expenses").delete().eq("id", id); prettyToast.success("Expense deleted"); load(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold gradient-text">Expenses — {date.toLocaleDateString()}</h1>
        <Button onClick={() => setOpen(true)} style={{ background: "var(--gradient-primary)" }} className="btn-glow"><Plus className="h-4 w-4 mr-2" /> Add Expense</Button>
      </div>
      <div className="glass-panel-strong p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground border-b border-border">
            <th className="p-3">Reason</th><th className="p-3">Category</th><th className="p-3">Quantity</th><th className="p-3">Amount</th><th className="p-3">Total</th><th className="p-3">Date</th><th className="p-3">Action</th>
          </tr></thead>
          <tbody>
            {items.length === 0 ? <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">No expenses recorded</td></tr> :
              items.map((i) => (
                <tr key={i.id} className="border-b border-border/50">
                  <td className="p-3 font-medium">{i.reason}</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded-full text-xs capitalize bg-muted text-muted-foreground border border-border">{i.category ?? "—"}</span></td>
                  <td className="p-3">{i.quantity}</td>
                  <td className="p-3">{money(i.amount)}</td>
                  <td className="p-3 font-semibold">{money(i.total)}</td>
                  <td className="p-3">{i.purchase_date}</td>
                  <td className="p-3"><div className="flex gap-2">
                    <button className="h-8 w-8 grid place-items-center rounded-lg hover:bg-muted text-accent"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => del(i.id)} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-muted text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-panel-strong">
          <DialogHeader><DialogTitle className="gradient-text text-2xl">Add Expense</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Reason</Label><Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
              <div className="space-y-2"><Label>Amount</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Total (auto)</Label><Input disabled value={money((Number(form.quantity) || 0) * (Number(form.amount) || 0))} /></div>
            <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} style={{ background: "var(--gradient-primary)" }}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
